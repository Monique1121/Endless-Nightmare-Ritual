/*
 * syncManager.js
 *
 * Defines the synchronisation strategy between the browser-local game state
 * (localStorage via GameState) and the remote database.
 *
 * Strategy overview
 * -----------------
 * 1. Automatic interval sync  – every SYNC_INTERVAL_MS, if the state is
 *    dirty, attempt a sync.
 * 2. Event-triggered sync     – explicit call to syncNow() from game code
 *    at key moments (run start/end, combat result, picking up items).
 * 3. Unload sync              – on 'beforeunload', perform a best-effort
 *    final save so progress is not lost when the tab is closed.
 *
 * The actual HTTP call is made to DB_API_URL.  If the server is unavailable
 * the sync is silently deferred until the next attempt (offline-first).
 *
 * Conflict resolution
 * -------------------
 * The server is considered the source of truth for persisted records.  The
 * local state is the source of truth for real-time, in-flight data that has
 * not yet been committed.  If the server returns a conflict (HTTP 409), the
 * local state is refreshed from the server response before the next sync.
 *
 * Endless Nightmare Ritual
 * 2026-04-08
 */

"use strict";

// URL of the REST endpoint that accepts game state snapshots.
// Replace with the real backend URL when available.
const DB_API_URL = "/api/sync";

// How often (in ms) to automatically flush dirty state to the server.
const SYNC_INTERVAL_MS = 30_000; // 30 seconds

class SyncManager {
    constructor(stateRef) {
        this._state    = stateRef;   // GameState singleton
        this._timer    = null;
        this._syncing  = false;      // prevent overlapping requests

        // Persist state before the page unloads
        window.addEventListener("beforeunload", () => {
            this._state.save();      // always persist to localStorage
            if (this._state.isDirty) {
                this._sendBeacon();  // best-effort DB flush
            }
        });
    }

    // ---- Public API --------------------------------------------------------

    /** Start the automatic background sync loop. */
    start() {
        if (this._timer !== null) return;
        this._timer = setInterval(() => this._autoSync(), SYNC_INTERVAL_MS);
        console.log("[SyncManager] Auto-sync started (interval:", SYNC_INTERVAL_MS, "ms)");
    }

    /** Stop the automatic background sync loop. */
    stop() {
        if (this._timer !== null) {
            clearInterval(this._timer);
            this._timer = null;
            console.log("[SyncManager] Auto-sync stopped.");
        }
    }

    /**
     * Immediately flush dirty state to the database.
     * Returns a Promise that resolves with the server response (or null when
     * there is nothing to sync / the request fails).
     */
    async syncNow() {
        if (!this._state.isDirty) {
            console.log("[SyncManager] State is clean – nothing to sync.");
            return null;
        }
        if (this._syncing) {
            console.log("[SyncManager] Sync already in progress – skipping.");
            return null;
        }
        return await this._doSync();
    }

    /**
     * Verify that the local state is consistent with the server.
     * Fetches the latest server snapshot for the current run and compares key
     * fields.  Returns an object { consistent: bool, diffs: [] }.
     */
    async checkConsistency() {
        const run = this._state.currentRun;
        if (!run.run_id) {
            return { consistent: true, diffs: [] };
        }
        try {
            const response = await fetch(`${DB_API_URL}/run/${run.run_id}`);
            if (!response.ok) {
                console.warn("[SyncManager] Consistency check failed – HTTP", response.status);
                return { consistent: null, diffs: [] };
            }
            const serverData = await response.json();
            return this._compareSnapshots(this._state.toSnapshot(), serverData);
        } catch (e) {
            console.warn("[SyncManager] Consistency check error:", e);
            return { consistent: null, diffs: [] };
        }
    }

    // ---- Private -----------------------------------------------------------

    async _autoSync() {
        if (this._state.isDirty) {
            console.log("[SyncManager] Auto-sync triggered.");
            await this._doSync();
        }
    }

    async _doSync() {
        this._syncing = true;
        const snapshot = this._state.toSnapshot();
        try {
            const response = await fetch(DB_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(snapshot),
            });

            if (response.ok) {
                this._state.markSynced();
                console.log("[SyncManager] Sync successful at", this._state.lastSynced);
                return await response.json();
            }

            if (response.status === 409) {
                // Conflict – refresh local state from server
                const serverState = await response.json();
                console.warn("[SyncManager] Conflict detected – refreshing from server.");
                this._resolveConflict(serverState);
            } else {
                console.warn("[SyncManager] Sync failed – HTTP", response.status);
            }
        } catch (e) {
            // Network unavailable – defer until next attempt
            console.warn("[SyncManager] Sync deferred (network error):", e.message);
        } finally {
            this._syncing = false;
        }
        return null;
    }

    /** Use sendBeacon for a fire-and-forget sync on page unload. */
    _sendBeacon() {
        try {
            const snapshot = JSON.stringify(this._state.toSnapshot());
            navigator.sendBeacon(DB_API_URL, new Blob([snapshot], { type: "application/json" }));
            console.log("[SyncManager] Beacon sent on unload.");
        } catch (e) {
            console.warn("[SyncManager] Beacon failed:", e);
        }
    }

    /**
     * Resolve a conflict by merging server-authoritative fields while keeping
     * in-flight local fields that the server does not yet know about.
     * The server is the source of truth for all run statistics and player health;
     * only the player's real-time position is kept from the local state.
     */
    _resolveConflict(serverState) {
        const local  = this._state._state;
        const server = serverState;

        // Server wins for all run statistics and player health
        if (server.currentRun) {
            local.currentRun.blood_recovered = server.currentRun.blood_recovered ?? local.currentRun.blood_recovered;
            local.currentRun.cards_found     = server.currentRun.cards_found     ?? local.currentRun.cards_found;
            local.currentRun.secrets_found   = server.currentRun.secrets_found   ?? local.currentRun.secrets_found;
            local.currentRun.completed       = server.currentRun.completed       ?? local.currentRun.completed;
        }
        if (server.player) {
            local.player.blood_current = server.player.blood_current ?? local.player.blood_current;
        }

        // Mark dirty so the merged state is pushed on the next sync
        local.isDirty = true;
        this._state.save();
    }

    /**
     * Compare two snapshots and return a diff report.
     * Only checks fields that are meaningful for consistency validation.
     */
    _compareSnapshots(local, server) {
        const diffs = [];
        const runFields = ["blood_recovered", "cards_found", "secrets_found", "completed"];
        for (const field of runFields) {
            if (local.currentRun[field] !== server.currentRun?.[field]) {
                diffs.push({
                    field,
                    local: local.currentRun[field],
                    server: server.currentRun?.[field],
                });
            }
        }
        if (local.player.blood_current !== server.player?.blood_current) {
            diffs.push({
                field: "player.blood_current",
                local: local.player.blood_current,
                server: server.player?.blood_current,
            });
        }
        return { consistent: diffs.length === 0, diffs };
    }
}

// Singleton instance – depends on the gameState singleton.
// NOTE: this file must be loaded AFTER gameState.js in the HTML.
const syncManager = new SyncManager(gameState);

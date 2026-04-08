/*
 * gameState.js
 *
 * Manages temporary real-time game state stored locally in the browser
 * (localStorage) so that not every state change requires a round-trip to
 * the database.  The SyncManager module is responsible for flushing the
 * dirty state to the server at the appropriate moments.
 *
 * Endless Nightmare Ritual
 * 2026-04-08
 */

"use strict";

const STORAGE_KEY = "endlessNightmareState";

// ---------------------------------------------------------------------------
// Default / empty state shape (mirrors the DB schema)
// ---------------------------------------------------------------------------
function createDefaultState() {
    return {
        player: {
            id: null,
            name: "",
            blood_max: 100,
            blood_current: 100,
            position: { x: 0, y: 0 },
        },
        currentRun: {
            run_id: null,
            labyrinth_id: null,
            level_id: 1,
            blood_recovered: 0,
            cards_found: 0,
            secrets_found: 0,
            completed: false,
            time_taken: 0,
            start_time: null,
        },
        deck: [],          // [{ card_id, card_gained }]
        lastSynced: null,  // ISO timestamp of last successful DB sync
        isDirty: false,    // true when local state has not yet been synced
    };
}

// ---------------------------------------------------------------------------
// GameState class
// ---------------------------------------------------------------------------
class GameState {
    constructor() {
        this._state = this._load();
    }

    // ---- Persistence -------------------------------------------------------

    /** Restore state from localStorage, falling back to defaults. */
    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn("[GameState] Could not parse saved state:", e);
        }
        return createDefaultState();
    }

    /** Persist the current state to localStorage. */
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
        } catch (e) {
            console.error("[GameState] Could not save state:", e);
        }
    }

    /** Wipe localStorage and reset to defaults (e.g. new game). */
    reset() {
        this._state = createDefaultState();
        localStorage.removeItem(STORAGE_KEY);
    }

    /** Return true if a saved state already exists. */
    hasSavedState() {
        return !!localStorage.getItem(STORAGE_KEY);
    }

    // ---- Accessors ---------------------------------------------------------

    get player()     { return this._state.player; }
    get currentRun() { return this._state.currentRun; }
    get deck()       { return this._state.deck; }
    get isDirty()    { return this._state.isDirty; }
    get lastSynced() { return this._state.lastSynced; }

    // ---- Mutators (each call marks the state dirty) ------------------------

    /** Initialize player info (called after login / character selection). */
    setPlayer(id, name, bloodMax, bloodCurrent) {
        this._state.player.id            = id;
        this._state.player.name          = name;
        this._state.player.blood_max     = bloodMax;
        this._state.player.blood_current = bloodCurrent;
        this._markDirty();
    }

    /** Update the player's world position (high-frequency, saved only locally). */
    setPlayerPosition(x, y) {
        this._state.player.position.x = x;
        this._state.player.position.y = y;
        this.save();            // position updates only go to localStorage
    }

    /** Update the player's current health. */
    setPlayerBlood(current) {
        this._state.player.blood_current = current;
        this._markDirty();
    }

    /** Begin a new run. */
    startRun(runId, labyrinthId, levelId) {
        this._state.currentRun.run_id       = runId;
        this._state.currentRun.labyrinth_id = labyrinthId;
        this._state.currentRun.level_id     = levelId;
        this._state.currentRun.blood_recovered = 0;
        this._state.currentRun.cards_found     = 0;
        this._state.currentRun.secrets_found   = 0;
        this._state.currentRun.completed       = false;
        this._state.currentRun.time_taken      = 0;
        this._state.currentRun.start_time      = Date.now();
        this._markDirty();
    }

    /** Mark the current run as completed and record total time. */
    completeRun() {
        const run = this._state.currentRun;
        run.completed  = true;
        run.time_taken = run.start_time
            ? Math.floor((Date.now() - run.start_time) / 1000)
            : 0;
        this._markDirty();
    }

    /** Record blood recovered (e.g. from a chest or after combat). */
    addBloodRecovered(amount) {
        this._state.currentRun.blood_recovered += amount;
        this._markDirty();
    }

    /** Record a card found during the run. */
    addCardFound(cardId) {
        this._state.currentRun.cards_found++;
        this._state.deck.push({ card_id: cardId, card_gained: true });
        this._markDirty();
    }

    /** Record a secret found during the run. */
    addSecretFound() {
        this._state.currentRun.secrets_found++;
        this._markDirty();
    }

    // ---- Sync helpers ------------------------------------------------------

    /** Called by SyncManager after a successful DB flush. */
    markSynced() {
        this._state.isDirty    = false;
        this._state.lastSynced = new Date().toISOString();
        this.save();
    }

    /** Return a plain-object snapshot suitable for sending to the server. */
    toSnapshot() {
        return JSON.parse(JSON.stringify(this._state));
    }

    // ---- Private -----------------------------------------------------------

    _markDirty() {
        this._state.isDirty = true;
        this.save();
    }
}

// Singleton instance shared across the game
const gameState = new GameState();

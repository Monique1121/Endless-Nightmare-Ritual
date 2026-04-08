/*
 * Endless Nightmare Ritual – API client
 *
 * Thin wrapper around fetch() for communicating with the REST API.
 * Include this script before your game code:
 *
 *   <script src="../../libs/api_client.js"></script>
 *
 * Usage examples:
 *
 *   // Register
 *   const { token } = await API.auth.register("Alice", "password123");
 *
 *   // Login
 *   const { token } = await API.auth.login("Alice", "password123");
 *   API.setToken(token);
 *
 *   // Get cards available in the game
 *   const cards = await API.cards.list();
 *
 *   // Create a new run
 *   const run = await API.runs.create({ labyrinth_id: 1, level_id: 1 });
 *
 *   // Update run when finished
 *   await API.runs.update(run.Run_id, { completed: true, time_taken: 300 });
 */

"use strict";

const API = (() => {
    // Base URL – change to your deployed server address in production
    const BASE_URL =
        (typeof window !== "undefined" && window.API_BASE_URL) ||
        "http://localhost:3000/api";

    let _token = null;

    /** Store the JWT returned after login/register */
    function setToken(token) {
        _token = token;
        try { sessionStorage.setItem("enr_token", token); } catch (_) { /* no-op in non-browser */ }
    }

    /** Load a previously saved token from sessionStorage */
    function loadToken() {
        try {
            const saved = sessionStorage.getItem("enr_token");
            if (saved) _token = saved;
        } catch (_) { /* no-op */ }
    }

    /** Clear the stored token (logout) */
    function clearToken() {
        _token = null;
        try { sessionStorage.removeItem("enr_token"); } catch (_) { /* no-op */ }
    }

    /**
     * Internal fetch helper.
     * @param {string} path    - API path (e.g. "/cards")
     * @param {object} options - fetch options
     */
    async function request(path, options = {}) {
        const headers = { "Content-Type": "application/json" };
        if (_token) headers["Authorization"] = `Bearer ${_token}`;

        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: { ...headers, ...(options.headers || {}) },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data.error || `Request failed with status ${response.status}`;
            throw Object.assign(new Error(message), { status: response.status, data });
        }

        return data;
    }

    // ── Auth ────────────────────────────────────────────────────────────────

    const auth = {
        /**
         * Register a new player.
         * @param {string} player_name
         * @param {string} password
         * @returns {Promise<{player_id, player_name, token}>}
         */
        register(player_name, password) {
            return request("/auth/register", {
                method: "POST",
                body: JSON.stringify({ player_name, password }),
            });
        },

        /**
         * Login with an existing player account.
         * @param {string} player_name
         * @param {string} password
         * @returns {Promise<{player_id, player_name, token}>}
         */
        login(player_name, password) {
            return request("/auth/login", {
                method: "POST",
                body: JSON.stringify({ player_name, password }),
            });
        },
    };

    // ── Players ─────────────────────────────────────────────────────────────

    const players = {
        /** Fetch a player profile by id */
        get(id) { return request(`/players/${id}`); },

        /**
         * Update player stats (owner only).
         * @param {number} id
         * @param {{blood_max?: number, blood_current?: number}} fields
         */
        update(id, fields) {
            return request(`/players/${id}`, {
                method: "PUT",
                body: JSON.stringify(fields),
            });
        },

        /** Delete a player account (owner only) */
        delete(id) { return request(`/players/${id}`, { method: "DELETE" }); },
    };

    // ── Cards ────────────────────────────────────────────────────────────────

    const cards = {
        /** Retrieve the full list of cards */
        list() { return request("/cards"); },

        /** Retrieve a single card by id */
        get(id) { return request(`/cards/${id}`); },
    };

    // ── Levels ───────────────────────────────────────────────────────────────

    const levels = {
        /** Retrieve the full list of levels */
        list() { return request("/levels"); },

        /** Retrieve a single level by id */
        get(id) { return request(`/levels/${id}`); },
    };

    // ── Runs ─────────────────────────────────────────────────────────────────

    const runs = {
        /** List all runs for the authenticated player */
        list() { return request("/runs"); },

        /** Get a single run by id */
        get(id) { return request(`/runs/${id}`); },

        /**
         * Start a new run.
         * @param {{labyrinth_id: number, level_id: number}} data
         */
        create(data) {
            return request("/runs", {
                method: "POST",
                body: JSON.stringify(data),
            });
        },

        /**
         * Update run progress/completion.
         * @param {number} id
         * @param {{blood_recovered?, cards_found?, secrets_found?, completed?, time_taken?}} fields
         */
        update(id, fields) {
            return request(`/runs/${id}`, {
                method: "PUT",
                body: JSON.stringify(fields),
            });
        },
    };

    // ── Combat ───────────────────────────────────────────────────────────────

    const combat = {
        /** List all combat records for the authenticated player */
        list() { return request("/combat"); },

        /** Get a single combat record by id */
        get(id) { return request(`/combat/${id}`); },

        /**
         * Start a new combat encounter.
         * @param {{enemy_id: number, run_id: number, level_id: number}} data
         */
        create(data) {
            return request("/combat", {
                method: "POST",
                body: JSON.stringify(data),
            });
        },

        /**
         * Update combat state (lives, result, blood used).
         * @param {number} id
         * @param {{result?, blood_used?, player_lives?, enemy_lives?}} fields
         */
        update(id, fields) {
            return request(`/combat/${id}`, {
                method: "PUT",
                body: JSON.stringify(fields),
            });
        },
    };

    // ── Public API ───────────────────────────────────────────────────────────

    // Try to restore a saved token on load
    loadToken();

    return { setToken, clearToken, auth, players, cards, levels, runs, combat };
})();

// CommonJS export for test environments
if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
}

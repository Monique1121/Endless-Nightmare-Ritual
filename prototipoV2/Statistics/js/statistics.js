/*
 * Endless Nightmare Ritual
 * Statistics Page – JavaScript
 *
 * Loads statistics from localStorage (updated by the game engine after each session)
 * and falls back to demo/placeholder data when no saved data is found.
 *
 * DB Integration note:
 *   Replace the `loadStats()` function body with a fetch() call to your backend API
 *   (e.g. GET /api/stats?player_id=<id>) to pull live data from the EndlessDB database.
 *   The object shape returned must match the `defaults` object defined below.
 */

"use strict";

// ---------------------------------------------------------------------------
// Default / demo data (used when no real game session data is available)
// ---------------------------------------------------------------------------
const DEMO_DATA = {
    // General
    totalRuns: 42,
    completedRuns: 28,
    failedRuns: 14,
    totalTimeSecs: 18540,   // in seconds
    totalBloodRecovered: 3840,
    totalSecrets: 17,

    // Combate
    totalCombats: 134,
    combatWins: 89,
    combatLosses: 45,
    totalBloodUsed: 2610,
    totalDamage: 7230,

    // Exploración
    labyrinthsExplored: 38,
    chestsOpened: 61,
    secretsFound: 17,
    highestLevel: "Nivel III – El Abismo",
    bestRunTimeSecs: 720,   // in seconds
    levelsCompleted: 19,

    // Cartas
    cardsFound: 210,
    uniqueCards: 47,
    legendaryCards: 6,

    // Enemy ranking
    enemies: [
        { name: "El Vigilante",    defeated: 24, wins: 5 },
        { name: "Sombra Errante",  defeated: 19, wins: 8 },
        { name: "Ánima Oscura",    defeated: 15, wins: 3 },
        { name: "El Guardián",     defeated: 11, wins: 6 },
        { name: "Espectro Rojo",   defeated: 8,  wins: 2 },
    ],

    // Top cards
    topCards: [
        { name: "Rito de Sangre",   type: "Ataque",  tier: "Legendaria", used: 88 },
        { name: "Velo de Sombras",  type: "Defensa", tier: "Rara",       used: 74 },
        { name: "Maldición",        type: "Ataque",  tier: "Común",      used: 63 },
        { name: "Tótem Maldito",    type: "Ritual",  tier: "Épica",      used: 51 },
        { name: "Pacto de Silencio",type: "Ritual",  tier: "Rara",       used: 39 },
    ],

    // Global leaderboard
    leaderboard: [
        { name: "Monique",   runs: 42, wins: 28 },
        { name: "JuanC",     runs: 35, wins: 22 },
        { name: "Julian",    runs: 30, wins: 18 },
        { name: "Arantza",   runs: 27, wins: 15 },
        { name: "Jugador_05",runs: 20, wins: 11 },
    ]
};

// ---------------------------------------------------------------------------
// Load stats: tries localStorage first, falls back to demo data
// ---------------------------------------------------------------------------
function loadStats() {
    /*
     * DB Integration hook:
     *   const res = await fetch('/api/stats?player_id=' + currentPlayerId);
     *   return await res.json();
     */
    const saved = localStorage.getItem("endlessStats");
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (_) {
            // corrupted data – fall through to demo
        }
    }
    return DEMO_DATA;
}

// ---------------------------------------------------------------------------
// Save stats to localStorage (called by game engine at session end)
// ---------------------------------------------------------------------------
function saveStats(data) {
    /*
     * DB Integration hook:
     *   await fetch('/api/stats', { method: 'POST', body: JSON.stringify(data) });
     */
    localStorage.setItem("endlessStats", JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Helper: format seconds → "Xh Ym Zs"
// ---------------------------------------------------------------------------
function formatTime(totalSecs) {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const parts = [];
    if (h > 0) parts.push(h + "h");
    if (m > 0) parts.push(m + "m");
    parts.push(s + "s");
    return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Render – General stats
// ---------------------------------------------------------------------------
function renderGeneral(data) {
    document.getElementById("totalRuns").textContent         = data.totalRuns;
    document.getElementById("completedRuns").textContent     = data.completedRuns;
    document.getElementById("failedRuns").textContent        = data.failedRuns;
    document.getElementById("totalTime").textContent         = formatTime(data.totalTimeSecs);
    document.getElementById("totalBloodRecovered").textContent = data.totalBloodRecovered;
    document.getElementById("totalSecrets").textContent      = data.totalSecrets;
}

// ---------------------------------------------------------------------------
// Render – Combate stats
// ---------------------------------------------------------------------------
function renderCombate(data) {
    document.getElementById("totalCombats").textContent  = data.totalCombats;
    document.getElementById("combatWins").textContent    = data.combatWins;
    document.getElementById("combatLosses").textContent  = data.combatLosses;
    document.getElementById("totalBloodUsed").textContent = data.totalBloodUsed;
    document.getElementById("totalDamage").textContent   = data.totalDamage;

    const topEnemy = data.enemies && data.enemies.length > 0
        ? data.enemies
            .filter((e) => e && e.name && typeof e.defeated === "number")
            .reduce((a, b) => (a.defeated >= b.defeated ? a : b), data.enemies[0]).name
        : "—";
    document.getElementById("topEnemy").textContent = topEnemy;

    const tbody = document.getElementById("enemyTableBody");
    tbody.innerHTML = "";
    if (data.enemies && data.enemies.length > 0) {
        data.enemies.forEach((e, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + (idx + 1) + "</td>" +
                "<td>" + e.name + "</td>" +
                "<td>" + e.defeated + "</td>" +
                "<td>" + e.wins + "</td>";
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="loadingMsg">Sin datos de combate aún.</td></tr>';
    }
}

// ---------------------------------------------------------------------------
// Render – Exploración stats
// ---------------------------------------------------------------------------
function renderExploracion(data) {
    document.getElementById("labyrinthsExplored").textContent = data.labyrinthsExplored;
    document.getElementById("chestsOpened").textContent       = data.chestsOpened;
    document.getElementById("secretsFound").textContent       = data.secretsFound;
    document.getElementById("highestLevel").textContent       = data.highestLevel;
    document.getElementById("bestRunTime").textContent        = formatTime(data.bestRunTimeSecs);
    document.getElementById("levelsCompleted").textContent    = data.levelsCompleted;
}

// ---------------------------------------------------------------------------
// Render – Cartas stats
// ---------------------------------------------------------------------------
function renderCartas(data) {
    document.getElementById("cardsFound").textContent   = data.cardsFound;
    document.getElementById("uniqueCards").textContent  = data.uniqueCards;
    document.getElementById("legendaryCards").textContent = data.legendaryCards;

    const topCard = data.topCards && data.topCards.length > 0
        ? data.topCards[0].name
        : "—";
    document.getElementById("topCard").textContent = topCard;

    const tbody = document.getElementById("cardsTableBody");
    tbody.innerHTML = "";
    if (data.topCards && data.topCards.length > 0) {
        data.topCards.forEach((c, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + (idx + 1) + "</td>" +
                "<td>" + c.name + "</td>" +
                "<td>" + c.type + "</td>" +
                "<td>" + c.tier + "</td>" +
                "<td>" + c.used + "</td>";
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="loadingMsg">Sin datos de cartas aún.</td></tr>';
    }
}

// ---------------------------------------------------------------------------
// Render – Global Leaderboard
// ---------------------------------------------------------------------------
function renderLeaderboard(data) {
    const tbody = document.getElementById("leaderboardBody");
    tbody.innerHTML = "";
    if (data.leaderboard && data.leaderboard.length > 0) {
        data.leaderboard.forEach((player, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + (idx + 1) + "</td>" +
                "<td>" + player.name + "</td>" +
                "<td>" + player.runs + "</td>" +
                "<td>" + player.wins + "</td>";
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="loadingMsg">Sin datos.</td></tr>';
    }
}

// ---------------------------------------------------------------------------
// Category filter logic
// ---------------------------------------------------------------------------
function initFilters() {
    const filterBtns    = document.querySelectorAll(".filterBtn");
    const statsSections = document.querySelectorAll(".statsSection");

    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.category;

            // Update active button
            filterBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            // Show matching section, hide others
            statsSections.forEach((sec) => {
                if (sec.id === target) {
                    sec.classList.remove("hidden");
                } else {
                    sec.classList.add("hidden");
                }
            });
        });
    });
}

// ---------------------------------------------------------------------------
// Back-button navigation
// ---------------------------------------------------------------------------
function initNavigation() {
    const btnBack = document.getElementById("btnBack");
    btnBack.addEventListener("click", () => {
        window.location.href = "../../Menu/html/menu.html";
    });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const data = loadStats();

    renderGeneral(data);
    renderCombate(data);
    renderExploracion(data);
    renderCartas(data);
    renderLeaderboard(data);

    initFilters();
    initNavigation();
});

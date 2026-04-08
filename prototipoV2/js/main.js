"use strict";

/*
 * Endless Nightmare Ritual — Navigation & Interaction Controller
 *
 * Manages transitions between the menu and game sections within
 * the single-page layout of index.html.
 */

document.addEventListener("DOMContentLoaded", () => {

    // ── Section elements ──────────────────────────────────────────────────────
    const menuSection = document.getElementById("menuSection");
    const gameSection = document.getElementById("gameSection");

    // ── Menu elements ─────────────────────────────────────────────────────────
    const menuEl    = document.getElementById("menu");
    const configEl  = document.getElementById("config");

    // ── Menu canvas (background only — no active game loop needed) ────────────
    const menuCanvas = document.getElementById("menuCanvas");
    menuCanvas.width  = 800;
    menuCanvas.height = 600;

    // ── Button: Nueva partida → show game ─────────────────────────────────────
    document.getElementById("irLobby").addEventListener("click", () => {
        showSection("game");
    });

    // ── Button: Ajustes ───────────────────────────────────────────────────────
    document.getElementById("buttonConfig").addEventListener("click", () => {
        configEl.classList.remove("settings");
        menuEl.style.display = "none";
    });

    // ── Button: Volver (inside settings) ──────────────────────────────────────
    document.getElementById("backButton").addEventListener("click", () => {
        configEl.classList.add("settings");
        menuEl.style.display = "block";
    });

    // ── Button: Return to menu from game ──────────────────────────────────────
    document.getElementById("returnToMenu").addEventListener("click", () => {
        showSection("menu");
    });

    // ── Section transition ────────────────────────────────────────────────────
    function showSection(target) {
        if (target === "game") {
            menuSection.classList.add("hidden");
            menuSection.classList.remove("active");
            gameSection.classList.remove("hidden");
            gameSection.classList.add("active");
            initLobbyScene();
        } else {
            gameSection.classList.add("hidden");
            gameSection.classList.remove("active");
            menuSection.classList.remove("hidden");
            menuSection.classList.add("active");
            stopLobbyScene();
            // Restore menu state
            configEl.classList.add("settings");
            menuEl.style.display = "block";
        }
    }

});

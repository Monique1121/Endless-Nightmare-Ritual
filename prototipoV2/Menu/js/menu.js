/*
 * Prototipo
 *
 * Endless Nightmare Ritual
 * 2026-03-11
 */

"use strict";

// Global variables
const canvasWidth = 800;
const canvasHeight = 600;

// Context of the Canvas
let ctx;

document.addEventListener("DOMContentLoaded", () => {

    const menu = document.getElementById("menu");
    const config = document.getElementById("config");
    // boton ajustes 
    const btnConfig = document.getElementById("buttonConfig");

        btnConfig.addEventListener("click", () => {
        config.classList.remove("settings");
    });


    // boton para volver al menu 
    const btnBack = document.getElementById("backButton");

        btnBack.addEventListener("click", () => {
        config.classList.add("settings");
        menu.style.display = "block";
    });

    // boton para ir a la lobby (nueva partida)
    const btnStart = document.getElementById("irLobby");

    btnStart.addEventListener("click", () => {
        // Reset any saved state so the new run starts fresh
        gameState.reset();
        window.location.href = "../../Lobby/html/lobbyV1.html";
    });

    // boton para continuar partida guardada
    const btnContinue = document.getElementById("continuar");

    if (gameState.hasSavedState()) {
        btnContinue.disabled = false;
        btnContinue.classList.remove("button-disabled");
    } else {
        btnContinue.disabled = true;
        btnContinue.classList.add("button-disabled");
    }

    btnContinue.addEventListener("click", () => {
        if (gameState.hasSavedState()) {
            // Navigate directly to the Maze to resume the saved run
            window.location.href = "../../Maze/html/lobbyV1.html";
        }
    });

});

function main() {
    // Get a reference to the object with id 'canvas' in the page
    const canvas = document.getElementById('canvas');
    // Resize the element
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // Get the context for drawing in 2D
    ctx = canvas.getContext('2d');


}
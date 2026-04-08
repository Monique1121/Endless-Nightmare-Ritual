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

    // boton para ir a las estadísticas
    const btnStats = document.getElementById("irEstadisticas");

    if (btnStats) {
        btnStats.addEventListener("click", () => {
            window.location.href = "../../Statistics/html/statistics.html";
        });
    }

    // boton para ir a la lobby 
    const btnStart = document.getElementById("irLobby");

    btnStart.addEventListener("click", () => {
        window.location.href = "../../Lobby/html/lobbyV1.html";
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
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

    const btnConfig = document.getElementById("buttonConfig");
    const btnBack = document.getElementById("backButton");

    btnConfig.addEventListener("click", () => {
        config.classList.remove("settings");
    });

    btnBack.addEventListener("click", () => {
        config.classList.add("settings");
        menu.style.display = "block";
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
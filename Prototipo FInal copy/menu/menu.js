"use strict";

function main() {
  // Esperar a que el DOM esté listo
  window.addEventListener('DOMContentLoaded', function() {
    
    // Botón Nueva Partida
    let btnNuevaPartida = document.getElementById('btnNuevaPartida');
    if (btnNuevaPartida) {
      btnNuevaPartida.addEventListener('click', function() {
        window.top.location.href = '../lobby/lobbyV1.html';
      });
    }
    
    // Botón Continuar
    let btnContinuar = document.getElementById('btnContinuar');
    if (btnContinuar) {
      btnContinuar.addEventListener('click', function() {
        alert('Funcionalidad de continuar próximamente');
      });
    }
    
    // Botón Ajustes
    let buttonConfig = document.getElementById('buttonConfig');
    let config = document.getElementById('config');
    let menu = document.getElementById('menu');
    
    if (buttonConfig && config && menu) {
      buttonConfig.addEventListener('click', function() {
        menu.style.display = 'none';
        config.style.display = 'block';
      });
    }
    
    // Botón Volver desde ajustes
    let backButton = document.getElementById('backButton');
    if (backButton && config && menu) {
      backButton.addEventListener('click', function() {
        config.style.display = 'none';
        menu.style.display = 'block';
      });
    }
    
    // Botón Créditos
    let btnCreditos = document.getElementById('btnCreditos');
    if (btnCreditos) {
      btnCreditos.addEventListener('click', function() {
        alert('Endless Nightmare Ritual\\nDesarrollado para clase de Construcción de Software');
      });
    }
    
  });
}

"use strict";

function main() {
  // Verificar autenticación antes de mostrar el menú
  checkAuthentication();
  
  // Ajustar canvas al tamaño de la ventana
  const canvas = document.getElementById('canvas');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reajustar cuando cambie el tamaño de la ventana
    window.addEventListener('resize', function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }
  
  // Configurar event listeners para los botones
    
  // Botón Nueva Partida
  let btnNuevaPartida = document.getElementById('btnNuevaPartida');
  if (btnNuevaPartida) {
    btnNuevaPartida.addEventListener('click', function() {
      window.location.href = '../lobby/lobbyV1.html';
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
      alert('Endless Nightmare Ritual\nDesarrollado para clase de Construcción de Software');
    });
  }
}

// Función para verificar autenticación
function checkAuthentication() {
  let isLoggedIn = localStorage.getItem('isLoggedIn');
  
  if (!isLoggedIn || isLoggedIn !== 'true') {
    // Si no está logueado, redirigir al login
    alert('Debes iniciar sesión para jugar');
    window.location.href = '../login/index.html';
    return false;
  }
  
  return true;
}

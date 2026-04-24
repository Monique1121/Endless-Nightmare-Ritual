"use strict";

// Verificar si el usuario está logueado
let isLoggedIn = localStorage.getItem('isLoggedIn');
let username = localStorage.getItem('username');

if (!isLoggedIn || isLoggedIn !== 'true') {
  // Si no está logueado, redirigir al login
  window.location.href = 'index.html';
}

// Mostrar nombre de usuario
let welcomeUser = document.getElementById('welcome-user');
if (welcomeUser && username) {
  welcomeUser.textContent = 'Jugador: ' + username;
}

// Función para cerrar sesión
function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}

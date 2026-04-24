"use strict";

// Obtener elementos del formulario
let loginForm = document.getElementById('loginForm');
let usernameInput = document.getElementById('username');
let passwordInput = document.getElementById('password');
let errorMessage = document.getElementById('error-message');

// Escuchar el submit del formulario
loginForm.addEventListener('submit', function(event) {
  event.preventDefault();
  
  let username = usernameInput.value;
  let password = passwordInput.value;
  
  // Validación simple (sin base de datos real)
  if (username.length < 3) {
    errorMessage.textContent = 'El usuario debe tener al menos 3 caracteres';
    return;
  }
  
  if (password.length < 4) {
    errorMessage.textContent = 'La contraseña debe tener al menos 4 caracteres';
    return;
  }
  
  // Guardar en localStorage que el usuario está logueado
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('username', username);
  
  // Redirigir a la página principal
  window.location.href = 'main.html';
});

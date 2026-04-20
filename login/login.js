"use strict";

const API_URL = 'http://localhost:3000/api';
let loginForm = document.getElementById('loginForm');
let usernameInput = document.getElementById('username');
let passwordInput = document.getElementById('password');
let errorMessage = document.getElementById('error-message');

// Función para hacer login
async function attemptLogin(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Credenciales inválidas');
    }
    
    // Login exitoso
    return data;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
}

// Función para crear jugador si no existe
async function createPlayerIfNeeded(userId, username) {
  try {
    const response = await fetch(`${API_URL}/player/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: userId,
        playerName: username 
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al crear jugador');
    }
    
    return data.playerId;
  } catch (error) {
    console.error('Error al crear jugador:', error);
    throw error;
  }
}

// Escuchar el submit del formulario
loginForm.addEventListener('submit', async function(event) {
  event.preventDefault();
  
  let username = usernameInput.value.trim();
  let password = passwordInput.value;
  
  // Validación simple
  if (username.length < 3) {
    errorMessage.textContent = 'El usuario debe tener al menos 3 caracteres';
    errorMessage.style.color = '#ff4444';
    return;
  }
  
  if (password.length < 4) {
    errorMessage.textContent = 'La contraseña debe tener al menos 4 caracteres';
    errorMessage.style.color = '#ff4444';
    return;
  }
  errorMessage.textContent = 'Conectando con el servidor...';
  errorMessage.style.color = '#ffaa00';
  
  try {
    // Intentar login (solo usuarios existentes)
    const result = await attemptLogin(username, password);
    
    let playerId = null;
    try {
      const playerCheck = await fetch(`${API_URL}/player/${result.userId}`);
      if (playerCheck.ok) {
        const playerData = await playerCheck.json();
        if (playerData.success && playerData.player) {
          playerId = playerData.player.Player_id;
        }
      }
    } catch (e) {
      // Jugador no existe, se creará a continuación
    }
    
    // Si no tiene jugador, crear uno
    if (!playerId) {
      errorMessage.textContent = 'Creando personaje...';
      playerId = await createPlayerIfNeeded(result.userId, username);
    }
    
    // Guardar datos en localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('userId', result.userId);
    localStorage.setItem('playerId', playerId);
    
    // Mensaje de éxito
    errorMessage.textContent = '¡Bienvenido al ritual!';
    errorMessage.style.color = '#44ff44';
    
    // Redirigir al menú después de 500ms
    setTimeout(() => {
      window.location.href = '../menu/menu.html';
    }, 500);
    
  } catch (error) {
    errorMessage.textContent = error.message || 'Error de conexión. Verifica que el servidor esté activo.';
    errorMessage.style.color = '#ff4444';
  }
});

"use strict";

const API_URL = 'http://localhost:3000/api';
// Este login web hace casi lo mismo que el del juego, pero aqui termina mandando al wrapper de jugar.
document.body.classList.toggle('embedded-mode', window.self !== window.top);
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

// Si el usuario ya existe pero le falta su Player, aqui se completa ese paso.
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
    errorMessage.textContent = 'Usuario muy corto (min 3)';
    errorMessage.style.color = '#ff4444';
    return;
  }
  
  if (password.length < 4) {
    errorMessage.textContent = 'Contrasena muy corta (min 4)';
    errorMessage.style.color = '#ff4444';
    return;
  }
  errorMessage.textContent = 'Conectando...';
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
    
    // Esto deja el deck base listo para que la parte web no entre vacia.
    // Asegurar que el jugador tenga 5 cartas iniciales
    errorMessage.textContent = 'Inicializando...';
    try {
      await fetch(`${API_URL}/player/${playerId}/deck/initialize`, {
        method: 'POST'
      });
    } catch (e) {
      // Si falla es porque ya tiene cartas, continuar normalmente
      console.log('Jugador ya tiene cartas iniciales');
    }
    
    // Cargar cartas desde la API y sincronizar con GameState
    errorMessage.textContent = 'Cargando inventario...';
    try {
      const deckResponse = await fetch(`${API_URL}/player/${playerId}/deck`);
      if (deckResponse.ok) {
        const deckData = await deckResponse.json();
        if (deckData.success && deckData.deck) {
          // Guardamos una copia local para que el resto de pantallas lean el mismo estado.
          const storageKey = `playerData_${playerId}`;
          let playerData = localStorage.getItem(storageKey);
          if (!playerData) {
            playerData = {
              Player_id: playerId,
              username: username,
              blood: 100,
              maxBlood: 100,
              inventory: { demonCards: [], loreCards: [] },
              stats: { secretsDiscovered: 0, labyrinthsCompleted: 0, combatsWon: 0, combatsLost: 0, chestsOpened: 0 },
              currentLevel: "escuela",
              chestsOpened: []
            };
          } else {
            playerData = JSON.parse(playerData);
            if (!playerData.Player_id) {
              playerData.Player_id = playerId;
            }
          }
          
          playerData.inventory.demonCards = deckData.deck.map(card => ({
            id: card.Card_id,
            name: card.Card_name,
            image: card.Sprite_path || `assets/sprites/card${card.Card_id}.png`,
            quantity: 1
          }));
          
          localStorage.setItem(storageKey, JSON.stringify(playerData));
        }
      }
    } catch (e) {
      console.error('Error sincronizando inventario:', e);
    }
    
    // Aqui ya dejamos la sesion minima guardada para brincar al wrapper del juego.
    // Guardar datos en localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('userId', result.userId);
    localStorage.setItem('playerId', playerId);
    
    // Mensaje de exito
    errorMessage.textContent = 'BIENVENIDO';
    errorMessage.style.color = '#44ff44';
    
    // Redirigir al menú después de 500ms
    setTimeout(() => {
      window.location.href = 'html/jugar.html';
    }, 500);
    
  } catch (error) {
    errorMessage.textContent = error.message || 'ERROR - Servidor no disponible';
    errorMessage.style.color = '#ff4444';
  }
});

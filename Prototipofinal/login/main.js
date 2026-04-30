"use strict";

const API_URL = 'http://localhost:3000/api';
document.body.classList.toggle('embedded-mode', window.self !== window.top);

// Esta es la portada publica donde solo enseñamos un resumen rapido del juego.

function hasActiveSession() {
  return localStorage.getItem('isLoggedIn') === 'true' && !!localStorage.getItem('playerId');
}

function updateEntryState() {
  const playButton = document.getElementById('play-now-btn');
  const welcomeStatus = document.getElementById('welcome-status');
  const welcomeCopy = document.getElementById('welcome-copy');
  const hasSession = hasActiveSession();

  if (!playButton || !welcomeStatus || !welcomeCopy) {
    return;
  }

  if (hasSession) {
    playButton.textContent = 'CONTINUAR PARTIDA';
    welcomeCopy.textContent = 'Tu sesión ya está lista para volver al ritual.';
    welcomeStatus.textContent = 'Entrarás directo al menú principal del juego.';
    return;
  }

  playButton.textContent = 'ENTRAR AL RITUAL';
  welcomeCopy.textContent = 'El ritual te espera en la oscuridad...';
  welcomeStatus.textContent = 'Primero identifica tu usuario para entrar al menú del juego.';
}

// Desde aqui mandamos al login cuando el usuario ya quiere entrar de verdad.
function goToLogin() {
  if (hasActiveSession()) {
    window.location.href = '../menu/menu.html';
    return;
  }

  window.location.href = 'index.html';
}

// Cada bloque carga un ranking corto para que la portada no se sienta vacia.
async function loadTopCards() {
  const container = document.getElementById('top-cards');
  
  try {
    const response = await fetch(`${API_URL}/leaderboard/cards?limit=5`);
    
    if (!response.ok) {
      throw new Error('Error al cargar ranking');
    }
    
    const players = await response.json();
    
    if (players.length === 0) {
      container.innerHTML = '<p class="mini-placeholder">Sin datos</p>';
      return;
    }
    
    let html = '<ol class="mini-list">';
    players.forEach((player, index) => {
      const position = index + 1;
      html += `<li><span class="rank">${position}.</span> <strong>${player.Player_name}</strong>: ${player.Total_cards || 0} cartas</li>`;
    });
    html += '</ol>';
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<p class="mini-placeholder error">Error de conexión</p>';
  }
}

// Aqui repetimos la idea pero ahora con secretos encontrados.
async function loadTopSecrets() {
  const container = document.getElementById('top-secrets');
  
  try {
    const response = await fetch(`${API_URL}/leaderboard/secrets?limit=5`);
    
    if (!response.ok) {
      throw new Error('Error al cargar ranking');
    }
    
    const players = await response.json();
    
    if (players.length === 0) {
      container.innerHTML = '<p class="mini-placeholder">Sin datos</p>';
      return;
    }
    
    let html = '<ol class="mini-list">';
    players.forEach((player, index) => {
      const position = index + 1;
      html += `<li><span class="rank">${position}.</span> <strong>${player.Player_name}</strong>: ${player.Total_secrets || 0} secretos</li>`;
    });
    html += '</ol>';
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<p class="mini-placeholder error">Error de conexión</p>';
  }
}

// Y este ranking deja ver quien le ha metido mas tiempo al proyecto.
async function loadTopPlaytime() {
  const container = document.getElementById('top-playtime');
  
  try {
    const response = await fetch(`${API_URL}/leaderboard/playtime?limit=5`);
    
    if (!response.ok) {
      throw new Error('Error al cargar ranking');
    }
    
    const players = await response.json();
    
    if (players.length === 0) {
      container.innerHTML = '<p class="mini-placeholder">Sin datos</p>';
      return;
    }
    
    let html = '<ol class="mini-list">';
    players.forEach((player, index) => {
      const position = index + 1;
      const hours = Math.floor((player.Total_playtime || 0) / 3600);
      const minutes = Math.floor(((player.Total_playtime || 0) % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      html += `<li><span class="rank">${position}.</span> <strong>${player.Player_name}</strong>: ${timeStr}</li>`;
    });
    html += '</ol>';
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<p class="mini-placeholder error">Error de conexión</p>';
  }
}

// Apenas abre la pagina jalamos los tres tops para llenar la portada.
window.addEventListener('DOMContentLoaded', function() {
  updateEntryState();
  loadTopCards();
  loadTopSecrets();
  loadTopPlaytime();
});

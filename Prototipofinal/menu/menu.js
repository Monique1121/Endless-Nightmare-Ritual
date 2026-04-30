"use strict";

// Este menu ya es como el puente rapido antes de entrar al lobby.
// Aqui dejamos solo lo importante para no meter opciones de mas.

function navigateGame(url) {
  window.location.href = url;
}

// Leemos el rol guardado para pintar la etiqueta sin pedirlo otra vez a la API.
function getStoredUserRole() {
  const storedRole = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
  if (storedRole === 'admin') {
    return 'admin';
  }

  if (localStorage.getItem('isAdmin') === 'true') {
    return 'admin';
  }

  return 'ejecutivo';
}

function main() {
  // Ajustar canvas a pantalla completa
  const canvas = document.getElementById('canvas');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reajustar si cambia el tamaño de ventana
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }
  
  // Esperar a que el DOM esté listo
  window.addEventListener('DOMContentLoaded', function() {
    const musicController = BackgroundMusic.createSceneMusic('../musica/Jes%C3%BAs%20Lastra%20-%20Abandoned.mp3');
    const volumeMusic = document.getElementById('volumeMusic');

    BackgroundMusic.bindMusicSlider(volumeMusic);
    musicController.syncVolume();

    const userRole = getStoredUserRole();
    const roleBadge = document.getElementById('roleBadge');

    if (roleBadge) {
      roleBadge.textContent = userRole === 'admin' ? 'Rol: Administrador' : 'Rol: Ejecutivo';
      roleBadge.classList.toggle('admin-role', userRole === 'admin');
    }
    
    // Botón Nueva Partida
    let btnNuevaPartida = document.getElementById('btnNuevaPartida');
    if (btnNuevaPartida) {
      btnNuevaPartida.addEventListener('click', async function() {
        const playerId = localStorage.getItem('playerId');
        if (!playerId) {
          alert('ERROR - Sin jugador activo');
          return;
        }

        try {
          // Aqui se resetea desde servidor para arrancar limpio y con cartas base nuevas.
          // Resetear jugador en el servidor (borra todo y da 5 cartas nuevas)
          const response = await fetch(`http://localhost:3000/api/player/${playerId}/reset`, {
            method: 'POST'
          });
          
          const data = await response.json();
          if (data.success) {
            console.log('Jugador reseteado en servidor');
            console.log('Cartas iniciales:', data.initialCards);
            console.log('Progreso guardado automaticamente - puedes continuar con estas cartas');
            
            // Resetear GameState (limpiar localStorage)
            if (typeof GameState !== 'undefined') {
              GameState.reset();
              console.log('Cache local limpiado');
            }
            
            // Guardar flag de que es nueva partida para que el lobby lo sepa
            localStorage.setItem('isNewGame', 'true');
            
            // Redirigir al lobby (alli se cargaran los datos del servidor)
            navigateGame('../lobby/lobbyV1.html');
          } else {
            alert('ERROR - No se pudo resetear');
          }
        } catch (error) {
          console.error('Error al resetear jugador:', error);
          alert('ERROR - No se pudo iniciar');
        }
      });
    }
    
    // Botón Continuar
    let btnContinuar = document.getElementById('btnContinuar');
    if (btnContinuar) {
      btnContinuar.addEventListener('click', function() {
        const playerId = localStorage.getItem('playerId');
        if (!playerId) {
          alert('ERROR - Sin jugador activo');
          return;
        }
        
        // Simplemente ir al lobby - el lobby cargara los datos del servidor automaticamente
        console.log('Continuando partida guardada...');
        navigateGame('../lobby/lobbyV1.html');
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
    
  });
}

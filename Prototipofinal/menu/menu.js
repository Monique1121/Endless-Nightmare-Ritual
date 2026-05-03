"use strict";

// Redirige a otra pantalla del juego.
function navigateGame(url) {
  window.location.href = url;
}

// Resuelve el rol guardado para pintar la etiqueta del usuario en el menu.
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

// Inicializa musica, botones y flujo de nueva partida o continuar.
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
    const musicVolumeValue = document.getElementById('musicVolumeValue');

    BackgroundMusic.bindMusicSlider(volumeMusic, musicVolumeValue);
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
          // Pide al backend limpiar el progreso pero conservar la cuenta actual.
          const response = await fetch(`http://localhost:3000/api/player/${playerId}/reset`, {
            method: 'POST'
          });
          
          const data = await response.json();
          if (data.success) {
            console.log('Jugador reseteado en servidor');
            console.log('Cartas iniciales:', data.initialCards);
            console.log('Progreso guardado automaticamente - puedes continuar con estas cartas');
            
            // Limpia cache local para que el lobby recargue todo desde servidor.
            if (typeof GameState !== 'undefined') {
              GameState.reset();
              console.log('Cache local limpiado');
            }
            
            // Marca que se trata de una partida nueva para el flujo del lobby.
            localStorage.setItem('isNewGame', 'true');
            
            // El lobby vuelve a consultar progreso, cartas y desbloqueos.
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
        
        // El lobby recupera el progreso actual directamente desde la API.
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

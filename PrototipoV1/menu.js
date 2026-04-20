// =========================================
// ENDLESS NIGHTMARE RITUAL - Menú Principal
// =========================================

// Crear partículas de fondo
function createParticles() {
  const container = document.getElementById('particles');
  const particleCount = 50;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Posición aleatoria
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    // Variables CSS personalizadas para animación
    particle.style.setProperty('--duration', (3 + Math.random() * 5) + 's');
    particle.style.setProperty('--tx', (Math.random() * 100 - 50) + 'px');
    particle.style.setProperty('--ty', (Math.random() * 100 - 50) + 'px');
    particle.style.animationDelay = Math.random() * 3 + 's';
    
    container.appendChild(particle);
  }
}

createParticles();

// Referencias a elementos del DOM
const mainMenu = document.getElementById('mainMenu');
const levelSelect = document.getElementById('levelSelect');
const btnJugar = document.getElementById('btnJugar');
const btnOpciones = document.getElementById('btnOpciones');
const btnCreditos = document.getElementById('btnCreditos');
const btnSalir = document.getElementById('btnSalir');
const btnBack = document.getElementById('btnBack');

// Sonido de hover (simulado con vibración en móviles)
function playHoverSound() {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

// Agregar efecto de sonido a todos los botones
document.querySelectorAll('.menu-btn, .level-card, .back-btn').forEach(btn => {
  btn.addEventListener('mouseenter', playHoverSound);
});

// Botón Jugar - Ir directo al mapa del bosque
btnJugar.addEventListener('click', () => {
  window.location.href = 'forest-map.html';
});

// Botón Regresar
btnBack.addEventListener('click', () => {
  levelSelect.classList.remove('active');
  mainMenu.style.display = 'flex';
});

// Selección de nivel
document.querySelectorAll('.level-card:not(.level-locked)').forEach(card => {
  card.addEventListener('click', () => {
    const level = card.getAttribute('data-level');
    loadLevel(level);
  });
});

// Función para cargar nivel
function loadLevel(levelName) {
  // Agregar clase de carga
  levelSelect.classList.add('loading');
  
  // Simular carga y redirigir
  setTimeout(() => {
    switch(levelName) {
      case 'forest':
        window.location.href = 'index.html';
        break;
      case 'school':
        // Redirigir a escuela (cuando esté implementado)
        alert('Nivel no disponible aún');
        break;
      case 'hospital':
        // Redirigir a hospital (cuando esté implementado)
        alert('Nivel no disponible aún');
        break;
      case 'lab':
        // Redirigir a laboratorio (cuando esté implementado)
        alert('Nivel no disponible aún');
        break;
    }
  }, 500);
}

// Botón Opciones
btnOpciones.addEventListener('click', () => {
  alert('Opciones - Próximamente\n\nAquí podrás configurar:\n- Volumen\n- Dificultad\n- Controles\n- Pantalla completa');
});

// Botón Créditos
btnCreditos.addEventListener('click', () => {
  alert('CRÉDITOS\n\n' +
        '═══════════════════\n' +
        'ENDLESS NIGHTMARE RITUAL\n' +
        'Versión Final 1.0\n\n' +
        'Desarrollado por:\n' +
        'Tu Equipo de Desarrollo\n\n' +
        'Música y Sonido:\n' +
        'Efectos de Horror Atmosférico\n\n' +
        'Arte Pixel:\n' +
        'Estilo Retro Horror\n\n' +
        'Gracias por jugar\n' +
        '═══════════════════');
});

// Botón Salir
btnSalir.addEventListener('click', () => {
  if (confirm('¿Estás seguro de que deseas salir del juego?')) {
    // En un juego real, cerraría la aplicación
    // En web, podemos redirigir a una página de despedida o cerrar la pestaña
    alert('Gracias por jugar ENDLESS NIGHTMARE RITUAL\n\n¡Hasta la próxima!');
    window.close();
  }
});

// Atajos de teclado
document.addEventListener('keydown', (e) => {
  // ESC para volver
  if (e.key === 'Escape' && levelSelect.classList.contains('active')) {
    btnBack.click();
  }
  
  // Enter en menú principal para jugar
  if (e.key === 'Enter' && mainMenu.style.display !== 'none') {
    btnJugar.click();
  }
});

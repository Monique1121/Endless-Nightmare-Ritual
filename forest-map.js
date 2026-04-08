// =========================================
// ENDLESS NIGHTMARE RITUAL - Mapa del Bosque
// =========================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Configuración del canvas - Mapa MUCHO más grande estilo Fear & Hunger
const TILE_SIZE = 32;
const MAP_WIDTH = 80;  // Mapa masivo para exploración
const MAP_HEIGHT = 60;
const VIEW_WIDTH = 960;  // Vista limitada del jugador
const VIEW_HEIGHT = 640;
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

// Cámara para seguir al jugador
const camera = {
  x: 0,
  y: 0
};

// RNG para generación procedural
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Jugador con animación - Estilo The Binding of Isaac (más visible)
const player = {
  x: MAP_WIDTH / 2,
  y: MAP_HEIGHT / 2,
  size: 24,
  speed: 0.14,  // Un poco más rápido
  color: '#d4a088',  // Color más claro para mejor visibilidad
  walkFrame: 0,
  walkSpeed: 0.15,
  isMoving: false,
  direction: 'down',
  sanity: 100
};

// Edificios/Niveles - Distribuidos en mapa grande
const buildings = [
  {
    name: 'ESCUELA ABANDONADA',
    desc: 'La oscuridad aquí es palpable. Algo te observa desde las sombras...\nNivel: Laberinto + Combate TCG',
    x: 25,
    y: 20,
    width: 5,
    height: 4,
    color: '#7d5a4f',  // Más claro
    icon: '🏫',
    url: 'index.html',
    unlocked: true
  },
  {
    name: 'HOSPITAL ABANDONADO',
    desc: 'El olor a muerte y formaldehído inunda tus sentidos...\n(Próximamente)',
    x: 50,
    y: 35,
    width: 5,
    height: 4,
    color: '#6a6a6a',  // Más claro
    icon: '🏥',
    url: null,
    unlocked: false
  },
  {
    name: 'LABORATORIO ABANDONADO',
    desc: 'Gritos ahogados resuenan desde el subsuelo...\n(Próximamente)',
    x: 60,
    y: 15,
    width: 5,
    height: 4,
    color: '#5f6a5f',  // Más claro
    icon: '🔬',
    url: null,
    unlocked: false
  }
];

// ===== ELEMENTOS TERRORÍFICOS =====
const bloodPools = [];  // Charcos de sangre
const corpses = [];     // Cadáveres
const bones = [];       // Huesos esparcidos
const eyes = [];        // Ojos que observan desde la oscuridad

// Generar elementos de horror
for (let i = 0; i < 150; i++) {
  bloodPools.push({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    size: Math.random() * 1.5 + 0.5,
    darkness: Math.random() * 0.3 + 0.5
  });
}

for (let i = 0; i < 30; i++) {
  corpses.push({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    type: Math.floor(Math.random() * 3),
    rotation: Math.random() * Math.PI * 2
  });
}

for (let i = 0; i < 80; i++) {
  bones.push({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    type: Math.random() > 0.5 ? 'skull' : 'bone',
    rotation: Math.random() * Math.PI * 2
  });
}

// Ojos que parpadean en la oscuridad
for (let i = 0; i < 40; i++) {
  eyes.push({
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    blinkTimer: Math.random() * 100,
    isOpen: true
  });
}

// ===== SISTEMA DE PARTÍCULAS TERRORÍFICAS =====
const particles = [];
const fogParticles = [];

class Particle {
  constructor(x, y, type = 'ash') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.speed = Math.random() * 0.3 + 0.1;
    this.drift = Math.random() * 0.4 - 0.2;
    this.size = Math.random() * 3 + 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.05;
    this.alpha = Math.random() * 0.15 + 0.1;  // Mucho más transparente
    this.color = type === 'ash' ? '#6a6a6a' : 
                 type === 'blood' ? '#8a3a3a' : '#5a5a5a';  // Más claro
  }

  update() {
    this.y += this.speed;
    this.x += this.drift;
    this.rotation += this.rotSpeed;
    
    if (this.y > MAP_HEIGHT * TILE_SIZE + 10) {
      this.y = -10;
      this.x = Math.random() * MAP_WIDTH * TILE_SIZE;
    }
  }

  draw(ctx, camX, camY) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x - camX, this.y - camY);
    ctx.rotate(this.rotation);
    
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    
    ctx.restore();
  }
}

class FogParticle {
  constructor() {
    this.x = Math.random() * MAP_WIDTH * TILE_SIZE;
    this.y = Math.random() * MAP_HEIGHT * TILE_SIZE;
    this.radius = Math.random() * 60 + 40;
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.speedY = (Math.random() - 0.5) * 0.15;
    this.alpha = Math.random() * 0.25 + 0.15;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    
    if (this.x < -this.radius) this.x = MAP_WIDTH * TILE_SIZE + this.radius;
    if (this.x > MAP_WIDTH * TILE_SIZE + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = MAP_HEIGHT * TILE_SIZE + this.radius;
    if (this.y > MAP_HEIGHT * TILE_SIZE + this.radius) this.y = -this.radius;
  }

  draw(ctx, camX, camY) {
    const grd = ctx.createRadialGradient(
      this.x - camX, this.y - camY, 0, 
      this.x - camX, this.y - camY, this.radius
    );
    grd.addColorStop(0, `rgba(120, 120, 120, ${this.alpha * 0.3})`);  // Mucho más sutil
    grd.addColorStop(1, 'rgba(100, 100, 100, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.x - camX, this.y - camY, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Inicializar partículas - Ceniza y niebla densa
for (let i = 0; i < 100; i++) {
  particles.push(new Particle(
    Math.random() * MAP_WIDTH * TILE_SIZE,
    Math.random() * MAP_HEIGHT * TILE_SIZE,
    Math.random() > 0.9 ? 'blood' : 'ash'
  ));
}

for (let i = 0; i < 40; i++) {
  fogParticles.push(new FogParticle());
}

// ===== GENERACIÓN DE DECORACIONES TERRORÍFICAS =====
const trees = [];
const decorations = [];

// Generar árboles muertos y retorcidos
for (let i = 0; i < 200; i++) {
  const tx = Math.random() * MAP_WIDTH;
  const ty = Math.random() * MAP_HEIGHT;
  
  // No poner árboles en edificios
  let onBuilding = false;
  for (let building of buildings) {
    if (tx >= building.x - 2 && tx <= building.x + building.width + 2 &&
        ty >= building.y - 2 && ty <= building.y + building.height + 2) {
      onBuilding = true;
      break;
    }
  }
  
  if (!onBuilding) {
    trees.push({
      x: tx,
      y: ty,
      size: Math.random() * 0.9 + 0.5,
      shade: Math.random() * 40,
      dead: Math.random() > 0.4  // 60% árboles muertos
    });
  }
}

// Generar decoraciones (rocas ensangrentadas, cráneos, cruces)
for (let i = 0; i < 100; i++) {
  const dx = Math.random() * MAP_WIDTH;
  const dy = Math.random() * MAP_HEIGHT;
  
  decorations.push({
    x: dx,
    y: dy,
    type: ['rock', 'grave', 'cross', 'bones'][Math.floor(Math.random() * 4)],
    size: Math.random() * 0.6 + 0.4
  });
}

// Input
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  
  // Interacción con E
  if (e.key.toLowerCase() === 'e') {
    checkBuildingInteraction();
  }
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Botón menú
document.getElementById('menuBtn').addEventListener('click', () => {
  if (confirm('¿Volver al menú principal?')) {
    window.location.href = 'menu.html';
  }
});

// Sistema de interacción
let currentBuilding = null;
const interactPrompt = document.getElementById('interactPrompt');
const buildingNameEl = document.getElementById('buildingName');
const buildingDescEl = document.getElementById('buildingDesc');
const enterBtn = document.getElementById('enterBtn');
const cancelBtn = document.getElementById('cancelBtn');

enterBtn.addEventListener('click', () => {
  if (currentBuilding && currentBuilding.url) {
    window.location.href = currentBuilding.url;
  } else {
    alert('Este nivel aún no está disponible');
    closePrompt();
  }
});

cancelBtn.addEventListener('click', closePrompt);

function closePrompt() {
  interactPrompt.classList.remove('active');
  currentBuilding = null;
}

function checkBuildingInteraction() {
  for (let building of buildings) {
    const playerCenterX = player.x + 0.5;
    const playerCenterY = player.y + 0.5;
    const buildingCenterX = building.x + building.width / 2;
    const buildingCenterY = building.y + building.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(playerCenterX - buildingCenterX, 2) + 
      Math.pow(playerCenterY - buildingCenterY, 2)
    );

    if (distance < 5) {  // Aumentado el rango de interacción
      currentBuilding = building;
      buildingNameEl.textContent = building.icon + ' ' + building.name;
      buildingDescEl.textContent = building.desc;
      interactPrompt.classList.add('active');
      return;
    }
  }
}

// Actualizar jugador
function updatePlayer() {
  let newX = player.x;
  let newY = player.y;
  player.isMoving = false;

  if (keys['w'] || keys['arrowup']) {
    newY -= player.speed;
    player.isMoving = true;
    player.direction = 'up';
  }
  if (keys['s'] || keys['arrowdown']) {
    newY += player.speed;
    player.isMoving = true;
    player.direction = 'down';
  }
  if (keys['a'] || keys['arrowleft']) {
    newX -= player.speed;
    player.isMoving = true;
    player.direction = 'left';
  }
  if (keys['d'] || keys['arrowright']) {
    newX += player.speed;
    player.isMoving = true;
    player.direction = 'right';
  }

  // Animación de caminar
  if (player.isMoving) {
    player.walkFrame += player.walkSpeed;
    if (player.walkFrame > Math.PI * 2) player.walkFrame = 0;
  } else {
    player.walkFrame = 0;
  }

  // Límites del mapa
  newX = Math.max(0.5, Math.min(MAP_WIDTH - 1.5, newX));
  newY = Math.max(0.5, Math.min(MAP_HEIGHT - 1.5, newY));

  // Colisión con edificios
  let collision = false;
  for (let building of buildings) {
    if (newX + 0.75 > building.x && 
        newX - 0.75 < building.x + building.width &&
        newY + 0.75 > building.y && 
        newY - 0.75 < building.y + building.height) {
      collision = true;
      break;
    }
  }

  if (!collision) {
    player.x = newX;
    player.y = newY;
  }

  // Actualizar cámara para seguir al jugador
  camera.x = player.x * TILE_SIZE - VIEW_WIDTH / 2;
  camera.y = player.y * TILE_SIZE - VIEW_HEIGHT / 2;

  // Limitar cámara a los bordes del mapa
  camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - VIEW_WIDTH, camera.x));
  camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - VIEW_HEIGHT, camera.y));
}

// ===== FUNCIONES DE RENDERIZADO TERRORÍFICAS =====

function drawBloodPool(x, y, size, darkness, camX, camY) {
  const px = x * TILE_SIZE - camX;
  const py = y * TILE_SIZE - camY;
  
  if (px < -50 || px > VIEW_WIDTH + 50 || py < -50 || py > VIEW_HEIGHT + 50) return;
  
  ctx.save();
  ctx.globalAlpha = darkness * 0.7;
  const grd = ctx.createRadialGradient(px, py, 0, px, py, TILE_SIZE * size);
  grd.addColorStop(0, '#8a3a3a');
  grd.addColorStop(0.5, '#6a2020');
  grd.addColorStop(1, 'rgba(90, 30, 30, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(px, py, TILE_SIZE * size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCorpse(x, y, type, rotation, camX, camY) {
  const px = x * TILE_SIZE - camX;
  const py = y * TILE_SIZE - camY;
  
  if (px < -50 || px > VIEW_WIDTH + 50 || py < -50 || py > VIEW_HEIGHT + 50) return;
  
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(rotation);
  
  // Cuerpo
  ctx.fillStyle = '#7a5a5a';
  ctx.fillRect(-10, -5, 20, 10);
  
  // Sangre
  ctx.fillStyle = '#6a2a2a';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawBone(x, y, type, rotation, camX, camY) {
  const px = x * TILE_SIZE - camX;
  const py = y * TILE_SIZE - camY;
  
  if (px < -50 || px > VIEW_WIDTH + 50 || py < -50 || py > VIEW_HEIGHT + 50) return;
  
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(rotation);
  
  if (type === 'skull') {
    ctx.fillStyle = '#e4e4d0';  // Más claro
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-3, -2, 2, 3);
    ctx.fillRect(1, -2, 2, 3);
  } else {
    ctx.fillStyle = '#e4e4d0';  // Más claro
    ctx.fillRect(-8, -2, 16, 4);
    ctx.fillRect(-3, -5, 6, 2);
    ctx.fillRect(-3, 3, 6, 2);
  }
  
  ctx.restore();
}

function drawEye(x, y, isOpen, camX, camY) {
  const px = x * TILE_SIZE - camX;
  const py = y * TILE_SIZE - camY;
  
  if (px < -50 || px > VIEW_WIDTH + 50 || py < -50 || py > VIEW_HEIGHT + 50) return;
  if (!isOpen) return;
  
  ctx.save();
  const grd = ctx.createRadialGradient(px, py, 0, px, py, 6);
  grd.addColorStop(0, '#ff6a6a');
  grd.addColorStop(0.5, '#ca4a4a');
  grd.addColorStop(1, 'rgba(200, 74, 74, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTree(x, y, size, shade, dead, camX, camY) {
  const px = x * TILE_SIZE - camX;
  const py = y * TILE_SIZE - camY;
  
  if (px < -100 || px > VIEW_WIDTH + 100 || py < -100 || py > VIEW_HEIGHT + 100) return;
  
  // Sombra del árbol
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(px, py + TILE_SIZE * 0.8, TILE_SIZE * 0.4 * size, TILE_SIZE * 0.2 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  
  if (dead) {
    // Árbol muerto pero visible
    const trunkWidth = TILE_SIZE * 0.12 * size;
    const trunkHeight = TILE_SIZE * 0.8 * size;
    ctx.fillStyle = `rgb(${80 - shade}, ${70 - shade}, ${65 - shade})`;  // Mucho más claro
    
    // Tronco torcido
    ctx.beginPath();
    ctx.moveTo(px - trunkWidth/2, py);
    ctx.lineTo(px - trunkWidth/2 + 3, py - trunkHeight/2);
    ctx.lineTo(px + trunkWidth/2 - 2, py - trunkHeight);
    ctx.lineTo(px + trunkWidth/2, py - trunkHeight);
    ctx.lineTo(px - trunkWidth/2 + 5, py - trunkHeight/2);
    ctx.lineTo(px - trunkWidth/2, py);
    ctx.fill();
    
    // Ramas retorcidas
    ctx.strokeStyle = `rgb(${70 - shade}, ${65 - shade}, ${60 - shade})`;  // Mucho más claro
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py - trunkHeight * 0.7);
    ctx.lineTo(px - 15, py - trunkHeight * 0.9);
    ctx.moveTo(px, py - trunkHeight * 0.5);
    ctx.lineTo(px + 12, py - trunkHeight * 0.7);
    ctx.stroke();
  } else {
    // Árbol vivo y visible
    const trunkWidth = TILE_SIZE * 0.15 * size;
    const trunkHeight = TILE_SIZE * 0.6 * size;
    ctx.fillStyle = `rgb(${90 - shade}, ${80 - shade}, ${70 - shade})`;  // Mucho más claro
    ctx.fillRect(px - trunkWidth / 2, py - trunkHeight, trunkWidth, trunkHeight);
    
    // Copa verde visible
    const foliageColor = `rgb(${70 - shade}, ${90 - shade}, ${70 - shade})`;  // Verde más claro
    ctx.fillStyle = foliageColor;
    
    ctx.beginPath();
    ctx.arc(px, py - trunkHeight, TILE_SIZE * 0.5 * size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(px - TILE_SIZE * 0.25 * size, py - trunkHeight - TILE_SIZE * 0.2 * size, TILE_SIZE * 0.35 * size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE * 0.25 * size, py - trunkHeight - TILE_SIZE * 0.2 * size, TILE_SIZE * 0.35 * size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDecoration(x, y, type, size, camX, camY) {
  const px = x * TILE_SIZE - camX;
  const py = y * TILE_SIZE - camY;
  
  if (px < -50 || px > VIEW_WIDTH + 50 || py < -50 || py > VIEW_HEIGHT + 50) return;
  
  if (type === 'rock') {
    ctx.fillStyle = '#8a8a8a';  // Mucho más claro
    ctx.beginPath();
    ctx.ellipse(px, py, TILE_SIZE * 0.3 * size, TILE_SIZE * 0.2 * size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Manchas de sangre
    ctx.fillStyle = '#7a3a3a';  // Más visible
    ctx.beginPath();
    ctx.arc(px - 3, py - 2, TILE_SIZE * 0.08 * size, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'grave') {
    // Lápida
    ctx.fillStyle = '#9a9a9a';  // Mucho más claro
    ctx.fillRect(px - 8, py - 16, 16, 20);
    ctx.beginPath();
    ctx.arc(px, py - 16, 8, Math.PI, 0);
    ctx.fill();
    
    // Cruz
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(px - 1, py - 14, 2, 10);
    ctx.fillRect(px - 4, py - 11, 8, 2);
  } else if (type === 'cross') {
    // Cruz de madera
    ctx.fillStyle = '#8a6a5a';  // Mucho más claro
    ctx.fillRect(px - 2, py - 20, 4, 20);
    ctx.fillRect(px - 8, py - 15, 16, 4);
  } else if (type === 'bones') {
    // Pila de huesos
    ctx.fillStyle = '#e4e4d0';  // Más claro
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(px - 6 + i * 3, py - 2 + i * 2, 8, 3);
    }
  }
}

// Renderizar - Estilo THE BINDING OF ISAAC
function render() {
  const camX = camera.x;
  const camY = camera.y;
  
  // Fondo claro estilo The Binding of Isaac
  ctx.fillStyle = '#7a6a5a';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Niebla muy sutil (casi invisible)
  for (let fog of fogParticles) {
    fog.update();
    ctx.save();
    ctx.globalAlpha = 0.15; // Mucho más transparente
    fog.draw(ctx, camX, camY);
    ctx.restore();
  }

  // Suelo con textura de tierra visible
  ctx.fillStyle = '#8b7355';
  for (let i = 0; i < MAP_WIDTH; i++) {
    for (let j = 0; j < MAP_HEIGHT; j++) {
      const px = i * TILE_SIZE - camX;
      const py = j * TILE_SIZE - camY;
      
      if (px > -50 && px < VIEW_WIDTH + 50 && py > -50 && py < VIEW_HEIGHT + 50) {
        if (seededRandom(i * 137 + j * 213) > 0.8) {
          ctx.fillRect(px + seededRandom(i + j * 100) * 10, 
                       py + seededRandom(j + i * 100) * 10, 
                       1, 1);
        }
      }
    }
  }

  // Charcos de sangre
  bloodPools.forEach(pool => {
    drawBloodPool(pool.x, pool.y, pool.size, pool.darkness, camX, camY);
  });

  // Cadáveres
  corpses.forEach(corpse => {
    drawCorpse(corpse.x, corpse.y, corpse.type, corpse.rotation, camX, camY);
  });

  // Huesos
  bones.forEach(bone => {
    drawBone(bone.x, bone.y, bone.type, bone.rotation, camX, camY);
  });

  // Decoraciones (capa inferior)
  decorations.forEach(dec => {
    if (dec.y < player.y) {
      drawDecoration(dec.x, dec.y, dec.type, dec.size, camX, camY);
    }
  });

  // Árboles (capa inferior - detrás del jugador)
  trees.forEach(tree => {
    if (tree.y < player.y) {
      drawTree(tree.x, tree.y, tree.size, tree.shade, tree.dead, camX, camY);
    }
  });

  // Edificios con cámara
  for (let building of buildings) {
    const x = building.x * TILE_SIZE - camX;
    const y = building.y * TILE_SIZE - camY;
    const w = building.width * TILE_SIZE;
    const h = building.height * TILE_SIZE;

    // Solo renderizar si está en vista
    if (x > -w - 50 && x < VIEW_WIDTH + 50 && y > -h - 50 && y < VIEW_HEIGHT + 50) {
      // Sombra suave
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x + 8, y + 8, w, h);

      // Edificio base visible
      ctx.fillStyle = building.unlocked ? building.color : '#6a6a6a';
      ctx.fillRect(x, y, w, h);

      // Grietas y detalles
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      for (let i = 0; i < 8; i++) {
        const cx = x + seededRandom(i * 23 + building.x) * w;
        const cy = y + seededRandom(i * 47 + building.y) * h;
        ctx.fillRect(cx, cy, 1, seededRandom(i * 71) * 15 + 5);
      }

      // Ventanas con luz inquietante
      if (building.unlocked) {
        const windowRows = building.height;
        const windowCols = building.width;
        
        for (let wy = 0; wy < windowRows; wy++) {
          for (let wx = 0; wx < windowCols; wx++) {
            const windowX = x + wx * TILE_SIZE + TILE_SIZE * 0.25;
            const windowY = y + wy * TILE_SIZE + TILE_SIZE * 0.2;
            const windowW = TILE_SIZE * 0.35;
            const windowH = TILE_SIZE * 0.45;
            
            // Marco de ventana
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(windowX - 2, windowY - 2, windowW + 4, windowH + 4);
            
            // Luz sangrienta parpadeante
            if (seededRandom(wx * 11 + wy * 13) > 0.4) {
              const flicker = Math.sin(Date.now() * 0.01 + wx * 100) * 0.2 + 0.8;
              ctx.fillStyle = `rgba(200, 60, 60, ${flicker * 0.8})`;  // Más brillante
              ctx.fillRect(windowX, windowY, windowW, windowH);
              
              // Resplandor exterior
              ctx.save();
              ctx.globalAlpha = flicker * 0.5;
              const windowGlow = ctx.createRadialGradient(
                windowX + windowW/2, windowY + windowH/2, 0,
                windowX + windowW/2, windowY + windowH/2, 35
              );
              windowGlow.addColorStop(0, '#ca4a4a');
              windowGlow.addColorStop(1, 'rgba(200, 74, 74, 0)');
              ctx.fillStyle = windowGlow;
              ctx.fillRect(windowX - 20, windowY - 20, windowW + 40, windowH + 40);
              ctx.restore();
            } else {
              ctx.fillStyle = '#4a4a4a';
              ctx.fillRect(windowX, windowY, windowW, windowH);
            }
          }
        }
      }

      // Borde del edificio
      ctx.strokeStyle = building.unlocked ? '#7a7a7a' : '#5a5a5a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Techo
      ctx.fillStyle = building.unlocked ? '#5a5a5a' : '#4a4a4a';
      ctx.beginPath();
      ctx.moveTo(x - 12, y);
      ctx.lineTo(x + w / 2, y - 25);
      ctx.lineTo(x + w + 12, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Nombre e ícono
      ctx.fillStyle = building.unlocked ? '#d4a090' : '#888';
      ctx.font = 'bold 26px VT323';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.strokeText(building.icon, x + w / 2, y - 30);
      ctx.fillText(building.icon, x + w / 2, y - 30);

      // Indicador de proximidad
      const playerCenterX = player.x + 0.5;
      const playerCenterY = player.y + 0.5;
      const buildingCenterX = building.x + building.width / 2;
      const buildingCenterY = building.y + building.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(playerCenterX - buildingCenterX, 2) + 
        Math.pow(playerCenterY - buildingCenterY, 2)
      );

      if (distance < 5 && building.unlocked) {
        // Pulso de animación
        const pulse = Math.sin(Date.now() * 0.006) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ddd';  // Más claro
        ctx.font = 'bold 24px VT323';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('Presiona E', x + w / 2, y + h + 30);
        ctx.fillText('Presiona E', x + w / 2, y + h + 30);
        ctx.restore();
      }
    }
  }

  // Jugador con cámara - Estilo Isaac (bien visible)
  const px = player.x * TILE_SIZE - camX;
  const py = player.y * TILE_SIZE - camY;

  // Sombra del jugador
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(px + player.size / 2, py + player.size + 2, 
              player.size / 2, player.size / 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Offset de piernas para animación de caminar
  const legOffset = player.isMoving ? Math.sin(player.walkFrame) * 3 : 0;

  // Piernas
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(px + 6, py + player.size - 8 + legOffset, 5, 8);
  ctx.fillRect(px + player.size - 11, py + player.size - 8 - legOffset, 5, 8);

  // Cuerpo del jugador
  ctx.fillStyle = player.color;
  ctx.fillRect(px + 4, py + 6, player.size - 8, player.size - 6);

  // Brazos con animación
  const armSwing = player.isMoving ? Math.sin(player.walkFrame) * 2 : 0;
  ctx.fillStyle = '#b88878';
  ctx.fillRect(px, py + 10 + armSwing, 4, 8);
  ctx.fillRect(px + player.size - 4, py + 10 - armSwing, 4, 8);

  // Cabeza
  ctx.fillStyle = '#f4d4bc';
  ctx.fillRect(px + 6, py + 2, player.size - 12, 10);

  // Ojos (más grandes y visibles)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(px + 8, py + 5, 3, 3);
  ctx.fillRect(px + player.size - 11, py + 5, 3, 3);
  
  // Boca
  ctx.fillStyle = '#8a5a5a';
  ctx.fillRect(px + player.size / 2 - 2, py + 9, 4, 1);

  // Árboles (capa superior - delante del jugador)
  trees.forEach(tree => {
    if (tree.y >= player.y) {
      drawTree(tree.x, tree.y, tree.size, tree.shade, tree.dead, camX, camY);
    }
  });

  // Decoraciones (capa superior)
  decorations.forEach(dec => {
    if (dec.y >= player.y) {
      drawDecoration(dec.x, dec.y, dec.type, dec.size, camX, camY);
    }
  });

  // Ojos en la oscuridad - actualización y renderizado
  eyes.forEach(eye => {
    eye.blinkTimer--;
    if (eye.blinkTimer <= 0) {
      eye.isOpen = !eye.isOpen;
      eye.blinkTimer = eye.isOpen ? Math.random() * 100 + 50 : Math.random() * 10 + 5;
    }
    drawEye(eye.x, eye.y, eye.isOpen, camX, camY);
  });

  // Partículas (ceniza y sangre)
  for (let particle of particles) {
    particle.update();
    particle.draw(ctx, camX, camY);
  }

  // ===== ESTILO THE BINDING OF ISAAC - SIN OSCURIDAD =====
  // Solo una viñeta MUY suave en los bordes, casi imperceptible
  const vignette = ctx.createRadialGradient(
    VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH * 0.4,
    VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH * 0.8
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

// Game loop
function gameLoop() {
  updatePlayer();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();

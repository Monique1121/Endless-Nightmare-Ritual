"use strict";


const API_URL = 'http://localhost:3000/api';

// Variables del canvas
let canvas;
let ctx;
const canvasWidth = 1600;
const canvasHeight = 900;

// Pool de cartas disponibles (se carga desde API)
let cardPool = [];

// Cartas de respaldo en caso de error de conexión
const fallbackCards = [
  { Card_id:1, Card_name:'Sombra Voraz', Cost:1, Attack:3, Life:3 },
  { Card_id:2, Card_name:'Iman Llamas', Cost:2, Attack:4, Life:4 },
  { Card_id:3, Card_name:'Latigo Umbral', Cost:1, Attack:2, Life:2 },
  { Card_id:4, Card_name:'Guardia Abisal', Cost:3, Attack:5, Life:6 },
  { Card_id:5, Card_name:'Bendicion', Cost:2, Attack:1, Life:5 },
  { Card_id:6, Card_name:'Furia Carmesi', Cost:4, Attack:7, Life:5 },
  { Card_id:7, Card_name:'Eco Vacio', Cost:2, Attack:3, Life:3 },
  { Card_id:8, Card_name:'Tormentador', Cost:3, Attack:6, Life:4 },
  { Card_id:9, Card_name:'Pesadilla', Cost:1, Attack:2, Life:3 },
  { Card_id:10, Card_name:'Asesino', Cost:2, Attack:4, Life:3 }
];

// Estado del juego
let gameState = {
  turn: 'player',
  phase: 'main',
  playerBlood: 100,
  playerMaxBlood: 100,
  oppBlood: 50,
  oppMaxBlood: 100,
  playerHand: [],
  oppHand: [],
  playerBenchCards: [null, null, null, null],
  playerActiveCard: null,
  oppBenchCards: [null, null, null, null],
  oppActiveCard: null,
  selectedHandCard: null,
  cardIdCounter: 100,
  cardsPlayedThisTurn: 0,
  playerKnockouts: 0,
  oppKnockouts: 0,
  waitingForAI: false,
  aiTimer: 0,
  sacrificeUsedThisTurn: false,
  gameOver: false,
  won: false,
  returnTimeout: null,
  combatId: null  // ID del combate en la BD
};
async function loadCardPool() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No hay token de autenticación');
      cardPool = normalizeCards(fallbackCards);
      return;
    }
    
    const response = await fetch(`${API_URL}/cards/pool`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar cartas');
    }
    
    const apiCards = await response.json();
    cardPool = normalizeCards(apiCards);
    console.log(`✅ ${cardPool.length} cartas cargadas desde la API`);
    
  } catch (error) {
    console.error('Error cargando cartas desde API:', error);
    console.warn('Usando cartas de respaldo');
    cardPool = normalizeCards(fallbackCards);
  }
}

// Normalizar cartas de la BD al formato del juego
function normalizeCards(apiCards) {
  return apiCards.map(card => ({
    id: card.Card_id,
    name: card.Card_name,
    cost: card.Cost,
    atk: card.Attack,
    hp: card.Life
  }));
}

// Iniciar combate en la BD
async function startCombat() {
  try {
    const token = localStorage.getItem('authToken');
    const playerId = localStorage.getItem('playerId');
    
    if (!token || !playerId) return;
    
    const response = await fetch(`${API_URL}/combat/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        player_id: parseInt(playerId),
        enemy_id: 1  // ID genérico del enemigo
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      gameState.combatId = data.combat_id;
      console.log('Combate iniciado en BD:', data.combat_id);
    }
  } catch (error) {
    console.error('Error al iniciar combate:', error);
  }
}

// Finalizar combate en la BD
async function endCombat(won) {
  try {
    const token = localStorage.getItem('authToken');
    const playerId = localStorage.getItem('playerId');
    
    if (!token || !playerId || !gameState.combatId) return;
    
    const response = await fetch(`${API_URL}/combat/${gameState.combatId}/end`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        winner: won ? 'player' : 'enemy',
        player_id: parseInt(playerId)
      })
    });
    
    if (response.ok) {
      console.log(`Combate finalizado: ${won ? 'VICTORIA' : 'DERROTA'}`);
      
      // Sincronizar GameState si existe
      if (typeof GameState !== 'undefined' && GameState.sync) {
        await GameState.sync();
      }
    }
  } catch (error) {
    console.error('Error al finalizar combate:', error);
  }
}
// FUNCIONES AUXILIARES

// Funciones auxiliares simples
function cloneCard(card) {
  let newCard = {
    id: card.id,
    name: card.name,
    cost: card.cost,
    atk: card.atk,
    hp: card.hp,
    instanceId: gameState.cardIdCounter,
    currentHP: card.hp
  };
  gameState.cardIdCounter = gameState.cardIdCounter + 1;
  return newCard;
}

function log(msg) {
  console.log(msg);
}
function draw() {
  // Limpiar canvas
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  drawGameInfo();
  drawOppField();
  drawPlayerField();
  drawPlayerHand();
  
  // Verificar fin de juego
  checkGameOver();
  if (gameState.waitingForAI) {
    gameState.aiTimer = gameState.aiTimer + 1;
    if (gameState.aiTimer > 60) {
      gameState.waitingForAI = false;
      gameState.aiTimer = 0;
      aiTurn();
    }
  }
  if (gameState.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.fillStyle = gameState.won ? '#00ff00' : '#ff0000';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    
    if (gameState.won) {
      ctx.fillText('VICTORIA!', canvasWidth / 2, canvasHeight / 2 - 60);
      ctx.fillStyle = 'white';
      ctx.font = '36px Arial';
      ctx.fillText('Noqueaste 6 cartas del rival', canvasWidth / 2, canvasHeight / 2 + 20);
    } else {
      ctx.fillText('DERROTA', canvasWidth / 2, canvasHeight / 2 - 60);
      ctx.fillStyle = 'white';
      ctx.font = '36px Arial';
      ctx.fillText('Perdiste 6 cartas', canvasWidth / 2, canvasHeight / 2 + 20);
    }
    
    ctx.font = '28px Arial';
    ctx.fillText('Regresando al lobby...', canvasWidth / 2, canvasHeight / 2 + 100);
    ctx.textAlign = 'left';
    
    // Regresar al lobby despues de 3 segundos
    if (!gameState.returnTimeout) {
      gameState.returnTimeout = setTimeout(function() {
        window.location.href = '../lobby/lobbyV1.html';
      }, 3000);
    }
  }
  
  requestAnimationFrame(draw);
}

function drawGameInfo() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  
  // Turno actual
  let turnText = gameState.turn === 'player' ? 'TU TURNO' : 'TURNO RIVAL';
  let phaseText = gameState.phase === 'main' ? 'Jugar Cartas' : 'Combate';
  ctx.fillText(turnText + ' - ' + phaseText, 450, 30);
  
  // Sangre del jugador
  ctx.fillText('Tu sangre: ' + gameState.playerBlood + '/' + gameState.playerMaxBlood, 50, 30);
  
  // Sangre del rival
  ctx.fillText('Rival: ' + gameState.oppBlood + '/' + gameState.oppMaxBlood, 950, 30);
  
  // Knockouts
  ctx.fillText('KO: ' + gameState.playerKnockouts + '/6', 50, 60);
  ctx.fillText('KO: ' + gameState.oppKnockouts + '/6', 950, 60);
}

    function drawPlayerHand() {
      let cardWidth = 80;
      let cardHeight = 110;
      let startX = 100;
      let startY = 650;
      let spacing = 90;
      
      ctx.font = '12px Arial';
      
      for (let i = 0; i < gameState.playerHand.length; i++) {
        let card = gameState.playerHand[i];
        let x = startX + (i * spacing);
        let canAfford = gameState.playerBlood >= card.cost;
        let isPlayerTurn = gameState.turn === 'player' && gameState.phase === 'main';
        
        // Color de la carta
        if (!canAfford || !isPlayerTurn) {
          ctx.fillStyle = '#1a1a1a';
        } else if (gameState.selectedHandCard === card) {
          ctx.fillStyle = '#cc0000';
        } else {
          ctx.fillStyle = '#4a0000';
        }
        ctx.fillRect(x, startY, cardWidth, cardHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(x, startY, cardWidth, cardHeight);
        
        // Nombre de la carta (acortado si es necesario)
        ctx.fillStyle = '#ffffff';
        let shortName = card.name.length > 10 ? card.name.substring(0, 9) + '...' : card.name;
        ctx.fillText(shortName, x + 5, startY + 20);
        
        // Stats
        ctx.fillText('Cost: ' + card.cost, x + 5, startY + 40);
        ctx.fillText('ATK: ' + card.atk, x + 5, startY + 60);
        ctx.fillText('HP: ' + card.hp, x + 5, startY + 80);
      }
      
      // Instrucciones
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText('Haz clic en una carta para seleccionarla', 100, 630);
    }

    function drawOppField() {
      // Banco del rival (arriba)
      let cardWidth = 70;
      let cardHeight = 90;
      let startX = 150;
      let startY = 100;
      let spacing = 80;
      
      ctx.font = '12px Arial';
      for (let i = 0; i < 4; i++) {
        let x = startX + (i * spacing);
        let card = gameState.oppBenchCards[i];
        
        if (card) {
          // Carta en banco
          ctx.fillStyle = '#4a0000';
          ctx.fillRect(x, startY, cardWidth, cardHeight);
          ctx.strokeStyle = '#cc0000';
          ctx.strokeRect(x, startY, cardWidth, cardHeight);
          
          ctx.fillStyle = '#ffffff';
          let shortName = card.name.length > 8 ? card.name.substring(0, 7) + '.' : card.name;
          ctx.fillText(shortName, x + 5, startY + 20);
          ctx.fillText('ATK:' + card.atk, x + 5, startY + 40);
          ctx.fillText('HP:' + card.currentHP, x + 5, startY + 60);
        } else {
          // Espacio vacío
          ctx.strokeStyle = '#333333';
          ctx.strokeRect(x, startY, cardWidth, cardHeight);
        }
      }
      
      // Carta activa del rival
      if (gameState.oppActiveCard) {
        let x = 550;
        let y = 100;
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(x, y, 100, 120);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 100, 120);
        ctx.lineWidth = 1;
        
        let card = gameState.oppActiveCard;
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        let shortName = card.name.length > 10 ? card.name.substring(0, 9) : card.name;
        ctx.fillText(shortName, x + 5, y + 20);
        ctx.fillText('ATK: ' + card.atk, x + 5, y + 50);
        ctx.fillText('HP: ' + card.currentHP + '/' + card.hp, x + 5, y + 80);
      } else {
        // Espacio activo vacío
        let x = 550;
        let y = 100;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 100, 120);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('ACTIVO', x + 20, y + 65);
      }
    }

    function drawPlayerField() {
      // Banco del jugador (centro-abajo)
      let cardWidth = 70;
      let cardHeight = 90;
      let startX = 150;
      let startY = 480;
      let spacing = 80;
      
      ctx.font = '12px Arial';
      for (let i = 0; i < 4; i++) {
        let x = startX + (i * spacing);
        let card = gameState.playerBenchCards[i];
        
        if (card) {
          // Carta en banco
          ctx.fillStyle = '#4a0000';
          ctx.fillRect(x, startY, cardWidth, cardHeight);
          ctx.strokeStyle = '#cc0000';
          ctx.strokeRect(x, startY, cardWidth, cardHeight);
          
          ctx.fillStyle = '#ffffff';
          let shortName = card.name.length > 8 ? card.name.substring(0, 7) + '.' : card.name;
          ctx.fillText(shortName, x + 5, startY + 20);
          ctx.fillText('ATK:' + card.atk, x + 5, startY + 40);
          ctx.fillText('HP:' + card.currentHP, x + 5, startY + 60);
        } else {
          // Espacio vacío - resaltar si hay carta seleccionada
          if (gameState.selectedHandCard && gameState.turn === 'player' && gameState.phase === 'main') {
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1;
          }
          ctx.strokeRect(x, startY, cardWidth, cardHeight);
          ctx.lineWidth = 1;
        }
      }
      
      // Carta activa del jugador
      if (gameState.playerActiveCard) {
        let x = 550;
        let y = 480;
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(x, y, 100, 120);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 100, 120);
        ctx.lineWidth = 1;
        
        let card = gameState.playerActiveCard;
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        let shortName = card.name.length > 10 ? card.name.substring(0, 9) : card.name;
        ctx.fillText(shortName, x + 5, y + 20);
        ctx.fillText('ATK: ' + card.atk, x + 5, y + 50);
        ctx.fillText('HP: ' + card.currentHP + '/' + card.hp, x + 5, y + 80);
      } else {
        // Espacio activo vacío
        let x = 550;
        let y = 480;
        if (gameState.selectedHandCard && gameState.turn === 'player' && gameState.phase === 'main') {
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 3;
        }
        ctx.strokeRect(x, y, 100, 120);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('ACTIVO', x + 20, y + 65);
      }
      
      // Botones simples
      drawButton('ATACAR', 700, 500, 120, 35);
      drawButton('TERMINAR', 700, 545, 120, 35);
      drawButton('SACRIFICIO', 700, 590, 120, 35);
    }

    function drawButton(text, x, y, width, height) {
      ctx.fillStyle = '#2a0000';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#cc0000';
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText(text, x + 10, y + 22);
    }

// Seleccionar carta de la mano
function selectHandCard(card) {
  if (gameState.turn !== 'player' || gameState.phase !== 'main') return;
  gameState.selectedHandCard = card;
  log('Carta seleccionada: ' + card.name);
}

// Jugar carta al campo
function playCardToField(zone, index) {
  if (!gameState.selectedHandCard) return;
  if (gameState.playerBlood < gameState.selectedHandCard.cost) {
    log('No tienes suficiente sangre');
    return;
  }
  
  let card = cloneCard(gameState.selectedHandCard);
  gameState.playerBlood = gameState.playerBlood - card.cost;
  
  if (zone === 'bench' && !gameState.playerBenchCards[index]) {
    gameState.playerBenchCards[index] = card;
    log('Carta colocada en banco');
  } else if (zone === 'active' && !gameState.playerActiveCard) {
    gameState.playerActiveCard = card;
    log('Carta activa colocada');
  } else {
    log('Espacio ocupado');
    return;
  }
  
  // Quitar carta de la mano
  let newHand = [];
  for (let i = 0; i < gameState.playerHand.length; i++) {
    if (gameState.playerHand[i] !== gameState.selectedHandCard) {
      newHand.push(gameState.playerHand[i]);
    }
  }
  gameState.playerHand = newHand;
  gameState.selectedHandCard = null;
  gameState.cardsPlayedThisTurn = gameState.cardsPlayedThisTurn + 1;
  
  if (gameState.cardsPlayedThisTurn >= 3) {
    log('Máximo de cartas jugadas (3). Presiona ATACAR o TERMINAR');
  }
}

// Atacar - función simplificada
function manualAttack() {
  if (gameState.turn !== 'player' || gameState.phase !== 'main') return;
  if (!gameState.playerActiveCard) {
    log('No tienes carta activa');
    return;
  }
  
  log('Iniciando combate');
  gameState.phase = 'battle';
  performBattle();
}

// Combate directo - sin setTimeout
function performBattle() {
  if (!gameState.playerActiveCard || !gameState.oppActiveCard) {
    log('No hay combate posible');
    endTurn();
    return;
  }
  
  let playerCard = gameState.playerActiveCard;
  let oppCard = gameState.oppActiveCard;
  
  log(playerCard.name + ' vs ' + oppCard.name);
  
  // Aplicar daño
  playerCard.currentHP = playerCard.currentHP - oppCard.atk;
  oppCard.currentHP = oppCard.currentHP - playerCard.atk;
  
  log('Tu carta: ' + playerCard.currentHP + ' HP, Rival: ' + oppCard.currentHP + ' HP');
  
  // Verificar muertes
  if (oppCard.currentHP <= 0) {
    log('Destruiste ' + oppCard.name);
    gameState.oppActiveCard = null;
    gameState.oppKnockouts = gameState.oppKnockouts + 1;
    promoteFromBench('opponent');
  }
  
  if (playerCard.currentHP <= 0) {
    log('Tu ' + playerCard.name + ' fue destruido');
    gameState.playerActiveCard = null;
    gameState.playerKnockouts = gameState.playerKnockouts + 1;
    promoteFromBench('player');
  }
  
  endTurn();
}

// Promover carta del banco al espacio activo
function promoteFromBench(who) {
  if (who === 'player') {
    for (let i = 0; i < 4; i++) {
      if (gameState.playerBenchCards[i]) {
        gameState.playerActiveCard = gameState.playerBenchCards[i];
        gameState.playerBenchCards[i] = null;
        log('Carta promovida desde banco');
        return;
      }
    }
  } else {
    for (let i = 0; i < 4; i++) {
      if (gameState.oppBenchCards[i]) {
        gameState.oppActiveCard = gameState.oppBenchCards[i];
        gameState.oppBenchCards[i] = null;
        return;
      }
    }
  }
}

// Terminar turno
function manualEndTurn() {
  if (gameState.turn !== 'player' || gameState.phase !== 'main') return;
  log('Pasas el turno');
  endTurn();
}

// Sacrificar carta del banco para potenciar carta activa
function sacrificeForPower() {
  if (gameState.turn !== 'player' || gameState.phase !== 'main') {
    log('No es tu turno');
    return;
  }
  
  if (gameState.sacrificeUsedThisTurn) {
    log('Ya usaste el sacrificio este turno');
    return;
  }
  
  if (!gameState.playerActiveCard) {
    log('No tienes carta activa');
    return;
  }
  
  // Costo de sacrificio
  let sacrificeCost = 15;
  if (gameState.playerBlood < sacrificeCost) {
    log('No tienes suficiente sangre (necesitas 15)');
    return;
  }
  
  // Buscar primera carta en banco
  let sacrificeIndex = -1;
  for (let i = 0; i < 4; i++) {
    if (gameState.playerBenchCards[i]) {
      sacrificeIndex = i;
      break;
    }
  }
  
  if (sacrificeIndex === -1) {
    log('No tienes cartas en el banco para sacrificar');
    return;
  }
  
  // Realizar sacrificio
  let sacrificedCard = gameState.playerBenchCards[sacrificeIndex];
  gameState.playerBenchCards[sacrificeIndex] = null;
  
  // Gastar sangre
  gameState.playerBlood = gameState.playerBlood - sacrificeCost;
  
  // Dar boost a carta activa
  gameState.playerActiveCard.atk = gameState.playerActiveCard.atk + 3;
  gameState.playerActiveCard.currentHP = gameState.playerActiveCard.currentHP + 2;
  
  gameState.sacrificeUsedThisTurn = true;
  
  log('Sacrificaste ' + sacrificedCard.name + ' (-15 sangre)');
  log('Tu carta activa gana +3 ATK y +2 HP');
  
  // Compactar banco (mover cartas a la izquierda)
  compactBench();
}

// Compactar banco del jugador
function compactBench() {
  let cards = [];
  for (let i = 0; i < 4; i++) {
    if (gameState.playerBenchCards[i]) {
      cards.push(gameState.playerBenchCards[i]);
    }
  }
  
  for (let i = 0; i < 4; i++) {
    gameState.playerBenchCards[i] = null;
  }
  
  for (let i = 0; i < cards.length; i++) {
    gameState.playerBenchCards[i] = cards[i];
  }
}

// Terminar turno (interna)
function endTurn() {
  if (gameState.turn === 'player') {
    gameState.turn = 'opponent';
    gameState.phase = 'main';
    gameState.cardsPlayedThisTurn = 0;
    gameState.sacrificeUsedThisTurn = false;
    
    // Regenerar sangre del rival
    if (gameState.oppBlood < gameState.oppMaxBlood) {
      gameState.oppBlood = Math.min(gameState.oppMaxBlood, gameState.oppBlood + 2);
    }
    
    // Activar IA con delay visual
    gameState.waitingForAI = true;
    gameState.aiTimer = 0;
  } else {
    gameState.turn = 'player';
    gameState.phase = 'main';
    gameState.cardsPlayedThisTurn = 0;
    gameState.sacrificeUsedThisTurn = false;
    
    // Regenerar sangre del jugador
    if (gameState.playerBlood < gameState.playerMaxBlood) {
      gameState.playerBlood = Math.min(gameState.playerMaxBlood, gameState.playerBlood + 2);
    }
    
    // Robar cartas
    for (let i = 0; i < 2; i++) {
      if (gameState.playerHand.length < 10) {
        let randomIndex = Math.floor(Math.random() * cardPool.length);
        let newCard = cloneCard(cardPool[randomIndex]);
        gameState.playerHand.push(newCard);
      }
    }
    log('Robaste 2 cartas');
  }
}

// IA simple  - sin setTimeout
function aiTurn() {
  log('Turno del rival');
  
  // Robar 2 cartas
  for (let i = 0; i < 2; i++) {
    if (gameState.oppHand.length < 10) {
      let randomIndex = Math.floor(Math.random() * cardPool.length);
      let newCard = cloneCard(cardPool[randomIndex]);
      gameState.oppHand.push(newCard);
    }
  }
  
  // Ordenar por ATK (más fuerte primero)
  gameState.oppHand.sort(function(a, b) {
    return b.atk - a.atk;
  });
  
  // Jugar hasta 3 cartas
  let played = 0;
  let i = 0;
  while (i < gameState.oppHand.length && played < 3) {
    let card = gameState.oppHand[i];
    
    if (gameState.oppBlood >= card.cost) {
      // Prioridad 1: slot activo
      if (!gameState.oppActiveCard) {
        gameState.oppActiveCard = card;
        gameState.oppBlood = gameState.oppBlood - card.cost;
        log('Rival jugó ' + card.name);
        gameState.oppHand.splice(i, 1);
        played = played + 1;
        continue;
      }
      
      // Prioridad 2: llenar banco
      let placed = false;
      for (let j = 0; j < 4; j++) {
        if (!gameState.oppBenchCards[j]) {
          gameState.oppBenchCards[j] = card;
          gameState.oppBlood = gameState.oppBlood - card.cost;
          log('Rival colocó carta en banco');
          gameState.oppHand.splice(i, 1);
          played = played + 1;
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        i = i + 1;
      }
    } else {
      i = i + 1;
    }
  }
  
  // Decidir si usar sacrificio (simple)
  if (gameState.oppActiveCard && gameState.oppBlood >= 15 && !gameState.sacrificeUsedThisTurn) {
    // Buscar si tiene carta en banco
    let hasBenchCard = false;
    for (let k = 0; k < 4; k++) {
      if (gameState.oppBenchCards[k]) {
        hasBenchCard = true;
        break;
      }
    }
    
    // Sacrificar si tiene mucha sangre (40% de probabilidad)
    if (hasBenchCard && gameState.oppBlood > 25 && Math.random() < 0.4) {
      // Encontrar carta para sacrificar
      for (let k = 0; k < 4; k++) {
        if (gameState.oppBenchCards[k]) {
          let sacrificed = gameState.oppBenchCards[k];
          gameState.oppBenchCards[k] = null;
          gameState.oppBlood = gameState.oppBlood - 15;
          gameState.oppActiveCard.atk = gameState.oppActiveCard.atk + 3;
          gameState.oppActiveCard.currentHP = gameState.oppActiveCard.currentHP + 2;
          gameState.sacrificeUsedThisTurn = true;
          log('Rival sacrificó ' + sacrificed.name + ' (-15 sangre)');
          log('Su carta activa gana +3 ATK y +2 HP');
          break;
        }
      }
    }
  }
  
  // Decidir si atacar (simple)
  if (gameState.oppActiveCard && gameState.playerActiveCard) {
    if (gameState.oppActiveCard.atk >= gameState.playerActiveCard.atk) {
      log('Rival ataca');
      gameState.phase = 'battle';
      performBattle();
    } else {
      log('Rival pasa');
      endTurn();
    }
  } else {
    endTurn();  
  }
}
// Verificar fin de juego
function checkGameOver() {
  if (gameState.oppKnockouts >= 6) {
    showGameOver(true);
  } else if (gameState.playerKnockouts >= 6) {
    showGameOver(false);
  }
}
function showGameOver(won) {
  gameState.phase = 'gameover';
  gameState.gameOver = true;
  gameState.won = won;
  
  // Guardar sangre final en el inventario
  GameState.setBlood(gameState.playerBlood);
  
  if (won) {
    GameState.updateStat('combatsWon');
    
    // Dar carta de recompensa al ganar
    const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
    GameState.addDemonCard(randomCard.id, randomCard.name);
    console.log(`¡Recompensa de victoria! Carta: ${randomCard.name}`);
  } else {
    GameState.updateStat('combatsLost');
  }
  
  // Guardar resultado en la API
  endCombat(won);
}

// Manejo de clicks en canvas
function handleCanvasClick(event) {
  if (gameState.phase === 'gameover') return;
  let rect = canvas.getBoundingClientRect();
  let canvasRatio = canvas.width / canvas.height;  // 1600/900 = 1.777...
  let displayRatio = rect.width / rect.height;
  
  let renderWidth, renderHeight, offsetX, offsetY;
  
  // object-fit: contain crea letterboxing
  if (displayRatio > canvasRatio) {
    // Barras negras a los lados
    renderHeight = rect.height;
    renderWidth = renderHeight * canvasRatio;
    offsetX = (rect.width - renderWidth) / 2;
    offsetY = 0;
  } else {
    // Barras negras arriba/abajo
    renderWidth = rect.width;
    renderHeight = renderWidth / canvasRatio;
    offsetX = 0;
    offsetY = (rect.height - renderHeight) / 2;
  }
  
  // Coordenadas relativas al canvas real (sin letterboxing)
  let x = ((event.clientX - rect.left - offsetX) / renderWidth) * canvas.width;
  let y = ((event.clientY - rect.top - offsetY) / renderHeight) * canvas.height;
  
  // Click en mano (seleccionar carta)
  if (y >= 650 && y <= 760 && gameState.turn === 'player' && gameState.phase === 'main') {
    let cardWidth = 80;
    let startX = 100;
    let spacing = 90;
    
    for (let i = 0; i < gameState.playerHand.length; i++) {
      let cardX = startX + (i * spacing);
      let cardEndX = cardX + cardWidth;
      
      if (x >= cardX && x <= cardEndX) {
        let card = gameState.playerHand[i];
        if (gameState.playerBlood >= card.cost) {
          selectHandCard(card);
        } else {
          log('No tienes suficiente sangre');
        }
        return;
      }
    }
  }
  
  // Click en banco (colocar carta)
  if (gameState.selectedHandCard && y >= 480 && y <= 570) {
    let cardWidth = 70;
    let startX = 150;
    let spacing = 80;
    
    for (let i = 0; i < 4; i++) {
      let cardX = startX + (i * spacing);
      if (x >= cardX && x <= cardX + cardWidth && !gameState.playerBenchCards[i]) {
        playCardToField('bench', i);
        return;
      }
    }
  }
  
  // Click en espacio activo
  if (gameState.selectedHandCard && x >= 550 && x <= 650 && y >= 480 && y <= 600 && !gameState.playerActiveCard) {
    playCardToField('active', null);
    return;
  }
  
  // Click en botones
  if (x >= 700 && x <= 820) {
    if (y >= 500 && y <= 535) {
      manualAttack();
    } else if (y >= 545 && y <= 580) {
      manualEndTurn();
    } else if (y >= 590 && y <= 625) {
      sacrificeForPower();
    }
  }
}

// Inicialización
async function main() {
  canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error('No se encontró el canvas');
    return;
  }
  ctx = canvas.getContext('2d');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  console.log('Cargando cartas desde la API...');
  await loadCardPool();
  
  if (cardPool.length === 0) {
    console.error('No se pudieron cargar las cartas');
    alert('Error: No se pudieron cargar las cartas del juego');
    return;
  }
  
  // Iniciar combate en la BD
  await startCombat();
  const playerData = GameState.load();
  if (playerData) {
    gameState.playerBlood = playerData.blood;
    gameState.playerMaxBlood = playerData.maxBlood;
    console.log(`Sangre inicial del jugador: ${gameState.playerBlood}/${gameState.playerMaxBlood}`);
  } else {
    console.warn('No se encontraron datos del jugador, usando valores por defecto');
    gameState.playerBlood = 100;
    gameState.playerMaxBlood = 100;
  }
  
  // Dar cartas iniciales
  for (let i = 0; i < 5; i++) {
    let randomIndex = Math.floor(Math.random() * cardPool.length);
    gameState.playerHand.push(cloneCard(cardPool[randomIndex]));
  }
  
  for (let i = 0; i < 5; i++) {
    let randomIndex = Math.floor(Math.random() * cardPool.length);
    gameState.oppHand.push(cloneCard(cardPool[randomIndex]));
  }
  
  canvas.addEventListener('click', handleCanvasClick);
  
  requestAnimationFrame(draw);
}

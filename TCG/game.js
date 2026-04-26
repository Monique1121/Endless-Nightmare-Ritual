"use strict";

const API_URL = 'http://localhost:3000/api';

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

async function loadCardPool() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No hay token de autenticación');
      return normalizeCards(fallbackCards);
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
    console.log(`Cartas cargadas: ${apiCards.length}`);
    return normalizeCards(apiCards);
    
  } catch (error) {
    console.error('Error cargando cartas desde API:', error);
    console.warn('Usando cartas de respaldo');
    return normalizeCards(fallbackCards);
  }
}

function normalizeCards(apiCards) {
  return apiCards.map(card => new Card(
    card.Card_id,
    card.Card_name,
    card.Cost,
    card.Attack,
    card.Life
  ));
}

class Card {
  constructor(id, name, cost, atk, hp) {
    this.id        = id;
    this.name      = name;
    this.cost      = cost;
    this.atk       = atk;
    this.hp        = hp;
    this.currentHP = hp;
    this.instanceId = null;
  }
 
  cloneCard(instanceId) {
    const card = new Card(this.id, this.name, this.cost, this.atk, this.hp);
    card.instanceId = instanceId;
    return card;
  }
 
  get isDead() {
    return this.currentHP <= 0;
  }
}
 

class Player {
  constructor(maxBlood = 100) {
    this.blood      = maxBlood;
    this.maxBlood   = maxBlood;
    this.hand       = [];
    this.bench      = [null, null, null, null];
    this.activeCard = null;
    this.knockouts  = 0;
    this.cardsPlayedThisTurn   = 0;
    this.sacrificeUsedThisTurn = false;
  }
 
  canAfford(cost) {
    return this.blood >= cost;
  }
 
  spend(amount) {
    this.blood -= amount;
  }
 
  regen(amount = 2) {
    this.blood = Math.min(this.maxBlood, this.blood + amount);
  }
 
  resetTurnState() {
    this.cardsPlayedThisTurn   = 0;
    this.sacrificeUsedThisTurn = false;
  }
 
  drawCards(cardPool, idCounter, count = 2, maxHand = 10) {
    for (let i = 0; i < count && this.hand.length < maxHand; i++) {
      const base = cardPool[Math.floor(Math.random() * cardPool.length)];
      this.hand.push(base.cloneCard(idCounter.value++));
    }
  }
 
  promoteFromBench() {
    const i = this.bench.findIndex(c => c !== null);
    if (i === -1) return;
    this.activeCard = this.bench[i];
    this.bench[i]   = null;
    this.compactBench();
    log('Carta promovida desde banco');
  }
 
  compactBench() {
    const cards = this.bench.filter(c => c !== null);
    this.bench.fill(null);
    cards.forEach((c, i) => { this.bench[i] = c; });
  }
}
 

class OpponentPlayer extends Player {
  constructor() {
    super(50);
  }
 
  takeTurn(game) {
    log('Turno del rival');
 
    this.drawCards(game.cardPool, game.idCounter, 2);
    this.hand.sort((a, b) => b.atk - a.atk);
 
    // Jugar hasta 3 cartas
    let played = 0;
    let i = 0;
    while (i < this.hand.length && played < 3) {
      const card = this.hand[i];
      if (this.canAfford(card.cost)) {
        if (!this.activeCard) {
          this.activeCard = card;
          this.spend(card.cost);
          this.hand.splice(i, 1);
          log('Rival jugó ' + card.name);
          played++;
          continue;
        }
        const slot = this.bench.indexOf(null);
        if (slot !== -1) {
          this.bench[slot] = card;
          this.spend(card.cost);
          this.hand.splice(i, 1);
          log('Rival colocó carta en banco');
          played++;
          continue;
        }
      }
      i++;
    }
 
    // Sacrificio con 40% de probabilidad
    const hasBench = this.bench.some(c => c !== null);
    if (
      this.activeCard &&
      this.canAfford(15) &&
      !this.sacrificeUsedThisTurn &&
      hasBench &&
      this.blood > 25 &&
      Math.random() < 0.4
    ) {
      const idx = this.bench.findIndex(c => c !== null);
      if (idx !== -1) {
        const sacrificed = this.bench[idx];
        this.bench[idx]  = null;
        this.spend(15);
        this.activeCard.atk       += 3;
        this.activeCard.currentHP += 2;
        this.sacrificeUsedThisTurn = true;
        this.compactBench();
        log('Rival sacrificó ' + sacrificed.name + ' (-15 sangre)');
        log('Su carta activa gana +3 ATK y +2 HP');
      }
    }
 
    // Decidir si atacar
    const playerActive = game.state.player.activeCard;
    if (this.activeCard && playerActive) {
      if (this.activeCard.atk >= playerActive.atk) {
        log('Rival ataca');
        game.state.phase = 'battle';
        game.performBattle();
        return;
      }
    }
 
    log('Rival pasa');
    game.endTurn();
  }
}
 
class CombatState {
  constructor(cardPool) {
    this.cardPool     = cardPool;
    this.turn         = 'player';
    this.phase        = 'main';
    this.player       = new Player();
    this.opponent     = new OpponentPlayer();
    this.waitingForOpponent = false;
    this.opponentTimer      = 0;
    this.gameOver     = false;
    this.winner       = null;
  }
}
 

class Draw {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');
    this.canvas.width  = 1600;
    this.canvas.height = 900;
  }
 
  toCanvasCoords(event) {
    const rect         = this.canvas.getBoundingClientRect();
    const canvasRatio  = this.canvas.width / this.canvas.height;
    const displayRatio = rect.width / rect.height;
 
    let renderW, renderH, offX, offY;
 
    if (displayRatio > canvasRatio) {
      renderH = rect.height;
      renderW = renderH * canvasRatio;
      offX    = (rect.width - renderW) / 2;
      offY    = 0;
    } else {
      renderW = rect.width;
      renderH = renderW / canvasRatio;
      offX    = 0;
      offY    = (rect.height - renderH) / 2;
    }
 
    return {
      x: ((event.clientX - rect.left - offX) / renderW) * this.canvas.width,
      y: ((event.clientY - rect.top  - offY) / renderH) * this.canvas.height,
    };
  }
 
  clear() {
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
 
  render(state, selectedCard) {
    this.clear();
    this.drawGameInfo(state);
    this.drawOppField(state);
    this.drawPlayerField(state, selectedCard);
    this.drawPlayerHand(state, selectedCard);
    this.drawCombatLog();
    if (state.gameOver) this.drawGameOver(state);
  }
 
  drawGameInfo(state) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
 
    const turnText  = state.turn === 'player' ? 'TU TURNO' : 'TURNO RIVAL';
    const phaseText = state.phase === 'main'  ? 'Jugar Cartas' : 'Combate';
 
    ctx.fillText(turnText + ' - ' + phaseText, 450, 30);
    ctx.fillText('Tu sangre: ' + state.player.blood + '/' + state.player.maxBlood, 50, 30);
    ctx.fillText('Rival: '     + state.opponent.blood + '/' + state.opponent.maxBlood, 950, 30);
    ctx.fillText('KO: ' + state.player.knockouts   + '/6', 50,  60);
    ctx.fillText('KO: ' + state.opponent.knockouts + '/6', 950, 60);
  }
 
  drawPlayerHand(state, selectedCard) {
    const ctx = this.ctx;
    ctx.font = '12px Arial';
 
    for (let i = 0; i < state.player.hand.length; i++) {
      const card = state.player.hand[i];
      const x    = 100 + i * 90;
 
      const canAfford    = state.player.canAfford(card.cost);
      const isPlayerTurn = state.turn === 'player' && state.phase === 'main';
 
      ctx.fillStyle = (!canAfford || !isPlayerTurn)
        ? '#1a1a1a'
        : (selectedCard === card ? '#cc0000' : '#4a0000');
 
      ctx.fillRect(x, 650, 80, 110);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x, 650, 80, 110);
 
      ctx.fillStyle = '#ffffff';
      const name = card.name.length > 10 ? card.name.substring(0, 9) + '...' : card.name;
      ctx.fillText(name,              x + 5, 670);
      ctx.fillText('Cost: ' + card.cost, x + 5, 690);
      ctx.fillText('ATK: ' + card.atk,  x + 5, 710);
      ctx.fillText('HP: ' + card.hp,    x + 5, 730);
    }
 
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Haz clic en una carta para seleccionarla', 100, 630);
  }
 
  drawOppField(state) {
    const ctx      = this.ctx;
    const opponent = state.opponent;
 
    ctx.font = '12px Arial';
 
    for (let i = 0; i < 4; i++) {
      const x    = 150 + i * 80;
      const card = opponent.bench[i];
 
      if (card) {
        ctx.fillStyle   = '#4a0000';
        ctx.fillRect(x, 100, 70, 90);
        ctx.strokeStyle = '#cc0000';
        ctx.strokeRect(x, 100, 70, 90);
        ctx.fillStyle = '#ffffff';
        const name = card.name.length > 8 ? card.name.substring(0, 7) + '.' : card.name;
        ctx.fillText(name,                x + 5, 120);
        ctx.fillText('ATK:' + card.atk,   x + 5, 140);
        ctx.fillText('HP:'  + card.currentHP, x + 5, 160);
      } else {
        ctx.strokeStyle = '#333333';
        ctx.strokeRect(x, 100, 70, 90);
      }
    }
 
    if (opponent.activeCard) {
      const card = opponent.activeCard;
      ctx.fillStyle   = '#cc0000';
      ctx.fillRect(550, 100, 100, 120);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth   = 3;
      ctx.strokeRect(550, 100, 100, 120);
      ctx.lineWidth   = 1;
      ctx.fillStyle   = '#ffffff';
      ctx.font        = '14px Arial';
      const name = card.name.length > 10 ? card.name.substring(0, 9) : card.name;
      ctx.fillText(name,                                   555, 120);
      ctx.fillText('ATK: ' + card.atk,                    555, 150);
      ctx.fillText('HP: ' + card.currentHP + '/' + card.hp, 555, 180);
    } else {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth   = 3;
      ctx.strokeRect(550, 100, 100, 120);
      ctx.lineWidth   = 1;
      ctx.fillStyle   = '#ffffff';
      ctx.fillText('ACTIVO', 570, 165);
    }
  }
 
  drawPlayerField(state, selectedCard) {
    const ctx      = this.ctx;
    const player   = state.player;
    const showHint = selectedCard && state.turn === 'player' && state.phase === 'main';
 
    ctx.font = '12px Arial';
 
    for (let i = 0; i < 4; i++) {
      const x    = 150 + i * 80;
      const card = player.bench[i];
 
      if (card) {
        ctx.fillStyle   = '#4a0000';
        ctx.fillRect(x, 480, 70, 90);
        ctx.strokeStyle = '#cc0000';
        ctx.strokeRect(x, 480, 70, 90);
        ctx.fillStyle = '#ffffff';
        const name = card.name.length > 8 ? card.name.substring(0, 7) + '.' : card.name;
        ctx.fillText(name,                x + 5, 500);
        ctx.fillText('ATK:' + card.atk,   x + 5, 520);
        ctx.fillText('HP:'  + card.currentHP, x + 5, 540);
      } else {
        ctx.strokeStyle = showHint ? '#4ade80' : '#666666';
        ctx.lineWidth   = showHint ? 2 : 1;
        ctx.strokeRect(x, 480, 70, 90);
        ctx.lineWidth   = 1;
      }
    }
 
    if (player.activeCard) {
      const card = player.activeCard;
      ctx.fillStyle   = '#00aa00';
      ctx.fillRect(550, 480, 100, 120);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth   = 3;
      ctx.strokeRect(550, 480, 100, 120);
      ctx.lineWidth   = 1;
      ctx.fillStyle   = '#000000';
      ctx.font        = '14px Arial';
      const name = card.name.length > 10 ? card.name.substring(0, 9) : card.name;
      ctx.fillText(name,                                   555, 500);
      ctx.fillText('ATK: ' + card.atk,                    555, 530);
      ctx.fillText('HP: ' + card.currentHP + '/' + card.hp, 555, 560);
    } else {
      ctx.strokeStyle = showHint ? '#4ade80' : '#333333';
      ctx.lineWidth   = 3;
      ctx.strokeRect(550, 480, 100, 120);
      ctx.lineWidth   = 1;
      ctx.fillStyle   = '#ffffff';
      ctx.fillText('ACTIVO', 570, 545);
    }
 
    this.drawButton('ATACAR',     700, 500, 120, 35);
    this.drawButton('TERMINAR',   700, 545, 120, 35);
    this.drawButton('SACRIFICIO', 700, 590, 120, 35);
  }
 
  drawButton(text, x, y, width, height) {
    const ctx = this.ctx;
    ctx.fillStyle   = '#2a0000';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#cc0000';
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle   = '#ffffff';
    ctx.font        = '14px Arial';
    ctx.fillText(text, x + 10, y + 22);
  }
 
  drawGameOver(state) {
    const ctx = this.ctx;
    const won = state.winner === 'player';
 
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
 
    ctx.fillStyle = won ? '#00ff00' : '#ff0000';
    ctx.font      = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(won ? 'VICTORIA!' : 'DERROTA', this.canvas.width / 2, this.canvas.height / 2 - 60);
 
    ctx.fillStyle = 'white';
    ctx.font      = '36px Arial';
    ctx.fillText(
      won ? 'Noqueaste 6 cartas del rival' : 'Perdiste 6 cartas',
      this.canvas.width / 2, this.canvas.height / 2 + 20
    );
    ctx.font = '28px Arial';
    ctx.fillText('Guardando partida...', this.canvas.width / 2, this.canvas.height / 2 + 70);
    ctx.fillText('Regresando al lobby...', this.canvas.width / 2, this.canvas.height / 2 + 110);
    ctx.textAlign = 'left';
  }
  
  drawCombatLog() {
    const ctx = this.ctx;
    const logX = 1100;
    const logY = 50;
    const logWidth = 480;
    const logHeight = 830;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(logX, logY, logWidth, logHeight);
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(logX, logY, logWidth, logHeight);
    
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('REGISTRO DE COMBATE', logX + 10, logY + 25);
    
    if (!window.gameInstance || !window.gameInstance.combatLogs) return;
    
    const logs = window.gameInstance.combatLogs;
    const maxVisibleLogs = 45;
    const startIndex = Math.max(0, logs.length - maxVisibleLogs);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px Courier New';
    
    let yPos = logY + 50;
    for (let i = startIndex; i < logs.length; i++) {
      const log = logs[i];
      const lines = this.wrapText(ctx, log, logWidth - 20);
      
      for (const line of lines) {
        if (yPos > logY + logHeight - 10) break;
        ctx.fillText(line, logX + 10, yPos);
        yPos += 18;
      }
    }
  }
  
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }
}
 

class InputHandler {
  constructor(canvas, game) {
    this.game = game;
    canvas.addEventListener('click', e => this.handleClick(e));
  }
 
  handleClick(event) {
    const { x, y } = this.game.renderer.toCanvasCoords(event);
    this.game.handleClick(x, y);
  }
}
 

class Game {
  constructor(cardPool) {
    this.cardPool       = cardPool;
    this.idCounter      = { value: 100 };
    this.state          = new CombatState(cardPool);
    this.renderer       = new Draw('canvas');
    this.input          = new InputHandler(this.renderer.canvas, this);
    this.selectedCard   = null;
    this._returnTimeout = null;
    this.combatLogs     = [];
    // Variables para BD
    this.combatId       = null;
    this.turnNumber     = 0;
    this.currentTurnId  = null;
    this.bloodSpentThisTurn = 0;
  }
 
  async init() {
    await this.startCombat();
    
    if (typeof GameState !== 'undefined') {
      const playerData = GameState.load();
      if (playerData) {
        this.state.player.blood = playerData.blood;
        this.state.player.maxBlood = playerData.maxBlood;
        console.log(`Sangre inicial del jugador: ${this.state.player.blood}/${this.state.player.maxBlood}`);
      }
    }
    
    this.state.player.drawCards(this.cardPool, this.idCounter, 5);
    this.state.opponent.drawCards(this.cardPool, this.idCounter, 5);
    log('Juego iniciado');
  }

  async startCombat() {
    try {
      const token = localStorage.getItem('authToken');
      const playerId = localStorage.getItem('playerId');
      
      if (!token || !playerId) {
        console.warn('No hay token o playerId, combate sin registrar');
        return;
      }
      
      const levelId = localStorage.getItem('currentLevel') || 1;
      
      const response = await fetch(`${API_URL}/combat/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: parseInt(playerId),
          enemy_id: 1,
          level_id: parseInt(levelId)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.combatId = data.combat_id;
        console.log('Combate iniciado ID:', data.combat_id);
        
        // Registrar el turno inicial
        await this.logTurn('Player', 0);
      } else {
        console.warn('No se pudo iniciar combate en BD');
      }
    } catch (error) {
      console.error('Error al iniciar combate:', error);
    }
  }

  async endCombat(won) {
    try {
      const token = localStorage.getItem('authToken');
      const playerId = localStorage.getItem('playerId');
      
      if (!token || !playerId || !this.combatId) return;
      
      const bloodUsed = this.state.player.maxBlood - this.state.player.blood;
      
      // Determinar cartas ganadas (aleatorio entre 1-3 cartas)
      const cardsGained = [];
      if (won) {
        const numCards = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numCards; i++) {
          const randomCard = this.cardPool[Math.floor(Math.random() * this.cardPool.length)];
          cardsGained.push(randomCard.id);
        }
      }
      
      const response = await fetch(`${API_URL}/combat/${this.combatId}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          winner: won ? 'player' : 'enemy',
          player_id: parseInt(playerId),
          blood_used: bloodUsed,
          total_turns: this.turnNumber || 0,
          player_ko: this.state.player.knockouts,
          enemy_ko: this.state.opponent.knockouts,
          cards_gained: cardsGained
        })
      });
      
      if (response.ok) {
        console.log(`Combate finalizado: ${won ? 'VICTORIA' : 'DERROTA'}`);
        if (won && cardsGained.length > 0) {
          console.log(`Cartas ganadas: ${cardsGained.length}`);
        }
        
        // Sincronizar GameState si existe
        if (typeof GameState !== 'undefined' && GameState.sync) {
          await GameState.sync();
        }
      }
    } catch (error) {
      console.error('Error al finalizar combate:', error);
    }
  }

  async logTurn(activePlayer, bloodSpent) {
    if (!this.combatId) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      this.turnNumber++;
      
      const response = await fetch(`${API_URL}/combat/${this.combatId}/turn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          turn_number: this.turnNumber,
          active_player: activePlayer,
          blood_spent: bloodSpent || 0
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.currentTurnId = data.turn_id;
      }
    } catch (error) {
      console.error('Error al registrar turno:', error);
    }
  }

  async logCardAction(cardId, actionType, usedBy, bloodSpent, damageDealt, hpBefore, hpAfter, cardDead) {
    if (!this.combatId || !this.currentTurnId) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      await fetch(`${API_URL}/combat/${this.combatId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          turn_id: this.currentTurnId,
          card_id: cardId,
          action_type: actionType,
          used_by: usedBy,
          blood_spent: bloodSpent || 0,
          damage_dealt: damageDealt || 0,
          hp_before: hpBefore,
          hp_after: hpAfter,
          card_dead: cardDead || false
        })
      });
    } catch (error) {
      console.error('Error al registrar acción:', error);
    }
  }
 
  gameLoop() {
    this.update();
    this.renderer.render(this.state, this.selectedCard);
    requestAnimationFrame(() => this.gameLoop());
  }
 
  update() {
    this.checkGameOver();
 
    if (this.state.waitingForOpponent) {
      this.state.opponentTimer++;
      if (this.state.opponentTimer > 60) {
        this.state.waitingForOpponent = false;
        this.state.opponentTimer      = 0;
        this.state.opponent.takeTurn(this);
      }
    }
 
    // Regresar al lobby después de 4 segundos (dar tiempo para guardar)
    if (this.state.gameOver && !this._returnTimeout) {
      this._returnTimeout = setTimeout(() => {
        console.log('Regresando al lobby...');
        window.location.href = '../lobby/lobbyV1.html';
      }, 4000);
    }
  }
 
  selectHandCard(card) {
    if (this.state.turn !== 'player' || this.state.phase !== 'main') return;
    this.selectedCard = card;
    log('Carta seleccionada: ' + card.name);
  }
 
  playCardToField(zone, index) {
    const player = this.state.player;
    if (!this.selectedCard) return;
 
    if (!player.canAfford(this.selectedCard.cost)) {
      log('No tienes suficiente sangre');
      return;
    }
 
    const card = this.selectedCard.cloneCard(this.idCounter.value++);
    const bloodCost = card.cost;
 
    if (zone === 'bench') {
      if (player.bench[index] !== null) { log('Espacio ocupado'); return; }
      player.bench[index] = card;
      log('Carta colocada en banco');
    } else if (zone === 'active') {
      if (player.activeCard) { log('Ya tienes carta activa'); return; }
      player.activeCard = card;
      log('Carta activa colocada');
    }
 
    player.spend(bloodCost);
    this.bloodSpentThisTurn += bloodCost;
    
    // Registrar acción en BD
    this.logCardAction(
      card.id,
      'Play',
      'Player',
      bloodCost,
      0,
      card.hp,
      card.currentHP,
      false
    );
    
    player.hand = player.hand.filter(c => c !== this.selectedCard);
    this.selectedCard = null;
    player.cardsPlayedThisTurn++;
 
    if (player.cardsPlayedThisTurn >= 3) {
      log('Máximo de cartas jugadas (3). Presiona ATACAR o TERMINAR');
    }
  }
 
  manualAttack() {
    if (this.state.turn !== 'player' || this.state.phase !== 'main') return;
    if (!this.state.player.activeCard) { log('No tienes carta activa'); return; }
    log('Iniciando combate');
    this.state.phase = 'battle';
    this.performBattle();
  }
 
  performBattle() {
    const player   = this.state.player;
    const opponent = this.state.opponent;
 
    if (!player.activeCard || !opponent.activeCard) {
      log('No hay combate posible');
      this.endTurn();
      return;
    }
 
    const pCard = player.activeCard;
    const oCard = opponent.activeCard;
 
    log(pCard.name + ' vs ' + oCard.name);
 
    // Guardar HP antes del combate
    const playerHpBefore = pCard.currentHP;
    const oppHpBefore = oCard.currentHP;
 
    pCard.currentHP -= oCard.atk;
    oCard.currentHP -= pCard.atk;
 
    log('Tu carta: ' + pCard.currentHP + ' HP, Rival: ' + oCard.currentHP + ' HP');
 
    // Registrar acciones de ataque en BD
    const playerCardDead = pCard.isDead;
    const oppCardDead = oCard.isDead;
    
    this.logCardAction(
      pCard.id,
      'Attack',
      'Player',
      0,
      pCard.atk,
      playerHpBefore,
      pCard.currentHP,
      playerCardDead
    );
    
    this.logCardAction(
      oCard.id,
      'Attack',
      'Enemy',
      0,
      oCard.atk,
      oppHpBefore,
      oCard.currentHP,
      oppCardDead
    );
 
    if (oppCardDead) {
      log('Destruiste ' + oCard.name);
      opponent.activeCard = null;
      opponent.knockouts++;
      opponent.promoteFromBench();
    }
 
    if (playerCardDead) {
      log('Tu ' + pCard.name + ' fue destruido');
      player.activeCard = null;
      player.knockouts++;
      player.promoteFromBench();
    }
 
    this.endTurn();
  }
 
  manualEndTurn() {
    if (this.state.turn !== 'player' || this.state.phase !== 'main') return;
    log('Pasas el turno');
    this.endTurn();
  }
 
  sacrificeForPower() {
    const { state } = this;
    const player    = state.player;
 
    if (state.turn !== 'player' || state.phase !== 'main') { log('No es tu turno'); return; }
    if (player.sacrificeUsedThisTurn) { log('Ya usaste el sacrificio este turno'); return; }
    if (!player.activeCard)           { log('No tienes carta activa'); return; }
    if (!player.canAfford(15))        { log('No tienes suficiente sangre (necesitas 15)'); return; }
 
    const idx = player.bench.findIndex(c => c !== null);
    if (idx === -1) { log('No tienes cartas en el banco para sacrificar'); return; }
 
    const sacrificed   = player.bench[idx];
    const activeCardHpBefore = player.activeCard.currentHP;
    
    player.bench[idx]  = null;
    player.spend(15);
    this.bloodSpentThisTurn += 15;
    
    player.activeCard.atk += 3;
    player.activeCard.currentHP += 2;
    player.sacrificeUsedThisTurn = true;
    player.compactBench();
 
    log('Sacrificaste ' + sacrificed.name + ' (-15 sangre)');
    log('Tu carta activa gana +3 ATK y +2 HP');
    
    // Registrar acción de sacrificio en BD
    this.logCardAction(
      sacrificed.id,
      'Sacrifice',
      'Player',
      15,
      0,
      sacrificed.currentHP,
      0,
      true
    );
    
    // Registrar el boost de la carta activa
    this.logCardAction(
      player.activeCard.id,
      'Boost',
      'Player',
      0,
      3,
      activeCardHpBefore,
      player.activeCard.currentHP,
      false
    );
  }
 
  endTurn() {
    const { state } = this;
    const player    = state.player;
    const opponent  = state.opponent;
 
    if (state.turn === 'player') {
      this.logTurn('Player', this.bloodSpentThisTurn);
      
      state.turn  = 'opponent';
      state.phase = 'main';
      player.resetTurnState();
      this.bloodSpentThisTurn = 0;
      opponent.regen(2);
      state.waitingForOpponent = true;
      state.opponentTimer      = 0;
    } else {
      this.logTurn('Enemy', this.bloodSpentThisTurn);
      
      state.turn  = 'player';
      state.phase = 'main';
      opponent.resetTurnState();
      this.bloodSpentThisTurn = 0;
      player.regen(2);
      player.drawCards(this.cardPool, this.idCounter, 2);
      log('Robaste 2 cartas');
    }
  }
 
  async checkGameOver() {
    if (this.state.gameOver) return;
 
    if (this.state.opponent.knockouts >= 6) {
      this.state.gameOver = true;
      this.state.winner   = 'player';
      log('¡Ganaste el juego!');
      await this.handleGameOver(true);
    } else if (this.state.player.knockouts >= 6) {
      this.state.gameOver = true;
      this.state.winner   = 'opponent';
      log('Perdiste el juego');
      await this.handleGameOver(false);
    }
  }

  async handleGameOver(won) {
    // Guardado automatico al finalizar
    console.log('Finalizando partida...');
    console.log(`Resultado: ${won ? 'VICTORIA' : 'DERROTA'}`);
    console.log(`Sangre final: ${this.state.player.blood}/${this.state.player.maxBlood}`);
    
    if (typeof GameState !== 'undefined') {
      GameState.setBlood(this.state.player.blood);
      console.log('Sangre guardada');
      
      if (won) {
        GameState.updateStat('combatsWon');
        console.log('Estadisticas actualizadas: +1 victoria');
        
        const randomCard = this.cardPool[Math.floor(Math.random() * this.cardPool.length)];
        GameState.addDemonCard(randomCard.id, randomCard.name);
        console.log(`Recompensa obtenida: ${randomCard.name}`);
      } else {
        GameState.updateStat('combatsLost');
        console.log('Estadisticas actualizadas: +1 derrota');
      }
      
      console.log('Sincronizando con servidor...');
      const syncSuccess = await GameState.sync();
      
      if (syncSuccess) {
        console.log('Partida guardada correctamente');
      } else {
        console.warn('Error al sincronizar, datos guardados localmente');
      }
    }
    
    await this.endCombat(won);
  }
 
  handleClick(x, y) {
    const { state } = this;
    if (state.gameOver) return;
 
    const player = state.player;
    const isPlayerMainTurn = state.turn === 'player' && state.phase === 'main';
 
    if (y >= 650 && y <= 760 && isPlayerMainTurn) {
      for (let i = 0; i < player.hand.length; i++) {
        const cardX = 100 + i * 90;
        if (x >= cardX && x <= cardX + 80) {
          const card = player.hand[i];
          player.canAfford(card.cost)
            ? this.selectHandCard(card)
            : log('No tienes suficiente sangre');
          return;
        }
      }
    }
 
    if (this.selectedCard && y >= 480 && y <= 570) {
      for (let i = 0; i < 4; i++) {
        const cardX = 150 + i * 80;
        if (x >= cardX && x <= cardX + 70 && player.bench[i] === null) {
          this.playCardToField('bench', i);
          return;
        }
      }
    }
 
    // Espacio activo del jugador
    if (this.selectedCard && x >= 550 && x <= 650 && y >= 480 && y <= 600 && !player.activeCard) {
      this.playCardToField('active', null);
      return;
    }
 
    if (x >= 700 && x <= 820) {
      if (y >= 500 && y <= 535) { this.manualAttack();      return; }
      if (y >= 545 && y <= 580) { this.manualEndTurn();     return; }
      if (y >= 590 && y <= 625) { this.sacrificeForPower(); return; }
    }
  }
}
 

function log(msg) {
  console.log(msg);
  
  if (window.gameInstance && window.gameInstance.combatLogs) {
    const timestamp = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    window.gameInstance.combatLogs.push(`[${timestamp}] ${msg}`);
    
    if (window.gameInstance.combatLogs.length > 100) {
      window.gameInstance.combatLogs.shift();
    }
  }
}
 
// Inicialización asíncrona
window.onload = async function () {
  window.gameInstance = { combatLogs: ['===== REGISTRO DE COMBATE ====='] };
  
  log('Cargando cartas desde la API...');
  const cardPool = await loadCardPool();
  
  if (cardPool.length === 0) {
    console.error('No se pudieron cargar las cartas');
    alert('Error: No se pudieron cargar las cartas del juego');
    return;
  }
  
  const game = new Game(cardPool);
  game.combatLogs = window.gameInstance.combatLogs;
  window.gameInstance = game;
  await game.init();
  game.gameLoop();
};
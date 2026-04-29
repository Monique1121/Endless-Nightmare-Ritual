"use strict";

const TCG_LAYOUT = {
  hand: { x: 70, y: 650, width: 120, height: 180, spacing: 140 },
  playerBench: { x: 80, y: 420, width: 100, height: 130, spacing: 110 },
  playerActive: { x: 550, y: 380, width: 130, height: 170 },
  buttons: {
    attack: { x: 700, y: 500, width: 120, height: 35 },
    endTurn: { x: 700, y: 545, width: 120, height: 35 },
    sacrifice: { x: 700, y: 590, width: 120, height: 35 }
  }
};

function isPointInsideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
 

class Card {
  constructor(id, name, cost, atk, hp, sprite = null) {
    this.id        = id;
    this.name      = name;
    this.cost      = cost;
    this.atk       = atk;
    this.hp        = hp;
    this.currentHP = hp;
    this.instanceId = null;
    this.sprite    = sprite;
    this.spriteImg = null;
    
    if (sprite) {
      this.spriteImg = new Image();
      this.spriteImg.src = sprite;
    }
  }
 
  cloneCard(instanceId) {
    const card = new Card(this.id, this.name, this.cost, this.atk, this.hp, this.sprite);
    card.instanceId = instanceId;
    return card;
  }
 
  get isDead() {
    return this.currentHP <= 0;
  }
}
 

class Player {
  constructor(maxBlood = 100, playerName = 'Jugador') {
    this.blood      = maxBlood;
    this.maxBlood   = maxBlood;
    this.name       = playerName;
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
    const prefix = this.name === 'Jugador' ? '[JUGADOR]' : '[ENEMIGO]';
    log(`${prefix} Promocion: ${this.activeCard.name}`);
  }
 
  compactBench() {
    const cards = this.bench.filter(c => c !== null);
    this.bench.fill(null);
    cards.forEach((c, i) => { this.bench[i] = c; });
  }
}
 

class AIPlayer extends Player {
  constructor(maxBlood = 50, enemyName = 'Enemigo') {
    super(maxBlood, enemyName);
  }
 
  takeTurn(game) {
    log('[ENEMIGO] Turno iniciado');
 
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
          log('[ENEMIGO] Jugo ' + card.name + ' (activo)');
          played++;
          continue;
        }
        const slot = this.bench.indexOf(null);
        if (slot !== -1) {
          this.bench[slot] = card;
          this.spend(card.cost);
          this.hand.splice(i, 1);
          log('[ENEMIGO] Coloco ' + card.name + ' (banco)');
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
      this.canAfford(10) &&
      !this.sacrificeUsedThisTurn &&
      hasBench &&
      this.blood > 25 &&
      Math.random() < 0.4
    ) {
      const idx = this.bench.findIndex(c => c !== null);
      if (idx !== -1) {
        const sacrificed = this.bench[idx];
        this.bench[idx]  = null;
        this.spend(10);
        this.activeCard.atk       += 3;
        this.activeCard.currentHP += 2;
        this.sacrificeUsedThisTurn = true;
        this.compactBench();
        log('[ENEMIGO] Sacrifico ' + sacrificed.name + ' (-10 sangre)');
        log('[ENEMIGO] Carta activa +3 ATK +2 HP');
      }
    }
 
    // Decidir si atacar
    const playerActive = game.state.player.activeCard;
    if (this.activeCard && playerActive) {
      if (this.activeCard.atk >= playerActive.atk) {
        log('[ENEMIGO] Ataca!');
        game.state.phase = 'battle';
        game.performBattle();
        return;
      }
    }
 
    log('[ENEMIGO] Pasa turno');
    game.endTurn();
  }
}
 
class GameState {
  constructor(cardPool, enemyBlood = 50, playerBlood = 100, playerName = 'Jugador', enemyName = 'Enemigo', knockoutsToWin = 6) {
    this.cardPool     = cardPool;
    this.turn         = 'player';
    this.phase        = 'main';
    this.player       = new Player(playerBlood, playerName);
    this.opponent     = new AIPlayer(enemyBlood, enemyName);
    this.knockoutsToWin = knockoutsToWin;
    this.waitingForAI = false;
    this.aiTimer      = 0;
    this.gameOver     = false;
    this.winner       = null;
    this.turnNumber   = 0;
    this.totalBloodUsed = 0;
  }
}
 

class Draw {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');
    this.canvas.width  = 1600;
    this.canvas.height = 900;
  }
 
  // Convierte coordenadas del click a coordenadas del canvas,
  // corrigiendo el letterboxing de object-fit: contain
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
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
 
  render(state, selectedCard, combatLogs = []) {
    this.clear();
    this.drawGameInfo(state);
    this.drawOppField(state);
    this.drawPlayerField(state, selectedCard);
    this.drawPlayerHand(state, selectedCard);
    this.drawCombatLog(combatLogs);
    if (state.gameOver) this.drawGameOver(state);
  }
 
  drawGameInfo(state) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
 
    const turnText  = state.turn === 'player' ? 'TU TURNO' : `TURNO ${state.opponent.name.toUpperCase()}`;
    const phaseText = state.phase === 'main'  ? 'Jugar Cartas' : 'Combate';
 
    ctx.fillText(turnText + ' - ' + phaseText, 450, 30);
    ctx.fillText(state.player.name + ': ' + state.player.blood + '/' + state.player.maxBlood, 50, 30);
    ctx.fillText(state.opponent.name + ': ' + state.opponent.blood + '/' + state.opponent.maxBlood, 950, 30);
    ctx.fillText('KO: ' + state.player.knockouts   + '/' + state.knockoutsToWin, 50,  60);
    ctx.fillText('KO: ' + state.opponent.knockouts + '/' + state.knockoutsToWin, 950, 60);
  }
 
  drawPlayerHand(state, selectedCard) {
    const ctx = this.ctx;
    const numCards = state.player.hand.length;
    const { hand } = TCG_LAYOUT;
 
    for (let i = 0; i < numCards; i++) {
      const card = state.player.hand[i];
      const x = hand.x + i * hand.spacing;
 
      const canAfford = state.player.canAfford(card.cost);
      const isPlayerTurn = state.turn === 'player' && state.phase === 'main';
      const isSelected = selectedCard === card;
 
      // Color de fondo simple
      if (!canAfford || !isPlayerTurn) {
        ctx.fillStyle = '#2a2a2a';
      } else if (isSelected) {
        ctx.fillStyle = '#ffaa00';
      } else {
        ctx.fillStyle = '#5a0000';
      }
      ctx.fillRect(x, hand.y, hand.width, hand.height);
      
      // Borde
      ctx.strokeStyle = isSelected ? '#ffff00' : '#ffffff';
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.strokeRect(x, hand.y, hand.width, hand.height);
      
      // Sprite
      if (card.spriteImg) {
        ctx.drawImage(card.spriteImg, x + 10, 660, 100, 90);
      }
      
      // Línea separadora
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, 755, 120, 2);
 
      // Nombre
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Arial';
      const name = card.name.length > 11 ? card.name.substring(0, 10) + '...' : card.name;
      ctx.fillText(name, x + 8, 773);
      
      // Stats
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ffff00';
      ctx.fillText('C:' + card.cost, x + 8, 791);
      ctx.fillStyle = '#ff6666';
      ctx.fillText('ATK:' + card.atk, x + 8, 807);
      ctx.fillStyle = '#00ff00';
      ctx.fillText('HP:' + card.hp, x + 8, 823);
    }
 
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Selecciona una carta', 70, 635);
  }
 
  drawOppField(state) {
    const ctx = this.ctx;
    const opponent = state.opponent;
    const startX = 80;
    const spacing = 110;
 
    for (let i = 0; i < 4; i++) {
      const x = startX + i * spacing;
      const card = opponent.bench[i];
 
      if (card) {
        // Fondo rojo oscuro
        ctx.fillStyle = '#6a0000';
        ctx.fillRect(x, 80, 100, 130);
        
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 80, 100, 130);
        
        if (card.spriteImg) {
          ctx.drawImage(card.spriteImg, x + 10, 88, 80, 70);
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, 163, 100, 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        const name = card.name.length > 10 ? card.name.substring(0, 9) + '.' : card.name;
        ctx.fillText(name, x + 6, 178);
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ff6666';
        ctx.fillText('ATK:' + card.atk, x + 6, 194);
        ctx.fillStyle = '#00ff00';
        ctx.fillText('HP:' + card.currentHP, x + 6, 206);
      } else {
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x, 80, 100, 130);
        ctx.setLineDash([]);
      }
    }
 
    if (opponent.activeCard) {
      const card = opponent.activeCard;
      
      // Carta activa enemiga
      ctx.fillStyle = '#aa0000';
      ctx.fillRect(550, 80, 130, 170);
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(550, 80, 130, 170);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1;
      ctx.strokeRect(553, 83, 124, 164);
      
      if (card.spriteImg) {
        ctx.drawImage(card.spriteImg, 560, 90, 110, 95);
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(550, 190, 130, 2);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 16px Arial';
      const name = card.name.length > 11 ? card.name.substring(0, 10) : card.name;
      ctx.fillText(name, 558, 208);
      
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ff6666';
      ctx.fillText('ATK:' + card.atk, 558, 226);
      ctx.fillStyle = '#00ff00';
      ctx.fillText('HP:' + card.currentHP + '/' + card.hp, 558, 242);
    } else {
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(550, 80, 130, 170);
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('SIN CARTA', 570, 160);
      ctx.fillText('ACTIVA', 580, 178);
    }
  }
 
  drawPlayerField(state, selectedCard) {
    const ctx      = this.ctx;
    const player   = state.player;
    const showHint = selectedCard && state.turn === 'player' && state.phase === 'main';
    const { playerBench, playerActive, buttons } = TCG_LAYOUT;
 
    ctx.font = '12px Arial';
 
    for (let i = 0; i < 4; i++) {
      const x = playerBench.x + i * playerBench.spacing;
      const card = player.bench[i];
 
      if (card) {
        // Fondo azul
        ctx.fillStyle = '#004488';
        ctx.fillRect(x, playerBench.y, playerBench.width, playerBench.height);
        
        ctx.strokeStyle = '#4499ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, playerBench.y, playerBench.width, playerBench.height);
        
        if (card.spriteImg) {
          ctx.drawImage(card.spriteImg, x + 10, 428, 80, 70);
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, 503, 100, 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        const name = card.name.length > 10 ? card.name.substring(0, 9) + '.' : card.name;
        ctx.fillText(name, x + 6, 518);
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ff6666';
        ctx.fillText('ATK:' + card.atk, x + 6, 534);
        ctx.fillStyle = '#00ff00';
        ctx.fillText('HP:' + card.currentHP, x + 6, 546);
      } else {
        ctx.strokeStyle = showHint ? '#00ff00' : '#444444';
        ctx.lineWidth = showHint ? 2 : 1;
        ctx.setLineDash(showHint ? [] : [6, 6]);
        ctx.strokeRect(x, playerBench.y, playerBench.width, playerBench.height);
        ctx.setLineDash([]);
      }
    }
 
    if (player.activeCard) {
      const card = player.activeCard;
      
      // Carta activa jugador
      ctx.fillStyle = '#0066cc';
      ctx.fillRect(playerActive.x, playerActive.y, playerActive.width, playerActive.height);
      
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 3;
      ctx.strokeRect(playerActive.x, playerActive.y, playerActive.width, playerActive.height);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1;
      ctx.strokeRect(playerActive.x + 3, playerActive.y + 3, playerActive.width - 6, playerActive.height - 6);
      
      if (card.spriteImg) {
        ctx.drawImage(card.spriteImg, 560, 390, 110, 95);
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(550, 490, 130, 2);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 16px Arial';
      const name = card.name.length > 11 ? card.name.substring(0, 10) : card.name;
      ctx.fillText(name, 558, 508);
      
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ff6666';
      ctx.fillText('ATK:' + card.atk, 558, 526);
      ctx.fillStyle = '#00ff00';
      ctx.fillText('HP:' + card.currentHP + '/' + card.hp, 558, 542);
    } else {
      ctx.strokeStyle = showHint ? '#00ff00' : '#666666';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(playerActive.x, playerActive.y, playerActive.width, playerActive.height);
      ctx.setLineDash([]);
      
      if (showHint) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('COLOCA CARTA', 560, 460);
      } else {
        ctx.fillStyle = '#666666';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('SIN CARTA', 570, 460);
        ctx.fillText('ACTIVA', 580, 478);
      }
    }
 
    this.drawButton('ATACAR', buttons.attack.x, buttons.attack.y, buttons.attack.width, buttons.attack.height);
    this.drawButton('TERMINAR', buttons.endTurn.x, buttons.endTurn.y, buttons.endTurn.width, buttons.endTurn.height);
    this.drawButton('SACRIFICIO', buttons.sacrifice.x, buttons.sacrifice.y, buttons.sacrifice.width, buttons.sacrifice.height);
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
    const isFinalVictory = won && Number(globalGame?.combatData?.level_id) === 3;
 
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
 
    ctx.fillStyle = won ? '#00ff00' : '#ff0000';
    ctx.font      = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(won ? 'VICTORIA!' : 'DERROTA', this.canvas.width / 2, this.canvas.height / 2 - 60);
 
    ctx.fillStyle = 'white';
    ctx.font      = '36px Arial';
    const knockoutText = won 
      ? `Noqueaste ${state.knockoutsToWin} cartas de ${state.opponent.name}` 
      : `Perdiste ${state.knockoutsToWin} cartas`;
    ctx.fillText(knockoutText, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.font = '28px Arial';
    ctx.fillText(isFinalVictory ? 'TERMINASTE EL JUEGO' : 'Regresando al lobby...', this.canvas.width / 2, this.canvas.height / 2 + 100);
    ctx.textAlign = 'left';
  }

  drawCombatLog(logs) {
    const ctx = this.ctx;
    const x = 1000;
    const y = 80;
    const width = 580;
    const lineHeight = 22;
    const padding = 20;
    const headerHeight = 50;
    const maxLogs = 35;

    if (logs.length === 0) return;

    // Fondo del panel completo
    ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
    ctx.fillRect(x, y, width, 800);
    
    // Borde del panel (doble línea roja)
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, 800);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, width - 6, 800 - 6);
    
    // Header con gradiente
    const gradient = ctx.createLinearGradient(x, y, x, y + headerHeight);
    gradient.addColorStop(0, '#cc0000');
    gradient.addColorStop(1, '#880000');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, headerHeight);
    
    // Título del header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('REGISTRO DE COMBATE', x + width/2, y + 32);
    ctx.textAlign = 'left';
    
    // Línea separadora brillante
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + headerHeight);
    ctx.lineTo(x + width, y + headerHeight);
    ctx.stroke();

    // Logs con scroll
    ctx.font = '15px Consolas';
    const recentLogs = logs.slice(-maxLogs);
    const startY = y + headerHeight + padding + 8;
    
    recentLogs.forEach((logMsg, index) => {
      const logY = startY + (index * lineHeight);
      
      // Color y estilo según tipo de mensaje
      if (logMsg.includes('===')) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px Consolas';
      } else if (logMsg.includes('---') || logMsg.includes('TURNO')) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 15px Consolas';
      } else if (logMsg.includes('[JUGADOR]')) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '15px Consolas';
      } else if (logMsg.includes('[ENEMIGO]')) {
        ctx.fillStyle = '#ff6666';
        ctx.font = '15px Consolas';
      } else if (logMsg.includes('ATAQUE') || logMsg.includes('Ataque')) {
        ctx.fillStyle = '#ff9900';
        ctx.font = 'bold 15px Consolas';
      } else if (logMsg.includes('MUERTA') || logMsg.includes('Destruyo')) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 15px Consolas';
      } else if (logMsg.includes('VICTORIA') || logMsg.includes('DERROTA')) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 18px Consolas';
      } else {
        ctx.fillStyle = '#cccccc';
        ctx.font = '15px Consolas';
      }
      
      // Truncar mensaje si es muy largo
      let displayMsg = logMsg;
      if (logMsg.length > 58) {
        displayMsg = logMsg.substring(0, 55) + '...';
      }
      
      ctx.fillText(displayMsg, x + padding, logY);
    });
    
    // Footer con indicador de más logs
    if (logs.length > maxLogs) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y + 750, width, 50);
      
      ctx.fillStyle = '#888888';
      ctx.font = 'italic 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`+${logs.length - maxLogs} mensajes anteriores`, x + width/2, y + 780);
      ctx.textAlign = 'left';
    }
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
  constructor(cardPool, enemyBlood = 50, combatData = null, playerBlood = 100, playerName = 'Jugador', enemyName = 'Enemigo', knockoutsToWin = 6) {
    this.cardPool       = cardPool;
    this.idCounter      = { value: 100 };
    this.state          = new GameState(cardPool, enemyBlood, playerBlood, playerName, enemyName, knockoutsToWin);
    this.renderer       = new Draw('canvas');
    this.input          = new InputHandler(this.renderer.canvas, this);
    this.selectedCard   = null;
    this._returnTimeout = null;
    this.combatData     = combatData;
    this.currentTurnId  = null;
    this.combatLogs     = [];  // Array de logs del combate
  }
 
  init() {
    this.state.player.drawCards(this.cardPool, this.idCounter, 5);
    this.state.opponent.drawCards(this.cardPool, this.idCounter, 5);
    log('=== COMBATE INICIADO ===');
    log('Cartas iniciales robadas');
  }
 
  gameLoop() {
    this.update();
    this.renderer.render(this.state, this.selectedCard, this.combatLogs);
    requestAnimationFrame(() => this.gameLoop());
  }
 
  update() {
    this.checkGameOver();
 
    if (this.state.waitingForAI) {
      this.state.aiTimer++;
      if (this.state.aiTimer > 60) {
        this.state.waitingForAI = false;
        this.state.aiTimer      = 0;
        this.state.opponent.takeTurn(this);
      }
    }
 
    if (this.state.gameOver && !this._returnTimeout) {
      this._returnTimeout = setTimeout(() => {
        window.location.href = '../lobby/lobbyV1.html';
      }, 3000);
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
 
    if (zone === 'bench') {
      if (player.bench[index] !== null) { log('Espacio ocupado'); return; }
      player.bench[index] = card;
      log('[JUGADOR] Carta en banco');
    } else if (zone === 'active') {
      if (player.activeCard) { log('Ya hay carta activa'); return; }
      player.activeCard = card;
      log('[JUGADOR] Carta activa colocada');
    }
 
    player.spend(card.cost);
    this.state.totalBloodUsed += card.cost;
    player.hand = player.hand.filter(c => c !== this.selectedCard);
    this.selectedCard = null;
    player.cardsPlayedThisTurn++;
    
    this.registerAction(card.id, 'play', 'player', card.cost, 0, card.currentHP, card.currentHP, false);
 
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

    const pHpBefore = pCard.currentHP;
    const oHpBefore = oCard.currentHP;
 
    log(pCard.name + ' vs ' + oCard.name);
 
    pCard.currentHP -= oCard.atk;
    oCard.currentHP -= pCard.atk;
 
    log('Tu carta: ' + pCard.currentHP + ' HP | Enemigo: ' + oCard.currentHP + ' HP');

    this.registerAction(pCard.id, 'attack', 'player', 0, pCard.atk, pHpBefore, pCard.currentHP, pCard.isDead);
    this.registerAction(oCard.id, 'attack', 'opponent', 0, oCard.atk, oHpBefore, oCard.currentHP, oCard.isDead);
 
    if (oCard.isDead) {
      log('[JUGADOR] Destruyo ' + oCard.name + ' del enemigo!');
      opponent.activeCard = null;
      opponent.knockouts++;
      opponent.promoteFromBench();
    }
 
    if (pCard.isDead) {
      log('[JUGADOR] ' + pCard.name + ' fue destruido');
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
    if (!player.canAfford(10))        { log('No tienes suficiente sangre (necesitas 10)'); return; }
 
    const idx = player.bench.findIndex(c => c !== null);
    if (idx === -1) { log('Sin cartas en banco'); return; }
 
    const sacrificed   = player.bench[idx];
    player.bench[idx]  = null;
    player.spend(10);
    player.activeCard.atk += 3;
    player.activeCard.currentHP += 2;
    player.sacrificeUsedThisTurn = true;
    player.compactBench();
 
    log('Sacrificaste ' + sacrificed.name + ' (-10 sangre)');
    log('Tu carta activa gana +3 ATK y +2 HP');
  }
 
  async endTurn() {
    const { state } = this;
    const player    = state.player;
    const opponent  = state.opponent;
 
    if (state.turn === 'player') {
      state.turn  = 'opponent';
      state.phase = 'main';
      player.resetTurnState();
      opponent.regen(2);
      state.waitingForAI = true;
      state.turnNumber++;
      await this.registerTurn('player');
      state.aiTimer      = 0;
    } else {
      state.turn  = 'player';
      state.phase = 'main';
      opponent.resetTurnState();
      player.regen(2);
      player.drawCards(this.cardPool, this.idCounter, 2);
      log('[JUGADOR] Robaste 2 cartas');
      state.turnNumber++;
      await this.registerTurn('opponent');
    }
  }

  async registerTurn(activePlayer) {
    if (!this.combatData || !this.combatData.combat_id) {
      console.warn('No se puede registrar turno - Sin datos de combate');
      return;
    }

    try {
      const bloodSpent = activePlayer === 'player' ? 
        (this.state.player.maxBlood - this.state.player.blood) : 
        (this.combatData.enemy_blood - this.state.opponent.blood);

      const response = await fetch(`http://localhost:3000/api/combat/${this.combatData.combat_id}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turn_number: this.state.turnNumber,
          active_player: activePlayer,
          blood_spent: bloodSpent
        })
      });

      const data = await response.json();
      if (data.success) {
        this.currentTurnId = data.turn_id;
        const playerText = activePlayer === 'player' ? 'JUGADOR' : 'ENEMIGO';
        log(`--- TURNO ${this.state.turnNumber} [${playerText}] ---`);
        if (bloodSpent > 0) {
          log(`Sangre gastada: ${bloodSpent}`);
        }
      }
    } catch (error) {
      console.error('Error al registrar turno:', error);
    }
  }

  async registerAction(cardId, actionType, usedBy, bloodSpent, damageDealt, hpBefore, hpAfter, cardDead) {
    if (!this.combatData || !this.combatData.combat_id || !this.currentTurnId) {
      console.warn('No se puede registrar accion - Sin datos de combate o turno');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/combat/${this.combatData.combat_id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      const data = await response.json();
      if (data.success) {
        const actionText = actionType === 'play' ? 'JUGAR' : 'ATAQUE';
        const userText = usedBy === 'player' ? 'Jugador' : 'Enemigo';
        const statusText = cardDead ? ' [MUERTA]' : '';
        
        if (actionType === 'play') {
          log(`${userText}: Jugo carta ID:${cardId} (-${bloodSpent} sangre)`);
        } else if (actionType === 'attack') {
          log(`${userText}: Ataque (${damageDealt} dano) ${hpBefore}->${hpAfter}HP${statusText}`);
        }
      }
    } catch (error) {
      console.error('Error al registrar accion:', error);
    }
  }
 
  checkGameOver() {
    if (this.state.gameOver) return;
 
    const knockoutsNeeded = this.state.knockoutsToWin;
    
    if (this.state.opponent.knockouts >= knockoutsNeeded) {
      this.state.gameOver = true;
      this.state.winner   = 'player';
      log('=== VICTORIA ===');
      log(`${this.state.opponent.name} derrotado (${this.state.turnNumber} turnos)`);
      this.endCombat();
    } else if (this.state.player.knockouts >= knockoutsNeeded) {
      this.state.gameOver = true;
      this.state.winner   = 'opponent';
      log('=== DERROTA ===');
      log(`Fuiste derrotado (${this.state.turnNumber} turnos)`);
      this.endCombat();
    }
  }

  async endCombat() {
    if (!this.combatData || !this.combatData.combat_id) {
      console.warn('Sin datos de combate para registrar');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/combat/${this.combatData.combat_id}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winner: this.state.winner,
          player_id: this.combatData.player_id,
          blood_used: this.state.totalBloodUsed,
          total_turns: this.state.turnNumber,
          player_ko: this.state.player.knockouts,
          enemy_ko: this.state.opponent.knockouts,
          cards_gained: []
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Combate registrado en BD:', this.state.winner === 'player' ? 'Victoria' : 'Derrota');
      }
    } catch (error) {
      console.error('Error al registrar fin de combate:', error);
    }
  }
 
  handleClick(x, y) {
    const { state } = this;
    if (state.gameOver) return;
 
    const player = state.player;
    const isPlayerMainTurn = state.turn === 'player' && state.phase === 'main';
    const { hand, playerBench, playerActive, buttons } = TCG_LAYOUT;
 
    if (isPlayerMainTurn && y >= hand.y && y <= hand.y + hand.height) {
      for (let i = 0; i < player.hand.length; i++) {
        const cardX = hand.x + i * hand.spacing;
        if (x >= cardX && x <= cardX + hand.width) {
          const card = player.hand[i];
          player.canAfford(card.cost)
            ? this.selectHandCard(card)
            : log('No tienes suficiente sangre');
          return;
        }
      }
    }
 
    if (this.selectedCard && y >= playerBench.y && y <= playerBench.y + playerBench.height) {
      for (let i = 0; i < 4; i++) {
        const cardX = playerBench.x + i * playerBench.spacing;
        if (x >= cardX && x <= cardX + playerBench.width && player.bench[i] === null) {
          this.playCardToField('bench', i);
          return;
        }
      }
    }
 
    if (this.selectedCard && !player.activeCard && isPointInsideRect(x, y, playerActive)) {
      this.playCardToField('active', null);
      return;
    }
 
    if (isPointInsideRect(x, y, buttons.attack)) { this.manualAttack(); return; }
    if (isPointInsideRect(x, y, buttons.endTurn)) { this.manualEndTurn(); return; }
    if (isPointInsideRect(x, y, buttons.sacrifice)) { this.sacrificeForPower(); return; }
  }
}
 

let globalGame = null; // Referencia global al juego para la función log

function log(msg) {
  console.log(msg);
  if (globalGame && globalGame.combatLogs) {
    globalGame.combatLogs.push(msg);
    // Mantener solo los últimos 50 logs
    if (globalGame.combatLogs.length > 50) {
      globalGame.combatLogs.shift();
    }
  }
}
 


const API_URL = "http://localhost:3000/api";

async function loadPlayerDeck() {
    const playerId = localStorage.getItem("playerId");
    const runId = localStorage.getItem("runId");

    if (!playerId) {
        console.error("Missing playerId");
        return [];
    }

    let finalCards = [];

    // 1. Load permanent deck cards
    const deckRes = await fetch(`${API_URL}/player/${playerId}/deck`);
    const deckData = await deckRes.json();

    if (deckData.success && deckData.deck) {
        finalCards.push(...deckData.deck);
    }

    // 2. Load temporary cards from current run
    if (runId) {
        const tempRes = await fetch(`${API_URL}/run/${runId}/cards/temp`);
        const tempData = await tempRes.json();

        if (tempData.success && tempData.tempCards) {
            finalCards.push(...tempData.tempCards);
        }
    }

    // Eliminar cartas duplicadas (mantener solo una copia de cada Card_id)
    const uniqueCards = [];
    const seenIds = new Set();
    
    for (const card of finalCards) {
        if (!seenIds.has(card.Card_id)) {
            seenIds.add(card.Card_id);
            uniqueCards.push(card);
        }
    }

    return uniqueCards.map(card =>
        new Card(
            card.Card_id,
            card.Card_name,
            card.Blood_cost,
            card.Damage,
            card.HP,
            card.Sprite_path || null
        )
    );
}

window.onload = async function () {
    const cardPool = await loadPlayerDeck();

    if (cardPool.length === 0) {
        alert("SIN CARTAS - Necesitas un deck");
        window.location.href = "../lobby/lobbyV1.html";
        return;
    }
    
    // Cargar datos del jugador desde localStorage
    const playerData = JSON.parse(localStorage.getItem('playerData') || '{}');
    let playerId = playerData.Player_id || localStorage.getItem('playerId');
    let playerBlood = 100;
    let playerName = 'Jugador';
    
    if (!playerId) {
      console.error('No se encontro playerId para cargar datos del jugador');
    }
    
    // Obtener datos actualizados del jugador desde la API
    if (playerId) {
        try {
            const playerResponse = await fetch(`http://localhost:3000/api/player/${playerId}/stats`);
            const playerStats = await playerResponse.json();
            if (playerStats.success) {
                playerBlood = playerStats.stats.Blood_current || 100;
                playerName = playerStats.stats.Player_name || 'Jugador';
            }
        } catch (error) {
            console.error('Error al cargar stats del jugador:', error);
        }
    }
    
    // Cargar datos del enemigo desde localStorage
    let enemyBlood = 50;
    let enemyName = "Enemigo";
    let enemyId = null;
    let knockoutsToWin = 6;
    
    try {
        const enemyDataStr = localStorage.getItem('enemyData');
        if (enemyDataStr) {
            const enemyData = JSON.parse(enemyDataStr);
            enemyBlood = enemyData.Blood_pool || 50;
            enemyName = enemyData.Enemy_name || "Enemigo";
            enemyId = enemyData.Enemy_id;
            knockoutsToWin = enemyData.Knockouts_to_win || 6;
        } else {
            console.warn('No se encontraron datos del enemigo, usando valores por defecto');
        }
    } catch (error) {
        console.error('Error al cargar datos del enemigo:', error);
    }

    // Obtener datos del run
    const runId = localStorage.getItem('runId');
    const runData = localStorage.getItem('currentRunData');
    let levelId = 1;

    if (runData) {
        try {
            const parsedRunData = JSON.parse(runData);
            levelId = parsedRunData.Level_id || 1;
        } catch (e) {
            console.warn('Error al parsear runData:', e);
        }
    }

    // Iniciar combate en la base de datos
    let combatData = null;
    if (playerId && enemyId) {
        try {
            const response = await fetch('http://localhost:3000/api/combat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: playerId,
                    enemy_id: enemyId,
                    run_id: runId ? parseInt(runId) : null,
                    level_id: levelId
                })
            });

            const data = await response.json();
            if (data.success) {
                combatData = {
                    combat_id: data.combat_id,
                    player_id: playerId,
                    enemy_id: enemyId,
                  enemy_blood: enemyBlood,
                  level_id: levelId
                };
            }
        } catch (error) {
            console.error('Error al iniciar combate:', error);
        }
    } else {
        console.warn('No se puede iniciar combate en BD - Faltan datos:', { playerId, enemyId });
    }

    const game = new Game(cardPool, enemyBlood, combatData, playerBlood, playerName, enemyName, knockoutsToWin);
    globalGame = game; // Establecer referencia global para los logs
    game.init();
    game.gameLoop();
};
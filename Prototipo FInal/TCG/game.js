"use strict";
 

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
 

class AIPlayer extends Player {
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
 
class GameState {
  constructor(cardPool) {
    this.cardPool     = cardPool;
    this.turn         = 'player';
    this.phase        = 'main';
    this.player       = new Player();
    this.opponent     = new AIPlayer();
    this.waitingForAI = false;
    this.aiTimer      = 0;
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
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
 
  render(state, selectedCard) {
    this.clear();
    this.drawGameInfo(state);
    this.drawOppField(state);
    this.drawPlayerField(state, selectedCard);
    this.drawPlayerHand(state, selectedCard);
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
    ctx.fillText('Regresando al lobby...', this.canvas.width / 2, this.canvas.height / 2 + 100);
    ctx.textAlign = 'left';
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
    this.state          = new GameState(cardPool);
    this.renderer       = new Draw('canvas');
    this.input          = new InputHandler(this.renderer.canvas, this);
    this.selectedCard   = null;
    this._returnTimeout = null;
  }
 
  init() {
    this.state.player.drawCards(this.cardPool, this.idCounter, 5);
    this.state.opponent.drawCards(this.cardPool, this.idCounter, 5);
    log('Juego iniciado');
  }
 
  gameLoop() {
    this.update();
    this.renderer.render(this.state, this.selectedCard);
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
      log('Carta colocada en banco');
    } else if (zone === 'active') {
      if (player.activeCard) { log('Ya tienes carta activa'); return; }
      player.activeCard = card;
      log('Carta activa colocada');
    }
 
    player.spend(card.cost);
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
 
    pCard.currentHP -= oCard.atk;
    oCard.currentHP -= pCard.atk;
 
    log('Tu carta: ' + pCard.currentHP + ' HP, Rival: ' + oCard.currentHP + ' HP');
 
    if (oCard.isDead) {
      log('Destruiste ' + oCard.name);
      opponent.activeCard = null;
      opponent.knockouts++;
      opponent.promoteFromBench();
    }
 
    if (pCard.isDead) {
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
    player.bench[idx]  = null;
    player.spend(15);
    player.activeCard.atk += 3;
    player.activeCard.currentHP += 2;
    player.sacrificeUsedThisTurn = true;
    player.compactBench();
 
    log('Sacrificaste ' + sacrificed.name + ' (-15 sangre)');
    log('Tu carta activa gana +3 ATK y +2 HP');
  }
 
  endTurn() {
    const { state } = this;
    const player    = state.player;
    const opponent  = state.opponent;
 
    if (state.turn === 'player') {
      state.turn  = 'opponent';
      state.phase = 'main';
      player.resetTurnState();
      opponent.regen(2);
      state.waitingForAI = true;
      state.aiTimer      = 0;
    } else {
      state.turn  = 'player';
      state.phase = 'main';
      opponent.resetTurnState();
      player.regen(2);
      player.drawCards(this.cardPool, this.idCounter, 2);
      log('Robaste 2 cartas');
    }
  }
 
  checkGameOver() {
    if (this.state.gameOver) return;
 
    if (this.state.opponent.knockouts >= 6) {
      this.state.gameOver = true;
      this.state.winner   = 'player';
      log('¡Ganaste el juego!');
    } else if (this.state.player.knockouts >= 6) {
      this.state.gameOver = true;
      this.state.winner   = 'opponent';
      log('Perdiste el juego');
    }
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
}
 

const API_URL = "http://localhost:3000/api";

async function loadPlayerDeck() {
  const playerId = localStorage.getItem("playerId");

  if (!playerId) {
    console.error("Missing playerId in localStorage");
    return [];
  }

  const response = await fetch(`${API_URL}/player/${playerId}/deck`);
  const data = await response.json();

  if (!data.success || !data.deck || data.deck.length === 0) {
    console.warn("No cards found in player deck");
    return [];
  }

  return data.deck.map(card =>
    new Card(
      card.Card_id,
      card.Card_name,
      card.Blood_cost,
      card.Damage,
      card.HP
    )
  );
}

window.onload = async function () {
  const cardPool = await loadPlayerDeck();

  if (cardPool.length === 0) {
    alert("No tienes cartas en tu deck todavía.");
    window.location.href = "../lobby/lobbyV1.html";
    return;
  }

  const game = new Game(cardPool);
  game.init();
  game.gameLoop();
};
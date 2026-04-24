"use strict";
 
// ---------------------------------------------------------------------------
// Card — datos e instancia de carta
// ---------------------------------------------------------------------------
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
 
  clone(instanceId) {
    const c = new Card(this.id, this.name, this.cost, this.atk, this.hp);
    c.instanceId = instanceId;
    return c;
  }
 
  get isDead() {
    return this.currentHP <= 0;
  }
}
 
// ---------------------------------------------------------------------------
// Bench — los 4 slots de banca
// ---------------------------------------------------------------------------
class Bench {
  constructor(size = 4) {
    this.slots = new Array(size).fill(null);
    this.size  = size;
  }
 
  // Coloca carta en el primer slot libre; regresa true si se colocó
  place(card) {
    const i = this.slots.indexOf(null);
    if (i === -1) return false;
    this.slots[i] = card;
    return true;
  }
 
  // Coloca carta en un slot específico; regresa true si se colocó
  placeAt(index, card) {
    if (this.slots[index] !== null) return false;
    this.slots[index] = card;
    return true;
  }
 
  // Saca la primera carta del banco (para promover a activo)
  promote() {
    const i = this.slots.findIndex(c => c !== null);
    if (i === -1) return null;
    const card = this.slots[i];
    this.slots[i] = null;
    this.compact();
    return card;
  }
 
  // Saca la carta de un slot específico
  removeAt(index) {
    const card = this.slots[index];
    this.slots[index] = null;
    this.compact();
    return card;
  }
 
  compact() {
    const cards = this.slots.filter(c => c !== null);
    this.slots.fill(null);
    cards.forEach((c, i) => { this.slots[i] = c; });
  }
 
  get hasCard() {
    return this.slots.some(c => c !== null);
  }
 
  get(index) {
    return this.slots[index];
  }
 
  get count() {
    return this.slots.filter(c => c !== null).length;
  }
}
 
// ---------------------------------------------------------------------------
// Player — estado e inventario de un jugador
// ---------------------------------------------------------------------------
class Player {
  constructor(maxBlood = 100) {
    this.maxBlood  = maxBlood;
    this.blood     = maxBlood;
    this.hand      = [];
    this.bench     = new Bench(4);
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
 
  // Roba cartas hasta el máximo indicado
  drawCards(pool, idCounter, count = 2, maxHand = 10) {
    let drawn = 0;
    while (drawn < count && this.hand.length < maxHand) {
      const base = pool[Math.floor(Math.random() * pool.length)];
      this.hand.push(base.clone(idCounter.next()));
      drawn++;
    }
    return drawn;
  }
 
  // Regenera sangre al inicio del turno
  regen(amount = 2) {
    this.blood = Math.min(this.maxBlood, this.blood + amount);
  }
 
  resetTurnState() {
    this.cardsPlayedThisTurn   = 0;
    this.sacrificeUsedThisTurn = false;
  }
}
 
class AIPlayer extends Player {
  constructor() {
    super(50);
  }
 
  // Lógica de turno completa de la IA
  takeTurn(game) {
    log('Turno del rival');
 
    this.drawCards(game.cardPool, game.idCounter, 2);
 
    // Ordenar por ATK descendente
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
        if (this.bench.place(card)) {
          this.spend(card.cost);
          this.hand.splice(i, 1);
          log('Rival colocó carta en banco');
          played++;
          continue;
        }
      }
      i++;
    }
 
    // Intentar sacrificio con 40% de probabilidad
    if (
      this.activeCard &&
      this.canAfford(15) &&
      !this.sacrificeUsedThisTurn &&
      this.bench.hasCard &&
      this.blood > 25 &&
      Math.random() < 0.4
    ) {
      const sacrificed = this.bench.promote();
      if (sacrificed) {
        this.spend(15);
        this.activeCard.atk += 3;
        this.activeCard.currentHP += 2;
        this.sacrificeUsedThisTurn = true;
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
 
// ---------------------------------------------------------------------------
// IdCounter — contador de IDs de instancia
// ---------------------------------------------------------------------------
class IdCounter {
  constructor(start = 100) {
    this._value = start;
  }
  next() {
    return this._value++;
  }
}
 
// ---------------------------------------------------------------------------
// GameState — estado puro del juego (sin lógica)
// ---------------------------------------------------------------------------
class GameState {
  constructor() {
    this.turn    = 'player';
    this.phase   = 'main';
    this.player   = new Player(100);
    this.opponent = new AIPlayer();
    this.waitingForAI = false;
    this.aiTimer      = 0;
    this.gameOver     = false;
    this.winner       = null;
  }
}
 
// ---------------------------------------------------------------------------
// Renderer — todo lo relacionado con dibujar en canvas
// ---------------------------------------------------------------------------
class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');
    this.canvas.width  = 1600;
    this.canvas.height = 900;
  }
 
  get W() { return this.canvas.width; }
  get H() { return this.canvas.height; }
 
  clear() {
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.W, this.H);
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
    ctx.fillText('Rival: ' + state.opponent.blood + '/' + state.opponent.maxBlood, 950, 30);
    ctx.fillText('KO: ' + state.player.knockouts + '/6', 50, 60);
    ctx.fillText('KO: ' + state.opponent.knockouts + '/6', 950, 60);
  }
 
  _drawCard(card, x, y, w, h, fillColor, strokeColor, textColor = '#ffffff', lineWidth = 1) {
    const ctx = this.ctx;
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 1;
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    const name = card.name.length > 8 ? card.name.substring(0, 7) + '.' : card.name;
    ctx.fillText(name, x + 5, y + 20);
    ctx.fillText('ATK:' + card.atk, x + 5, y + 40);
    ctx.fillText('HP:' + card.currentHP, x + 5, y + 60);
  }
 
  _drawActiveCard(card, x, y, fillColor, strokeColor, textColor = '#ffffff') {
    const ctx = this.ctx;
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, 100, 120);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 100, 120);
    ctx.lineWidth = 1;
    ctx.fillStyle = textColor;
    ctx.font = '14px Arial';
    const name = card.name.length > 10 ? card.name.substring(0, 9) : card.name;
    ctx.fillText(name, x + 5, y + 20);
    ctx.fillText('ATK: ' + card.atk, x + 5, y + 50);
    ctx.fillText('HP: ' + card.currentHP + '/' + card.hp, x + 5, y + 80);
  }
 
  drawOppField(state) {
    const ctx = this.ctx;
    const { opponent } = state;
 
    // Banco
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 80;
      const card = opponent.bench.get(i);
      if (card) {
        this._drawCard(card, x, 100, 70, 90, '#4a0000', '#cc0000');
      } else {
        ctx.strokeStyle = '#333333';
        ctx.strokeRect(x, 100, 70, 90);
      }
    }
 
    // Activo
    if (opponent.activeCard) {
      this._drawActiveCard(opponent.activeCard, 550, 100, '#cc0000', '#ff0000');
    } else {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(550, 100, 100, 120);
      ctx.lineWidth = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText('ACTIVO', 570, 165);
    }
  }
 
  drawPlayerField(state, selectedCard) {
    const ctx = this.ctx;
    const { player } = state;
    const showHint = selectedCard && state.turn === 'player' && state.phase === 'main';
 
    // Banco
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 80;
      const card = player.bench.get(i);
      if (card) {
        this._drawCard(card, x, 480, 70, 90, '#4a0000', '#cc0000');
      } else {
        ctx.strokeStyle = showHint ? '#4ade80' : '#666666';
        ctx.lineWidth   = showHint ? 2 : 1;
        ctx.strokeRect(x, 480, 70, 90);
        ctx.lineWidth = 1;
      }
    }
 
    // Activo
    if (player.activeCard) {
      this._drawActiveCard(player.activeCard, 550, 480, '#00aa00', '#00ff00', '#000000');
    } else {
      ctx.strokeStyle = showHint ? '#4ade80' : '#333333';
      ctx.lineWidth   = 3;
      ctx.strokeRect(550, 480, 100, 120);
      ctx.lineWidth = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText('ACTIVO', 570, 545);
    }
 
    // Botones
    this.drawButton('ATACAR',    700, 500, 120, 35);
    this.drawButton('TERMINAR',  700, 545, 120, 35);
    this.drawButton('SACRIFICIO',700, 590, 120, 35);
  }
 
  drawPlayerHand(state, selectedCard) {
    const ctx = this.ctx;
    const { player } = state;
 
    ctx.font = '12px Arial';
    for (let i = 0; i < player.hand.length; i++) {
      const card = player.hand[i];
      const x = 100 + i * 90;
      const canAfford    = player.canAfford(card.cost);
      const isPlayerTurn = state.turn === 'player' && state.phase === 'main';
 
      ctx.fillStyle = (!canAfford || !isPlayerTurn)
        ? '#1a1a1a'
        : (selectedCard === card ? '#cc0000' : '#4a0000');
      ctx.fillRect(x, 650, 80, 110);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x, 650, 80, 110);
 
      ctx.fillStyle = '#ffffff';
      const name = card.name.length > 10 ? card.name.substring(0, 9) + '...' : card.name;
      ctx.fillText(name,        x + 5, 670);
      ctx.fillText('Cost: ' + card.cost, x + 5, 690);
      ctx.fillText('ATK: ' + card.atk,  x + 5, 710);
      ctx.fillText('HP: ' + card.hp,    x + 5, 730);
    }
 
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Haz clic en una carta para seleccionarla', 100, 630);
  }
 
  drawButton(text, x, y, w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = '#2a0000';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#cc0000';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(text, x + 10, y + 22);
  }
 
  drawGameOver(state) {
    const ctx = this.ctx;
    const won = state.winner === 'player';
 
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, this.W, this.H);
 
    ctx.fillStyle = won ? '#00ff00' : '#ff0000';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(won ? 'VICTORIA!' : 'DERROTA', this.W / 2, this.H / 2 - 60);
 
    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.fillText(
      won ? 'Noqueaste 6 cartas del rival' : 'Perdiste 6 cartas',
      this.W / 2, this.H / 2 + 20
    );
    ctx.font = '28px Arial';
    ctx.fillText('Regresando al lobby...', this.W / 2, this.H / 2 + 100);
    ctx.textAlign = 'left';
  }
 
  // Convierte coordenadas del evento de click a coordenadas del canvas,
  // corrigiendo el letterboxing de object-fit: contain
  toCanvasCoords(event) {
    const rect        = this.canvas.getBoundingClientRect();
    const canvasRatio = this.canvas.width / this.canvas.height;
    const displayRatio = rect.width / rect.height;
 
    let renderW, renderH, offX, offY;
 
    if (displayRatio > canvasRatio) {
      // Barras negras a los lados
      renderH = rect.height;
      renderW = renderH * canvasRatio;
      offX = (rect.width - renderW) / 2;
      offY = 0;
    } else {
      // Barras negras arriba/abajo
      renderW = rect.width;
      renderH = renderW / canvasRatio;
      offX = 0;
      offY = (rect.height - renderH) / 2;
    }
 
    return {
      x: ((event.clientX - rect.left - offX) / renderW) * this.canvas.width,
      y: ((event.clientY - rect.top  - offY) / renderH) * this.canvas.height,
    };
  }
}
 
// ---------------------------------------------------------------------------
// InputHandler — captura clicks y los delega al juego
// ---------------------------------------------------------------------------
class InputHandler {
  constructor(renderer, game) {
    this.renderer = renderer;
    this.game     = game;
    renderer.canvas.addEventListener('click', e => this.onClick(e));
  }
 
  onClick(event) {
    const { x, y } = this.renderer.toCanvasCoords(event);
    this.game.handleClick(x, y);
  }
}
 
// ---------------------------------------------------------------------------
// Game — coordinador central
// ---------------------------------------------------------------------------
class Game {
  constructor(cardPool) {
    this.cardPool    = cardPool;
    this.idCounter   = new IdCounter(100);
    this.state       = new GameState();
    this.renderer    = new Renderer('canvas');
    this.input       = new InputHandler(this.renderer, this);
    this.selectedCard = null;
    this._returnTimeout = null;
  }
 
  init() {
    const { player, opponent } = this.state;
 
    // Cartas iniciales
    player.drawCards(this.cardPool, this.idCounter, 5);
    opponent.drawCards(this.cardPool, this.idCounter, 5);
 
    log('Juego iniciado');
  }
 
  // -------------------------------------------------------------------------
  // Game loop
  // -------------------------------------------------------------------------
  gameLoop() {
    this._update();
    this.renderer.render(this.state, this.selectedCard);
    requestAnimationFrame(() => this.gameLoop());
  }
 
  _update() {
    this._checkGameOver();
 
    const state = this.state;
    if (state.waitingForAI) {
      state.aiTimer++;
      if (state.aiTimer > 60) {
        state.waitingForAI = false;
        state.aiTimer = 0;
        state.opponent.takeTurn(this);
      }
    }
 
    // Regresar al lobby después del game over
    if (state.gameOver && !this._returnTimeout) {
      this._returnTimeout = setTimeout(() => {
        window.location.href = '../lobby/lobbyV1.html';
      }, 3000);
    }
  }
 
  // -------------------------------------------------------------------------
  // Acciones del jugador
  // -------------------------------------------------------------------------
  selectCard(card) {
    if (this.state.turn !== 'player' || this.state.phase !== 'main') return;
    this.selectedCard = card;
    log('Carta seleccionada: ' + card.name);
  }
 
  playCardToField(zone, benchIndex = null) {
    const { state, selectedCard } = this;
    const player = state.player;
 
    if (!selectedCard) return;
 
    if (!player.canAfford(selectedCard.cost)) {
      log('No tienes suficiente sangre');
      return;
    }
 
    const card = selectedCard.clone(this.idCounter.next());
 
    if (zone === 'bench') {
      if (!player.bench.placeAt(benchIndex, card)) {
        log('Espacio ocupado');
        return;
      }
      log('Carta colocada en banco');
    } else if (zone === 'active') {
      if (player.activeCard) {
        log('Ya tienes carta activa');
        return;
      }
      player.activeCard = card;
      log('Carta activa colocada');
    }
 
    player.spend(card.cost);
    player.hand = player.hand.filter(c => c !== selectedCard);
    this.selectedCard = null;
    player.cardsPlayedThisTurn++;
 
    if (player.cardsPlayedThisTurn >= 3) {
      log('Máximo de cartas jugadas (3). Presiona ATACAR o TERMINAR');
    }
  }
 
  manualAttack() {
    const { state } = this;
    if (state.turn !== 'player' || state.phase !== 'main') return;
    if (!state.player.activeCard) {
      log('No tienes carta activa');
      return;
    }
    log('Iniciando combate');
    state.phase = 'battle';
    this.performBattle();
  }
 
  performBattle() {
    const { state } = this;
    const player   = state.player;
    const opponent = state.opponent;
 
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
      const promoted = opponent.bench.promote();
      if (promoted) opponent.activeCard = promoted;
    }
 
    if (pCard.isDead) {
      log('Tu ' + pCard.name + ' fue destruido');
      player.activeCard = null;
      player.knockouts++;
      const promoted = player.bench.promote();
      if (promoted) player.activeCard = promoted;
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
 
    if (state.turn !== 'player' || state.phase !== 'main') {
      log('No es tu turno'); return;
    }
    if (player.sacrificeUsedThisTurn) {
      log('Ya usaste el sacrificio este turno'); return;
    }
    if (!player.activeCard) {
      log('No tienes carta activa'); return;
    }
    if (!player.canAfford(15)) {
      log('No tienes suficiente sangre (necesitas 15)'); return;
    }
    if (!player.bench.hasCard) {
      log('No tienes cartas en el banco para sacrificar'); return;
    }
 
    const sacrificed = player.bench.promote();
    player.spend(15);
    player.activeCard.atk       += 3;
    player.activeCard.currentHP += 2;
    player.sacrificeUsedThisTurn = true;
 
    log('Sacrificaste ' + sacrificed.name + ' (-15 sangre)');
    log('Tu carta activa gana +3 ATK y +2 HP');
  }
 
  endTurn() {
    const { state } = this;
    const player   = state.player;
    const opponent = state.opponent;
 
    if (state.turn === 'player') {
      state.turn  = 'opponent';
      state.phase = 'main';
      player.resetTurnState();
      opponent.regen(2);
      state.waitingForAI = true;
      state.aiTimer = 0;
    } else {
      state.turn  = 'player';
      state.phase = 'main';
      opponent.resetTurnState();
      player.regen(2);
      player.drawCards(this.cardPool, this.idCounter, 2);
      log('Robaste 2 cartas');
    }
  }
 
  // -------------------------------------------------------------------------
  // Fin de juego
  // -------------------------------------------------------------------------
  _checkGameOver() {
    const { state } = this;
    if (state.gameOver) return;
 
    if (state.opponent.knockouts >= 6) {
      state.gameOver = true;
      state.winner   = 'player';
      log('¡Ganaste el juego!');
    } else if (state.player.knockouts >= 6) {
      state.gameOver = true;
      state.winner   = 'opponent';
      log('Perdiste el juego');
    }
  }
 
  // -------------------------------------------------------------------------
  // Manejo de clicks
  // -------------------------------------------------------------------------
  handleClick(x, y) {
    const { state } = this;
    if (state.gameOver) return;
 
    const player = state.player;
    const isPlayerMainTurn = state.turn === 'player' && state.phase === 'main';
 
    // Zona de la mano (y: 650–760)
    if (y >= 650 && y <= 760 && isPlayerMainTurn) {
      for (let i = 0; i < player.hand.length; i++) {
        const cardX = 100 + i * 90;
        if (x >= cardX && x <= cardX + 80) {
          const card = player.hand[i];
          if (player.canAfford(card.cost)) {
            this.selectCard(card);
          } else {
            log('No tienes suficiente sangre');
          }
          return;
        }
      }
    }
 
    // Zona del banco del jugador (y: 480–570) — colocar carta seleccionada
    if (this.selectedCard && y >= 480 && y <= 570) {
      for (let i = 0; i < 4; i++) {
        const cardX = 150 + i * 80;
        if (x >= cardX && x <= cardX + 70 && !player.bench.get(i)) {
          this.playCardToField('bench', i);
          return;
        }
      }
    }
 
    // Zona activa del jugador — colocar carta seleccionada
    if (this.selectedCard && x >= 550 && x <= 650 && y >= 480 && y <= 600 && !player.activeCard) {
      this.playCardToField('active');
      return;
    }
 
    // Botones (x: 700–820)
    if (x >= 700 && x <= 820) {
      if (y >= 500 && y <= 535) { this.manualAttack();     return; }
      if (y >= 545 && y <= 580) { this.manualEndTurn();    return; }
      if (y >= 590 && y <= 625) { this.sacrificeForPower();return; }
    }
  }
}
 
// ---------------------------------------------------------------------------
// Utilidades globales
// ---------------------------------------------------------------------------
function log(msg) {
  console.log(msg);
}
 
// ---------------------------------------------------------------------------
// Pool de cartas y arranque
// ---------------------------------------------------------------------------
const cardPool = [
  new Card(1,  'Sombra Voraz',   1, 3, 3),
  new Card(2,  'Imán Llamas',    2, 4, 4),
  new Card(3,  'Látigo Umbral',  1, 2, 2),
  new Card(4,  'Guardia Abisal', 3, 5, 6),
  new Card(5,  'Bendición',      2, 1, 5),
  new Card(6,  'Furia Carmesí',  4, 7, 5),
  new Card(7,  'Eco Vacío',      2, 3, 3),
  new Card(8,  'Tormentador',    3, 6, 4),
  new Card(9,  'Pesadilla',      1, 2, 3),
  new Card(10, 'Asesino',        2, 4, 3),
];
 
window.onload = function () {
  const game = new Game(cardPool);
  game.init();
  game.gameLoop();
};
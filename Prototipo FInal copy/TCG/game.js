"use strict";

// Variables del canvas
let canvas;
let ctx;
const canvasWidth = 1600;
const canvasHeight = 900;

class Card {
  constructor(id, name, cost, atk, hp) {
    this.id         = id;
    this.name       = name;
    this.cost       = cost;
    this.atk        = atk;
    this.hp         = hp;
    this.currentHP  = hp;
    this.instanceId = null;
  }


  cloneCard(instanceId) {
    const card = new Card(this.id, this.name, this.cost, this.atk, this.hp);
    card.instanceId = instanceId;
    return card;
  }
}

const cardPool = [
  new Card(1, 'Sombra Voraz',   1, 3, 3),
  new Card(2, 'Imán Llamas',    2, 4, 4),
  new Card(3, 'Látigo Umbral',  1, 2, 2),
  new Card(4, 'Guardia Abisal', 3, 5, 6),
  new Card(5, 'Bendición',      2, 1, 5),
  new Card(6, 'Furia Carmesí',  4, 7, 5),
  new Card(7, 'Eco Vacío',      2, 3, 3),
  new Card(8, 'Tormentador',    3, 6, 4),
  new Card(9, 'Pesadilla',      1, 2, 3),
  new Card(10,'Asesino',        2, 4, 3),
];

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


}

class AIPlayer extends Player {

  constructor() {
    super(50);
  }

}

class GameState {

  constructor(cardPool) {
    this.cardPool    = cardPool;
    this.idCounter   = 100;
    this.turn        = 'player';
    this.phase       = 'main';
    this.player      = new Player();
    this.opponent    = new AIPlayer();
    this.aiTimer     = 0;
    this.waitingForAI = false;
  }

}

class Draw {

  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');
    this.canvas.width  = 1600;
    this.canvas.height = 900;
  }

  clear() {
  this.ctx.fillStyle = '#0a0a0a';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

  render(state, selectedCard) {
    this.clear();
    this.drawGameInfo(state);
    this.drawOppField(state);
    this.drawPlayerField(state);
    this.drawPlayerHand(state, selectedCard);

    if (state.gameOver) {
      this.drawGameOver(state);
    }
  }

  drawGameInfo(state) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';

    // Turno
    let turnText = state.turn === 'player' ? 'TU TURNO' : 'TURNO RIVAL';
    let phaseText = state.phase === 'main' ? 'Jugar Cartas' : 'Combate';

    ctx.fillText(turnText + ' - ' + phaseText, 450, 30);

    // Sangre del jugador
    ctx.fillText('Tu sangre: ' + state.player.blood + '/' + state.player.maxBlood, 50, 30);

    // Sangre del rival
    ctx.fillText('Rival: ' + state.opponent.blood + '/' + state.opponent.maxBlood, 950, 30);

    // Knockouts
    ctx.fillText('KO: ' + state.player.knockouts + '/6', 50, 60);
    ctx.fillText('KO: ' + state.opponent.knockouts + '/6', 950, 60);
  }

  drawPlayerHand(state, selectedCard) {
    const ctx = this.ctx;

    let cardWidth = 80;
    let cardHeight = 110;
    let startX = 100;
    let startY = 650;
    let spacing = 90;

    ctx.font = '12px Arial';

    for (let i = 0; i < state.player.hand.length; i++) {
      let card = state.player.hand[i];
      let x = startX + (i * spacing);

      let canAfford = state.player.blood >= card.cost;
      let isPlayerTurn = state.turn === 'player' && state.phase === 'main';

      if (!canAfford || !isPlayerTurn) {
        ctx.fillStyle = '#1a1a1a';
      } else if (selectedCard === card) {
        ctx.fillStyle = '#cc0000';
      } else {
        ctx.fillStyle = '#4a0000';
      }

      ctx.fillRect(x, startY, cardWidth, cardHeight);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x, startY, cardWidth, cardHeight);

      ctx.fillStyle = '#ffffff';
      let shortName = card.name.length > 10 ? card.name.substring(0, 9) + '...' : card.name;
      ctx.fillText(shortName, x + 5, startY + 20);

      ctx.fillText('Cost: ' + card.cost, x + 5, startY + 40);
      ctx.fillText('ATK: ' + card.atk, x + 5, startY + 60);
      ctx.fillText('HP: ' + card.hp, x + 5, startY + 80);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Haz clic en una carta para seleccionarla', 100, 630);
  }

  drawOppField(state) {
    const ctx = this.ctx;

    // Banco del rival (arriba)
    let cardWidth = 70;
    let cardHeight = 90;
    let startX = 150;
    let startY = 100;
    let spacing = 80;
    
    ctx.font = '12px Arial';
    
    // Dibujar banco
    for (let i = 0; i < 4; i++) {
      let x = startX + (i * spacing);
      let card = state.opponent.bench[i];
      
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
    if (state.opponent.activeCard) {
      let x = 550;
      let y = 100;
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(x, y, 100, 120);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, 100, 120);
      ctx.lineWidth = 1;
      
      let card = state.opponent.activeCard;
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

  drawPlayerField(state, selectedCard) {
    const ctx = this.ctx;

    // Banco del jugador (centro-abajo)
    let cardWidth = 70;
    let cardHeight = 90;
    let startX = 150;
    let startY = 480;
    let spacing = 80;
    
    ctx.font = '12px Arial';
    
    // Dibujar banco
    for (let i = 0; i < 4; i++) {
      let x = startX + (i * spacing);
      let card = state.player.bench[i];
      
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
        if (selectedCard && state.turn === 'player' && state.phase === 'main') {
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
    if (state.player.activeCard) {
      let x = 550;
      let y = 480;
      ctx.fillStyle = '#00aa00';
      ctx.fillRect(x, y, 100, 120);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, 100, 120);
      ctx.lineWidth = 1;
      
      let card = state.player.activeCard;
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
      if (selectedCard && state.turn === 'player' && state.phase === 'main') {
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
    this.drawButton('ATACAR', 700, 500, 120, 35);
    this.drawButton('TERMINAR', 700, 545, 120, 35);
    this.drawButton('SACRIFICIO', 700, 590, 120, 35);
  }

  drawButton(text, x, y, width, height) {
    const ctx = this.ctx;

    ctx.fillStyle = '#2a0000';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = '#cc0000';
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(text, x + 10, y + 22);
  }

}

class InputHandler {

  constructor(canvas, game) {
    this.game = game;
    canvas.addEventListener('click', e => this.handleClick(e, canvas));
  }

  handleClick(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  this.game.handleClick(x, y);
}

}

class Game {

  constructor(cardPool) {
    this.state    = new GameState(cardPool);
    this.renderer = new Draw('canvas');
    this.input    = new InputHandler(this.renderer.canvas, this);
    this.selectedCard = null;
  }

  init() {
    // Dar cartas iniciales jugador
    for (let i = 0; i < 5; i++) {
      let c = this.state.cardPool[Math.floor(Math.random() * this.state.cardPool.length)];
      this.state.player.hand.push(c.cloneCard(this.state.idCounter++));
    }

    // Dar cartas iniciales rival
    for (let i = 0; i < 5; i++) {
      let c = this.state.cardPool[Math.floor(Math.random() * this.state.cardPool.length)];
      this.state.opponent.hand.push(c.cloneCard(this.state.idCounter++));
    }

    log("Juego iniciado");
  }

  _handleAI() {
    if (this.state.waitingForAI) {
      this.state.aiTimer++;

      if (this.state.aiTimer > 60) {
        this.state.waitingForAI = false;
        this.state.aiTimer = 0;
        this._aiTurn();
      }
    }
  }

  gameLoop() {
    this.update();
    this.renderer.render(this.state, this.selectedCard);
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    this.checkGameOver();
    this._handleAI();
  }

  selectHandCard(card) {
    if (this.state.turn !== 'player' || this.state.phase !== 'main') return;

    this.selectedCard = card;
    log('Carta seleccionada: ' + card.name);
  }

  // Jugar carta al campo
  playCardToField(zone, index) {
    const state = this.state;
    const player = state.player;

    if (!this.selectedCard) return;

    if (player.blood < this.selectedCard.cost) {
      log('No tienes suficiente sangre');
      return;
    }

    // Clonar carta correctamente
    let card = this.selectedCard.cloneCard(state.idCounter++);
    player.blood -= card.cost;

    if (zone === 'bench' && !player.bench[index]) {
      player.bench[index] = card;
      log('Carta colocada en banco');

    } else if (zone === 'active' && !player.activeCard) {
      player.activeCard = card;
      log('Carta activa colocada');

    } else {
      log('Espacio ocupado');
      return;
    }

    // Quitar carta de la mano
    player.hand = player.hand.filter(c => c !== this.selectedCard);

    this.selectedCard = null;
    player.cardsPlayedThisTurn++;

    if (player.cardsPlayedThisTurn >= 3) {
      log('Máximo de cartas jugadas (3). Presiona ATACAR o TERMINAR');
    }
  }

  manualAttack() {
    const state = this.state;

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
    const state = this.state;
    const player = state.player;
    const opponent = state.opponent;

    if (!player.activeCard || !opponent.activeCard) {
      log('No hay combate posible');
      this.endTurn();
      return;
    }

    let playerCard = player.activeCard;
    let oppCard = opponent.activeCard;

    log(playerCard.name + ' vs ' + oppCard.name);

    // Aplicar daño
    playerCard.currentHP = playerCard.currentHP - oppCard.atk;
    oppCard.currentHP = oppCard.currentHP - playerCard.atk;

    log('Tu carta: ' + playerCard.currentHP + ' HP, Rival: ' + oppCard.currentHP + ' HP');

    // Verificar muertes
    if (oppCard.currentHP <= 0) {
      log('Destruiste ' + oppCard.name);
      opponent.activeCard = null;
      opponent.knockouts++;
      this.promoteFromBench(opponent);
    }

    if (playerCard.currentHP <= 0) {
      log('Tu ' + playerCard.name + ' fue destruido');
      player.activeCard = null;
      player.knockouts++;
      this.promoteFromBench(player);
    }

    this.endTurn();
  }

  promoteFromBench(player) {
    for (let i = 0; i < player.bench.length; i++) {
      if (player.bench[i]) {
        player.activeCard = player.bench[i];
        player.bench[i] = null;

        log('Carta promovida desde banco');
        return;
      }
    }
  }

  manualEndTurn() {
    const state = this.state;

    if (state.turn !== 'player' || state.phase !== 'main') return;

    log('Pasas el turno');
    this.endTurn();
  }

  sacrificeForPower() {
    const state = this.state;
    const player = state.player;

    if (state.turn !== 'player' || state.phase !== 'main') {
      log('No es tu turno');
      return;
    }

    if (player.sacrificeUsedThisTurn) {
      log('Ya usaste el sacrificio este turno');
      return;
    }

    if (!player.activeCard) {
      log('No tienes carta activa');
      return;
    }

    let sacrificeCost = 15;

    if (player.blood < sacrificeCost) {
      log('No tienes suficiente sangre (necesitas 15)');
      return;
    }

    // Buscar carta en banco
    let sacrificeIndex = -1;

    for (let i = 0; i < player.bench.length; i++) {
      if (player.bench[i]) {
        sacrificeIndex = i;
        break;
      }
    }

    if (sacrificeIndex === -1) {
      log('No tienes cartas en el banco para sacrificar');
      return;
    }

    // Sacrificio
    let sacrificedCard = player.bench[sacrificeIndex];
    player.bench[sacrificeIndex] = null;

    player.blood -= sacrificeCost;

    // Buff
    player.activeCard.atk += 3;
    player.activeCard.currentHP += 2;

    player.sacrificeUsedThisTurn = true;

    log('Sacrificaste ' + sacrificedCard.name + ' (-15 sangre)');
    log('Tu carta activa gana +3 ATK y +2 HP');

    this.compactBench(player);
  }

  compactBench(player) {
    let cards = [];

    for (let i = 0; i < player.bench.length; i++) {
      if (player.bench[i]) {
        cards.push(player.bench[i]);
      }
    }

    for (let i = 0; i < player.bench.length; i++) {
      player.bench[i] = null;
    }

    for (let i = 0; i < cards.length; i++) {
      player.bench[i] = cards[i];
    }
  }

  endTurn() {
    const state = this.state;
    const player = state.player;
    const opponent = state.opponent;

    if (state.turn === 'player') {

      // Cambiar a turno rival
      state.turn = 'opponent';
      state.phase = 'main';
      player.cardsPlayedThisTurn = 0;
      player.sacrificeUsedThisTurn = false;

      // Regenerar sangre del rival
      if (opponent.blood < opponent.maxBlood) {
        opponent.blood = Math.min(opponent.maxBlood, opponent.blood + 2);
      }

      // Activar IA
      state.waitingForAI = true;
      state.aiTimer = 0;

    } else {

      // Cambiar a turno jugador
      state.turn = 'player';
      state.phase = 'main';
      player.cardsPlayedThisTurn = 0;
      player.sacrificeUsedThisTurn = false;

      // Regenerar sangre del jugador
      if (player.blood < player.maxBlood) {
        player.blood = Math.min(player.maxBlood, player.blood + 2);
      }

      // Robar 2 cartas
      for (let i = 0; i < 2; i++) {
        if (player.hand.length < 10) {
          let randomIndex = Math.floor(Math.random() * state.cardPool.length);

          // 👇 IMPORTANTE: clonar bien
          let newCard = state.cardPool[randomIndex].cloneCard(state.idCounter++);

          player.hand.push(newCard);
        }
      }

      log('Robaste 2 cartas');
    }
  }

  _aiTurn() {
    const state = this.state;
    const player = state.player;
    const opponent = state.opponent;

    log('Turno del rival');

    // Robar 2 cartas
    for (let i = 0; i < 2; i++) {
      if (opponent.hand.length < 10) {
        let randomIndex = Math.floor(Math.random() * state.cardPool.length);
        let newCard = state.cardPool[randomIndex].cloneCard(state.idCounter++);
        opponent.hand.push(newCard);
      }
    }

    // Ordenar por ATK (más fuerte primero)
    opponent.hand.sort((a, b) => b.atk - a.atk);

    // Jugar hasta 3 cartas
    let played = 0;
    let i = 0;

    while (i < opponent.hand.length && played < 3) {
      let card = opponent.hand[i];

      if (opponent.blood >= card.cost) {

        // Prioridad 1: activo
        if (!opponent.activeCard) {
          opponent.activeCard = card;
          opponent.blood -= card.cost;

          log('Rival jugó ' + card.name);

          opponent.hand.splice(i, 1);
          played++;
          continue;
        }

        // Prioridad 2: banco
        let placed = false;

        for (let j = 0; j < opponent.bench.length; j++) {
          if (!opponent.bench[j]) {
            opponent.bench[j] = card;
            opponent.blood -= card.cost;

            log('Rival colocó carta en banco');

            opponent.hand.splice(i, 1);
            played++;
            placed = true;
            break;
          }
        }

        if (!placed) i++;

      } else {
        i++;
      }
    }

    // Sacrificio IA
    if (opponent.activeCard && opponent.blood >= 15 && !opponent.sacrificeUsedThisTurn) {

      let hasBenchCard = opponent.bench.some(c => c !== null);

      if (hasBenchCard && opponent.blood > 25 && Math.random() < 0.4) {

        for (let k = 0; k < opponent.bench.length; k++) {
          if (opponent.bench[k]) {

            let sacrificed = opponent.bench[k];
            opponent.bench[k] = null;

            opponent.blood -= 15;

            opponent.activeCard.atk += 3;
            opponent.activeCard.currentHP += 2;

            opponent.sacrificeUsedThisTurn = true;

            log('Rival sacrificó ' + sacrificed.name + ' (-15 sangre)');
            log('Su carta activa gana +3 ATK y +2 HP');

            this.compactBench(opponent);
            break;
          }
        }
      }
    }

    // Decidir ataque
    if (opponent.activeCard && player.activeCard) {

      if (opponent.activeCard.atk >= player.activeCard.atk) {
        log('Rival ataca');
        state.phase = 'battle';
        this.performBattle();

      } else {
        log('Rival pasa');
        this.endTurn();
      }

    } else {
      this.endTurn();
    }
  }

  checkGameOver() {
    const state = this.state;

    if (state.opponent.knockouts >= 6) {
      state.gameOver = true;
      state.winner = 'player';
      log('¡Ganaste el juego!');
    }

    if (state.player.knockouts >= 6) {
      state.gameOver = true;
      state.winner = 'opponent';
      log('Perdiste el juego');
    }
  }

  showGameOver(won) {
    const state = this.state;

    state.phase = 'gameover';
    state.gameOver = true;
    state.winner = won ? 'player' : 'opponent';

    log(won ? '¡Ganaste la partida!' : 'Perdiste la partida');
  }

  handleClick(x, y) {
  const state = this.state;

  if (state.gameOver) return;
  const player = state.player;

  if (y >= 650 && y <= 760 && state.turn === 'player' && state.phase === 'main') {
    let startX = 100;
    let spacing = 90;
    let cardWidth = 80;

    for (let i = 0; i < player.hand.length; i++) {
      let xCard = startX + (i * spacing);

      if (x >= xCard && x <= xCard + cardWidth) {
        let card = player.hand[i];

        if (player.blood >= card.cost) {
          this.selectHandCard(card);
        } else {
          log('No tienes suficiente sangre');
        }

        return;
      }
    }
  }

  // Colocar carta
  if (this.selectedCard && y >= 480 && y <= 570) {
    let startX = 150;
    let spacing = 80;
    let cardWidth = 70;

    for (let i = 0; i < 4; i++) {
      let xCard = startX + (i * spacing);

      if (
        x >= xCard &&
        x <= xCard + cardWidth &&
        !player.bench[i]
      ) {
        this.playCardToField('bench', i);
        return;
      }
    }
  }

 // Click en espacio activo
  if (this.selectedCard && x >= 550 && x <= 650 && y >= 480 && y <= 600 && !player.activeCard) {
    this.playCardToField('active', null);
    return;
  }

  // Click en botones
  if (x >= 700 && x <= 820) {

    // ATACAR
    if (y >= 500 && y <= 535) {
      this.manualAttack();
      return;
    }

    // TERMINAR
    if (y >= 545 && y <= 580) {
      this.manualEndTurn();
      return;
    }

    // SACRIFICIO
    if (y >= 590 && y <= 625) {
      this.sacrificeForPower();
      return;
    }
  }
}


}

function log(msg) {
  console.log(msg);
}

function main() {
  const game = new Game(cardPool);
  game.init();
  game.gameLoop();
}

window.onload = main;
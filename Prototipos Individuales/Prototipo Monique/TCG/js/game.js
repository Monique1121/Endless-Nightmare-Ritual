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

  get isAlive() {
    return this.currentHP > 0;
  }

  damage(amount) {
    this.currentHP -= amount;
  }

  sacrifice(atkBonus, hpBonus) {
    this.atk       += atkBonus;
    this.currentHP += hpBonus;
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

class Renderer {

  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas.getContext('2d');
    this.canvas.width  = 1600;
    this.canvas.height = 900;
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
    this.renderer = new Renderer('canvas');
    this.input    = new InputHandler(this.renderer.canvas, this);
    this.selectedCard = null;
  }

}

function main() {
  const game = new Game(cardPool);
  game.gameLoop();
}

window.onload = main;
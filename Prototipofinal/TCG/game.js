"use strict";

// Aqui github nos echo la mano para reacomodar todo este layout.
// Lo importante es que render y clicks usan esta misma base para que no se descuadre nada.
const TCG_LAYOUT = {
  header: { leftX: 72, centerX: 548, rightX: 930, nameY: 36, koY: 68 },
  hand: {
    x: 70,
    areaX: 70,
    areaWidth: 940,
    y: 646,
    width: 138,
    height: 192,
    spacing: 148,
    artX: 12,
    artY: 10,
    artWidth: 114,
    artHeight: 98,
    dividerY: 110,
    nameY: 134,
    costY: 156,
    atkY: 173,
    hpY: 188,
    labelX: 70,
    labelY: 628
  },
  enemyBench: {
    x: 112,
    y: 122,
    width: 114,
    height: 150,
    spacing: 126,
    artX: 10,
    artY: 12,
    artWidth: 94,
    artHeight: 80,
    dividerY: 103,
    nameY: 122,
    atkY: 139,
    hpY: 155
  },
  playerBench: {
    x: 112,
    y: 430,
    width: 114,
    height: 150,
    spacing: 126,
    artX: 10,
    artY: 12,
    artWidth: 94,
    artHeight: 80,
    dividerY: 103,
    nameY: 122,
    atkY: 139,
    hpY: 155
  },
  enemyActive: {
    x: 628,
    y: 108,
    width: 184,
    height: 236,
    artX: 12,
    artY: 14,
    artWidth: 160,
    artHeight: 124,
    dividerY: 152,
    nameY: 178,
    atkY: 200,
    hpY: 222,
    emptyLine1Y: 126,
    emptyLine2Y: 147
  },
  playerActive: {
    x: 628,
    y: 395,
    width: 184,
    height: 236,
    artX: 12,
    artY: 14,
    artWidth: 160,
    artHeight: 124,
    dividerY: 152,
    nameY: 178,
    atkY: 200,
    hpY: 222,
    emptyLine1Y: 122,
    emptyLine2Y: 143
  },
  buttons: {
    attack: { x: 848, y: 434, width: 172, height: 44 },
    endTurn: { x: 848, y: 489, width: 172, height: 44 },
    sacrifice: { x: 848, y: 544, width: 172, height: 44 }
  },
  combatLog: {
    x: 1068,
    y: 88,
    width: 458,
    height: 690,
    lineHeight: 22,
    padding: 18,
    headerHeight: 48,
    maxLogs: 31,
    footerHeight: 42
  }
};

const TCG_THEME = {
  fonts: {
    display: "'Press Start 2P', 'Courier New', monospace",
    body: "'Cinzel', 'Palatino Linotype', serif",
    mono: "'Cascadia Code', 'Consolas', monospace"
  },
  colors: {
    ink: '#07090c',
    inkSoft: '#111217',
    ritual: '#23080d',
    ritualSoft: '#55151d',
    ritualBright: '#d9545f',
    brass: '#fff0ee',
    brassSoft: '#8f2832',
    parchment: '#fff8f6',
    muted: '#d1c2c7',
    disabled: '#292b2f',
    playerStone: '#15191f',
    enemyStone: '#351118',
    blood: '#ff858d',
    life: '#a3c88f',
    hint: '#d8e0d8',
    ghost: '#807a86'
  }
};

function isPointInsideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function getBenchSlotRect(layout, index) {
  return {
    x: layout.x + index * layout.spacing,
    y: layout.y,
    width: layout.width,
    height: layout.height
  };
}

function getHandSpread(cardCount) {
  const { hand } = TCG_LAYOUT;

  if (cardCount <= 1) {
    return { startX: hand.areaX, spacing: hand.spacing };
  }

  const availableSpacing = Math.floor((hand.areaWidth - hand.width) / (cardCount - 1));
  const spacing = Math.max(84, Math.min(hand.spacing, availableSpacing));
  const totalWidth = hand.width + (cardCount - 1) * spacing;
  const startX = hand.areaX + Math.max(0, Math.floor((hand.areaWidth - totalWidth) / 2));

  return { startX, spacing };
}

function getHandCardRect(index, cardCount) {
  const { hand } = TCG_LAYOUT;
  const { startX, spacing } = getHandSpread(cardCount);

  return {
    x: startX + index * spacing,
    y: hand.y,
    width: hand.width,
    height: hand.height
  };
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

  font(size, family = TCG_THEME.fonts.body, weight = 700) {
    return `${weight} ${size}px ${family}`;
  }

  drawPanel(x, y, width, height, fillStyle, strokeStyle, lineWidth = 2, innerStrokeStyle = null) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, width, height);

    if (innerStrokeStyle && width > 10 && height > 10) {
      ctx.strokeStyle = innerStrokeStyle;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
    }
    ctx.restore();
  }

  drawFittedText(text, centerX, y, maxWidth, maxSize, minSize, family = TCG_THEME.fonts.body, weight = 700, color = TCG_THEME.colors.parchment) {
    const ctx = this.ctx;
    let size = maxSize;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = color;

    while (size > minSize) {
      ctx.font = this.font(size, family, weight);
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }

    ctx.font = this.font(size, family, weight);
    ctx.fillText(text, centerX, y);
    ctx.restore();
  }

  // Aqui github nos ayudo con el recorte porque varios sprites eran la carta completa
  // y se veian medio chuecos dentro del espacio del arte.
  drawCardArtwork(image, x, y, width, height) {
    if (!image) return;

    const ctx = this.ctx;
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      ctx.drawImage(image, x, y, width, height);
      return;
    }

    let cropX = 0;
    let cropY = 0;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;

    if (sourceHeight > sourceWidth * 1.15) {
      const safeX = sourceWidth * 0.12;
      const safeY = sourceHeight * 0.21;
      const safeWidth = sourceWidth * 0.76;
      const safeHeight = sourceHeight * 0.44;
      const targetRatio = width / height;
      const safeRatio = safeWidth / safeHeight;

      cropX = safeX;
      cropY = safeY;
      cropWidth = safeWidth;
      cropHeight = safeHeight;

      if (safeRatio > targetRatio) {
        cropWidth = safeHeight * targetRatio;
        cropX = safeX + (safeWidth - cropWidth) / 2;
      } else {
        cropHeight = safeWidth / targetRatio;
        cropY = safeY + (safeHeight - cropHeight) * 0.2;
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height);
    ctx.restore();
  }
 
  // Esta parte tambien la pulimos con github para que el click no se moviera
  // cuando el canvas dejaba margenes negros por el ajuste de pantalla.
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
    const ctx = this.ctx;

    const baseGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    baseGradient.addColorStop(0, '#07090c');
    baseGradient.addColorStop(0.46, '#11090c');
    baseGradient.addColorStop(1, '#040607');
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cornerGlow = ctx.createRadialGradient(210, 120, 30, 210, 120, 430);
    cornerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    cornerGlow.addColorStop(0.45, 'rgba(217, 84, 95, 0.16)');
    cornerGlow.addColorStop(1, 'rgba(4, 6, 7, 0)');
    ctx.fillStyle = cornerGlow;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const ritualGlow = ctx.createRadialGradient(560, 382, 80, 560, 382, 420);
    ritualGlow.addColorStop(0, 'rgba(196, 86, 96, 0.16)');
    ritualGlow.addColorStop(0.4, 'rgba(86, 28, 33, 0.08)');
    ritualGlow.addColorStop(1, 'rgba(4, 6, 7, 0)');
    ctx.fillStyle = ritualGlow;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawPanel(34, 18, 994, 812, 'rgba(7, 10, 12, 0.42)', 'rgba(217, 84, 95, 0.2)', 1, 'rgba(255, 240, 240, 0.08)');

    ctx.save();
    ctx.strokeStyle = 'rgba(217, 84, 95, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(560, 382, 106, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(560, 382, 72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(454, 382);
    ctx.lineTo(666, 382);
    ctx.moveTo(560, 276);
    ctx.lineTo(560, 488);
    ctx.stroke();
    ctx.restore();
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
    const { header } = TCG_LAYOUT;
    const leftCenterX = 38 + (255 / 2);
    const centerPanelX = 322 + (454 / 2);
    const rightCenterX = 794 + (248 / 2);
 
    const turnText  = state.turn === 'player' ? 'TU TURNO' : `TURNO ${state.opponent.name.toUpperCase()}`;
    const phaseText = state.phase === 'main'  ? 'Jugar Cartas' : 'Combate';

    this.drawPanel(38, 14, 255, 64, 'rgba(7, 11, 14, 0.86)', 'rgba(217, 84, 95, 0.58)', 2, 'rgba(255, 240, 240, 0.12)');
    this.drawPanel(322, 12, 454, 68, 'rgba(23, 10, 13, 0.9)', 'rgba(217, 84, 95, 0.64)', 2, 'rgba(255, 240, 240, 0.14)');
    this.drawPanel(794, 14, 248, 64, 'rgba(7, 11, 14, 0.86)', 'rgba(217, 84, 95, 0.58)', 2, 'rgba(255, 240, 240, 0.12)');

    this.drawFittedText(`${state.player.name}: ${state.player.blood}/${state.player.maxBlood}`, leftCenterX, header.nameY, 220, 20, 12);
    this.drawFittedText(`${state.opponent.name}: ${state.opponent.blood}/${state.opponent.maxBlood}`, rightCenterX, header.nameY, 214, 18, 10);

    ctx.textAlign = 'center';
    ctx.fillStyle = TCG_THEME.colors.muted;
    ctx.font = this.font(12, TCG_THEME.fonts.display, 400);
    ctx.fillText('KO: ' + state.player.knockouts + '/' + state.knockoutsToWin, leftCenterX, header.koY);
    ctx.fillText('KO: ' + state.opponent.knockouts + '/' + state.knockoutsToWin, rightCenterX, header.koY);

    ctx.fillStyle = TCG_THEME.colors.brass;
    ctx.font = this.font(18, TCG_THEME.fonts.display, 400);
    ctx.shadowColor = 'rgba(217, 84, 95, 0.48)';
    ctx.shadowBlur = 18;
    this.drawFittedText(turnText + ' - ' + phaseText, centerPanelX, header.nameY, 408, 18, 11, TCG_THEME.fonts.display, 400, TCG_THEME.colors.brass);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }
 
  drawPlayerHand(state, selectedCard) {
    const ctx = this.ctx;
    const numCards = state.player.hand.length;
    const { hand } = TCG_LAYOUT;
 
    for (let i = 0; i < numCards; i++) {
      const card = state.player.hand[i];
      const rect = getHandCardRect(i, numCards);
      const x = rect.x;
      const y = rect.y;
 
      const canAfford = state.player.canAfford(card.cost);
      const isPlayerTurn = state.turn === 'player' && state.phase === 'main';
      const isSelected = selectedCard === card;
 
      // Color de fondo simple
      const fill = !canAfford || !isPlayerTurn
        ? 'rgba(41, 43, 47, 0.92)'
        : isSelected
          ? 'rgba(100, 26, 35, 0.98)'
          : 'rgba(53, 19, 25, 0.94)';
      const stroke = isSelected ? 'rgba(255, 248, 246, 0.92)' : 'rgba(217, 84, 95, 0.74)';
      const innerStroke = isSelected ? 'rgba(255, 248, 246, 0.22)' : 'rgba(217, 84, 95, 0.14)';
      this.drawPanel(x, y, hand.width, hand.height, fill, stroke, isSelected ? 3 : 2, innerStroke);
      
      // Sprite
      if (card.spriteImg) {
        this.drawCardArtwork(card.spriteImg, x + hand.artX, y + hand.artY, hand.artWidth, hand.artHeight);
      }
      
      // Línea separadora
      ctx.fillStyle = 'rgba(245, 232, 198, 0.72)';
      ctx.fillRect(x, y + hand.dividerY, hand.width, 2);
 
      // Nombre
      ctx.fillStyle = TCG_THEME.colors.parchment;
      ctx.font = this.font(15, TCG_THEME.fonts.body, 700);
      const name = card.name.length > 11 ? card.name.substring(0, 10) + '...' : card.name;
      ctx.fillText(name, x + 8, y + hand.nameY);
      
      // Stats
      ctx.font = this.font(14, TCG_THEME.fonts.body, 700);
      ctx.fillStyle = TCG_THEME.colors.parchment;
      ctx.fillText('C:' + card.cost, x + 8, y + hand.costY);
      ctx.fillStyle = TCG_THEME.colors.blood;
      ctx.fillText('ATK:' + card.atk, x + 8, y + hand.atkY);
      ctx.fillStyle = TCG_THEME.colors.life;
      ctx.fillText('HP:' + card.hp, x + 8, y + hand.hpY);
    }
 
  }
 
  drawOppField(state) {
    const ctx = this.ctx;
    const opponent = state.opponent;
    const { enemyBench, enemyActive } = TCG_LAYOUT;
 
    ctx.textAlign = 'center';
    ctx.fillStyle = TCG_THEME.colors.muted;
    ctx.font = this.font(12, TCG_THEME.fonts.display, 400);
    ctx.fillText('Banca enemiga', enemyBench.x + ((enemyBench.width + (enemyBench.spacing * 3)) / 2), enemyBench.y - 14);
    ctx.textAlign = 'left';

    for (let i = 0; i < 4; i++) {
      const slot = getBenchSlotRect(enemyBench, i);
      const x = slot.x;
      const card = opponent.bench[i];
 
      if (card) {
        this.drawPanel(slot.x, slot.y, slot.width, slot.height, 'rgba(57, 21, 27, 0.96)', 'rgba(217, 84, 95, 0.78)', 2, 'rgba(255, 240, 240, 0.08)');
        
        if (card.spriteImg) {
          this.drawCardArtwork(card.spriteImg, x + enemyBench.artX, slot.y + enemyBench.artY, enemyBench.artWidth, enemyBench.artHeight);
        }
        
        ctx.fillStyle = 'rgba(245, 232, 198, 0.72)';
        ctx.fillRect(slot.x, slot.y + enemyBench.dividerY, slot.width, 2);
        
        ctx.fillStyle = TCG_THEME.colors.parchment;
        ctx.font = this.font(13, TCG_THEME.fonts.body, 700);
        const name = card.name.length > 10 ? card.name.substring(0, 9) + '.' : card.name;
        ctx.fillText(name, x + 6, slot.y + enemyBench.nameY);
        
        ctx.font = this.font(12, TCG_THEME.fonts.body, 700);
        ctx.fillStyle = TCG_THEME.colors.blood;
        ctx.fillText('ATK:' + card.atk, x + 6, slot.y + enemyBench.atkY);
        ctx.fillStyle = TCG_THEME.colors.life;
        ctx.fillText('HP:' + card.currentHP, x + 6, slot.y + enemyBench.hpY);
      } else {
        ctx.strokeStyle = 'rgba(143, 113, 65, 0.42)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
        ctx.setLineDash([]);
      }
    }
 
    if (opponent.activeCard) {
      const card = opponent.activeCard;
      this.drawPanel(enemyActive.x, enemyActive.y, enemyActive.width, enemyActive.height, 'rgba(63, 19, 28, 0.97)', 'rgba(217, 84, 95, 0.92)', 3, 'rgba(255, 240, 240, 0.16)');
      
      if (card.spriteImg) {
        this.drawCardArtwork(card.spriteImg, enemyActive.x + enemyActive.artX, enemyActive.y + enemyActive.artY, enemyActive.artWidth, enemyActive.artHeight);
      }
      
      ctx.fillStyle = 'rgba(245, 232, 198, 0.76)';
      ctx.fillRect(enemyActive.x, enemyActive.y + enemyActive.dividerY, enemyActive.width, 2);
      
      ctx.fillStyle = TCG_THEME.colors.brass;
      ctx.font = this.font(16, TCG_THEME.fonts.body, 700);
      const name = card.name.length > 11 ? card.name.substring(0, 10) : card.name;
      ctx.fillText(name, enemyActive.x + 8, enemyActive.y + enemyActive.nameY);
      
      ctx.font = this.font(14, TCG_THEME.fonts.body, 700);
      ctx.fillStyle = TCG_THEME.colors.blood;
      ctx.fillText('ATK:' + card.atk, enemyActive.x + 8, enemyActive.y + enemyActive.atkY);
      ctx.fillStyle = TCG_THEME.colors.life;
      ctx.fillText('HP:' + card.currentHP + '/' + card.hp, enemyActive.x + 8, enemyActive.y + enemyActive.hpY);
    } else {
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(143, 113, 65, 0.58)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(enemyActive.x, enemyActive.y, enemyActive.width, enemyActive.height);
      ctx.setLineDash([]);
      
      ctx.fillStyle = TCG_THEME.colors.ghost;
      ctx.font = this.font(13, TCG_THEME.fonts.display, 400);
      ctx.fillText('SIN CARTA', enemyActive.x + (enemyActive.width / 2), enemyActive.y + enemyActive.emptyLine1Y);
      ctx.fillText('ACTIVA', enemyActive.x + (enemyActive.width / 2), enemyActive.y + enemyActive.emptyLine2Y);
      ctx.textAlign = 'left';
    }
  }
 
  drawPlayerField(state, selectedCard) {
    const ctx      = this.ctx;
    const player   = state.player;
    const showHint = selectedCard && state.turn === 'player' && state.phase === 'main';
    const { playerBench, playerActive, buttons } = TCG_LAYOUT;
 
    ctx.textAlign = 'center';
    ctx.fillStyle = TCG_THEME.colors.muted;
    ctx.font = this.font(12, TCG_THEME.fonts.display, 400);
    ctx.fillText('Banca del jugador', playerBench.x + ((playerBench.width + (playerBench.spacing * 3)) / 2), playerBench.y - 14);
    ctx.textAlign = 'left';
 
    for (let i = 0; i < 4; i++) {
      const slot = getBenchSlotRect(playerBench, i);
      const x = slot.x;
      const card = player.bench[i];
 
      if (card) {
        this.drawPanel(slot.x, slot.y, slot.width, slot.height, 'rgba(24, 33, 38, 0.96)', 'rgba(217, 84, 95, 0.5)', 2, 'rgba(255, 240, 240, 0.06)');
        
        if (card.spriteImg) {
          this.drawCardArtwork(card.spriteImg, x + playerBench.artX, slot.y + playerBench.artY, playerBench.artWidth, playerBench.artHeight);
        }
        
        ctx.fillStyle = 'rgba(245, 232, 198, 0.72)';
        ctx.fillRect(slot.x, slot.y + playerBench.dividerY, slot.width, 2);
        
        ctx.fillStyle = TCG_THEME.colors.parchment;
        ctx.font = this.font(13, TCG_THEME.fonts.body, 700);
        const name = card.name.length > 10 ? card.name.substring(0, 9) + '.' : card.name;
        ctx.fillText(name, x + 6, slot.y + playerBench.nameY);
        
        ctx.font = this.font(12, TCG_THEME.fonts.body, 700);
        ctx.fillStyle = TCG_THEME.colors.blood;
        ctx.fillText('ATK:' + card.atk, x + 6, slot.y + playerBench.atkY);
        ctx.fillStyle = TCG_THEME.colors.life;
        ctx.fillText('HP:' + card.currentHP, x + 6, slot.y + playerBench.hpY);
      } else {
        ctx.strokeStyle = showHint ? 'rgba(154, 180, 136, 0.9)' : 'rgba(143, 113, 65, 0.42)';
        ctx.lineWidth = showHint ? 2 : 1;
        ctx.setLineDash(showHint ? [] : [6, 6]);
        ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
        ctx.setLineDash([]);
      }
    }
 
    if (player.activeCard) {
      const card = player.activeCard;
      this.drawPanel(playerActive.x, playerActive.y, playerActive.width, playerActive.height, 'rgba(22, 29, 33, 0.97)', 'rgba(217, 84, 95, 0.62)', 3, 'rgba(255, 240, 240, 0.1)');
      
      if (card.spriteImg) {
        this.drawCardArtwork(card.spriteImg, playerActive.x + playerActive.artX, playerActive.y + playerActive.artY, playerActive.artWidth, playerActive.artHeight);
      }
      
      ctx.fillStyle = 'rgba(245, 232, 198, 0.76)';
      ctx.fillRect(playerActive.x, playerActive.y + playerActive.dividerY, playerActive.width, 2);
      
      ctx.fillStyle = TCG_THEME.colors.brass;
      ctx.font = this.font(16, TCG_THEME.fonts.body, 700);
      const name = card.name.length > 11 ? card.name.substring(0, 10) : card.name;
      ctx.fillText(name, playerActive.x + 8, playerActive.y + playerActive.nameY);
      
      ctx.font = this.font(14, TCG_THEME.fonts.body, 700);
      ctx.fillStyle = TCG_THEME.colors.blood;
      ctx.fillText('ATK:' + card.atk, playerActive.x + 8, playerActive.y + playerActive.atkY);
      ctx.fillStyle = TCG_THEME.colors.life;
      ctx.fillText('HP:' + card.currentHP + '/' + card.hp, playerActive.x + 8, playerActive.y + playerActive.hpY);
    } else {
      ctx.textAlign = 'center';
      ctx.strokeStyle = showHint ? 'rgba(154, 180, 136, 0.96)' : 'rgba(143, 113, 65, 0.58)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(playerActive.x, playerActive.y, playerActive.width, playerActive.height);
      ctx.setLineDash([]);
      
      if (showHint) {
        ctx.fillStyle = TCG_THEME.colors.hint;
        ctx.font = this.font(13, TCG_THEME.fonts.display, 400);
        ctx.fillText('COLOCA CARTA', playerActive.x + (playerActive.width / 2), playerActive.y + playerActive.emptyLine1Y);
      } else {
        ctx.fillStyle = TCG_THEME.colors.ghost;
        ctx.font = this.font(13, TCG_THEME.fonts.display, 400);
        ctx.fillText('SIN CARTA', playerActive.x + (playerActive.width / 2), playerActive.y + playerActive.emptyLine1Y);
        ctx.fillText('ACTIVA', playerActive.x + (playerActive.width / 2), playerActive.y + playerActive.emptyLine2Y);
      }
      ctx.textAlign = 'left';
    }
 
    this.drawButton('ATACAR', buttons.attack.x, buttons.attack.y, buttons.attack.width, buttons.attack.height);
    this.drawButton('TERMINAR', buttons.endTurn.x, buttons.endTurn.y, buttons.endTurn.width, buttons.endTurn.height);
    this.drawButton('SACRIFICIO', buttons.sacrifice.x, buttons.sacrifice.y, buttons.sacrifice.width, buttons.sacrifice.height);
  }
 
  drawButton(text, x, y, width, height) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(112, 28, 36, 0.98)');
    gradient.addColorStop(1, 'rgba(57, 14, 20, 0.98)');

    this.drawPanel(x, y, width, height, gradient, 'rgba(217, 84, 95, 0.82)', 2, 'rgba(255, 248, 246, 0.14)');

    ctx.fillStyle   = TCG_THEME.colors.parchment;
    ctx.font        = this.font(13, TCG_THEME.fonts.display, 400);
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.fillText(text, x + width / 2, y + height / 2 + 1);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
 
  drawGameOver(state) {
    const ctx = this.ctx;
    const won = state.winner === 'player';
    const isFinalVictory = won && Number(globalGame?.combatData?.level_id) === 3;
 
    ctx.fillStyle = 'rgba(5, 6, 8, 0.84)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
 
    ctx.fillStyle = won ? TCG_THEME.colors.brass : TCG_THEME.colors.ritualBright;
    ctx.font      = this.font(52, TCG_THEME.fonts.display, 400);
    ctx.textAlign = 'center';
    ctx.fillText(won ? 'VICTORIA!' : 'DERROTA', this.canvas.width / 2, this.canvas.height / 2 - 60);
 
    ctx.fillStyle = TCG_THEME.colors.parchment;
    ctx.font      = this.font(28, TCG_THEME.fonts.body, 700);
    const knockoutText = won 
      ? `Noqueaste ${state.knockoutsToWin} cartas de ${state.opponent.name}` 
      : `Perdiste ${state.knockoutsToWin} cartas`;
    ctx.fillText(knockoutText, this.canvas.width / 2, this.canvas.height / 2 + 20);
    ctx.font = this.font(22, TCG_THEME.fonts.body, 700);
    ctx.fillText(isFinalVictory ? 'TERMINASTE EL JUEGO' : 'Regresando al lobby...', this.canvas.width / 2, this.canvas.height / 2 + 100);
    ctx.textAlign = 'left';
  }

  drawCombatLog(logs) {
    const ctx = this.ctx;
    const { combatLog } = TCG_LAYOUT;
    const { x, y, width, height, lineHeight, padding, headerHeight, maxLogs, footerHeight } = combatLog;

    if (logs.length === 0) return;

    this.drawPanel(x, y, width, height, 'rgba(8, 12, 15, 0.96)', 'rgba(217, 84, 95, 0.74)', 3, 'rgba(255, 240, 240, 0.08)');
    
    // Header con gradiente
    const gradient = ctx.createLinearGradient(x, y, x, y + headerHeight);
    gradient.addColorStop(0, '#7a2430');
    gradient.addColorStop(1, '#341117');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, headerHeight);
    
    // Título del header
    ctx.fillStyle = TCG_THEME.colors.parchment;
    ctx.font = this.font(16, TCG_THEME.fonts.display, 400);
    ctx.textAlign = 'center';
    ctx.fillText('REGISTRO DE COMBATE', x + width/2, y + 32);
    ctx.textAlign = 'left';
    
    // Línea separadora brillante
    ctx.strokeStyle = 'rgba(217, 84, 95, 0.44)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + headerHeight);
    ctx.lineTo(x + width, y + headerHeight);
    ctx.stroke();

    // Logs con scroll
    ctx.font = this.font(15, TCG_THEME.fonts.mono, 600);
    const recentLogs = logs.slice(-maxLogs);
    const startY = y + headerHeight + padding + 8;
    
    recentLogs.forEach((logMsg, index) => {
      const logY = startY + (index * lineHeight);
      
      // Color y estilo según tipo de mensaje
      if (logMsg.includes('===')) {
        ctx.fillStyle = TCG_THEME.colors.brass;
        ctx.font = this.font(15, TCG_THEME.fonts.mono, 700);
      } else if (logMsg.includes('---') || logMsg.includes('TURNO')) {
        ctx.fillStyle = TCG_THEME.colors.brass;
        ctx.font = this.font(14, TCG_THEME.fonts.mono, 700);
      } else if (logMsg.includes('[JUGADOR]')) {
        ctx.fillStyle = TCG_THEME.colors.life;
        ctx.font = this.font(14, TCG_THEME.fonts.mono, 600);
      } else if (logMsg.includes('[ENEMIGO]')) {
        ctx.fillStyle = TCG_THEME.colors.blood;
        ctx.font = this.font(14, TCG_THEME.fonts.mono, 600);
      } else if (logMsg.includes('ATAQUE') || logMsg.includes('Ataque')) {
        ctx.fillStyle = TCG_THEME.colors.brass;
        ctx.font = this.font(14, TCG_THEME.fonts.mono, 700);
      } else if (logMsg.includes('MUERTA') || logMsg.includes('Destruyo')) {
        ctx.fillStyle = TCG_THEME.colors.ritualBright;
        ctx.font = this.font(14, TCG_THEME.fonts.mono, 700);
      } else if (logMsg.includes('VICTORIA') || logMsg.includes('DERROTA')) {
        ctx.fillStyle = TCG_THEME.colors.brass;
        ctx.font = this.font(16, TCG_THEME.fonts.mono, 700);
      } else {
        ctx.fillStyle = '#d1c9b6';
        ctx.font = this.font(14, TCG_THEME.fonts.mono, 600);
      }
      
      // Truncar mensaje si es muy largo
      let displayMsg = logMsg;
      if (logMsg.length > 46) {
        displayMsg = logMsg.substring(0, 43) + '...';
      }
      
      ctx.fillText(displayMsg, x + padding, logY);
    });
    
    // Footer con indicador de más logs
    if (logs.length > maxLogs) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y + height - footerHeight, width, footerHeight);
      
      ctx.fillStyle = TCG_THEME.colors.ghost;
      ctx.font = this.font(13, TCG_THEME.fonts.body, 600);
      ctx.textAlign = 'center';
      ctx.fillText(`+${logs.length - maxLogs} mensajes anteriores`, x + width / 2, y + height - 15);
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

    // Aqui github nos ayudo a bajar cada turno a BD sin mover la logica principal del combate.
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

    // Igual esta parte nos echo la mano github para guardar jugadas, dano
    // y si una carta quedo fuera durante el TCG.
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
        const cardRect = getHandCardRect(i, player.hand.length);
        if (isPointInsideRect(x, y, cardRect)) {
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
        const slot = getBenchSlotRect(playerBench, i);
        if (isPointInsideRect(x, y, slot) && player.bench[i] === null) {
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

    // Aqui github nos ayudo a juntar el deck fijo con las cartas temporales del run
    // para que no se perdieran al entrar al combate.
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
  BackgroundMusic.createSceneMusic('../musica/Dark%20Drone.flac');

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
    
    // Esta carga la fuimos cerrando con github para que el TCG arrancara
    // con el jugador, enemigo y run correctos desde el inicio.
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
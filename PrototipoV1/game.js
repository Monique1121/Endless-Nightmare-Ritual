    // codigo del tcg
    
    var cardPool = [
      { id:1, name:'Sombra Del Voraz', cost:1, atk:3, hp:3 },
      { id:2, name:'Imán de Llamas', cost:2, atk:4, hp:4 },
      { id:3, name:'Látigo Umbral', cost:1, atk:2, hp:2 },
      { id:4, name:'Guardia Abisal', cost:3, atk:5, hp:6 },
      { id:5, name:'Bendición Oscura', cost:2, atk:1, hp:5 },
      { id:6, name:'Furia Carmesí', cost:4, atk:7, hp:5 },
      { id:7, name:'Eco del Vacío', cost:2, atk:3, hp:3 },
      { id:8, name:'Tormentador', cost:3, atk:6, hp:4 },
      { id:9, name:'Pesadilla Viviente', cost:1, atk:2, hp:3 },
      { id:10, name:'Asesino Ritual', cost:2, atk:4, hp:3 }
    ];

    var gameState = {
      turn: 'player',
      phase: 'main',
      playerBlood: 50,
      playerMaxBlood: 50,
      oppBlood: 50,
      oppMaxBlood: 50,
      playerHand: [],
      oppHand: [],
      playerBenchCards: [null, null, null, null],
      playerActiveCard: null,
      oppBenchCards: [null, null, null, null],
      oppActiveCard: null,
      selectedHandCard: null,
      selectedFieldCard: null,
      cardIdCounter: 100,
      cardsPlayedThisTurn: 0,
      playerKnockouts: 0,
      oppKnockouts: 0,
      sacrificeUsedThisTurn: false
    };

    function shuffleArray(array) { 
      for(var i = array.length - 1; i > 0; i--) { 
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      } 
    }

    // Genera una mano inicial balanceada para el jugador:
    // - Mínimo de cartas baratas (costo 1) para jugadas tempranas
    // - Mezcla de cartas medias y costosas
    // - Máximo 2 copias de cualquier carta para garantizar variedad
    // - Cada ejecución produce una combinación diferente
    function generateBalancedPlayerHand(count) {
      var cheap = [];   // costo 1
      var medium = [];  // costo 2
      var expensive = []; // costo 3-4

      for (var i = 0; i < cardPool.length; i++) {
        if (cardPool[i].cost === 1) {
          cheap.push(cardPool[i]);
        } else if (cardPool[i].cost === 2) {
          medium.push(cardPool[i]);
        } else {
          expensive.push(cardPool[i]);
        }
      }

      shuffleArray(cheap);
      shuffleArray(medium);
      shuffleArray(expensive);

      var selected = [];
      var copiesCount = {};

      // Función auxiliar que intenta agregar una carta respetando el límite de 2 copias
      function tryAdd(card) {
        var copies = copiesCount[card.id] || 0;
        if (copies < 2) {
          selected.push(card);
          copiesCount[card.id] = copies + 1;
          return true;
        }
        return false;
      }

      // Garantizar al menos 3 cartas baratas (costo 1) para jugadas tempranas
      var cheapAdded = 0;
      for (var i = 0; i < cheap.length && cheapAdded < 3; i++) {
        if (tryAdd(cheap[i])) cheapAdded++;
      }

      // Garantizar al menos 3 cartas de costo medio
      var mediumAdded = 0;
      for (var i = 0; i < medium.length && mediumAdded < 3; i++) {
        if (tryAdd(medium[i])) mediumAdded++;
      }

      // Agregar 1-2 cartas costosas (costo 3-4) para opciones de alto impacto
      var expAdded = 0;
      for (var i = 0; i < expensive.length && expAdded < 2; i++) {
        if (tryAdd(expensive[i])) expAdded++;
      }

      // Completar hasta 'count' cartas con las cartas aún dentro del límite de copias
      var remaining = cheap.concat(medium).concat(expensive).filter(function(card) {
        return (copiesCount[card.id] || 0) < 2;
      });
      shuffleArray(remaining);
      for (var i = 0; i < remaining.length && selected.length < count; i++) {
        tryAdd(remaining[i]);
      }

      // Mezclar la selección final para orden aleatorio en la mano
      shuffleArray(selected);

      // Clonar cada carta seleccionada para la instancia del juego
      var hand = [];
      for (var i = 0; i < selected.length; i++) {
        hand.push(cloneCard(selected[i]));
      }
      return hand;
    }

    function cloneCard(card) {
      var newCard = {};
      newCard.id = card.id;
      newCard.name = card.name;
      newCard.cost = card.cost;
      newCard.atk = card.atk;
      newCard.hp = card.hp;
      newCard.instanceId = gameState.cardIdCounter;
      newCard.currentHP = card.hp;
      gameState.cardIdCounter = gameState.cardIdCounter + 1;
      return newCard;
    }

    function log(msg, who) {
      if (!who) who = 'player';
      
      // Obtener el elemento de log correcto
      var logEl;
      if (who === 'player') {
        logEl = document.getElementById('playerLog');
      } else {
        logEl = document.getElementById('oppLog');
      }
      
      // Crear nueva entrada de log
      var entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = msg;
      logEl.appendChild(entry);
      
      // Hacer scroll automático al final
      logEl.scrollTop = logEl.scrollHeight;
      
      // Limitar a 10 mensajes máximo
      while(logEl.children.length > 10) {
        logEl.removeChild(logEl.firstChild);
      }
    }

    //Interfaz de usuario (UI) y renderizado de elementos
    // Función principal que actualiza todos los elementos visuales
    function updateUI() {
      // Actualizar sangre (recurso)
      document.getElementById('playerBlood').textContent = gameState.playerBlood;
      document.getElementById('oppBlood').textContent = gameState.oppBlood;
      
      // Actualizar knockouts (cartas noqueadas)
      // IMPORTANTE: Cada panel muestra cuántas cartas PROPIAS ha perdido
      // oppKnockouts = cartas del RIVAL que han muerto
      // playerKnockouts = cartas del JUGADOR que han muerto
      document.getElementById('playerKnockouts').textContent = gameState.playerKnockouts;
      document.getElementById('oppKnockouts').textContent = gameState.oppKnockouts;
      
      // Actualizar texto de fase
      var phaseText = '';
      if (gameState.turn === 'player') {
        phaseText = 'TU TURNO';
      } else {
        phaseText = 'TURNO RIVAL';
      }
      
      if (gameState.phase === 'main') {
        phaseText = phaseText + ' — FASE: Jugar Cartas';
      } else {
        phaseText = phaseText + ' — FASE: Combate';
      }
      document.getElementById('phaseDisplay').textContent = phaseText;
      
      // Dibujar mano del jugador
      renderPlayerHand();
      
      // Dibujar mano del rival (solo dorsos)
      renderOppHand();
      
      // Dibujar el campo de batalla
      renderField();
      
      checkGameOver();
    }

    function renderPlayerHand() {
      var handEl = document.getElementById('hand');
      handEl.innerHTML = '';
      
      for (var i = 0; i < gameState.playerHand.length; i++) {
        var card = gameState.playerHand[i];
        
        var div = document.createElement('div');
        div.className = 'card';
        
        var canAfford = gameState.playerBlood >= card.cost;
        var isPlayerTurn = gameState.turn === 'player' && gameState.phase === 'main';
        
        if (!canAfford || !isPlayerTurn) {
          div.classList.add('disabled');
        }
        
        // Crear el HTML de la carta con estructura organizada
        div.innerHTML = '<div class="card-image">Imagen</div>' +
                        '<div class="card-body">' +
                        '<h3>' + card.name + '</h3>' +
                        '<div class="card-stats">' +
                        '<div class="card-stat"><span class="card-stat-label">◇ COST</span><span class="card-stat-value">' + card.cost + '</span></div>' +
                        '<div class="card-stat"><span class="card-stat-label">► ATK</span><span class="card-stat-value">' + card.atk + '</span></div>' +
                        '<div class="card-stat"><span class="card-stat-label">♥ HP</span><span class="card-stat-value">' + card.hp + '</span></div>' +
                        '</div></div>';
        
        div.addEventListener('click', function(cardToSelect) {
          return function() {
            if (div.classList.contains('disabled')) {
              if (!canAfford) log('No tienes suficiente sangre');
              return;
            }
            selectHandCard(cardToSelect);
          };
        }(card));
        
        handEl.appendChild(div);
      }
    }

    function renderOppHand() {
      var oppHandEl = document.getElementById('oppHand');
      oppHandEl.innerHTML = '';
      
      for (var i = 0; i < gameState.oppHand.length; i++) {
        var div = document.createElement('div');
        div.className = 'card-back';
        oppHandEl.appendChild(div);
      }
    }

    // Dibujar el campo de batalla (banco y cartas activas)
    function renderField() {
      // Banco del jugador (4 espacios)
      var playerBenchEl = document.getElementById('playerBench');
      var playerBenchSlots = playerBenchEl.querySelectorAll('.slot');
      for (var i = 0; i < playerBenchSlots.length; i++) {
        var card = gameState.playerBenchCards[i];
        renderSlot(playerBenchSlots[i], card, 'player', 'bench', i);
      }
      
      // Carta activa del jugador
      var playerActiveEl = document.getElementById('playerActive');
      renderSlot(playerActiveEl, gameState.playerActiveCard, 'player', 'active', null);
      
      // Banco del rival (4 espacios)
      var oppBenchEl = document.getElementById('oppBench');
      var oppBenchSlots = oppBenchEl.querySelectorAll('.slot');
      for (var i = 0; i < oppBenchSlots.length; i++) {
        var card = gameState.oppBenchCards[i];
        renderSlot(oppBenchSlots[i], card, 'opponent', 'bench', i);
      }
      
      // Carta activa del rival
      var oppActiveEl = document.getElementById('oppActive');
      renderSlot(oppActiveEl, gameState.oppActiveCard, 'opponent', 'active', null);
    }

    function renderSlot(slotEl, card, owner, zone, index) {
      if (!card) {
        slotEl.innerHTML = '';
        slotEl.classList.add('empty');
        slotEl.classList.remove('can-attack');
        
        if (owner === 'player' && gameState.selectedHandCard && 
            gameState.turn === 'player' && gameState.phase === 'main') {
          slotEl.classList.add('highlight');
          slotEl.onclick = function(z, idx) {
            return function() {
              playCardToField(z, idx);
            };
          }(zone, index);
        } else {
          slotEl.classList.remove('highlight');
          slotEl.onclick = null;
        }
      } else {
        slotEl.classList.remove('empty', 'highlight');
        
        var cardDiv = document.createElement('div');
        cardDiv.className = 'field-card';
        cardDiv.innerHTML = '<div class="field-card-image">Imagen</div>' +
                            '<div class="field-card-body">' +
                            '<div class="field-card-name">' + card.name + '</div>' +
                            '<div class="field-card-stats">' +
                            '<span class="field-stat">► ' + card.atk + '</span>' +
                            '<span class="field-stat">♥ ' + card.currentHP + '/' + card.hp + '</span>' +
                            '</div></div>';
        
        slotEl.innerHTML = '';
        slotEl.appendChild(cardDiv);
      }
    }

    function selectHandCard(card) {
      if (gameState.turn !== 'player' || gameState.phase !== 'main') return;
      
      gameState.selectedHandCard = card;
      
      // Quitar selección de todas las cartas
      var allCards = document.querySelectorAll('#hand .card');
      for (var i = 0; i < allCards.length; i++) {
        allCards[i].classList.remove('selected');
      }
      
      // Marcar la carta seleccionada
      // Nota: usar event.target para obtener la carta clickeada
      if (event && event.target) {
        var clickedCard = event.target.closest('.card');
        if (clickedCard) {
          clickedCard.classList.add('selected');
        }
      }
      
      updateUI();
    }

    // Función para jugar una carta de la mano al campo
    function playCardToField(zone, index) {
      // Verificar que hay una carta seleccionada
      if (!gameState.selectedHandCard) return;
      
      // Verificar que tenemos suficiente sangre
      if (gameState.playerBlood < gameState.selectedHandCard.cost) {
        log('No tienes suficiente sangre');
        return;
      }
      
      // Crear una copia de la carta para el campo
      var card = cloneCard(gameState.selectedHandCard);
      
      // Restar el costo de sangre
      gameState.playerBlood = gameState.playerBlood - card.cost;
      
      // Colocar la carta en el campo
      if (zone === 'bench') {
        // NUEVO: Añadir carta al FINAL de la fila (primera posición vacía)
        var placed = false;
        for (var i = 0; i < gameState.playerBenchCards.length; i++) {
          if (gameState.playerBenchCards[i] === null) {
            gameState.playerBenchCards[i] = card;
            placed = true;
            log('[DEF] ' + card.name + ' en posición ' + (i + 1));
            break;
          }
        }
        if (!placed) {
          log('Banco lleno');
          return;
        }
      } else if (zone === 'active') {
        // Verificar que no hay carta activa ya
        if (gameState.playerActiveCard !== null) {
          log('Ya tienes un demonio activo');
          return;
        }
        gameState.playerActiveCard = card;
        log('► ' + card.name + ' entra al combate!');
      }
      
      // Quitar la carta de la mano
      var newHand = [];
      for (var i = 0; i < gameState.playerHand.length; i++) {
        if (gameState.playerHand[i] !== gameState.selectedHandCard) {
          newHand.push(gameState.playerHand[i]);
        }
      }
      gameState.playerHand = newHand;
      gameState.selectedHandCard = null;
      
      // Incrementar contador de cartas jugadas
      gameState.cardsPlayedThisTurn = gameState.cardsPlayedThisTurn + 1;
      
      updateUI();
      
      // Informar al jugador que puede seguir jugando o atacar
      if (gameState.cardsPlayedThisTurn >= 3) {
        log('Ya jugaste 3 cartas. Presiona ATACAR o TERMINAR');
      } else {
        log('Puedes jugar ' + (3 - gameState.cardsPlayedThisTurn) + ' carta(s) más este turno');
      }
    }
    
    // Función para atacar manualmente (botón ATACAR)
    function manualAttack() {
      // Verificar que es el turno del jugador
      if (gameState.turn !== 'player' || gameState.phase !== 'main') {
        log('! No puedes atacar ahora');
        return;
      }
      
      // Verificar que tiene carta activa
      if (!gameState.playerActiveCard) {
        log('! Coloca un demonio en el espacio activo');
        return;
      }
      
      log('► Iniciando combate!');
      startBattlePhase();
    }
    
    // Función para terminar turno manualmente (botón TERMINAR TURNO)
    function manualEndTurn() {
      // Verificar que es el turno del jugador
      if (gameState.turn !== 'player' || gameState.phase !== 'main') {
        log('! No es tu turno');
        return;
      }
      
      log('Pasas el turno');
      gameState.phase = 'battle'; // Cambiar fase para desactivar acciones
      updateUI();
      
      setTimeout(function() {
        endTurn();
      }, 800);
    }

    // NUEVA MECÁNICA: Sacrificar carta DEF para dar poder a carta activa
    function sacrificeForPower() {
      // Verificaciones
      if (gameState.turn !== 'player' || gameState.phase !== 'main') {
        log('! No es tu turno');
        return;
      }
      
      if (gameState.sacrificeUsedThisTurn) {
        log('! Ya usaste el sacrificio este turno');
        return;
      }
      
      if (!gameState.playerActiveCard) {
        log('! No tienes carta activa para potenciar');
        return;
      }
      
      // NUEVO: Sacrificio cuesta sangre (5)
      var sacrificeCost = 5;
      if (gameState.playerBlood < sacrificeCost) {
        log('! No tienes suficiente sangre (necesitas ' + sacrificeCost + ')');
        return;
      }
      
      // NUEVO: Solo se puede sacrificar la PRIMERA carta (izquierda)
      if (gameState.playerBenchCards[0] === null) {
        log('! No tienes carta en la primera posición del banco');
        return;
      }
      
      // Realizar el sacrificio
      var sacrificedCard = gameState.playerBenchCards[0];
      gameState.playerBenchCards[0] = null;
      
      // Gastar sangre
      gameState.playerBlood = gameState.playerBlood - sacrificeCost;
      
      // Dar buff a la carta activa
      var atkBoost = 3;
      gameState.playerActiveCard.atk = gameState.playerActiveCard.atk + atkBoost;
      gameState.playerActiveCard.currentHP = gameState.playerActiveCard.currentHP + 2;
      
      gameState.sacrificeUsedThisTurn = true;
      
      log('⚡ SACRIFICIO: ' + sacrificedCard.name + ' fue sacrificada! (-' + sacrificeCost + ' sangre)');
      log('» ' + gameState.playerActiveCard.name + ' gana +' + atkBoost + ' ATK y +2 HP!');
      
      // NUEVO: Reorganizar banco (compactar hacia la izquierda)
      compactBench('player');
      
      updateUI();
    }

    // Función de combate entre cartas activas
    function attackWithCard() {
      // Verificar que ambos tienen carta activa
      if (!gameState.playerActiveCard || !gameState.oppActiveCard) return;
      
      var playerCard = gameState.playerActiveCard;
      var oppCard = gameState.oppActiveCard;
      
      log(playerCard.name + ' vs ' + oppCard.name);
      log('► COMBATE: Las cartas activas luchan entre sí', 'opponent');
      
      // Obtener elementos DOM de las cartas
      var playerActiveEl = document.getElementById('playerActive');
      var oppActiveEl = document.getElementById('oppActive');
      var playerCardEl = playerActiveEl.querySelector('.field-card');
      var oppCardEl = oppActiveEl.querySelector('.field-card');
      
      // Animación de ataque del jugador
      if (playerCardEl) {
        playerCardEl.classList.add('attack-anim');
        setTimeout(function() {
          playerCardEl.classList.remove('attack-anim');
        }, 600);
      }
      
      // Animación de ataque del oponente (más tarde)
      setTimeout(function() {
        if (oppCardEl) {
          oppCardEl.classList.add('attack-anim');
          setTimeout(function() {
            oppCardEl.classList.remove('attack-anim');
          }, 600);
        }
      }, 300);
      
      // Aplicar daño mutuo después de las animaciones de ataque
      setTimeout(function() {
        var playerDamage = oppCard.atk;
        var oppDamage = playerCard.atk;
        
        playerCard.currentHP = playerCard.currentHP - playerDamage;
        oppCard.currentHP = oppCard.currentHP - oppDamage;
        
        // Animación de daño y mostrar indicador en carta del jugador
        if (playerCardEl && playerDamage > 0) {
          playerCardEl.classList.add('damage-anim');
          showDamageIndicator(playerActiveEl, playerDamage);
          setTimeout(function() {
            playerCardEl.classList.remove('damage-anim');
          }, 500);
        }
        
        // Animación de daño y mostrar indicador en carta del oponente
        if (oppCardEl && oppDamage > 0) {
          oppCardEl.classList.add('damage-anim');
          showDamageIndicator(oppActiveEl, oppDamage);
          setTimeout(function() {
            oppCardEl.classList.remove('damage-anim');
          }, 500);
        }
        
        log('» Resultado: Tu carta ' + playerCard.currentHP + ' HP, Rival ' + oppCard.currentHP + ' HP');
        
        // Revisar resultados después de mostrar daño
        setTimeout(function() {
          // Revisar si alguna carta murió
          if (oppCard.currentHP <= 0) {
            log('[X] VICTORIA en combate: Destruiste ' + oppCard.name + '!');
            log('[X] Tu ' + oppCard.name + ' fue destruido', 'opponent');
            gameState.oppActiveCard = null;
            
            // Incrementar contador: carta DEL RIVAL murió
            gameState.oppKnockouts = gameState.oppKnockouts + 1;
            log('! Rival perdió: ' + gameState.oppKnockouts + '/6 cartas');
            
            // Intentar llenar el espacio activo con carta del banco
            autoPromoteFromBench('opponent');
          }
          
          if (playerCard.currentHP <= 0) {
            log('[X] DERROTA en combate: Tu ' + playerCard.name + ' fue destruido');
            log('[X] Destruiste ' + playerCard.name + '!', 'opponent');
            gameState.playerActiveCard = null;
            
            // Incrementar contador: carta DEL JUGADOR murió
            gameState.playerKnockouts = gameState.playerKnockouts + 1;
            log('! Perdiste: ' + gameState.playerKnockouts + '/6 cartas');
            
            autoPromoteFromBench('player');
          }
          
          updateUI();
          
          // Terminar el turno después del combate
          setTimeout(function() {
            endTurn();
          }, 800);
        }, 600);
      }, 500);
    }
    
    // Función para mostrar indicador de daño flotante
    function showDamageIndicator(containerEl, damage) {
      var indicator = document.createElement('div');
      indicator.className = 'damage-indicator';
      indicator.textContent = '-' + damage;
      
      // Posicionar en el centro del contenedor
      var rect = containerEl.getBoundingClientRect();
      indicator.style.position = 'fixed';
      indicator.style.left = (rect.left + rect.width / 2) + 'px';
      indicator.style.top = (rect.top + rect.height / 2) + 'px';
      indicator.style.transform = 'translate(-50%, -50%)';
      
      document.body.appendChild(indicator);
      
      // Remover después de la animación
      setTimeout(function() {
        document.body.removeChild(indicator);
      }, 1200);
    }

    // NUEVO: Compactar banco hacia la izquierda (eliminar huecos)
    function compactBench(who) {
      var bench = who === 'player' ? gameState.playerBenchCards : gameState.oppBenchCards;
      
      // Recoger todas las cartas no nulas
      var cards = [];
      for (var i = 0; i < bench.length; i++) {
        if (bench[i] !== null) {
          cards.push(bench[i]);
        }
      }
      
      // Limpiar el banco
      for (var i = 0; i < bench.length; i++) {
        bench[i] = null;
      }
      
      // Colocar cartas desde la izquierda
      for (var i = 0; i < cards.length; i++) {
        bench[i] = cards[i];
      }
    }

    // Mover carta del banco a la posición activa automáticamente
    function autoPromoteFromBench(who) {
      if (who === 'player') {
        // NUEVO: Siempre tomar la PRIMERA carta (izquierda)
        if (gameState.playerBenchCards[0]) {
          gameState.playerActiveCard = gameState.playerBenchCards[0];
          gameState.playerBenchCards[0] = null;
          log('[DEF] ACTIVADA: ' + gameState.playerActiveCard.name + ' entra desde el banco');
          
          // Compactar el banco
          compactBench('player');
          return;
        }
      } else {
        // NUEVO: Siempre tomar la PRIMERA carta (izquierda)
        if (gameState.oppBenchCards[0]) {
          gameState.oppActiveCard = gameState.oppBenchCards[0];
          gameState.oppBenchCards[0] = null;
          log('[DEF] ' + gameState.oppActiveCard.name + ' del rival entra desde el banco', 'opponent');
          
          // Compactar el banco
          compactBench('opponent');
          return;
        }
      }
    }

    // Función nueva: iniciar fase de batalla
    function startBattlePhase() {
      gameState.phase = 'battle';
      log('► FASE DE COMBATE: Las cartas activas luchan');
      updateUI();
      
      // Realizar combate después de un momento
      setTimeout(function() {
        performBattle();
      }, 1000);
    }
    
    // Función nueva: realizar el combate
    function performBattle() {
      // Si ambos tienen carta activa, combaten
      if (gameState.playerActiveCard && gameState.oppActiveCard) {
        attackWithCard();
      } else {
        // Si no hay combate, pasar directamente al siguiente turno
        setTimeout(function() {
          endTurn();
        }, 500);
      }
    }

    // Terminar el turno actual
    function endTurn() {
      if (gameState.turn === 'player') {
        log('Fin de tu turno');
        gameState.turn = 'opponent';
        gameState.phase = 'main';
        gameState.cardsPlayedThisTurn = 0; // Resetear contador
        gameState.sacrificeUsedThisTurn = false; // Resetear sacrificio
        
        // Regenerar sangre del rival (2 por turno)
        if (gameState.oppBlood < gameState.oppMaxBlood) {
          gameState.oppBlood = Math.min(gameState.oppMaxBlood, gameState.oppBlood + 2);
        }
        
        updateUI();
        
        // Turno de la IA después de un momento
        setTimeout(function() {
          aiTurn();
        }, 800);
      } else {
        log('Turno del rival terminado', 'opponent');
        gameState.turn = 'player';
        gameState.phase = 'main';
        gameState.cardsPlayedThisTurn = 0; // Resetear contador
        gameState.sacrificeUsedThisTurn = false; // Resetear sacrificio
        
        // Regenerar sangre del jugador (2 por turno)
        if (gameState.playerBlood < gameState.playerMaxBlood) {
          gameState.playerBlood = Math.min(gameState.playerMaxBlood, gameState.playerBlood + 2);
        }
        
        // Robar 2 cartas por turno (más opciones para jugar)
        var cartasRobadas = 0;
        while (gameState.playerHand.length < 10 && cartasRobadas < 2) {
          var randomIndex = Math.floor(Math.random() * cardPool.length);
          var newCard = cloneCard(cardPool[randomIndex]);
          gameState.playerHand.push(newCard);
          cartasRobadas = cartasRobadas + 1;
        }
        if (cartasRobadas > 0) {
          log('Robas ' + cartasRobadas + ' carta(s)');
        }
        
        updateUI();
      }
    }

    // Turno de la inteligencia artificial (IA)
    function aiTurn() {
      log('Turno del rival...', 'opponent');
      
      // Robar 2 cartas al inicio del turno
      var cartasRobadas = 0;
      while (gameState.oppHand.length < 10 && cartasRobadas < 2) {
        var randomIndex = Math.floor(Math.random() * cardPool.length);
        var newCard = cloneCard(cardPool[randomIndex]);
        gameState.oppHand.push(newCard);
        cartasRobadas = cartasRobadas + 1;
      }
      
      // ESTRATEGIA IA: Ordenar mano por prioridad
      // Cartas con ATK alto primero para el slot activo
      gameState.oppHand.sort(function(a, b) {
        return b.atk - a.atk; // Mayor ATK primero
      });
      
      // Intentar jugar hasta 3 cartas (igual que el jugador)
      var played = 0;
      var i = 0;
      while (i < gameState.oppHand.length && played < 3) {
        var card = gameState.oppHand[i];
        
        // Verificar si tiene suficiente sangre
        if (gameState.oppBlood >= card.cost) {
          var cardPlayed = false;
          
          // PRIORIDAD 1: Llenar slot activo con la carta más fuerte
          if (!gameState.oppActiveCard) {
            gameState.oppActiveCard = card;
            gameState.oppBlood = gameState.oppBlood - card.cost;
            log('► Rival invoca ' + card.name + ' (' + card.atk + ' ATK)', 'opponent');
            
            // Remover carta de la mano
            gameState.oppHand.splice(i, 1);
            cardPlayed = true;
            played = played + 1;
          } else {
            // PRIORIDAD 2: Llenar banco con cartas de defensa (FILA: al final)
            var benchFull = true;
            for (var j = 0; j < gameState.oppBenchCards.length; j++) {
              if (!gameState.oppBenchCards[j]) {
                benchFull = false;
                gameState.oppBenchCards[j] = card;
                gameState.oppBlood = gameState.oppBlood - card.cost;
                log('[DEF] Rival coloca ' + card.name + ' en posición ' + (j + 1), 'opponent');
                
                // Remover carta de la mano
                gameState.oppHand.splice(i, 1);
                cardPlayed = true;
                played = played + 1;
                break;
              }
            }
            if (benchFull) {
              i = i + 1;
            }
          }
          
          // Si se jugó la carta, no avanzar el índice
          if (!cardPlayed) {
            i = i + 1;
          }
        } else {
          i = i + 1;
        }
      }
      
      updateUI();
      
      // ESTRATEGIA: Decidir si usar SACRIFICIO
      setTimeout(function() {
        var shouldSacrifice = false;
        
        // Condiciones para sacrificar:
        // 1. Tiene carta activa
        // 2. Tiene al menos 2 cartas en banco (mantener 1 de reserva)
        // 3. Tiene suficiente sangre (5)
        // 4. Jugador tiene carta activa más fuerte
        if (gameState.oppActiveCard && gameState.playerActiveCard && gameState.oppBlood >= 5) {
          var benchCount = 0;
          for (var i = 0; i < gameState.oppBenchCards.length; i++) {
            if (gameState.oppBenchCards[i] !== null) benchCount++;
          }
          
          // Si rival tiene carta débil vs carta fuerte del jugador
          var atkDifference = gameState.playerActiveCard.atk - gameState.oppActiveCard.atk;
          
          if (benchCount >= 2 && atkDifference > 2) {
            shouldSacrifice = true;
          }
          
          // O si el rival puede noquear al jugador con un boost
          if (benchCount >= 1 && gameState.playerKnockouts >= 5) {
            shouldSacrifice = true;
          }
        }
        
        if (shouldSacrifice) {
          // NUEVO: Solo sacrificar la PRIMERA carta (izquierda)
          if (gameState.oppBenchCards[0] !== null) {
            var sacrificed = gameState.oppBenchCards[0];
            gameState.oppBenchCards[0] = null;
            gameState.oppBlood = gameState.oppBlood - 5; // Costo de sacrificio
            
            // Dar buff
            gameState.oppActiveCard.atk = gameState.oppActiveCard.atk + 3;
            gameState.oppActiveCard.currentHP = gameState.oppActiveCard.currentHP + 2;
            
            log('⚡ SACRIFICIO RIVAL: ' + sacrificed.name + ' sacrificada! (-5 sangre)', 'opportunity');
            log('» ' + gameState.oppActiveCard.name + ' ahora tiene ' + gameState.oppActiveCard.atk + ' ATK!', 'opponent');
            
            // Compactar banco
            compactBench('opponent');
            
            updateUI();
          }
        }
        
        setTimeout(function() {
          // ESTRATEGIA: Decidir si ATACAR
          var shouldAttack = false;
          
          if (gameState.oppActiveCard && gameState.playerActiveCard) {
            // Atacar si tiene ventaja de ATK
            if (gameState.oppActiveCard.atk >= gameState.playerActiveCard.atk) {
              shouldAttack = true;
            }
            
            // Atacar si puede noquear al jugador
            if (gameState.playerKnockouts >= 5) {
              shouldAttack = true;
            }
            
            // Atacar si el jugador está cerca de ganar
            if (gameState.oppKnockouts >= 5) {
              shouldAttack = true;
            }
            
            // 50% de probabilidad de atacar si está igual
            if (gameState.oppActiveCard.atk === gameState.playerActiveCard.atk) {
              shouldAttack = Math.random() > 0.5;
            }
          } else if (gameState.oppActiveCard && !gameState.playerActiveCard) {
            // Siempre atacar si el jugador no tiene defensa
            shouldAttack = true;
          }
          
          if (shouldAttack) {
            log('► RIVAL DECIDE ATACAR!', 'opponent');
            gameState.phase = 'battle';
            updateUI();
            
            setTimeout(function() {
              if (gameState.oppActiveCard && gameState.playerActiveCard) {
                attackWithCard();
              } else {
                // Si no hay combate posible, terminar turno
                endTurn();
              }
            }, 800);
          } else {
            log('Rival pasa su turno (defensa)', 'opponent');
            endTurn();
          }
        }, 1000);
      }, 1200);
    }

    // Verificar si el juego terminó (victoria o derrota)
    function checkGameOver() {
      // Victoria SOLO por noqueos: 6 cartas para ganar
      if (gameState.oppKnockouts >= 6) {
        showGameOver(true);
        return;
      } else if (gameState.playerKnockouts >= 6) {
        showGameOver(false);
        return;
      }
    }

    // Mostrar pantalla de fin de juego
    function showGameOver(won) {
      var modal = document.getElementById('gameOverModal');
      var title = document.getElementById('gameOverTitle');
      var text = document.getElementById('gameOverText');
      
      if (won) {
        title.textContent = '*** ¡VICTORIA! ***';
        text.textContent = '¡Noqueaste 6 cartas del rival! Victoria ritual';
        title.style.color = '#4ade80';
      } else {
        title.textContent = '[X] DERROTA';
        text.textContent = 'Perdiste 6 cartas. Derrota ritual...';
        title.style.color = '#ef4444';
      }
      
      modal.style.display = 'flex';
    }

    // ========== INICIALIZACIÓN DEL JUEGO ==========
    function init() {
      // Dar 8 cartas iniciales al jugador usando selección balanceada:
      // garantiza variedad de costos y evita combinaciones desbalanceadas
      var playerStartingHand = generateBalancedPlayerHand(8);
      for (var i = 0; i < playerStartingHand.length; i++) {
        gameState.playerHand.push(playerStartingHand[i]);
      }
      
      // Dar 8 cartas iniciales al rival (aleatoriedad simple para la IA)
      for (var i = 0; i < 8; i++) {
        var randomIndex = Math.floor(Math.random() * cardPool.length);
        var card = cloneCard(cardPool[randomIndex]);
        gameState.oppHand.push(card);
      }
      
      // Botón de reiniciar la batalla
      document.getElementById('resetBtn').addEventListener('click', function() {
        // Recargar la página para empezar de nuevo
        location.reload();
      });
      
      // Botón para volver al mapa
      document.getElementById('mapBtn').addEventListener('click', function() {
        if (confirm('¿Volver al mapa del bosque? (Se perderá el progreso de la batalla)')) {
          window.location.href = 'forest-map.html';
        }
      });
      
      // Actualizar la interfaz por primera vez
      updateUI();
      
      // Mensajes de bienvenida
      log('¡Que comience el ritual!');
      log('► ATAQUE: Tu carta activa ataca al rival');
      log('[DEF] Cartas en banco protegen tu vida');
      log('Tienes 50 de SANGRE para jugar cartas');
      log('Comienzas con 8 cartas, robas 2 por turno');
      log('Puedes jugar hasta 3 cartas por turno');
      log('Rival preparado para el combate', 'opponent');
    }

    // Iniciar el juego cuando cargue la página
    init();
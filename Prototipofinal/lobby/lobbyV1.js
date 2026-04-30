"use strict";

// Este lobby es como el mundo base desde donde brincas a escuela, laboratorio u hospital.
// Aqui tambien vive el popup de inventario para revisar cartas y secretos sin salir de escena.


const canvasWidth = 800;
const canvasHeight = 600;


const worldWidth = 2048;
const worldHeight = 2048;

let ctx;


let game;


let oldTime = 0;

let playerSpeed = 0.50;
let playerVisualScale = 1.45;


const keyDirections = {
    w: "up",
    a: "left",
    s: "down",
    d: "right",
    ArrowUp: "up",
    ArrowLeft: "left",
    ArrowDown: "down",
    ArrowRight: "right",
};


const playerMotion = {
    up: {
        status: false,
        axis: "y",
        sign: -1,
        repeat: true,
        duration: 120,
        moveFrames: [6, 8],
        idleFrames: [7, 7],
    },
    left: {
        status: false,
        axis: "x",
        sign: -1,
        repeat: true,
        duration: 120,
        moveFrames: [9, 11],
        idleFrames: [10, 10],
    },
    down: {
        status: false,
        axis: "y",
        sign: 1,
        repeat: true,
        duration: 120,
        moveFrames: [0, 2],
        idleFrames: [1, 1],
    },
    right: {
        status: false,
        axis: "x",
        sign: 1,
        repeat: true,
        duration: 120,
        moveFrames: [3, 5],
        idleFrames: [4, 4],
    },

};


class Camera {
    constructor(viewWidth, viewHeight, worldWidth, worldHeight) {
        this.position = new Vector(0, 0);
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }

    follow(target) {
        this.position.x = target.position.x - this.viewWidth / 2;
        this.position.y = target.position.y - this.viewHeight / 2;

        this.position.x = Math.max(0, Math.min(this.position.x, this.worldWidth - this.viewWidth));
        this.position.y = Math.max(0, Math.min(this.position.y, this.worldHeight - this.viewHeight));
    }
}


class Game {
    constructor() {
        this.world = {
            width: worldWidth,
            height: worldHeight,
        };

        this.camera = new Camera(canvasWidth, canvasHeight, worldWidth, worldHeight);

        this.tileSize = 100;
        
        // Cargar imagen del mapa completo
        this.mapImage = new Image();
        this.mapImage.src = "assets/sprites/bosqueescuela2.png";
        
        this.inventoryOpen = false;
        this.viewingSecrets = false;

        this.createEventListeners();
        this.initObjects();
        this.initInventoryUI();
    }
    
    // Aqui agarramos las refs del popup para no buscarlas cada vez que se abre inventario.
    initInventoryUI() {
        this.inventoryPopup = document.getElementById("inventory-popup");
        this.inventoryBlood = document.getElementById("inventory-blood");
        this.inventoryCardsList = document.getElementById("inventory-cards-list");
        this.secretsList = document.getElementById("secrets-list");
        this.inventorySection = document.getElementById("inventory-section");
        this.secretsSection = document.getElementById("secrets-section");
    }
    
    toggleInventory() {
        if (this.inventoryOpen) {
            // Cerrar inventario
            this.inventoryOpen = false;
            this.viewingSecrets = false;
            this.inventoryPopup.classList.add("hidden");
        } else {
            // Abrir inventario (vista de cartas)
            this.inventoryOpen = true;
            this.viewingSecrets = false;
            this.player.keys = []; // Detener movimiento
            this.updateInventoryDisplay();
            this.showInventoryView();
            this.inventoryPopup.classList.remove("hidden");
        }
    }
    
    toggleSecretsView() {
        if (!this.inventoryOpen) return;
        
        this.viewingSecrets = !this.viewingSecrets;
        
        if (this.viewingSecrets) {
            this.updateSecretsDisplay();
            this.showSecretsView();
        } else {
            this.updateInventoryDisplay();
            this.showInventoryView();
        }
    }
    
    showInventoryView() {
        this.inventorySection.classList.remove("hidden");
        this.secretsSection.classList.add("hidden");
    }
    
    showSecretsView() {
        this.inventorySection.classList.add("hidden");
        this.secretsSection.classList.remove("hidden");
    }
    
    // Esta vista lee el GameState local y solo pinta lo que ya trae guardado el jugador.
    updateInventoryDisplay() {
        const playerData = GameState.load();
        if (!playerData) return;
        this.inventoryBlood.textContent = `${playerData.blood} / ${playerData.maxBlood}`;
        this.inventoryCardsList.innerHTML = "";
        
        if (playerData.inventory.demonCards.length === 0) {
            const emptyMsg = document.createElement("div");
            emptyMsg.className = "inventory-empty";
            emptyMsg.textContent = "Sin cartas";
            this.inventoryCardsList.appendChild(emptyMsg);
        } else {
            for (const card of playerData.inventory.demonCards) {
                const cardDiv = document.createElement("div");
                cardDiv.className = "inventory-card";
                
                const img = document.createElement("img");
                img.src = card.image;
                img.alt = card.name;
                img.className = "inventory-card-png";
                img.title = card.name;
                
                cardDiv.appendChild(img);
                
                if (card.quantity > 1) {
                    const quantityDiv = document.createElement("div");
                    quantityDiv.className = "inventory-card-quantity";
                    quantityDiv.textContent = `x${card.quantity}`;
                    cardDiv.appendChild(quantityDiv);
                }
                
                this.inventoryCardsList.appendChild(cardDiv);
            }
        }
    }
    
    updateSecretsDisplay() {
        const playerData = GameState.load();
        if (!playerData) return;
        this.inventoryBlood.textContent = `${playerData.blood} / ${playerData.maxBlood}`;
        this.secretsList.innerHTML = "";
        
        if (playerData.inventory.loreCards.length === 0) {
            const emptyMsg = document.createElement("div");
            emptyMsg.className = "inventory-empty";
            emptyMsg.textContent = "Sin secretos";
            this.secretsList.appendChild(emptyMsg);
        } else {
            for (const secret of playerData.inventory.loreCards) {
                const secretDiv = document.createElement("div");
                secretDiv.className = "secret-item";
                
                const title = document.createElement("h4");
                title.className = "secret-title";
                title.textContent = secret.title;
                
                const text = document.createElement("p");
                text.className = "secret-text";
                text.textContent = secret.description;
                
                secretDiv.appendChild(title);
                secretDiv.appendChild(text);
                this.secretsList.appendChild(secretDiv);
            }
        }
    }

    initObjects() {
        this.player = new AnimatedPlayer(
            new Vector(715, 1992),
            60,
            60,
            "red",
            3,
            playerMotion
        );

        
        this.player.setSprite(
    "assets/sprites/gracias.png",
    new Rect(0, 0, 143, 145)
);

        this.player.setScale(playerVisualScale);

        this.player.setSpeed(playerSpeed);

        this.actors = [];
        
        // zonas de colision (edificios, arboles grandes, etc)
        this.colliders = this.createColliders();
        
        // Zona de entrada al hospital 
        this.hospitalZone = new Rect(1800, 800, 400, 400);
        
        // Control de zonas de entrada
        this.inSchoolZone = false;
        this.inHospitalZone = false;
        this.inLabZone = false;
    }
    
    createColliders() {
        return [];
    }

    update(deltaTime) {
        // No actualizar jugador si el inventario está abierto
        if (!this.inventoryOpen) {
            this.player.update(deltaTime, this.world, this.colliders);
            this.camera.follow(this.player);
        }
        let px = this.player.position.x;
        let py = this.player.position.y;
        
        // Detectar zonas sin entrar automáticamente
        if (px >= 1460 && px <= 1600 && py >= 610 && py <= 740) {
            this.inHospitalZone = true;
        } else {
            this.inHospitalZone = false;
        }
        
        if (px >= 520 && px <= 640 && py >= 560 && py <= 700) {
            this.inLabZone = true;
        } else {
            this.inLabZone = false;
        }
        
        if (px >= 975 && px <= 1055 && py >= 810 && py <= 930) {
            this.inSchoolZone = true;
        } else {
            this.inSchoolZone = false;
        }

        for (let actor of this.actors) {
            if (actor.updateFrame) {
                actor.updateFrame(deltaTime);
            }
        }
    }
    
    checkPlayerInZone(zone) {
        let px = this.player.position.x;
        let py = this.player.position.y;
        
        if (px > zone.x && px < zone.x + zone.width &&
            py > zone.y && py < zone.y + zone.height) {
            return true;
        }
        return false;
    }

    drawBackground(ctx) {
        if (this.mapImage.complete) {
            ctx.drawImage(
                this.mapImage,
                0,
                0,
                this.world.width,
                this.world.height
            );
        }
    }

    drawCoordinates(ctx) {
        const x = Math.round(this.player.position.x);
        const y = Math.round(this.player.position.y);
        const panelWidth = 170;
        const panelX = canvasWidth - panelWidth - 15;

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(panelX, 15, panelWidth, 48);
        ctx.fillStyle = "white";
        ctx.font = "14px monospace";
        ctx.fillText(`X: ${x}`, panelX + 13, 35);
        ctx.fillText(`Y: ${y}`, panelX + 13, 54);
    }

    draw(ctx) {
        ctx.save();

        
        ctx.translate(-this.camera.position.x, -this.camera.position.y);

        
        this.drawBackground(ctx);

        // Ordenar por Y para que pase por delante/detras
        const allObjects = [...this.actors, this.player];
        allObjects.sort((a, b) => a.position.y - b.position.y);
        
        for (let obj of allObjects) {
            obj.draw(ctx);
        }

        ctx.restore();
        this.drawCoordinates(ctx);
        
        // Mostrar indicadores según la zona
        if (this.inSchoolZone) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(canvasWidth / 2 - 150, 50, 300, 60);
            ctx.fillStyle = "#00ff00";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("E - ENTRAR", canvasWidth / 2, 75);
            ctx.fillStyle = "white";
            ctx.fillText("ESCUELA", canvasWidth / 2, 95);
            ctx.textAlign = "left";
        }
        
        if (this.inHospitalZone) {
            const isUnlocked = GameState.isAreaUnlocked('hospital');
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(canvasWidth / 2 - 150, 50, 300, 80);
            
            if (isUnlocked) {
                ctx.fillStyle = "#00ff00";
                ctx.font = "bold 18px Arial";
                ctx.textAlign = "center";
                ctx.fillText("E - ENTRAR", canvasWidth / 2, 75);
                ctx.fillStyle = "white";
                ctx.fillText("HOSPITAL", canvasWidth / 2, 95);
            } else {
                ctx.fillStyle = "#ff4444";
                ctx.font = "bold 20px Arial";
                ctx.textAlign = "center";
                ctx.fillText("BLOQUEADO", canvasWidth / 2, 75);
                ctx.fillStyle = "#888888";
                ctx.font = "12px Arial";
                ctx.fillText("Completa el LABORATORIO primero", canvasWidth / 2, 95);
            }
            ctx.textAlign = "left";
        }
        
        if (this.inLabZone) {
            const isUnlocked = GameState.isAreaUnlocked('laboratory');
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(canvasWidth / 2 - 150, 50, 300, 80);
            
            if (isUnlocked) {
                ctx.fillStyle = "#00ff00";
                ctx.font = "bold 18px Arial";
                ctx.textAlign = "center";
                ctx.fillText("E - ENTRAR", canvasWidth / 2, 75);
                ctx.fillStyle = "white";
                ctx.fillText("LABORATORIO", canvasWidth / 2, 95);
            } else {
                ctx.fillStyle = "#ff4444";
                ctx.font = "bold 20px Arial";
                ctx.textAlign = "center";
                ctx.fillText("BLOQUEADO", canvasWidth / 2, 75);
                ctx.fillStyle = "#888888";
                ctx.font = "12px Arial";
                ctx.fillText("Completa la ESCUELA primero", canvasWidth / 2, 95);
            }
            ctx.textAlign = "left";
        }
    }

    createEventListeners() {
        window.addEventListener("keydown", async (event) => {
            // Tecla I para abrir/cerrar inventario
            if (event.key === "i" || event.key === "I") {
                this.toggleInventory();
                return;
            }
            
            // Tecla S para cambiar a secretos (solo si inventario está abierto)
            if ((event.key === "s" || event.key === "S") && this.inventoryOpen && !this.viewingSecrets) {
                this.toggleSecretsView();
                return;
            }
            
            // Tecla C para cambiar a cartas (solo si inventario está abierto y viendo secretos)
            if ((event.key === "c" || event.key === "C") && this.inventoryOpen && this.viewingSecrets) {
                this.toggleSecretsView();
                return;
            }
            
            // No procesar otras teclas si el inventario está abierto
            if (this.inventoryOpen) return;
            
            if (event.key in keyDirections) {
                this.addKey(keyDirections[event.key]);
                this.player.startMovement(keyDirections[event.key]);
            }
            
            // Desde aqui arrancamos los runs cuando el jugador entra a una zona valida.
            // Tecla E para interactuar con la escuela
            // if (event.key === "e" || event.key === "E") {
            //     if (this.inSchoolZone) {
            //         window.location.href = "../Maze/html/laberinto_cofres.html";
            //     }
            // }
            if (event.key === "e" || event.key === "E") {
                // Entrar a la Escuela
                if (this.inSchoolZone) {
                    try {
                        const playerId = localStorage.getItem("playerId");

                        const res = await fetch("http://localhost:3000/api/run/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                playerId: playerId,
                                labyrinthId: 1,
                                levelId: 1
                            })
                        });

                        const data = await res.json();

                        if (data.success) {
                            localStorage.setItem("runId", data.runId);
                            window.location.href = "../Maze/html/laberinto_cofres.html";
                        } else {
                            alert("No se pudo iniciar el laberinto: " + (data.message || "Error desconocido"));
                        }
                    } catch (error) {
                        console.error("Error al iniciar run:", error);
                        alert("Error de conexion. Esta el servidor corriendo?");
                    }
                }
                
                // Entrar al Hospital
                if (this.inHospitalZone) {
                    // Verificar si tiene el Hospital desbloqueado
                    if (!GameState.isAreaUnlocked('hospital')) {
                        alert('HOSPITAL BLOQUEADO\n\nDebes completar el laberinto del LABORATORIO primero.');
                        return;
                    }
                    window.location.href = "../hospital/hospital.html";
                }
                
                // Entrar al Laboratorio
                if (this.inLabZone) {
                    // Verificar si tiene el Laboratorio desbloqueado
                    if (!GameState.isAreaUnlocked('laboratory')) {
                        alert('LABORATORIO BLOQUEADO\n\nDebes completar el laberinto de la ESCUELA primero.');
                        return;
                    }
                    window.location.href = "../laboratorio/laboratorio.html";
                }
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key in keyDirections) {
                this.delKey(keyDirections[event.key]);
                this.player.stopMovement(keyDirections[event.key]);
            }
        });
    }

    addKey(direction) {
        if (!this.player.keys.includes(direction)) {
            this.player.keys.push(direction);
        }
    }

    delKey(direction) {
        const index = this.player.keys.indexOf(direction);
        if (index !== -1) {
            this.player.keys.splice(index, 1);
        }
    }
}


async function main() {
    // Verificar autenticación antes de iniciar el juego
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('Debes iniciar sesion para jugar');
        window.location.href = '../login/index.html';
        return;
    }
    
    // Inicializar GameState con el usuario logueado
    const username = localStorage.getItem('username') || 'Jugador';
    GameState.init(username);
    await GameState.loadFromServer();
    
    // Verificar si es una nueva partida
    const isNewGame = localStorage.getItem('isNewGame');
    if (isNewGame === 'true') {
        localStorage.removeItem('isNewGame'); // Limpiar flag
    }
    
    const canvas = document.getElementById("canvas");

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx = canvas.getContext("2d");

    game = new Game();
    
    canvas.focus(); // para que detecte teclas
    
    // Modal de salida
    const exitModal = document.getElementById('exit-modal');
    const btnConfirmExit = document.getElementById('btnConfirmExit');
    const btnCancelExit = document.getElementById('btnCancelExit');
    
    function showExitModal() {
        exitModal.classList.remove('hidden');
    }
    
    function hideExitModal() {
        exitModal.classList.add('hidden');
    }
    
    // Boton de salir (volver al menu)
    const exitButton = document.getElementById('exitButton');
    if (exitButton) {
        exitButton.addEventListener('click', showExitModal);
    }
    
    // Confirmar salida
    if (btnConfirmExit) {
        btnConfirmExit.addEventListener('click', () => {
            window.location.href = '../menu/menu.html';
        });
    }
    
    // Cancelar salida
    if (btnCancelExit) {
        btnCancelExit.addEventListener('click', hideExitModal);
    }
    
    // Cerrar modal con click fuera
    if (exitModal) {
        exitModal.addEventListener('click', (e) => {
            if (e.target === exitModal) {
                hideExitModal();
            }
        });
    }
    
    // Tecla ESC para abrir modal de salida
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Si el inventario esta abierto, cerrarlo primero
            const inventoryPopup = document.getElementById('inventory-popup');
            if (inventoryPopup && !inventoryPopup.classList.contains('hidden')) {
                return; // No hacer nada, el inventario maneja ESC
            }
            // Si el modal de salida esta abierto, cerrarlo
            if (exitModal && !exitModal.classList.contains('hidden')) {
                hideExitModal();
            } else {
                showExitModal();
            }
        }
    });

    requestAnimationFrame(drawScene);
}


function drawScene(newTime) {
    if (!oldTime) oldTime = newTime;

    let deltaTime = newTime - oldTime;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    game.update(deltaTime);
    game.draw(ctx);

    oldTime = newTime;
    requestAnimationFrame(drawScene);
}

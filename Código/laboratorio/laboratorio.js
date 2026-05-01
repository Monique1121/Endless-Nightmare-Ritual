"use strict";

// Esta escena carga el mapa del laboratorio y desde aqui se entra a su laberinto.
// La idea es dejar separado el recorrido libre y el salto al run que se crea en API.

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

        this.mapImage = new Image();
        this.mapImage.src = "assets/laboratorio.png";

        this.playerImage = new Image();
        this.playerImage.src = "../lobby/assets/sprites/gracias.png";

        this.player = new AnimatedPlayer(
            new Vector(655, 2018),
            60,
            60,
            "blue",
            3,
            playerMotion
        );
        
        this.player.setSprite(
            "../lobby/assets/sprites/gracias.png",
            new Rect(0, 0, 143, 145)
        );

        this.player.setScale(playerVisualScale);
        
        this.player.setSpeed(playerSpeed);

        this.actors = [];
        this.camera = new Camera(canvasWidth, canvasHeight, worldWidth, worldHeight);
        
        this.colliders = [];
        this.inExitZone = false;
        this.inLabyrinthZone = false;
        this.labyrinthData = {
            Labyrinth_name: "LABERINTO LAB",
            Time_limit: 105,
        };

        this.loadLabyrinthData();
    }

    // Aqui bajamos nombre y tiempo del laberinto para mostrar la entrada con datos reales.
    async loadLabyrinthData() {
        try {
            const response = await fetch("http://localhost:3000/api/labyrinth/4");
            if (!response.ok) {
                throw new Error("No se pudo cargar el laberinto del laboratorio");
            }

            const data = await response.json();
            if (data.success && data.labyrinth) {
                this.labyrinthData = data.labyrinth;
            }
        } catch (error) {
            console.error("Error cargando datos del laboratorio:", error);
        }
    }

    update(deltaTime) {
        this.player.update(deltaTime, this.world, this.colliders);
        this.camera.follow(this.player);

        // Detectar zona de salida del laboratorio (puerta lateral)
        let px = this.player.position.x;
        let py = this.player.position.y;
        
        this.inExitZone = (px >= 360 && px <= 510 && py >= 760 && py <= 900);
        
        // Detectar zona de entrada al laberinto del laboratorio (puerta principal)
        this.inLabyrinthZone = (px >= 1240 && px <= 1385 && py >= 760 && py <= 900);

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
        this.player.draw(ctx);

        for (let actor of this.actors) {
            actor.draw(ctx);
        }

        ctx.restore();
        this.drawCoordinates(ctx);
        
        // Mostrar indicador de salida
        if (this.inExitZone) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(canvasWidth / 2 - 150, 50, 300, 60);
            ctx.fillStyle = "white";
            ctx.font = "20px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("E - SALIR", canvasWidth / 2, 85);
            ctx.textAlign = "left";
        }
        
        // Mostrar indicador de entrada al laberinto
        if (this.inLabyrinthZone) {
            const labyrinthName = (this.labyrinthData?.Labyrinth_name || "LABERINTO LAB").toUpperCase();
            const timeLimit = Number(this.labyrinthData?.Time_limit || 105);
            const minutes = Math.floor(timeLimit / 60);
            const seconds = timeLimit % 60;
            const timeLabel = seconds === 0
                ? `${minutes} minuto${minutes === 1 ? "" : "s"}`
                : `${minutes} minuto${minutes === 1 ? "" : "s"} y ${seconds} segundos`;

            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(canvasWidth / 2 - 150, 120, 300, 80);
            ctx.fillStyle = "#ff4444";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("E - ENTRAR", canvasWidth / 2, 145);
            ctx.fillStyle = "white";
            ctx.fillText(labyrinthName, canvasWidth / 2, 175);
            ctx.font = "12px Arial";
            ctx.fillText(`(${timeLabel})`, canvasWidth / 2, 190);
            ctx.textAlign = "left";
        }
    }
}

async function handleKeyDown(event) {
    let key = event.key;
    
    // Manejar tecla E para salir o entrar al laberinto
    if (key === 'e' || key === 'E') {
        if (game.inExitZone) {
            showExitModal();
            return;
        }
        
        if (game.inLabyrinthZone) {
            try {
                // Cuando pica E aqui se crea el run del laboratorio antes de mandar al Maze.
                console.log("Entrando al laberinto del laboratorio...");
                const playerId = localStorage.getItem("playerId");

                const res = await fetch("http://localhost:3000/api/run/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        playerId: playerId,
                        labyrinthId: 4,  // Laboratorio
                        levelId: 2
                    })
                });

                const data = await res.json();
                console.log("Run creado:", data);

                if (data.success) {
                    localStorage.setItem("runId", data.runId);
                    window.location.href = "../Maze/html/laberinto_cofres.html";
                } else {
                    alert("No se pudo iniciar el laberinto: " + (data.message || "Error desconocido"));
                }
            } catch (error) {
                console.error("Error al iniciar run:", error);
                alert("Error de conexión. ¿Está el servidor corriendo?");
            }
            return;
        }
        return;
    }
    
    if (key in keyDirections) {
        event.preventDefault();
        let direction = keyDirections[key];
        if (!game.player.keys.includes(direction)) {
            game.player.keys.push(direction);
        }
    }
}

function handleKeyUp(event) {
    let key = event.key;
    if (key in keyDirections) {
        event.preventDefault();
        let direction = keyDirections[key];
        let index = game.player.keys.indexOf(direction);
        if (index > -1) {
            game.player.keys.splice(index, 1);
        }

        if (game.player.keys.length === 0) {
            let dirData = playerMotion[direction];
            game.player.setAnimation(...dirData.idleFrames, false, dirData.duration);
            playerMotion[direction].status = false;
        }
    }
}

function main() {
    let canvas = document.getElementById("canvas");
    if (!canvas) {
        console.error("No se encontró el canvas");
        return;
    }

    BackgroundMusic.createSceneMusic('../musica/Jes%C3%BAs%20Lastra%20-%20Abandoned.mp3');

    ctx = canvas.getContext("2d");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    game = new Game();

    canvas.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("keyup", handleKeyUp);
    canvas.focus();
    
    // Configurar modal de salida
    setupExitModal();
    
    requestAnimationFrame(gameLoop);
}

// Sistema de modal de salida
function showExitModal() {
    const exitModal = document.getElementById('exit-modal');
    if (exitModal) {
        exitModal.classList.remove('hidden');
    }
}

function hideExitModal() {
    const exitModal = document.getElementById('exit-modal');
    if (exitModal) {
        exitModal.classList.add('hidden');
    }
}

async function exitAndSave() {
    console.log('Guardando progreso antes de salir...');
    
    // Guardar progreso en el servidor
    await GameState.sync();
    
    console.log('Progreso guardado. Regresando al lobby...');
    window.location.href = "../lobby/lobbyV1.html";
}

function setupExitModal() {
    const exitButton = document.getElementById('exitButton');
    const btnConfirmExit = document.getElementById('btnConfirmExit');
    const btnCancelExit = document.getElementById('btnCancelExit');
    const exitModal = document.getElementById('exit-modal');
    
    // Boton de salir
    if (exitButton) {
        exitButton.addEventListener('click', showExitModal);
    }
    
    // Confirmar salida
    if (btnConfirmExit) {
        btnConfirmExit.addEventListener('click', exitAndSave);
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
    
    // Tecla ESC global
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('exit-modal');
            if (modal && !modal.classList.contains('hidden')) {
                hideExitModal();
            } else {
                showExitModal();
            }
        }
    });
}

function gameLoop(currentTime) {
    let deltaTime = currentTime - oldTime;
    oldTime = currentTime;

    game.update(deltaTime);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    game.draw(ctx);

    requestAnimationFrame(gameLoop);
}

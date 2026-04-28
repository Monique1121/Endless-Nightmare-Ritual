"use strict";


// const canvasWidth = 800;
// const canvasHeight = 600;


const worldWidth = 3000;
const worldHeight = 3000;

const rows = 40;
const cols = 50;
const cell_size = 64;

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
const wall = "white";
const path = "white";

let ctx;


let game;


let oldTime = 0;

let playerSpeed = 0.5;


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


class Chest {
    constructor(x, y, size) {
        this.position = new Vector(x + size / 2, y + size / 2);
        this.halfSize = new Vector(size / 2, size / 2);
        this.opened = false;
    }
}

class Wall {
    constructor(x, y, size) {
        this.position = new Vector(x + size/2, y + size/2);
        this.halfSize = new Vector(size/2, size/2);
    }

    draw(ctx) {
        ctx.fillStyle = wall;
        ctx.fillRect(this.position.x - this.halfSize.x, this.position.y - this.halfSize.y,
                     this.halfSize.x*2, this.halfSize.y*2);
    }
}

class Door {
    constructor(x, y, width, height, imageSrc) {
        this.position = new Vector(x + width / 2, y + height / 2);
        this.halfSize = new Vector(width / 2, height / 2);

        this.image = new Image();
        this.image.src = imageSrc;
    }

    draw(ctx) {
        ctx.drawImage(
            this.image,
            this.position.x - this.halfSize.x,
            this.position.y - this.halfSize.y,
            this.halfSize.x * 2,
            this.halfSize.y * 2
        );
    }
}



class Camera {
    constructor(viewWidth, viewHeight, worldWidth, worldHeight) {
        this.position = new Vector(0, 0);
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }

    follow(target) {
        // Centrar siempre la cámara en el jugador sin restricciones de borde
        this.position.x = target.position.x - this.viewWidth / 2;
        this.position.y = target.position.y - this.viewHeight / 2;
    }
}


class Game {
    constructor() {
        this.world = {
            width: cols * cell_size,
            height: rows * cell_size,
        };

        this.camera = new Camera(canvasWidth, canvasHeight, this.world.width, this.world.height);

        this.chestImage = new Image();
        this.chestImage.src = "../assets/cofre.png";
        this.isolatedCells = new Set();
        
        // Inicializar arrays antes de cargar
        this.chests = [];
        this.maze = [];
        this.deadEnds = [];
        this.actors = [];
        
        // Flag para indicar que el juego está listo
        this.isReady = false;

        // Temporizador (se cargará desde la BD)
        this.timeLimit = 120000; // Default: 2 minutos
        this.elapsedTime = 0;
        this.gameOver = false;
        this.won = false;
        
        // Datos del laberinto y enemigo
        this.labyrinthData = null;
        this.enemyData = null;

        this.createEventListeners();
        this.initObjects();
        this.loadLabyrinthData(); // Cargar datos antes de generar el laberinto
        this.chestImage = new Image();
        this.chestImage.src = "../assets/cofre.png";

        this.floorImage = new Image();
        this.floorImage.src = "../assets/floor.png";

        this.lightMask = new Image();
        this.lightMask.src = "../assets/light.png";
        this.lightMaskLoaded = false;
        this.lightMask.onload = () => { this.lightMaskLoaded = true; };

        this.darknessMask = new Image();
        this.darknessMask.src = "../assets/mascara_5.png";

        this.mouse = new Vector(0, 0);

        this.secretsFound = 0;

        // Almacenamiento temporal (solo se guarda al completar)
        this.tempCards = [];
        this.tempSecrets = [];
        this.tempChestsData = []; // Para guardar los datos de API
    }
    
    async loadLabyrinthData() {
        const runId = localStorage.getItem('runId');
        
        if (!runId) {
            console.error('No hay runId - debes entrar desde Hospital o Laboratorio');
            alert('ERROR: Debes entrar al laberinto desde el Hospital o Laboratorio.\n\nRegresando al lobby...');
            window.location.href = '../../lobby/lobbyV1.html';
            return;
        }
        
        try {
            // Obtener información del run para saber qué laberinto es
            const runResponse = await fetch(`http://localhost:3000/api/run/${runId}/info`);
            if (!runResponse.ok) {
                throw new Error('Error al obtener info del run');
            }
            
            const runData = await runResponse.json();
            const labyrinthId = runData.run.Labyrinth_id;
            const levelId = runData.run.Level_id;
            
            // Guardar datos del run para el TCG
            localStorage.setItem('currentRunData', JSON.stringify(runData.run));
            
            // Cargar datos del laberinto
            const labResponse = await fetch(`http://localhost:3000/api/labyrinth/${labyrinthId}`);
            if (labResponse.ok) {
                const labData = await labResponse.json();
                this.labyrinthData = labData.labyrinth;
                this.timeLimit = this.labyrinthData.Time_limit * 1000; // Convertir segundos a ms
                console.log(`Tiempo limite: ${this.labyrinthData.Time_limit} segundos`);
                console.log(`Nivel: ${this.labyrinthData.Level_name}`);
            }
            
            // Cargar datos del enemigo
            const enemyResponse = await fetch(`http://localhost:3000/api/enemy/level/${levelId}`);
            if (enemyResponse.ok) {
                const enemyData = await enemyResponse.json();
                this.enemyData = enemyData.enemy;
                console.log(`Enemigo: ${this.enemyData.Enemy_name}`);
                console.log(`Sangre del enemigo: ${this.enemyData.Blood_pool}`);
                
                // Guardar datos del enemigo en localStorage para el TCG
                localStorage.setItem('enemyData', JSON.stringify(this.enemyData));
            }
            
        } catch (error) {
            console.error('Error cargando datos del laberinto:', error);
        }
        
        // Generar el laberinto después de cargar los datos
        this.generateMaze();
        
        // Marcar que el juego está listo para ejecutarse
        this.isReady = true;
    }

    findDeadEnds() {

        const directions = [[1,0],[-1,0],[0,1],[0,-1]];
        this.deadEnds = Array(rows).fill().map(() => Array(cols).fill(false));

        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                if (this.maze[r][c] === 0) {
                    let freeNeighbors = 0;
                    for (let [dr, dc] of directions) {
                        if (this.maze[r + dr][c + dc] === 0) freeNeighbors++;
                    }
                    if (freeNeighbors === 1) this.deadEnds[r][c] = true;
                }
            }
        }
    }

    generateMaze(){

        this.maze = Array(rows).fill().map(() => Array(cols). fill(1));

        const startRow = 1;
        const startCol = 1;

        this.maze[startRow][startCol] = 0;

        this.carvePasssage(startRow, startCol);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.maze[row][col] === 1) {
                    this.actors.push(new Wall(col * cell_size, row * cell_size, cell_size));
                }
            }
        }

        this.findDeadEnds();

        this.chests = [];
        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                if (this.deadEnds[r][c] && !(r === 1 && c === 1)) {
                    this.chests.push(new Chest(c * cell_size, r * cell_size, cell_size));
                }
            }
        }

        const randomExit = this.getRandomExit();

        this.exit = new Door(randomExit.x, randomExit.y - cell_size, cell_size, cell_size * 2, "../assets/puerta.png");

        
        
        this.chests = this.chests.filter(chest => {
            return chest.position.x !== randomExit.x + cell_size / 2 ||
            chest.position.y !== randomExit.y + cell_size / 2;
        });

        
    }


    getRandomExit() {

        let candidates = [];

        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                if (this.deadEnds[r][c] && !(r === 1 && c === 1)) {
                    candidates.push([r, c]);
                }
            }
        }

        const idx = Math.floor(Math.random() * candidates.length);
        const [r, c] = candidates[idx];
        return { x: c * cell_size, y: r * cell_size };

    }

    carvePasssage(r, c){

        const direction = [
            [-3, 0],    // left
            [0, 3],     // right
            [3, 0],     // down
            [0, -3]     // up
        ];

        if (Math.random() < 0.4) {
        direction.sort(() => Math.random() - 0.5);
    }

        for (let [dr, dc] of direction){
            const newRow = r + dr;
            const newCol = c + dc;

            if (
                newRow > 0 &&
                newRow < rows - 1 &&
                newCol > 0 &&
                newCol < cols - 1 &&
                this.maze[newRow][newCol] == 1
            ){
                this.maze[newRow][newCol] = 0;
                this.maze[r + dr / 3][c + dc / 3] = 0;
                this.maze[r + (dr / 3) * 2][c + (dc / 3) * 2] = 0;
                this.carvePasssage(newRow, newCol);
            }
        }
    }

    drawMaze(){

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {

                let key = `${row},${col}`;

                if (this.maze[row][col] === 1) {
                    ctx.fillStyle = wall;
                    ctx.fillRect(col * cell_size, row * cell_size, cell_size, cell_size);
                } else {
                    ctx.drawImage(
                        this.floorImage,
                        col * cell_size,
                        row * cell_size,
                        cell_size,
                        cell_size
                    );

                }
                
                if (this.deadEnds[row][col]) {
                    ctx.drawImage(this.chestImage, col * cell_size, row * cell_size, cell_size, cell_size);
                }
            }
        }

    }

    drawDarkness(ctx) {

        const size = 3000;
        const dx = this.mouse.x - this.player.position.x;
        const dy = this.mouse.y - this.player.position.y;
        const angle = Math.atan2(dy, dx);

        ctx.save();

        const offset = 20;

        const px = this.player.position.x + Math.cos(angle) * offset;
        const py = this.player.position.y + Math.sin(angle) * offset;

        ctx.translate(px, py);
        ctx.rotate(angle - Math.PI / 2);
        ctx.drawImage(
            this.darknessMask, - size / 2 + 5, - size / 2 + 5, size, size);

        ctx.restore();
    }


    drawLight(ctx) {
        // Solo dibujar si la imagen está cargada
        if (!this.lightMaskLoaded) return;
        
        const player = this.player;

        const size = 3000;

        ctx.drawImage(
            this.lightMask,
            player.position.x - size / 2,
            player.position.y - size / 2,
            size,
            size
        );
    }

    drawArrow(ctx) {
        
        const dx = this.exit.position.x - this.player.position.x;
        const dy = this.exit.position.y - this.player.position.y;
        const angle = Math.atan2(dy, dx);

        const arrowX = this.player.position.x;
        const arrowY = this.player.position.y - this.player.halfSize.y * 2 - 10;

        ctx.save();

        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.moveTo(15, 0); 
        ctx.lineTo(-10, -8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }


    initObjects() {

        this.actors = [];

        this.player = new AnimatedPlayer(new Vector(cell_size + cell_size / 2, cell_size + cell_size / 2), cell_size,
            cell_size, "red", 3, playerMotion);
        this.player.halfSize = new Vector(cell_size / 2, cell_size / 2);
        this.player.setSprite("../assets/gracias.png", new Rect(0, 0, 143, 145));
        this.player.setCollider(cell_size * 0.50, cell_size * 0.50);
        this.player.setSpeed(playerSpeed);

        this.entrance = new Door(cell_size, 0, cell_size, cell_size * 2, "../assets/puerta.png");
 
    }

    checkChestCollisions() {
        const playerBox = {
            position: this.player.position,
            halfSize: new Vector(this.player.colliderWidth / 2, this.player.colliderHeight / 2),
        };

        for (let chest of this.chests) {
            if (!chest.opened && boxOverlap(playerBox, chest)) {
                chest.opened = true;
                this.openChest();
                break;
            }
        }
    }

openChest() {
    const playerId = localStorage.getItem('playerId');

    const mostrarPopup = (card, secret) => {
        // Mostrar popup sin sangre
        showChestPopup(card, secret);
    };

    const obtenerSecretoYMostrar = (card) => {
        if (Math.random() < 0.25 && playerId) {
            fetch('http://localhost:3000/api/secrets')
                .then(res => res.json())
                .then(data => {
                    const secret = data.secrets[Math.floor(Math.random() * data.secrets.length)];
                    // Guardar temporalmente (NO hacer POST todavía)
                    this.tempSecrets.push({
                        id: secret.Secret_id,
                        name: secret.Secret_name,
                        content: secret.Content
                    });
                    mostrarPopup(card, { name: secret.Secret_name, desc: secret.Content });
                    this.secretsFound++;
                })
                .catch(err => {
                    console.error("Error obteniendo secretos:", err);
                    mostrarPopup(card, null);
                });
        } else {
            mostrarPopup(card, null);
        }
    };

    if (!playerId) {
        console.warn("Sin playerId");
        mostrarPopup({ name: "Carta", desc: "Sin conexion" }, null);
        return;
    }

    fetch(`http://localhost:3000/api/player/${playerId}/cards/available`)
        .then(res => res.json())
        .then(data => {

            if (!data.cards || data.cards.length === 0) {
                mostrarPopup({ name: "Coleccion completa", desc: "Todas las cartas obtenidas" }, null);
                return;
            }
            const randomCard = data.cards[Math.floor(Math.random() * data.cards.length)];
            const card = {
                name: randomCard.Card_name,
                desc: `Costo: ${randomCard.Blood_cost} | Daño: ${randomCard.Damage} | HP: ${randomCard.HP}`
            };
            // Guardar temporalmente (NO hacer POST todavía)
            this.tempCards.push({
                id: randomCard.Card_id,
                name: randomCard.Card_name
            });
            obtenerSecretoYMostrar(card);
        })
        .catch(err => {
            console.error("Error obteniendo cartas:", err);
            mostrarPopup({ name: "Error", desc: "No se pudo conectar al servidor" }, null);
        });
}

    saveProgress() {
        // Guardar todo el progreso temporal solo cuando el jugador completa el laberinto
        const playerId = localStorage.getItem('playerId');
        const runId = localStorage.getItem('runId');

        console.log("Guardando progreso...");

        // Guardar cartas
        for (let card of this.tempCards) {
            GameState.addDemonCard(card.id, card.name);
            
            // Guardar en API
            if (runId && playerId) {
                fetch(`http://localhost:3000/api/run/${runId}/card/collect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerId, cardId: card.id })
                }).catch(console.error);
            }
        }

        // Guardar secretos
        for (let secret of this.tempSecrets) {
            GameState.addLoreCard(secret.id, secret.name, secret.content);
            
            // Guardar en API
            if (playerId) {
                fetch(`http://localhost:3000/api/player/${playerId}/secret/${secret.id}/discover`, {
                    method: 'POST'
                }).catch(console.error);
            }
        }

        console.log(`Progreso guardado: ${this.tempCards.length} cartas, ${this.tempSecrets.length} secretos`);
        console.log('Guardado automatico completado - Puedes continuar con estos items');
    }

    update(deltaTime) {
        // No actualizar hasta que el juego esté completamente inicializado
        if (!this.isReady) return;

        if (this.gameOver) return;
        
        // Actualizar temporizador
        this.elapsedTime += deltaTime;
        const timeLeft = this.timeLimit - this.elapsedTime;
        
        // Verificar si se acabó el tiempo
        if (timeLeft <= 0) {
            this.gameOver = true;
            this.won = false;
            return;
        }

        const oldX = this.player.position.x;
        const oldY = this.player.position.y;
        

        this.player.update(deltaTime, this.world);
        this.player.updateCollider();

        const Collider = new Vector(this.player.colliderWidth / 2, this.player.colliderHeight / 2);

        let testX = { position: new Vector(this.player.position.x, oldY), halfSize: Collider };
        for (let wall of this.actors) {
            if (boxOverlap(testX, wall)) {
                if (oldX < wall.position.x) {
                    this.player.position.x = wall.position.x - wall.halfSize.x - Collider.x;
                } else {
                    this.player.position.x = wall.position.x + wall.halfSize.x + Collider.x;
                }
                break;
            }
        }

        let testY = { position: new Vector(this.player.position.x, this.player.position.y), halfSize: Collider };
        for (let wall of this.actors) {
            if (boxOverlap(testY, wall)) {
                if (oldY < wall.position.y) {
                    this.player.position.y = wall.position.y - wall.halfSize.y - Collider.y;
                } else {
                    this.player.position.y = wall.position.y + wall.halfSize.y + Collider.y;
                }
                break;
            }
        }

        this.camera.follow(this.player);

        this.checkChestCollisions();

        // Verificar si llegó a la salida
        let playerTest = { position: this.player.position, halfSize: Collider };
        if (boxOverlap(playerTest, this.exit)) {
            this.gameOver = true;
            this.won = true;
            // Solo guardar progreso si ganó
            this.saveProgress();
        }

        
    }

    draw(ctx) {
        // No dibujar hasta que el juego esté completamente inicializado
        if (!this.isReady) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = "#ffffff";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Cargando laberinto...", canvasWidth / 2, canvasHeight / 2);
            return;
        }

        ctx.save();
        ctx.translate(-this.camera.position.x, -this.camera.position.y);
        
        this.drawMaze(ctx);
        
        for (let actor of this.actors) {
            actor.draw(ctx);
        }

        this.entrance.draw(ctx);
        this.exit.draw(ctx);
        this.drawLight(ctx);
        this.drawDarkness(ctx);
        this.player.draw(ctx);

        this.drawArrow(ctx);

        ctx.restore();

         // Mostrar temporizador
        const timeLeft = Math.max(0, this.timeLimit - this.elapsedTime);
        const totalSeconds = Math.ceil(timeLeft / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeString = minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(canvasWidth / 2 - 80, 10, 160, 40);
        ctx.fillStyle = totalSeconds <= 10 ? "red" : "white";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Tiempo: " + timeString, canvasWidth / 2, 38);
        ctx.textAlign = "left";
        
        // Mostrar mensaje de fin de juego
        if (this.gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            ctx.fillStyle = this.won ? "#00ff00" : "#ff0000";
            ctx.font = "32px 'Press Start 2P'";
            ctx.textAlign = "center";
            
            if (this.won) {
                ctx.fillText("ESCAPASTE", canvasWidth / 2, canvasHeight / 2 - 40);
                ctx.fillStyle = "white";
                ctx.font = "14px 'Press Start 2P'";
                ctx.fillText("Saliste del laberinto", canvasWidth / 2, canvasHeight / 2 + 10);
                ctx.fillStyle = "#ff6666";
                ctx.fillText("Preparate para el ritual", canvasWidth / 2, canvasHeight / 2 + 60);
            } else {
                ctx.fillText("ATRAPADO", canvasWidth / 2, canvasHeight / 2 - 40);
                ctx.fillStyle = "#888888";
                ctx.font = "14px 'Press Start 2P'";
                ctx.fillText("El tiempo se acabo", canvasWidth / 2, canvasHeight / 2 + 10);
                ctx.fillStyle = "#666666";
                ctx.fillText("Volviendo al lobby", canvasWidth / 2, canvasHeight / 2 + 60);
            }
            
            ctx.textAlign = "left";
            
            // Redirigir despues de 3 segundos
if (!this.returnTimeout) {
    this.returnTimeout = setTimeout(async () => {
        const playerId = localStorage.getItem("playerId");
        const runId = localStorage.getItem("runId");

        
        if (this.won) {
           await fetch(`http://localhost:3000/api/run/${runId}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerId: playerId,
                    timeTaken: Math.floor(this.elapsedTime / 1000),
                    secretsFound: this.secretsFound
                })
            });

            window.location.href = "../../TCG/game.html";
        } else {
            await fetch(`http://localhost:3000/api/run/${runId}/fail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerId: playerId
                })
            });

            window.location.href = "../../lobby/lobbyV1.html";
        }
    }, 2000);
}
        }
    }


    createEventListeners() {
         window.addEventListener("keydown", (event) => {
            if (event.key === "e" || event.key === "E") {
                closeChestPopup();
                return;
            }
            if (event.key in keyDirections) {
                this.addKey(keyDirections[event.key]);
                this.player.startMovement(keyDirections[event.key]);
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key in keyDirections) {
                this.delKey(keyDirections[event.key]);
                this.player.stopMovement(keyDirections[event.key]);
            }
        });

        canvas.addEventListener("mousemove", (event) => {

            const rect = canvas.getBoundingClientRect();

            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            this.mouse.x = mouseX + this.camera.position.x;
            this.mouse.y = mouseY + this.camera.position.y;

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

function showChestPopup(card, secret) {
    document.getElementById("chestCardName").textContent  = card.name;

    const secretDiv = document.getElementById("chestSecret");
    if (secret) {
        document.getElementById("chestSecretTitle").textContent = secret.name;
        document.getElementById("chestSecretText").textContent  = secret.desc;
        secretDiv.classList.remove("hidden");
    } else {
        secretDiv.classList.add("hidden");
    }

    document.getElementById("chestOverlay").classList.remove("hidden");
}

function closeChestPopup() {
    document.getElementById("chestOverlay").classList.add("hidden");
}


function main() {
    const canvas = document.getElementById("canvas");
    
    if (!canvas) {
        console.error('Canvas no encontrado - esperando DOM...');
        setTimeout(main, 100);
        return;
    }

    // Ajustar canvas a pantalla completa
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Reajustar si cambia el tamaño de ventana
    window.addEventListener('resize', () => {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        if (game && game.camera) {
            game.camera.viewport.width = canvasWidth;
            game.camera.viewport.height = canvasHeight;
        }
    });

    ctx = canvas.getContext("2d");

    game = new Game();

    requestAnimationFrame(drawScene);
}


function drawScene(newTime) {
    if (!oldTime) oldTime = newTime;

    let deltaTime = newTime - oldTime;

    // Llenar todo el canvas con negro
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    game.update(deltaTime);
    game.draw(ctx);

    oldTime = newTime;
    requestAnimationFrame(drawScene);
}
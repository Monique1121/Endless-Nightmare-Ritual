"use strict";

const API_URL = 'http://localhost:3000/api';

let cardPool = [];
let secretsPool = [];

const BLOOD_AMOUNTS = [5, 10, 15, 20, 25];

const worldWidth = 3000;
const worldHeight = 3000;

const rows = 40;
const cols = 50;
const cell_size = 60;

const canvasWidth = 800;
const canvasHeight = 600;
const wall = "white";
const path = "white";

let ctx;
let canvas;

let game;


let oldTime = 0;

let playerSpeed = 0.6;


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
async function hasLightMask() {
    try {
        const playerId = localStorage.getItem('playerId');
        if (!playerId) return false;
        
        const response = await fetch(`${API_URL}/player/${playerId}/item/mascara_luz`);
        if (!response.ok) return false;
        
        const data = await response.json();
        return data.hasItem;
    } catch (error) {
        console.error('Error verificando máscara de luz:', error);
        return false;
    }
}

// Cargar cofres abiertos del jugador
async function loadOpenedChests() {
    try {
        const playerId = localStorage.getItem('playerId');
        if (!playerId) return [];
        
        const response = await fetch(`${API_URL}/player/${playerId}/chests/opened`);
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.openedChests || [];
    } catch (error) {
        console.error('Error cargando cofres abiertos:', error);
        return [];
    }
}
async function markChestAsOpened(chestId) {
    try {
        const playerId = localStorage.getItem('playerId');
        if (!playerId) return;
        
        const response = await fetch(`${API_URL}/player/${playerId}/chest/${chestId}/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ runId: null })
        });
        
        if (!response.ok) throw new Error('Error al marcar cofre');
        console.log(`Cofre ${chestId} marcado como abierto`);
    } catch (error) {
        console.error('Error marcando cofre:', error);
    }
}
async function loadCardPool() {
    try {
        const response = await fetch(`${API_URL}/cards`);
        
        if (!response.ok) throw new Error('Error al cargar cartas');
        
        const data = await response.json();
        cardPool = data.cards.map(card => ({
            id: card.Card_id,
            name: card.Card_name
        }));
        
        console.log(`${cardPool.length} cartas cargadas`);
    } catch (error) {
        console.error('Error cargando cartas:', error);
        // Cartas de respaldo
        cardPool = [
            { id: 1, name: 'Sombra Voraz' },
            { id: 2, name: 'Imán Llamas' },
            { id: 3, name: 'Látigo Umbral' },
            { id: 4, name: 'Guardia Abisal' },
            { id: 5, name: 'Bendicion' },
            { id: 6, name: 'Carta Misteriosa' }
        ];
    }
}
async function loadSecrets() {
    // Secretos hardcoded hasta que estén en la BD
    secretsPool = [
        { Secret_id: 1, Title: "El Ritual Inicial", Text: "En las sombras de la escuela comenzó todo..." },
        { Secret_id: 2, Title: "La Primera Invocación", Text: "Los antiguos susurran en la oscuridad..." },
        { Secret_id: 3, Title: "Sangre y Pactos", Text: "El precio siempre se paga con sangre..." },
        { Secret_id: 4, Title: "El Umbral", Text: "Entre mundos existe un lugar olvidado..." },
        { Secret_id: 5, Title: "La Verdad Oculta", Text: "Lo que creías saber era solo el principio..." }
    ];
    console.log(`${secretsPool.length} secretos cargados`);
}
// CLASES DEL JUEGO

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
        this.position.x = target.position.x - this.viewWidth / 2;
        this.position.y = target.position.y - this.viewHeight / 2;

        this.position.x = Math.max(0, Math.min(this.position.x, this.worldWidth - this.viewWidth));
        this.position.y = Math.max(0, Math.min(this.position.y, this.worldHeight - this.viewHeight));
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
        
        this.chests = [];
        
        // Máscara de luz (efecto linterna)
        this.hasLightMask = false;
        this.lightRadius = 180;
        
        // Imágenes para el efecto de luz/oscuridad
        this.floorImage = new Image();
        this.floorImage.src = "../assets/floor.png";
        
        this.lightMask = new Image();
        this.lightMask.src = "../assets/light.png";
        
        this.darknessMask = new Image();
        this.darknessMask.src = "../assets/mascara_3.png";
        
        this.timeLimit = 60000;
        this.elapsedTime = 0;
        this.gameOver = false;
        this.won = false;

        this.createEventListeners();
        this.initObjects();
        this.generateMaze();
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
                    if (freeNeighbors === 1) {
                        this.deadEnds[r][c] = true;
                        
                        // No crear cofres cerca de la entrada (celdas 1,1 y vecinos cercanos)
                        const distanceFromStart = Math.abs(r - 1) + Math.abs(c - 1);
                        if (distanceFromStart < 3) continue;
                        const chestId = `${r}-${c}`;
                        this.chests.push({
                            row: r,
                            col: c,
                            id: chestId,
                            opened: false,
                            position: new Vector(c * cell_size + cell_size / 2, r * cell_size + cell_size / 2),
                            halfSize: new Vector(cell_size / 2, cell_size / 2)
                        });
                    }
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
        const randomExit = this.getRandomExit();
        this.exit = new Door(randomExit.x, randomExit.y - cell_size, cell_size, cell_size * 2, "../assets/puerta.png");
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
            [-3, 0],
            [0, 3],
            [3, 0],
            [0, -3]
        ];

        direction.sort(() => Math.random() - 0.5);

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
        this.player.setCollider(cell_size * 0.65, cell_size * 0.65);
        this.player.setSpeed(playerSpeed);

        this.entrance = new Door(cell_size, 0, cell_size, cell_size * 2, "../assets/puerta.png");
        
        // Mouse en coordenadas del canvas (relativas a la pantalla)
        this.mouseScreen = new Vector(canvasWidth / 2, canvasHeight / 2);
 
    }

    update(deltaTime) {
        if (this.gameOver) return;
        this.elapsedTime += deltaTime;
        const timeLeft = this.timeLimit - this.elapsedTime;
        if (timeLeft <= 0) {
            this.gameOver = true;
            this.won = false;
            return;
        }
        
        const oldX = this.player.position.x;
        const oldY = this.player.position.y;

        this.player.update(deltaTime, this.world);
        this.player.updateFrame(deltaTime);
        this.player.updateCollider();
        

        const Collider = new Vector(this.player.colliderWidth / 2, this.player.colliderHeight / 2);

        let testX = { position: new Vector(this.player.position.x, oldY), halfSize: Collider };
        for (let wall of this.actors) {
            if (boxOverlap(testX, wall)) {
                if (this.player.position.x < wall.position.x) {
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
                if (this.player.position.y < wall.position.y) {
                    this.player.position.y = wall.position.y - wall.halfSize.y - Collider.y;
                } else {
                    this.player.position.y = wall.position.y + wall.halfSize.y + Collider.y;
                }
                break;
            }
        }
        let playerTest = { position: this.player.position, halfSize: Collider };
        if (boxOverlap(playerTest, this.exit)) {
            this.gameOver = true;
            this.won = true;
        }
        
        // Detectar colisión con cofres y abrirlos
        this.checkChestCollisions();

        this.camera.follow(this.player);
    }
    
    checkChestCollisions() {
        const playerBox = {
            position: this.player.position,
            halfSize: new Vector(this.player.colliderWidth / 2, this.player.colliderHeight / 2),
        };

        for (let chest of this.chests) {
            if (!chest.opened && boxOverlap(playerBox, chest)) {
                chest.opened = true;
                this.openChest(chest);
                break;
            }
        }
    }
    
    async openChest(chest) {
        const card = cardPool.length > 0 
            ? cardPool[Math.floor(Math.random() * cardPool.length)]
            : { id: 0, name: "Carta Misteriosa" };
            
        const blood = BLOOD_AMOUNTS[Math.floor(Math.random() * BLOOD_AMOUNTS.length)];
        
        const secret = (Math.random() < 0.25 && secretsPool.length > 0)
            ? secretsPool[Math.floor(Math.random() * secretsPool.length)]
            : null;
        
        // Guardar en BD
        await markChestAsOpened(chest.id);
        if (typeof GameState !== 'undefined') {
            GameState.updateBlood(blood);
            GameState.addDemonCard(card.id, card.name);
            
            if (secret) {
                GameState.addLoreCard(secret.Secret_id, secret.Title, secret.Text);
            }
            
            await GameState.sync();
        }
        showChestPopup(card, blood, secret);
    }

    draw(ctx) {

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
        const timeLeft = Math.max(0, this.timeLimit - this.elapsedTime);
        const seconds = Math.ceil(timeLeft / 1000);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(canvasWidth / 2 - 80, 10, 160, 40);
        ctx.fillStyle = seconds <= 10 ? "red" : "white";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Tiempo: " + seconds + "s", canvasWidth / 2, 38);
        ctx.textAlign = "left";
        if (this.gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            ctx.fillStyle = this.won ? "#00ff00" : "#ff0000";
            ctx.font = "bold 48px Arial";
            ctx.textAlign = "center";
            
            if (this.won) {
                ctx.fillText("VICTORIA!", canvasWidth / 2, canvasHeight / 2 - 40);
                ctx.fillStyle = "white";
                ctx.font = "24px Arial";
                ctx.fillText("Escapaste del laberinto", canvasWidth / 2, canvasHeight / 2 + 10);
                ctx.font = "18px Arial";
                ctx.fillText("Preparate para el combate...", canvasWidth / 2, canvasHeight / 2 + 60);
            } else {
                ctx.fillText("MORISTE", canvasWidth / 2, canvasHeight / 2 - 40);
                ctx.fillStyle = "white";
                ctx.font = "24px Arial";
                ctx.fillText("Se acabo el tiempo", canvasWidth / 2, canvasHeight / 2 + 10);
                ctx.font = "18px Arial";
                ctx.fillText("Regresando al lobby...", canvasWidth / 2, canvasHeight / 2 + 60);
            }
            
            ctx.textAlign = "left";
            
            // Redirigir despues de 3 segundos
            if (!this.returnTimeout) {
                this.returnTimeout = setTimeout(() => {
                    if (this.won) {
                        window.location.href = "../../TCG/game.html";
                    } else {
                        window.location.href = "../../lobby/lobbyV1.html";
                    }
                }, 3000);
            }
        }
    }
    
    drawLight(ctx) {
        const player = this.player;
        const size = this.hasLightMask ? 2500 : 800; // Tamaño de luz según máscara

        ctx.drawImage(
            this.lightMask,
            player.position.x - size / 2,
            player.position.y - size / 2,
            size,
            size
        );
    }
    
    drawDarkness(ctx) {
        const size = 2000;
        const mouseWorldX = this.mouseScreen.x + this.camera.position.x;
        const mouseWorldY = this.mouseScreen.y + this.camera.position.y;
        
        const dx = mouseWorldX - this.player.position.x;
        const dy = mouseWorldY - this.player.position.y;
        const angle = Math.atan2(dy, dx);

        ctx.save();

        const offset = 20;
        const px = this.player.position.x + Math.cos(angle) * offset;
        const py = this.player.position.y + Math.sin(angle) * offset;

        ctx.translate(px, py);
        ctx.rotate(angle - Math.PI / 2);
        ctx.drawImage(
            this.darknessMask,
            -size / 2 + 5,
            -size / 2 + 5,
            size,
            size
        );

        ctx.restore();
    }


    createEventListeners() {
        window.addEventListener("keydown", (event) => {
            // Cerrar popup de cofre con E
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
            
            // Guardar coordenadas relativas al canvas (no al mundo)
            this.mouseScreen.x = event.clientX - rect.left;
            this.mouseScreen.y = event.clientY - rect.top;
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

function showChestPopup(card, blood, secret) {
    document.getElementById("chestCardName").textContent = card.name;
    document.getElementById("chestBloodAmount").textContent = blood;

    const secretDiv = document.getElementById("chestSecret");
    if (secret) {
        document.getElementById("chestSecretTitle").textContent = secret.Title;
        document.getElementById("chestSecretText").textContent = secret.Text;
        secretDiv.classList.remove("hidden");
    } else {
        secretDiv.classList.add("hidden");
    }

    document.getElementById("chestOverlay").classList.remove("hidden");
}

function closeChestPopup() {
    document.getElementById("chestOverlay").classList.add("hidden");
}
// FUNCIÓN PRINCIPAL

async function main() {
    canvas = document.getElementById("canvas");

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx = canvas.getContext("2d");
    console.log('Cargando datos desde la API...');
    await Promise.all([
        loadCardPool(),
        loadSecrets()
    ]);
    game = new Game();
    
    // Cargar estado del jugador
    console.log('Cargando estado del jugador...');
    game.hasLightMask = await hasLightMask();
    const openedChests = await loadOpenedChests();
    for (let chest of game.chests) {
        if (openedChests.includes(chest.id)) {
            chest.opened = true;
        }
    }
    
    console.log(`Mascara de luz: ${game.hasLightMask ? 'SI' : 'NO'}`);
    console.log(`Cofres abiertos: ${openedChests.length}/${game.chests.length}`);

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

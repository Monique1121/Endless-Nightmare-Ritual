"use strict";


// const canvasWidth = 800;
// const canvasHeight = 600;


const worldWidth = 3000;
const worldHeight = 3000;

const rows = 40;
const cols = 50;
const cell_size = 60;

const canvasWidth = 800;
const canvasHeight = 600;
const wall = "black";
const path = "white";

let ctx;
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

const CARDS = [
    { name: "Carta 1" ,    desc: "DESC"},
    { name: "Carta 2",  desc: "DESC"},
    { name: "Carta 3",     desc: "DESC"},
    { name: "Carta 4", desc: "DESC"},
    { name: "Carta 5",   desc: "DESC"},
    { name: "Carta 6",   desc: "DESC"},
];

const SECRETS = [
    { name: "Secreto 1", desc: "DESC" },
    { name: "Secreto 2", desc: "DESC" },
    { name: "Secreto 3", desc: "DESC" },
    { name: "Secreto 4", desc: "DESC" },
    { name: "Secreto 5", desc: "DESC" },
];


const BLOOD_AMOUNTS = [5, 10, 15, 20, 25];


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
        this.position.x = target.position.x - this.viewWidth / 2;
        this.position.y = target.position.y - this.viewHeight / 2;

        this.position.x = Math.max(0, Math.min(this.position.x, this.worldWidth - this.viewWidth));
        this.position.y = Math.max(0, Math.min(this.position.y, this.worldHeight - this.viewHeight));
    }
}


class Game {
    constructor() {
        this.world = { width: cols * cell_size, height: rows * cell_size };
        this.camera = new Camera(canvasWidth, canvasHeight, this.world.width, this.world.height);

        this.chestImage = new Image();
        this.chestImage.src = "../assets/cofre.png";

        this.createEventListeners();
        this.initObjects();
        this.generateMaze();

        this.chestImage = new Image();
        this.chestImage.src = "../assets/cofre.png";
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
                } else {
                    ctx.fillStyle = path;
                }
                ctx.fillRect(col * cell_size, row * cell_size, cell_size, cell_size);
                
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
        this.chests = [];
        this.player = new AnimatedPlayer(new Vector(cell_size + cell_size / 2, cell_size + cell_size / 2), cell_size,
            cell_size, "red", 3, playerMotion);
        this.player.halfSize = new Vector(cell_size / 2, cell_size / 2);
        this.player.setSprite("../assets/gracias.png", new Rect(0, 0, 143, 145));
        this.player.setCollider(cell_size * 0.65, cell_size * 0.65);
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
        const card   = CARDS[Math.floor(Math.random() * CARDS.length)];
        const blood  = BLOOD_AMOUNTS[Math.floor(Math.random() * BLOOD_AMOUNTS.length)];
        const secret = Math.random() < 0.25
            ? SECRETS[Math.floor(Math.random() * SECRETS.length)]
            : null;
        showChestPopup(card, blood, secret);
    } 


    update(deltaTime) {
        const oldX = this.player.position.x;
        const oldY = this.player.position.y;

        this.player.update(deltaTime, this.world);
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

        this.camera.follow(this.player);
        this.checkChestCollisions();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(-this.camera.position.x, -this.camera.position.y);

        this.drawMaze(ctx);

        for (let actor of this.actors) actor.draw(ctx);

        this.entrance.draw(ctx);
        this.exit.draw(ctx);
        this.player.draw(ctx);
        this.drawArrow(ctx);

        ctx.restore();
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
    }

    addKey(direction) {
        if (!this.player.keys.includes(direction)) this.player.keys.push(direction);
    }

    delKey(direction) {
        const i = this.player.keys.indexOf(direction);
        if (i !== -1) this.player.keys.splice(i, 1);
    }
}


function showChestPopup(card, blood, secret) {
    document.getElementById("chestCardName").textContent  = card.name;
    document.getElementById("chestBloodAmount").textContent = blood;

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
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;
    ctx = canvas.getContext("2d");

    game = new Game();
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
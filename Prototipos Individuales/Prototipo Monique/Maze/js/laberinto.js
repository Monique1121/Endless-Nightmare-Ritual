"use strict";


// const canvasWidth = 800;
// const canvasHeight = 600;


const worldWidth = 3000;
const worldHeight = 3000;

const rows = 30;
const cols = 40;
const cell_size = 50;

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

class Exit {
    constructor(x, y, size) {
        this.position = new Vector(x + size / 2, y + size / 2);
        this.halfSize = new Vector(size / 2, size / 2);
    }

    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(
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

        this.createEventListeners();
        this.initObjects();
        this.generateMaze();
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

        for (let row = 0; row < rows; row++){
            for (let col = 0; col < cols; col++){
                ctx.fillStyle = this.maze[row][col] == 1 ? wall : path;
                ctx.fillRect(col * cell_size, row * cell_size, cell_size, cell_size);
            }
        }

    }

    initObjects() {

        this.actors = [];

        this.player = new AnimatedPlayer(new Vector(cell_size + cell_size / 2, cell_size + cell_size / 2), 40,
            40, "red", 3, playerMotion);
        this.player.halfSize = new Vector(cell_size / 2, cell_size / 2);
        this.player.setSprite("../assets/gracias.png", new Rect(0, 0, 143, 145));

        this.player.setSpeed(playerSpeed);

        //this.exit = new Exit((cols - 3) * cell_size, (rows - 2) * cell_size, cell_size, "../assets/puerta.png");
        this.exit = new Exit((cols - 3) * cell_size, (rows - 2) * cell_size, cell_size, "../assets/puerta.png");

    }

   update(deltaTime) {
    const oldX = this.player.position.x;
    const oldY = this.player.position.y;

    this.player.update(deltaTime, this.world);

    let testX = { position: new Vector(this.player.position.x, oldY), halfSize: this.player.halfSize };
    for (let wall of this.actors) {
        if (boxOverlap(testX, wall)) {
            if (this.player.position.x < wall.position.x) {
                this.player.position.x = wall.position.x - wall.halfSize.x - this.player.halfSize.x;
            } else {
                this.player.position.x = wall.position.x + wall.halfSize.x + this.player.halfSize.x;
            }
            break;
        }
    }

    let testY = { position: new Vector(this.player.position.x, this.player.position.y), halfSize: this.player.halfSize };
    for (let wall of this.actors) {
        if (boxOverlap(testY, wall)) {
            if (this.player.position.y < wall.position.y) {
                this.player.position.y = wall.position.y - wall.halfSize.y - this.player.halfSize.y;
            } else {
                this.player.position.y = wall.position.y + wall.halfSize.y + this.player.halfSize.y;
            }
            break;
        }
    }

    this.camera.follow(this.player);
}

    draw(ctx) {
        ctx.save();
        ctx.translate(-this.camera.position.x, -this.camera.position.y);
        
        this.drawMaze(ctx);
        
        for (let actor of this.actors) {
            actor.draw(ctx);
        }

        this.exit.draw(ctx); // dibujamos la salida
        this.player.draw(ctx);


        ctx.restore();
    }


    createEventListeners() {
        window.addEventListener("keydown", (event) => {
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


function main() {
    const canvas = document.getElementById("canvas");

    canvas.width = canvasWidth;
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

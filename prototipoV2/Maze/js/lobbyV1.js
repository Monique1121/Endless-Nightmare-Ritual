"use strict";


const canvasWidth = 800;
const canvasHeight = 600;


const worldWidth = 3000;
const worldHeight = 3000;

let ctx;


let game;


let oldTime = 0;

let playerSpeed = 0.5;

// How often (in ms) to persist the player's position to localStorage
const POSITION_SAVE_INTERVAL_MS = 2000;


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
        this.floorColor1 = "#4CAF50";
        this.floorColor2 = "#66BB6A";

        // Throttle for persisting position to localStorage
        this._lastPositionSave = 0;

        this.createEventListeners();
        this.initObjects();

        // Start background sync with the database
        syncManager.start();
    }

    initObjects() {
        // Restore saved player position when continuing a run,
        // otherwise start at the centre of the world.
        const savedPos = gameState.player.position;
        const startX = (savedPos && savedPos.x) ? savedPos.x : this.world.width / 2;
        const startY = (savedPos && savedPos.y) ? savedPos.y : this.world.height / 2;

        this.player = new AnimatedPlayer(
            new Vector(startX, startY),
            60,
            60,
            "red",
            3,
            playerMotion
        );

        
        this.player.setSprite(
    "../assets/sprites/gracias.png",
    new Rect(0, 0, 143, 145)
);

        this.player.setSpeed(playerSpeed);

        this.actors = [];
    }

    update(deltaTime) {
        this.player.update(deltaTime, this.world);
        this.camera.follow(this.player);

        for (let actor of this.actors) {
            if (actor.updateFrame) {
                actor.updateFrame(deltaTime);
            }
        }

        // Throttled position persistence (localStorage only, not DB)
        this._lastPositionSave += deltaTime;
        if (this._lastPositionSave >= POSITION_SAVE_INTERVAL_MS) {
            this._lastPositionSave = 0;
            gameState.setPlayerPosition(
                this.player.position.x,
                this.player.position.y
            );
        }
    }

    drawBackground(ctx) {
        for (let y = 0; y < this.world.height; y += this.tileSize) {
            for (let x = 0; x < this.world.width; x += this.tileSize) {
                const useFirstColor = ((x / this.tileSize) + (y / this.tileSize)) % 2 === 0;
                ctx.fillStyle = useFirstColor ? this.floorColor1 : this.floorColor2;
                ctx.fillRect(x, y, this.tileSize, this.tileSize);
            }
        }
    }

    draw(ctx) {
        ctx.save();

        
        ctx.translate(-this.camera.position.x, -this.camera.position.y);

        
        this.drawBackground(ctx);

        for (let actor of this.actors) {
            actor.draw(ctx);
        }

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

    // Start a new run if there is no active one yet
    if (!gameState.currentRun.run_id) {
        gameState.startRun(
            Date.now(),          // run_id (temporary; server should assign real id)
            1,                   // labyrinth_id
            gameState.currentRun.level_id || 1
        );
    }

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

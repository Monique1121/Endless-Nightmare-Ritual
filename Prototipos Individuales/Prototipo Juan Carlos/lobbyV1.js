"use strict";


const canvasWidth = 800;
const canvasHeight = 600;


const worldWidth = 2048;
const worldHeight = 2048;

let ctx;


let game;


let oldTime = 0;

let playerSpeed = 0.50;


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
        
        // cargar imagen del mapa completo
        this.mapImage = new Image();
        this.mapImage.src = "assets/sprites/bosqueescuela.png";

        this.createEventListeners();
        this.initObjects();
    }

    initObjects() {
        // jugador empieza abajo en el medio del mapa
        this.player = new AnimatedPlayer(
            new Vector(this.world.width / 2, this.world.height - 150),
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

        this.player.setSpeed(playerSpeed);

        this.actors = [];
        
        // zonas de colision (edificios, arboles grandes, etc)
        this.colliders = this.createColliders();
    }
    
    createColliders() {
        // rectangulos donde el jugador NO puede pasar
        return [
            // escuela (izquierda-centro)
            new Rect(650, 700, 400, 350),
            
            // hospital (centro-arriba)
            new Rect(900, 400, 320, 280),
            
            // laboratorio (derecha)
            new Rect(1400, 700, 380, 320),
            
            // arboles grandes alrededor (algunos ejemplos)
            new Rect(200, 200, 80, 80),
            new Rect(400, 500, 80, 80),
            new Rect(1600, 300, 80, 80),
            new Rect(1700, 1200, 80, 80),
            new Rect(300, 1500, 80, 80),
        ];
    }

    update(deltaTime) {
        this.player.update(deltaTime, this.world, this.colliders);
        this.camera.follow(this.player);

        for (let actor of this.actors) {
            if (actor.updateFrame) {
                actor.updateFrame(deltaTime);
            }
        }
    }

    drawBackground(ctx) {
        // dibujar el mapa de fondo
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

    draw(ctx) {
        ctx.save();

        
        ctx.translate(-this.camera.position.x, -this.camera.position.y);

        
        this.drawBackground(ctx);

        // ordenar por Y para que pase por delante/detras
        const allObjects = [...this.actors, this.player];
        allObjects.sort((a, b) => a.position.y - b.position.y);
        
        for (let obj of allObjects) {
            obj.draw(ctx);
        }

        ctx.restore();
    }

    createEventListeners() {
        window.addEventListener("keydown", (event) => {
            if (event.key in keyDirections) {
                console.log("Tecla presionada:", event.key, "Dirección:", keyDirections[event.key]); // debug
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
    
    canvas.focus(); // para que detecte teclas

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

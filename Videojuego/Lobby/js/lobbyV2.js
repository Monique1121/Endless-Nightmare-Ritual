"use strict";

const canvasWidth = 800;
const canvasHeight = 600;

const worldWidth = 1600;
const worldHeight = 1200;

let ctx;
let game;
let oldTime = 0;
let playerSpeed = 0.25;

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


// Puerta que lleva a un nivel
class Door {
    constructor(x, y, width, height, label, color, levelUrl) {
        this.position = new Vector(x, y);
        this.size = new Vector(width, height);
        this.halfSize = new Vector(width / 2, height / 2);
        this.label = label;
        this.color = color;
        this.levelUrl = levelUrl;
        this.isNear = false;
    }

    // Devuelve true si el jugador esta cerca de la puerta
    checkPlayerProximity(player) {
        const dx = Math.abs(player.position.x - this.position.x);
        const dy = Math.abs(player.position.y - this.position.y);
        this.isNear = dx < this.halfSize.x + 50 && dy < this.halfSize.y + 50;
        return this.isNear;
    }

    // Navegar al nivel si hay una URL definida
    enter() {
        if (this.levelUrl && this.levelUrl !== "#") {
            window.location.href = this.levelUrl;
        }
    }

    draw(ctx) {
        const x = this.position.x - this.halfSize.x;
        const y = this.position.y - this.halfSize.y;
        const w = this.size.x;
        const h = this.size.y;

        // Marco de madera de la puerta
        ctx.fillStyle = "#4E342E";
        ctx.fillRect(x - 8, y - 8, w + 16, h + 16);

        // Cuerpo de la puerta
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, w, h);

        // Ventana/detalle superior
        ctx.fillStyle = "rgba(135, 206, 235, 0.6)";
        ctx.fillRect(x + 10, y + 10, w - 20, h * 0.3);

        // Manija
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(x + w - 14, y + h / 2 + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        // Nombre del nivel sobre la puerta
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.font = "bold 13px Verdana";
        ctx.textAlign = "center";
        ctx.strokeText(this.label, this.position.x, y - 20);
        ctx.fillText(this.label, this.position.x, y - 20);

        // Indicador de proximidad
        if (this.isNear) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(this.position.x - 95, y + h + 8, 190, 28);
            ctx.fillStyle = "#FFFF00";
            ctx.font = "bold 11px Verdana";
            ctx.textAlign = "center";
            ctx.fillText("Presiona ENTER para entrar", this.position.x, y + h + 27);
        }
    }
}


// Arbol decorativo del bosque
class Tree {
    constructor(x, y, radius) {
        this.position = new Vector(x, y);
        this.radius = radius;
        // Rectangulo de colision del tronco
        this.collider = new Rect(
            x - radius * 0.4,
            y - radius * 0.4,
            radius * 0.8,
            radius * 0.8
        );
    }

    draw(ctx) {
        const x = this.position.x;
        const y = this.position.y;
        const r = this.radius;

        // Sombra del arbol
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 8, r * 0.6, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tronco
        ctx.fillStyle = "#5D4037";
        ctx.fillRect(x - 6, y - 5, 12, r * 0.7 + 10);

        // Copa inferior (mas oscura)
        ctx.fillStyle = "#1B5E20";
        ctx.beginPath();
        ctx.arc(x, y - r * 0.2, r, 0, Math.PI * 2);
        ctx.fill();

        // Copa media
        ctx.fillStyle = "#2E7D32";
        ctx.beginPath();
        ctx.arc(x - 2, y - r * 0.55, r * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Copa superior (mas clara)
        ctx.fillStyle = "#43A047";
        ctx.beginPath();
        ctx.arc(x + 2, y - r * 0.85, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
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
        this.world = { width: worldWidth, height: worldHeight };
        this.camera = new Camera(canvasWidth, canvasHeight, worldWidth, worldHeight);
        this.activeDoor = null;

        this.createEventListeners();
        this.initObjects();
    }

    initObjects() {
        // Jugador empieza al fondo al centro del mundo
        this.player = new AnimatedPlayer(
            new Vector(this.world.width / 2, this.world.height - 120),
            60,
            60,
            "blue",
            3,
            playerMotion
        );
        this.player.setSprite("../assets/sprites/gracias.png", new Rect(0, 0, 143, 145));
        this.player.setSpeed(playerSpeed);

        // Las 3 puertas que llevan a distintos niveles
        this.doors = [
            new Door(
                300, 200,
                80, 120,
                "Nivel 1 - Bosque",
                "#8B4513",
                "../../Prototipo/forest-map.html"
            ),
            new Door(
                worldWidth / 2, 160,
                80, 120,
                "Nivel 2 - Laberinto",
                "#1565C0",
                "#"
            ),
            new Door(
                worldWidth - 300, 200,
                80, 120,
                "Nivel 3 - Batalla",
                "#B71C1C",
                "#"
            ),
        ];

        // Arboles que forman el bosque
        this.trees = this.buildForest();

        // Colisiones: solo los troncos de los árboles
        this.colliders = this.trees.map(t => t.collider);
    }

    buildForest() {
        const trees = [];

        // Borde izquierdo
        for (let y = 80; y < worldHeight; y += 150) {
            trees.push(new Tree(80, y, 40));
            trees.push(new Tree(160, y + 70, 35));
        }

        // Borde derecho
        for (let y = 80; y < worldHeight; y += 150) {
            trees.push(new Tree(worldWidth - 80, y, 40));
            trees.push(new Tree(worldWidth - 160, y + 70, 35));
        }

        // Borde superior (con huecos para las puertas)
        for (let x = 80; x < worldWidth; x += 140) {
            // Dejar huecos cerca de las puertas
            const nearDoor1 = Math.abs(x - 300) < 120;
            const nearDoor2 = Math.abs(x - worldWidth / 2) < 120;
            const nearDoor3 = Math.abs(x - (worldWidth - 300)) < 120;
            if (!nearDoor1 && !nearDoor2 && !nearDoor3) {
                trees.push(new Tree(x, 80, 38));
            }
        }

        // Borde inferior
        for (let x = 80; x < worldWidth; x += 140) {
            trees.push(new Tree(x, worldHeight - 80, 38));
        }

        // Arboles interiores dispersos
        const interior = [
            { x: 250, y: 450, r: 35 }, { x: 400, y: 600, r: 40 }, { x: 280, y: 750, r: 33 },
            { x: 500, y: 400, r: 37 }, { x: 650, y: 550, r: 42 }, { x: 480, y: 850, r: 35 },
            { x: 700, y: 700, r: 33 }, { x: 850, y: 450, r: 40 }, { x: 750, y: 950, r: 36 },
            { x: 950, y: 600, r: 38 }, { x: 1100, y: 400, r: 35 }, { x: 1050, y: 750, r: 40 },
            { x: 1200, y: 550, r: 33 }, { x: 1300, y: 650, r: 37 }, { x: 1250, y: 850, r: 42 },
            { x: 1400, y: 500, r: 35 }, { x: 350, y: 950, r: 38 }, { x: 600, y: 300, r: 33 },
            { x: 900, y: 350, r: 40 }, { x: 1100, y: 950, r: 36 },
        ];
        for (const t of interior) {
            trees.push(new Tree(t.x, t.y, t.r));
        }

        return trees;
    }

    update(deltaTime) {
        this.player.update(deltaTime, this.world, this.colliders);
        this.camera.follow(this.player);

        this.activeDoor = null;
        for (const door of this.doors) {
            if (door.checkPlayerProximity(this.player)) {
                this.activeDoor = door;
            }
        }
    }

    drawBackground(ctx) {
        // Base de cesped oscuro
        ctx.fillStyle = "#2E7D32";
        ctx.fillRect(0, 0, this.world.width, this.world.height);

        // Patron de teselas para dar textura al cesped
        ctx.fillStyle = "#388E3C";
        for (let y = 0; y < this.world.height; y += 80) {
            for (let x = 0; x < this.world.width; x += 80) {
                if ((Math.floor(x / 80) + Math.floor(y / 80)) % 2 === 0) {
                    ctx.fillRect(x, y, 80, 80);
                }
            }
        }

        // Camino de tierra hacia la puerta izquierda
        ctx.fillStyle = "#795548";
        ctx.fillRect(270, 195, 70, 40);
        ctx.fillRect(290, 200, 30, worldHeight - 200);

        // Camino de tierra hacia la puerta central
        ctx.fillRect(worldWidth / 2 - 20, 160, 40, worldHeight - 160);

        // Camino de tierra hacia la puerta derecha
        ctx.fillStyle = "#795548";
        ctx.fillRect(worldWidth - 370, 195, 70, 40);
        ctx.fillRect(worldWidth - 320, 200, 30, worldHeight - 200);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(-this.camera.position.x, -this.camera.position.y);

        this.drawBackground(ctx);

        // Arboles detras del jugador
        const behindPlayer = this.trees.filter(t => t.position.y < this.player.position.y);
        const inFrontPlayer = this.trees.filter(t => t.position.y >= this.player.position.y);

        for (const tree of behindPlayer) tree.draw(ctx);

        // Puertas
        for (const door of this.doors) door.draw(ctx);

        // Jugador
        this.player.draw(ctx);

        // Arboles adelante del jugador (para simular profundidad)
        for (const tree of inFrontPlayer) tree.draw(ctx);

        ctx.restore();

        // HUD encima de todo (coordenadas de pantalla, sin camara)
        this.drawHUD(ctx);
    }

    drawHUD(ctx) {
        // Fondo semitransparente para las instrucciones
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(10, 10, 270, 80);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "13px Verdana";
        ctx.textAlign = "left";
        ctx.fillText("WASD / Flechas: Mover jugador", 20, 32);
        ctx.fillText("ENTER: Entrar al nivel", 20, 55);
        ctx.fillText("Y / U: Mostrar cajas de colision", 20, 78);
    }

    createEventListeners() {
        window.addEventListener("keydown", (event) => {
            if (event.key in keyDirections) {
                this.addKey(keyDirections[event.key]);
                this.player.startMovement(keyDirections[event.key]);
            }
            if (event.key === "Enter" && this.activeDoor) {
                this.activeDoor.enter();
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
    canvas.focus();
    requestAnimationFrame(drawScene);
}


function drawScene(newTime) {
    if (!oldTime) oldTime = newTime;
    const deltaTime = newTime - oldTime;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    game.update(deltaTime);
    game.draw(ctx);
    oldTime = newTime;
    requestAnimationFrame(drawScene);
}

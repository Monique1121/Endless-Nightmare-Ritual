"use strict";

const canvasWidth = 800;
const canvasHeight = 600;

const worldWidth = 3000;
const worldHeight = 3000;

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

        this.inventoryOpen = false;

        // aqui esta la data del inventario, la teoria mantener esto vacia y hacer el metodo de la API 
        this.inventoryData = {
            blood: 85,
            cards: [
                {name: "Messi", type: "Goat", cost: 1000, damage: '10^10', hp: 'infinito', description: "El mejor de todos los tiempos, inflige daño infinito y tiene HP infinito."},
                {name: "Vini", type: "malo", cost: 85, damage: 7, hp: -1, description: "Una basura que deje de llorar segundon eterno "},
                {name: "Vini", type: "malo", cost: 85, damage: 7, hp: -1, description: "Una basura que deje de llorar segundon eterno "},
                {name: "Vini", type: "malo", cost: 85, damage: 7, hp: -1, description: "Una basura que deje de llorar segundon eterno "},
                {name: "Vini", type: "malo", cost: 85, damage: 7, hp: -1, description: "Una basura que deje de llorar segundon eterno "},
                {name: "Vini", type: "malo", cost: 85, damage: 7, hp: -1, description: "Una basura que deje de llorar segundon eterno "}
                
            ],
<<<<<<< HEAD

        };

        this.secretsData = {
            secrets: [
                {name: "Secreto 1", description: "Descripción del secreto 1"},
                {name: "Secreto 2", description: "Descripción del secreto 2"},
                {name: "Secreto 3", description: "Descripción del secreto 3"},
            ],
        }


=======
        };

>>>>>>> origin/main
        this.createEventListeners();
        this.initObjects();
        this.inventoryUI();
        this.drawInventory();
<<<<<<< HEAD
        this.drawSecrets();
=======
>>>>>>> origin/main
    }

    inventoryUI() {
        
        this.inventoryHUB = document.getElementById("inventory");
        this.inventoryBloodValue = document.getElementById("inventory_blood");
        this.inventoryCards = document.getElementById("inventory_cards");
    }

    initObjects() {
        this.player = new AnimatedPlayer(
            new Vector(this.world.width / 2, this.world.height / 2),
            60,
            60,
            "red",
            3,
            playerMotion
        );

        this.player.setSprite(
            "../../assets/gracias.png",
            new Rect(0, 0, 143, 145)
        );

        this.player.setSpeed(playerSpeed);

        this.actors = [];
    }

    drawInventory() {
        
        this.inventoryBloodValue.textContent = this.inventoryData.blood;
        this.inventoryCards.innerHTML = "";

        for (const card of this.inventoryData.cards) {
            const cardDiv = document.createElement("div");
            cardDiv.className = "inventory-card";
            cardDiv.innerHTML = `
                <h4>${card.name}</h4>
                <p>Tipo: ${card.type}</p>
                <p>Costo de sangre: ${card.cost}</p>
                <p>Daño: ${card.damage}</p> 
                <p>HP: ${card.hp}</p>
                <p>Descripción: ${card.description} </p>
            `;
            this.inventoryCards.append(cardDiv);
        }
    }

<<<<<<< HEAD
        drawSecrets() {
        
        this.inventoryBloodValue.textContent = this.inventoryData.blood;
        this.inventoryCards.innerHTML = "";

        for (const card of this.inventoryData.cards) {
            const cardDiv = document.createElement("div");
            cardDiv.className = "inventory-card";
            cardDiv.innerHTML = `
                <h4>${card.name}</h4>
                <p>Tipo: ${card.type}</p>
                <p>Costo de sangre: ${card.cost}</p>
                <p>Daño: ${card.damage}</p> 
                <p>HP: ${card.hp}</p>
                <p>Descripción: ${card.description} </p>
            `;
            this.inventoryCards.append(cardDiv);
        }
    }

=======
>>>>>>> origin/main
    toggleInventory(forceValue = null) {
        // Si forceValue es null, alterna el estado actual. De lo contrario, establece el estado según forceValue. Esto permite abrir o cerrar el inventario de forma controlada.
        this.inventoryOpen = forceValue === null ? !this.inventoryOpen : forceValue;

        if (this.inventoryOpen) {
            this.drawInventory();
            this.inventoryHUB.classList.remove("hidden");
            this.player.keys = [];
        } else {
            this.inventoryHUB.classList.add("hidden");
        }
    }

    update(deltaTime) {
        if (!this.inventoryOpen) {
            this.player.update(deltaTime, this.world);
            this.camera.follow(this.player);
        }

        for (let actor of this.actors) {
            if (actor.updateFrame) {
                actor.updateFrame(deltaTime);
            }
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
            if (event.key === "e" || event.key === "E") {
                this.toggleInventory();
                return;
            }

            if (this.inventoryOpen) return;

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
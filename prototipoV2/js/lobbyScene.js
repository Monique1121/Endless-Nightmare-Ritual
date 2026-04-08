"use strict";

/*
 * Endless Nightmare Ritual — Lobby Scene
 *
 * Self-contained game scene for the Lobby (open-world area).
 * Uses unique class names (LobbyCamera, LobbyGame) so it can coexist
 * on the same page with other scenes without variable conflicts.
 *
 * Public API:
 *   initLobbyScene()  – start the lobby game
 *   stopLobbyScene()  – stop the lobby game and clean up
 */

const LOBBY_CANVAS_W = 800;
const LOBBY_CANVAS_H = 600;
const LOBBY_WORLD_W  = 2048;
const LOBBY_WORLD_H  = 2048;

let lobbyCtx         = null;
let lobbyGame        = null;
let lobbyOldTime     = 0;
let lobbyAnimId      = null;
let lobbyActive      = false;

const LOBBY_PLAYER_SPEED = 0.50;

const lobbyKeyMap = {
    w: "up", a: "left", s: "down", d: "right",
    ArrowUp: "up", ArrowLeft: "left", ArrowDown: "down", ArrowRight: "right",
};

const lobbyPlayerMotion = {
    up:    { status: false, axis: "y", sign: -1, repeat: true, duration: 120, moveFrames: [6, 8],  idleFrames: [7,  7]  },
    left:  { status: false, axis: "x", sign: -1, repeat: true, duration: 120, moveFrames: [9, 11], idleFrames: [10, 10] },
    down:  { status: false, axis: "y", sign:  1, repeat: true, duration: 120, moveFrames: [0, 2],  idleFrames: [1,  1]  },
    right: { status: false, axis: "x", sign:  1, repeat: true, duration: 120, moveFrames: [3, 5],  idleFrames: [4,  4]  },
};


class LobbyCamera {
    constructor(viewW, viewH, worldW, worldH) {
        this.position  = new Vector(0, 0);
        this.viewWidth = viewW;
        this.viewHeight = viewH;
        this.worldWidth = worldW;
        this.worldHeight = worldH;
    }

    follow(target) {
        this.position.x = target.position.x - this.viewWidth  / 2;
        this.position.y = target.position.y - this.viewHeight / 2;
        this.position.x = Math.max(0, Math.min(this.position.x, this.worldWidth  - this.viewWidth));
        this.position.y = Math.max(0, Math.min(this.position.y, this.worldHeight - this.viewHeight));
    }
}


class LobbyGame {
    constructor() {
        this.world    = { width: LOBBY_WORLD_W, height: LOBBY_WORLD_H };
        this.camera   = new LobbyCamera(LOBBY_CANVAS_W, LOBBY_CANVAS_H, LOBBY_WORLD_W, LOBBY_WORLD_H);
        this.tileSize = 100;

        this.mapImage = new Image();
        this.mapImage.src = "../Videojuego/lobby/assets/sprites/bosqueescuela.png";

        this._keydownHandler = null;
        this._keyupHandler   = null;

        this.createEventListeners();
        this.initObjects();
    }

    initObjects() {
        // Reset direction statuses so keys don't carry over between sessions
        for (const dir of Object.values(lobbyPlayerMotion)) {
            dir.status = false;
        }

        this.player = new AnimatedPlayer(
            new Vector(this.world.width / 2, this.world.height - 150),
            60, 60, "red", 3, lobbyPlayerMotion
        );

        // Player sprite (shared asset, relative to index.html)
        this.player.setSprite("assets/gracias.png", new Rect(0, 0, 143, 145));
        this.player.setSpeed(LOBBY_PLAYER_SPEED);

        this.actors = [];

        // Collision zones (buildings, large trees)
        this.colliders = [
            new Rect(650,  700,  400, 350),
            new Rect(900,  400,  320, 280),
            new Rect(1400, 700,  380, 320),
            new Rect(200,  200,  80,  80),
            new Rect(400,  500,  80,  80),
            new Rect(1600, 300,  80,  80),
            new Rect(1700, 1200, 80,  80),
            new Rect(300,  1500, 80,  80),
        ];
    }

    update(deltaTime) {
        this.player.update(deltaTime, this.world);
        this.camera.follow(this.player);
    }

    drawBackground(ctx) {
        if (this.mapImage.complete && this.mapImage.naturalWidth > 0) {
            ctx.drawImage(this.mapImage, 0, 0, this.world.width, this.world.height);
        } else {
            // Fallback tiled floor while the map image loads
            const colors = ["#2d4a1e", "#3a5c27"];
            for (let y = 0; y < this.world.height; y += this.tileSize) {
                for (let x = 0; x < this.world.width; x += this.tileSize) {
                    const even = ((x / this.tileSize) + (y / this.tileSize)) % 2 === 0;
                    ctx.fillStyle = colors[even ? 0 : 1];
                    ctx.fillRect(x, y, this.tileSize, this.tileSize);
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(-this.camera.position.x, -this.camera.position.y);
        this.drawBackground(ctx);

        const allObjects = [...this.actors, this.player];
        allObjects.sort((a, b) => a.position.y - b.position.y);
        for (const obj of allObjects) {
            obj.draw(ctx);
        }
        ctx.restore();
    }

    createEventListeners() {
        this._keydownHandler = (event) => {
            if (!lobbyActive) return;
            if (event.key in lobbyKeyMap) {
                event.preventDefault();
                const dir = lobbyKeyMap[event.key];
                if (!this.player.keys.includes(dir)) {
                    this.player.keys.push(dir);
                }
                this.player.startMovement(dir);
            }
        };

        this._keyupHandler = (event) => {
            if (!lobbyActive) return;
            if (event.key in lobbyKeyMap) {
                const dir = lobbyKeyMap[event.key];
                const idx = this.player.keys.indexOf(dir);
                if (idx !== -1) this.player.keys.splice(idx, 1);
                this.player.stopMovement(dir);
            }
        };

        window.addEventListener("keydown", this._keydownHandler);
        window.addEventListener("keyup",   this._keyupHandler);
    }

    removeEventListeners() {
        if (this._keydownHandler) {
            window.removeEventListener("keydown", this._keydownHandler);
            this._keydownHandler = null;
        }
        if (this._keyupHandler) {
            window.removeEventListener("keyup", this._keyupHandler);
            this._keyupHandler = null;
        }
    }

    getPlayerPosition() {
        return {
            x: Math.round(this.player.position.x),
            y: Math.round(this.player.position.y),
        };
    }
}


// ─── Public API ───────────────────────────────────────────────────────────────

function initLobbyScene() {
    const canvas   = document.getElementById("canvas");
    canvas.width   = LOBBY_CANVAS_W;
    canvas.height  = LOBBY_CANVAS_H;
    lobbyCtx       = canvas.getContext("2d");
    lobbyActive    = true;
    lobbyOldTime   = 0;
    lobbyGame      = new LobbyGame();
    canvas.focus();
    lobbyAnimId = requestAnimationFrame(_lobbyDrawScene);
}

function stopLobbyScene() {
    lobbyActive = false;
    if (lobbyAnimId !== null) {
        cancelAnimationFrame(lobbyAnimId);
        lobbyAnimId = null;
    }
    if (lobbyGame) {
        lobbyGame.removeEventListeners();
        lobbyGame = null;
    }
    lobbyCtx = null;
}


// ─── Internal render loop ─────────────────────────────────────────────────────

function _lobbyDrawScene(newTime) {
    if (!lobbyActive) return;

    if (!lobbyOldTime) lobbyOldTime = newTime;
    const deltaTime = newTime - lobbyOldTime;

    lobbyCtx.clearRect(0, 0, LOBBY_CANVAS_W, LOBBY_CANVAS_H);
    lobbyGame.update(deltaTime);
    lobbyGame.draw(lobbyCtx);

    lobbyOldTime = newTime;

    _updateLobbyHUD();

    lobbyAnimId = requestAnimationFrame(_lobbyDrawScene);
}

function _updateLobbyHUD() {
    if (!lobbyGame) return;
    const pos = lobbyGame.getPlayerPosition();
    const el  = document.getElementById("hudPosition");
    if (el) el.textContent = `Posición: (${pos.x}, ${pos.y})`;
}

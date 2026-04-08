/*
 * API integration tests
 *
 * Endless Nightmare Ritual API
 *
 * These tests mock the database pool so no real MySQL instance is needed.
 * Run with:  npm test
 */

"use strict";

process.env.JWT_SECRET = "test_secret";
process.env.PORT = "0"; // Use random port so tests don't conflict

// Mock the database pool before loading the app
jest.mock("../config/db", () => {
    const mockQuery = jest.fn();
    return { query: mockQuery };
});

const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../server");
const pool = require("../config/db");

// Helper – generate a valid token for player_id 1
function makeToken(player_id = 1, player_name = "TestPlayer") {
    return jwt.sign({ player_id, player_name }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// ─── Health check ────────────────────────────────────────────────────────────

describe("GET /api/health", () => {
    it("returns 200 with status ok", async () => {
        const res = await request(app).get("/api/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });
});

// ─── Auth – register ─────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
    beforeEach(() => pool.query.mockReset());

    it("returns 400 when body is missing", async () => {
        const res = await request(app).post("/api/auth/register").send({});
        expect(res.status).toBe(400);
    });

    it("returns 409 when player_name is taken", async () => {
        pool.query.mockResolvedValueOnce([[{ Player_id: 1 }]]);
        const res = await request(app)
            .post("/api/auth/register")
            .send({ player_name: "existing", password: "pass123" });
        expect(res.status).toBe(409);
    });

    it("returns 201 and a JWT on success", async () => {
        pool.query
            .mockResolvedValueOnce([[]])             // name check → not taken
            .mockResolvedValueOnce([{ insertId: 2 }]); // INSERT
        const res = await request(app)
            .post("/api/auth/register")
            .send({ player_name: "NewPlayer", password: "secret" });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("token");
        expect(res.body.player_id).toBe(2);
    });
});

// ─── Auth – login ────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
    beforeEach(() => pool.query.mockReset());

    it("returns 400 when body is missing", async () => {
        const res = await request(app).post("/api/auth/login").send({});
        expect(res.status).toBe(400);
    });

    it("returns 401 when player does not exist", async () => {
        pool.query.mockResolvedValueOnce([[]]); // no rows
        const res = await request(app)
            .post("/api/auth/login")
            .send({ player_name: "ghost", password: "x" });
        expect(res.status).toBe(401);
    });

    it("returns 401 on wrong password", async () => {
        const hash = await bcrypt.hash("correct", 10);
        pool.query.mockResolvedValueOnce([[{ Player_id: 1, Player_name: "p", password_hash: hash }]]);
        const res = await request(app)
            .post("/api/auth/login")
            .send({ player_name: "p", password: "wrong" });
        expect(res.status).toBe(401);
    });

    it("returns 200 and a JWT on success", async () => {
        const hash = await bcrypt.hash("correct", 10);
        pool.query.mockResolvedValueOnce([[{ Player_id: 1, Player_name: "p", password_hash: hash }]]);
        const res = await request(app)
            .post("/api/auth/login")
            .send({ player_name: "p", password: "correct" });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
    });
});

// ─── Players ─────────────────────────────────────────────────────────────────

describe("GET /api/players/:id", () => {
    beforeEach(() => pool.query.mockReset());

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/players/1");
        expect(res.status).toBe(401);
    });

    it("returns 404 when player not found", async () => {
        pool.query.mockResolvedValueOnce([[]]); // no rows
        const res = await request(app)
            .get("/api/players/99")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.status).toBe(404);
    });

    it("returns player data when found", async () => {
        pool.query.mockResolvedValueOnce([[
            { Player_id: 1, Player_name: "p", Blood_max: 100, Blood_current: 80 }
        ]]);
        const res = await request(app)
            .get("/api/players/1")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.status).toBe(200);
        expect(res.body.Player_name).toBe("p");
    });
});

describe("PUT /api/players/:id", () => {
    beforeEach(() => pool.query.mockReset());

    it("returns 403 when updating another player", async () => {
        const res = await request(app)
            .put("/api/players/99")
            .set("Authorization", `Bearer ${makeToken(1)}`)
            .send({ blood_current: 50 });
        expect(res.status).toBe(403);
    });

    it("returns 400 when no fields provided", async () => {
        const res = await request(app)
            .put("/api/players/1")
            .set("Authorization", `Bearer ${makeToken(1)}`)
            .send({});
        expect(res.status).toBe(400);
    });

    it("updates player and returns updated data", async () => {
        pool.query
            .mockResolvedValueOnce([{}]) // UPDATE
            .mockResolvedValueOnce([[
                { Player_id: 1, Player_name: "p", Blood_max: 100, Blood_current: 50 }
            ]]);
        const res = await request(app)
            .put("/api/players/1")
            .set("Authorization", `Bearer ${makeToken(1)}`)
            .send({ blood_current: 50 });
        expect(res.status).toBe(200);
        expect(res.body.Blood_current).toBe(50);
    });
});

// ─── Cards ───────────────────────────────────────────────────────────────────

describe("GET /api/cards", () => {
    beforeEach(() => pool.query.mockReset());

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/cards");
        expect(res.status).toBe(401);
    });

    it("returns array of cards", async () => {
        pool.query.mockResolvedValueOnce([[
            { Card_id: 1, Card_name: "Fireball", Card_type: "attack", Blood_cost: 2, Damage: 5, Description: "", Card_tier: "common", HP: 0 }
        ]]);
        const res = await request(app)
            .get("/api/cards")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].Card_name).toBe("Fireball");
    });
});

// ─── Runs ────────────────────────────────────────────────────────────────────

describe("POST /api/runs", () => {
    beforeEach(() => pool.query.mockReset());

    it("returns 400 when required fields missing", async () => {
        const res = await request(app)
            .post("/api/runs")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({});
        expect(res.status).toBe(400);
    });

    it("creates run and returns 201", async () => {
        pool.query
            .mockResolvedValueOnce([{ insertId: 5 }])
            .mockResolvedValueOnce([[{ Run_id: 5, Player_id: 1, Labyrinth_id: 1, Level_id: 1, Blood_recovered: 0, Cards_found: 0, Secrets_found: 0, Completed: false, Time_taken: 0 }]]);
        const res = await request(app)
            .post("/api/runs")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ labyrinth_id: 1, level_id: 1 });
        expect(res.status).toBe(201);
        expect(res.body.Run_id).toBe(5);
    });
});

// ─── Combat ──────────────────────────────────────────────────────────────────

describe("POST /api/combat", () => {
    beforeEach(() => pool.query.mockReset());

    it("returns 400 when required fields missing", async () => {
        const res = await request(app)
            .post("/api/combat")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({});
        expect(res.status).toBe(400);
    });

    it("creates combat and returns 201", async () => {
        pool.query
            .mockResolvedValueOnce([{ insertId: 10 }])
            .mockResolvedValueOnce([[{ Combat_id: 10, Player_id: 1, Enemy_id: 2, Run_id: 5, Level_id: 1, Result: "in_progress", Blood_used: 0, Player_lives: 3, Enemy_lives: 3 }]]);
        const res = await request(app)
            .post("/api/combat")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ enemy_id: 2, run_id: 5, level_id: 1 });
        expect(res.status).toBe(201);
        expect(res.body.Result).toBe("in_progress");
    });
});

/*
 * Combat routes
 *
 * GET  /api/combat             – list all combats for the authenticated player
 * GET  /api/combat/:id         – get a single combat record
 * POST /api/combat             – create a new combat record
 * PUT  /api/combat/:id         – update combat result
 *
 * Endless Nightmare Ritual API
 */

"use strict";

const express = require("express");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/combat
router.get("/", authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT Combat_id, Player_id, Enemy_id, Run_id, Level_id,
                    Result, Blood_used, Player_lives, Enemy_lives
             FROM Combat WHERE Player_id = ?`,
            [req.player.player_id]
        );
        return res.json(rows);
    } catch (err) {
        console.error("list combat error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/combat/:id
router.get("/:id", authenticate, async (req, res) => {
    const combatId = parseInt(req.params.id);
    if (isNaN(combatId)) {
        return res.status(400).json({ error: "Invalid combat id" });
    }

    try {
        const [rows] = await pool.query(
            `SELECT Combat_id, Player_id, Enemy_id, Run_id, Level_id,
                    Result, Blood_used, Player_lives, Enemy_lives
             FROM Combat WHERE Combat_id = ? AND Player_id = ?`,
            [combatId, req.player.player_id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Combat not found" });
        }
        return res.json(rows[0]);
    } catch (err) {
        console.error("get combat error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/combat
router.post("/", authenticate, async (req, res) => {
    const { enemy_id, run_id, level_id } = req.body;

    if (!enemy_id || !run_id || !level_id) {
        return res.status(400).json({ error: "enemy_id, run_id and level_id are required" });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO Combat
                (Player_id, Enemy_id, Run_id, Level_id, Result, Blood_used, Player_lives, Enemy_lives)
             VALUES (?, ?, ?, ?, 'in_progress', 0, 3, 3)`,
            [req.player.player_id, enemy_id, run_id, level_id]
        );

        const [rows] = await pool.query(
            "SELECT * FROM Combat WHERE Combat_id = ?",
            [result.insertId]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error("create combat error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/combat/:id
router.put("/:id", authenticate, async (req, res) => {
    const combatId = parseInt(req.params.id);
    if (isNaN(combatId)) {
        return res.status(400).json({ error: "Invalid combat id" });
    }

    // Verify ownership
    const [existing] = await pool.query(
        "SELECT Player_id FROM Combat WHERE Combat_id = ?",
        [combatId]
    );
    if (existing.length === 0) {
        return res.status(404).json({ error: "Combat not found" });
    }
    if (existing[0].Player_id !== req.player.player_id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const { result, blood_used, player_lives, enemy_lives } = req.body;
    const fields = [];
    const values = [];

    if (result !== undefined) { fields.push("Result = ?"); values.push(result); }
    if (blood_used !== undefined) { fields.push("Blood_used = ?"); values.push(blood_used); }
    if (player_lives !== undefined) { fields.push("Player_lives = ?"); values.push(player_lives); }
    if (enemy_lives !== undefined) { fields.push("Enemy_lives = ?"); values.push(enemy_lives); }

    if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
    }

    try {
        values.push(combatId);
        await pool.query(`UPDATE Combat SET ${fields.join(", ")} WHERE Combat_id = ?`, values);

        const [rows] = await pool.query("SELECT * FROM Combat WHERE Combat_id = ?", [combatId]);
        return res.json(rows[0]);
    } catch (err) {
        console.error("update combat error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

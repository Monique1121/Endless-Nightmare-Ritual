/*
 * Runs routes
 *
 * GET  /api/runs               – list all runs for the authenticated player
 * GET  /api/runs/:id           – get a single run
 * POST /api/runs               – create a new run
 * PUT  /api/runs/:id           – update run data (e.g. mark completed)
 *
 * Endless Nightmare Ritual API
 */

"use strict";

const express = require("express");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/runs
router.get("/", authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT Run_id, Player_id, Labyrinth_id, Level_id,
                    Blood_recovered, Cards_found, Secrets_found, Completed, Time_taken
             FROM Run WHERE Player_id = ?`,
            [req.player.player_id]
        );
        return res.json(rows);
    } catch (err) {
        console.error("list runs error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/runs/:id
router.get("/:id", authenticate, async (req, res) => {
    const runId = parseInt(req.params.id);
    if (isNaN(runId)) {
        return res.status(400).json({ error: "Invalid run id" });
    }

    try {
        const [rows] = await pool.query(
            `SELECT Run_id, Player_id, Labyrinth_id, Level_id,
                    Blood_recovered, Cards_found, Secrets_found, Completed, Time_taken
             FROM Run WHERE Run_id = ? AND Player_id = ?`,
            [runId, req.player.player_id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Run not found" });
        }
        return res.json(rows[0]);
    } catch (err) {
        console.error("get run error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/runs
router.post("/", authenticate, async (req, res) => {
    const { labyrinth_id, level_id } = req.body;

    if (!labyrinth_id || !level_id) {
        return res.status(400).json({ error: "labyrinth_id and level_id are required" });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO Run
                (Player_id, Labyrinth_id, Level_id, Blood_recovered, Cards_found, Secrets_found, Completed, Time_taken)
             VALUES (?, ?, ?, 0, 0, 0, FALSE, 0)`,
            [req.player.player_id, labyrinth_id, level_id]
        );

        const [rows] = await pool.query(
            "SELECT * FROM Run WHERE Run_id = ?",
            [result.insertId]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error("create run error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/runs/:id
router.put("/:id", authenticate, async (req, res) => {
    const runId = parseInt(req.params.id);
    if (isNaN(runId)) {
        return res.status(400).json({ error: "Invalid run id" });
    }

    // Verify ownership
    const [existing] = await pool.query(
        "SELECT Player_id FROM Run WHERE Run_id = ?",
        [runId]
    );
    if (existing.length === 0) {
        return res.status(404).json({ error: "Run not found" });
    }
    if (existing[0].Player_id !== req.player.player_id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const { blood_recovered, cards_found, secrets_found, completed, time_taken } = req.body;
    const fields = [];
    const values = [];

    if (blood_recovered !== undefined) { fields.push("Blood_recovered = ?"); values.push(blood_recovered); }
    if (cards_found !== undefined) { fields.push("Cards_found = ?"); values.push(cards_found); }
    if (secrets_found !== undefined) { fields.push("Secrets_found = ?"); values.push(secrets_found); }
    if (completed !== undefined) { fields.push("Completed = ?"); values.push(completed); }
    if (time_taken !== undefined) { fields.push("Time_taken = ?"); values.push(time_taken); }

    if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
    }

    try {
        values.push(runId);
        await pool.query(`UPDATE Run SET ${fields.join(", ")} WHERE Run_id = ?`, values);

        const [rows] = await pool.query("SELECT * FROM Run WHERE Run_id = ?", [runId]);
        return res.json(rows[0]);
    } catch (err) {
        console.error("update run error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

/*
 * Players routes
 *
 * GET    /api/players/:id        – get player profile
 * PUT    /api/players/:id        – update player profile (owner only)
 * DELETE /api/players/:id        – delete player (owner only)
 *
 * Endless Nightmare Ritual API
 */

"use strict";

const express = require("express");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/players/:id
router.get("/:id", authenticate, async (req, res) => {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
        return res.status(400).json({ error: "Invalid player id" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT Player_id, Player_name, Blood_max, Blood_current FROM Player WHERE Player_id = ?",
            [playerId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Player not found" });
        }
        return res.json(rows[0]);
    } catch (err) {
        console.error("get player error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/players/:id
router.put("/:id", authenticate, async (req, res) => {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
        return res.status(400).json({ error: "Invalid player id" });
    }

    // Only the owner can update their profile
    if (req.player.player_id !== playerId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const { blood_max, blood_current } = req.body;

    if (blood_max === undefined && blood_current === undefined) {
        return res.status(400).json({ error: "No fields to update" });
    }

    try {
        const fields = [];
        const values = [];
        if (blood_max !== undefined) { fields.push("Blood_max = ?"); values.push(blood_max); }
        if (blood_current !== undefined) { fields.push("Blood_current = ?"); values.push(blood_current); }
        values.push(playerId);

        await pool.query(
            `UPDATE Player SET ${fields.join(", ")} WHERE Player_id = ?`,
            values
        );

        const [rows] = await pool.query(
            "SELECT Player_id, Player_name, Blood_max, Blood_current FROM Player WHERE Player_id = ?",
            [playerId]
        );
        return res.json(rows[0]);
    } catch (err) {
        console.error("update player error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /api/players/:id
router.delete("/:id", authenticate, async (req, res) => {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
        return res.status(400).json({ error: "Invalid player id" });
    }

    if (req.player.player_id !== playerId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const [result] = await pool.query(
            "DELETE FROM Player WHERE Player_id = ?",
            [playerId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Player not found" });
        }
        return res.json({ message: "Player deleted" });
    } catch (err) {
        console.error("delete player error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

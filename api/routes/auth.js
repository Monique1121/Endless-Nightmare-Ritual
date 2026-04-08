/*
 * Auth routes – register and login
 *
 * POST /api/auth/register  – create a new player account
 * POST /api/auth/login     – authenticate and receive a JWT
 *
 * Endless Nightmare Ritual API
 */

"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post("/register", async (req, res) => {
    const { player_name, password } = req.body;

    if (!player_name || !password) {
        return res.status(400).json({ error: "player_name and password are required" });
    }

    try {
        // Check if player_name already exists
        const [rows] = await pool.query(
            "SELECT Player_id FROM Player WHERE Player_name = ?",
            [player_name]
        );
        if (rows.length > 0) {
            return res.status(409).json({ error: "Player name already taken" });
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        const [result] = await pool.query(
            "INSERT INTO Player (Player_name, Blood_max, Blood_current, password_hash) VALUES (?, 100, 100, ?)",
            [player_name, password_hash]
        );

        const token = jwt.sign(
            { player_id: result.insertId, player_name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        return res.status(201).json({ player_id: result.insertId, player_name, token });
    } catch (err) {
        console.error("register error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { player_name, password } = req.body;

    if (!player_name || !password) {
        return res.status(400).json({ error: "player_name and password are required" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT Player_id, Player_name, password_hash FROM Player WHERE Player_name = ?",
            [player_name]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const player = rows[0];
        const match = await bcrypt.compare(password, player.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { player_id: player.Player_id, player_name: player.Player_name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        return res.json({ player_id: player.Player_id, player_name: player.Player_name, token });
    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

/*
 * Levels routes
 *
 * GET /api/levels           – list all levels
 * GET /api/levels/:id       – get a single level
 *
 * Endless Nightmare Ritual API
 */

"use strict";

const express = require("express");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/levels
router.get("/", authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT Level_id, Level_name FROM Levels");
        return res.json(rows);
    } catch (err) {
        console.error("list levels error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/levels/:id
router.get("/:id", authenticate, async (req, res) => {
    const levelId = parseInt(req.params.id);
    if (isNaN(levelId)) {
        return res.status(400).json({ error: "Invalid level id" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT Level_id, Level_name FROM Levels WHERE Level_id = ?",
            [levelId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Level not found" });
        }
        return res.json(rows[0]);
    } catch (err) {
        console.error("get level error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

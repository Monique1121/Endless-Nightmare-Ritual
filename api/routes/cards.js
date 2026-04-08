/*
 * Cards routes
 *
 * GET /api/cards           – list all cards
 * GET /api/cards/:id       – get a single card
 *
 * Endless Nightmare Ritual API
 */

"use strict";

const express = require("express");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/cards
router.get("/", authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT Card_id, Card_name, Card_type, Blood_cost, Damage, Description, Card_tier, HP FROM Cards"
        );
        return res.json(rows);
    } catch (err) {
        console.error("list cards error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/cards/:id
router.get("/:id", authenticate, async (req, res) => {
    const cardId = parseInt(req.params.id);
    if (isNaN(cardId)) {
        return res.status(400).json({ error: "Invalid card id" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT Card_id, Card_name, Card_type, Blood_cost, Damage, Description, Card_tier, HP FROM Cards WHERE Card_id = ?",
            [cardId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: "Card not found" });
        }
        return res.json(rows[0]);
    } catch (err) {
        console.error("get card error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;

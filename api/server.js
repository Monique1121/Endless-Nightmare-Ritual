/*
 * Main server entry point
 *
 * Endless Nightmare Ritual API
 *
 * Start with:  node server.js
 * Dev mode:    npm run dev
 */

"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const playerRoutes = require("./routes/players");
const cardRoutes = require("./routes/cards");
const levelRoutes = require("./routes/levels");
const runRoutes = require("./routes/runs");
const combatRoutes = require("./routes/combat");

const app = express();

// Security headers
app.use(helmet());

// CORS – allow requests from the game / web frontend origins.
// Set ALLOWED_ORIGINS to a comma-separated list of origins in your .env file.
// In development mode a set of localhost defaults is used when the variable is absent.
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const DEV_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",   // VS Code Live Server default
    "http://127.0.0.1:5500",
];

const allowedOrigins =
    configuredOrigins.length > 0
        ? configuredOrigins
        : process.env.NODE_ENV !== "production"
            ? DEV_ORIGINS
            : [];

app.use(
    cors({
        origin: (origin, cb) => {
            // Allow same-origin requests (no Origin header) and whitelisted origins
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            cb(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Rate limiting – 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parser
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/runs", runRoutes);
app.use("/api/combat", combatRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

const PORT = parseInt(process.env.PORT) || 3000;

// Only start listening if this file is run directly (not imported in tests)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Endless Nightmare Ritual API running on port ${PORT}`);
    });
}

module.exports = app;

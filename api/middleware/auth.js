/*
 * JWT authentication middleware
 *
 * Endless Nightmare Ritual API
 */

"use strict";

const jwt = require("jsonwebtoken");

/**
 * Verify the Bearer JWT token sent in the Authorization header.
 * Attaches `req.player` with the decoded payload on success.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.player = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

module.exports = { authenticate };

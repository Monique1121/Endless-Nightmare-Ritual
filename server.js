/**
 * Endless Nightmare Ritual - Local Development Server
 *
 * Serves all static files from the project root so the game
 * can be accessed at http://localhost:3000
 *
 * Usage:
 *   node server.js            (default port 3000)
 *   PORT=8080 node server.js  (custom port)
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".xml": "application/xml",
    ".txt": "text/plain",
};

const server = http.createServer((req, res) => {
    // Sanitise the URL to prevent directory traversal
    let urlPath = req.url.split("?")[0];
    urlPath = decodeURIComponent(urlPath);
    urlPath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");

    let filePath = path.join(ROOT, urlPath);

    // Redirect bare root to the main menu
    if (urlPath === "/" || urlPath === "") {
        res.writeHead(302, { Location: "/PrototipoV1/menu.html" });
        res.end();
        return;
    }

    // Guard against path traversal (including via symlinks)
    if (!path.resolve(filePath).startsWith(path.resolve(ROOT))) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("403 Forbidden");
        return;
    }

    // If the path is a directory, look for index.html inside it
    fs.stat(filePath, (statErr, stats) => {
        if (!statErr && stats.isDirectory()) {
            filePath = path.join(filePath, "index.html");
        }
        serveFile(filePath, res);
    });
});

function serveFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
            res.end(
                `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>404 - No encontrado</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem;background:#0a0308;color:#ffdede">
  <h1>404 - Página no encontrada</h1>
  <p><a href="/PrototipoV1/menu.html" style="color:#d24444">Volver al menú principal</a></p>
</body>
</html>`
            );
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

server.listen(PORT, () => {
    console.log("=========================================");
    console.log("  🎮 Endless Nightmare Ritual - Server");
    console.log("=========================================");
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Menu:    http://localhost:${PORT}/PrototipoV1/menu.html`);
    console.log("  Press Ctrl+C to stop the server");
    console.log("=========================================");
});

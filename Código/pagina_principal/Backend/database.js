import mysql from 'mysql2/promise';

// Este archivo solo deja la conexion lista para la parte web si luego se separa backend.
// Configuración de la conexión a MySQL
export const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'C4rl1t0s2023',
    database: process.env.DB_NAME || 'endless',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10)
});


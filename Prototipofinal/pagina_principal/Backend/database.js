import mysql from 'mysql2/promise';

// Este archivo solo deja la conexion lista para la parte web si luego se separa backend.
// Configuración de la conexión a MySQL
export const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'your password here ', 
    database: 'your database name here',
    port: 3306 
});


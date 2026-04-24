import mysql from 'mysql2/promise';

// Configuración de la conexión a MySQL
export const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'your password here ', 
    database: 'your database name here',
    port: 3306 
});


import mysql from 'mysql2/promise';

// Configuración de la conexión a MySQL
export const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'C4rl1t0s2023', 
    database: 'manga_cafe',
    port: 3306 
});

// Función para obtener todos los mangas
export async function getMangas() {
    const [rows] = await pool.query("SELECT * FROM mangas");
    return rows;
}

// Función para obtener el menú de un día específico
export async function getMenuByDay(day) {
    const [rows] = await pool.query(
        "SELECT * FROM menu WHERE day = ?", [day]
    );
    return rows;
}
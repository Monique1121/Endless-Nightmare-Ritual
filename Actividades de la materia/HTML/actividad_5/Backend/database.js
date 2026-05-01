import mysql from 'mysql2/promise';

// Configuración de la conexión a MySQL
export const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'nctdream123', 
    database: 'manga_cafe',
    port: '3305' 
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
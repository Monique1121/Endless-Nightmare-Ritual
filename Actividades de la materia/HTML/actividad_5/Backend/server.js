import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMangas, getMenuByDay } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
// Ruta dinámica que funciona en cualquier computadora
app.use(express.static(path.join(__dirname, '..')));

// Endpoint 1: mangas
app.get('/mangas', async (req, res) => {
    try {
        const mangas = await getMangas();
        res.send(mangas);
    } catch (error) {
        console.error('Error al obtener mangas:', error);
        res.status(500).send({ error: 'Error al obtener mangas' });
    }
});

// Endpoint 2: menu por dia
app.get('/menu/:day', async (req, res) => {
    try {
        const day = req.params.day;
        const items = await getMenuByDay(day);
        res.send(items);
    } catch (error) {
        console.error('Error al obtener menú:', error);
        res.status(500).send({ error: 'Error al obtener menú' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://127.0.0.1:${port}`);
});
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'C4rl1t0s2023',
    database: 'endless'
};
const pool = mysql.createPool(dbConfig);
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username y password son requeridos' 
        });
    }

    try {
        const [existing] = await pool.query(
            'SELECT User_id FROM Users WHERE Username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'El usuario ya existe' 
            });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        const [result] = await pool.query(
            'INSERT INTO Users (Username, Password_hash) VALUES (?, ?)',
            [username, passwordHash]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Usuario registrado exitosamente',
            userId: result.insertId 
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username y password son requeridos' 
        });
    }

    try {
        // Buscar usuario
        const [users] = await pool.query(
            'SELECT User_id, Username, Password_hash, Is_active FROM Users WHERE Username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario o contraseña incorrectos' 
            });
        }

        const user = users[0];
        if (!user.Is_active) {
            return res.status(403).json({ 
                success: false, 
                message: 'Usuario desactivado' 
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.Password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario o contraseña incorrectos' 
            });
        }
        await pool.query(
            'UPDATE Users SET Last_login = CURRENT_TIMESTAMP WHERE User_id = ?',
            [user.User_id]
        );

        res.json({ 
            success: true, 
            message: 'Login exitoso',
            userId: user.User_id,
            username: user.Username
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.post('/api/player/create', async (req, res) => {
    const { userId, playerName } = req.body;

    if (!userId || !playerName) {
        return res.status(400).json({ 
            success: false, 
            message: 'userId y playerName son requeridos' 
        });
    }

    try {
        // Verificar que el usuario existe
        const [users] = await pool.query(
            'SELECT User_id FROM Users WHERE User_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        const [result] = await pool.query(
            'INSERT INTO Player (User_id, Player_name) VALUES (?, ?)',
            [userId, playerName]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Jugador creado exitosamente',
            playerId: result.insertId 
        });

    } catch (error) {
        console.error('Error al crear jugador:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.get('/api/player/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [players] = await pool.query(
            `SELECT p.*, u.Username 
             FROM Player p 
             JOIN Users u ON p.User_id = u.User_id 
             WHERE p.User_id = ?`,
            [userId]
        );

        if (players.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Jugador no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            player: players[0] 
        });

    } catch (error) {
        console.error('Error al obtener jugador:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.get('/api/player/:playerId/stats', async (req, res) => {
    const { playerId } = req.params;

    try {
        const [stats] = await pool.query(
            `SELECT 
                Player_name,
                Level,
                Blood_current,
                Blood_max,
                Secrets_discovered,
                Total_playtime,
                Achievments_unlocked,
                Escuela_unlocked,
                Hospital_unlocked,
                Laboratorio_unlocked
             FROM Player 
             WHERE Player_id = ?`,
            [playerId]
        );

        if (stats.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Jugador no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            stats: stats[0] 
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.get('/api/player/:playerId/inventory', async (req, res) => {
    const { playerId } = req.params;

    try {
        const [cards] = await pool.query(
            `SELECT d.Deck_id, d.Card_id, c.Card_name, c.Blood_cost, c.Damage, c.HP 
             FROM Deck d 
             JOIN Cards c ON d.Card_id = c.Card_id 
             WHERE d.Player_id = ?`,
            [playerId]
        );
        const [player] = await pool.query(
            `SELECT Blood_current, Blood_max, Secrets_discovered, Level
             FROM Player 
             WHERE Player_id = ?`,
            [playerId]
        );

        if (player.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Jugador no encontrado' 
            });
        }

        // Por ahora los secretos no están en la BD, retornar vacío
        // Cuando se implemente tabla Player_Secrets, cargarlos aquí
        
        res.json({ 
            success: true,
            inventory: {
                blood_current: player[0].Blood_current,
                blood_max: player[0].Blood_max,
                level: player[0].Level,
                cards: cards,
                secrets_count: player[0].Secrets_discovered
            }
        });

    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Sincronizar estado del jugador
app.put('/api/player/:playerId/sync', async (req, res) => {
    const { playerId } = req.params;
    const { blood_current, secrets_discovered } = req.body;

    try {
        await pool.query(
            `UPDATE Player 
             SET Blood_current = ?,
                 Secrets_discovered = ?,
                 Last_update = CURRENT_TIMESTAMP
             WHERE Player_id = ?`,
            [blood_current, secrets_discovered, playerId]
        );

        res.json({ 
            success: true, 
            message: 'Estado sincronizado correctamente'
        });

    } catch (error) {
        console.error('Error al sincronizar estado:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.get('/api/cards', async (req, res) => {
    try {
        const [cards] = await pool.query('SELECT * FROM Cards');
        
        res.json({ 
            success: true, 
            cards: cards 
        });

    } catch (error) {
        console.error('Error al obtener cartas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.get('/api/player/:playerId/deck', async (req, res) => {
    const { playerId } = req.params;

    try {
        const [deck] = await pool.query(
            `SELECT d.*, c.Card_name, c.Blood_cost, c.Damage, c.HP 
             FROM Deck d 
             JOIN Cards c ON d.Card_id = c.Card_id 
             WHERE d.Player_id = ?`,
            [playerId]
        );

        res.json({ 
            success: true, 
            deck: deck 
        });

    } catch (error) {
        console.error('Error al obtener deck:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.get('/api/labyrinth/:labyrinthId/chests', async (req, res) => {
    const { labyrinthId } = req.params;

    try {
        const [chests] = await pool.query(
            `SELECT * FROM Chest WHERE Labyrinth_id = ?`,
            [labyrinthId]
        );

        res.json({ 
            success: true, 
            chests: chests 
        });

    } catch (error) {
        console.error('Error al obtener cofres:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.get('/api/player/:playerId/chests/opened', async (req, res) => {
    const { playerId } = req.params;

    try {
        const [openedChests] = await pool.query(
            `SELECT Chest_id FROM Player_Chest_Opened WHERE Player_id = ?`,
            [playerId]
        );

        res.json({ 
            success: true, 
            openedChests: openedChests.map(c => c.Chest_id)
        });

    } catch (error) {
        console.error('Error al obtener cofres abiertos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.post('/api/player/:playerId/chest/:chestId/open', async (req, res) => {
    const { playerId, chestId } = req.params;
    const { runId } = req.body;

    try {
        // Insertar registro (ignorar si ya existe)
        await pool.query(
            `INSERT IGNORE INTO Player_Chest_Opened (Player_id, Chest_id, Run_id) 
             VALUES (?, ?, ?)`,
            [playerId, chestId, runId || null]
        );

        res.json({ 
            success: true, 
            message: 'Cofre marcado como abierto'
        });

    } catch (error) {
        console.error('Error al marcar cofre como abierto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
app.get('/api/player/:playerId/item/:itemName', async (req, res) => {
    const { playerId, itemName } = req.params;

    try {
        const [items] = await pool.query(
            `SELECT * FROM Player_Items 
             WHERE Player_id = ? AND Item_name = ? AND Is_active = TRUE`,
            [playerId, itemName]
        );

        res.json({ 
            success: true, 
            hasItem: items.length > 0,
            item: items[0] || null
        });

    } catch (error) {
        console.error('Error al verificar item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Dar item al jugador (como la máscara de luz)
app.post('/api/player/:playerId/item/:itemName/give', async (req, res) => {
    const { playerId, itemName } = req.params;

    try {
        await pool.query(
            `INSERT IGNORE INTO Player_Items (Player_id, Item_name) 
             VALUES (?, ?)`,
            [playerId, itemName]
        );

        res.json({ 
            success: true, 
            message: `Item ${itemName} entregado`
        });

    } catch (error) {
        console.error('Error al dar item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Top jugadores por cartas obtenidas
app.get('/api/leaderboard/cards', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;

    try {
        const [players] = await pool.query(
            `SELECT p.Player_id, p.Player_name, COUNT(d.Card_id) as Total_cards
             FROM Player p
             LEFT JOIN Deck d ON p.Player_id = d.Player_id
             GROUP BY p.Player_id, p.Player_name
             ORDER BY Total_cards DESC
             LIMIT ?`,
            [limit]
        );

        res.json(players);

    } catch (error) {
        console.error('Error al obtener ranking de cartas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Top jugadores por secretos descubiertos
app.get('/api/leaderboard/secrets', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;

    try {
        const [players] = await pool.query(
            `SELECT Player_id, Player_name, Secrets_discovered as Total_secrets
             FROM Player
             ORDER BY Secrets_discovered DESC
             LIMIT ?`,
            [limit]
        );

        res.json(players);

    } catch (error) {
        console.error('Error al obtener ranking de secretos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Top jugadores por tiempo de juego
app.get('/api/leaderboard/playtime', async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;

    try {
        const [players] = await pool.query(
            `SELECT Player_id, Player_name, Total_playtime
             FROM Player
             ORDER BY Total_playtime DESC
             LIMIT ?`,
            [limit]
        );

        res.json(players);

    } catch (error) {
        console.error('Error al obtener ranking de tiempo:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});
// ENDPOINT DE PRUEBA

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});
// INICIAR SERVIDOR

app.listen(PORT, () => {
    console.log(`Servidor API corriendo en http://localhost:${PORT}`);
    console.log(`Base de datos: ${dbConfig.database}`);
    console.log('\nEndpoints disponibles:');
    console.log('  POST   /api/register           - Registrar usuario');
    console.log('  POST   /api/login              - Login');
    console.log('  POST   /api/player/create      - Crear jugador');
    console.log('  GET    /api/player/:userId     - Info del jugador');
    console.log('  GET    /api/player/:playerId/stats - Estadísticas');
    console.log('  GET    /api/player/:playerId/inventory - Inventario completo');
    console.log('  PUT    /api/player/:playerId/sync - Sincronizar estado');
    console.log('  GET    /api/player/:playerId/deck  - Deck del jugador');
    console.log('  GET    /api/cards              - Todas las cartas');
    console.log('  GET    /api/labyrinth/:labyrinthId/chests - Cofres del laberinto');
    console.log('  GET    /api/player/:playerId/chests/opened - Cofres visitados');
    console.log('  POST   /api/player/:playerId/chest/:chestId/open - Marcar cofre visitado');
    console.log('  GET    /api/player/:playerId/item/:itemName - Verificar item');
    console.log('  POST   /api/player/:playerId/item/:itemName/give - Dar item');
    console.log('  GET    /api/leaderboard/cards  - Top jugadores por cartas');
    console.log('  GET    /api/leaderboard/secrets - Top jugadores por secretos');
    console.log('  GET    /api/leaderboard/playtime - Top jugadores por tiempo');
    console.log('  GET    /api/test               - Test de conexión');
});

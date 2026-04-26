const express = require('express');
const mysql = require('mysql2/promise');
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
    password: 'nctdream123',
    database: 'endless',
    port: '3305'
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


    const [result] = await pool.query(
    'INSERT INTO Users (Username, Password_user, Is_active) VALUES (?, ?, TRUE)',
    [username, password]
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
            'SELECT User_id, Username, Password_user, Is_active FROM Users WHERE Username = ?',
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
        if (password !== user.Password_user) {
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
                Achievements_unlocked,
                School_unlocked,
                Hospital_unlocked,
                Laboratory_unlocked
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

app.post('/api/player/:playerId/secret/:secretId/discover', async (req, res) => {
    const { playerId, secretId } = req.params;
    try {
        await pool.query(
            `INSERT IGNORE INTO Player_Secrets (Player_id, Secret_id) VALUES (?, ?)`,
            [playerId, secretId]
        );
        await pool.query(
            `UPDATE Player SET Secrets_discovered = Secrets_discovered + 1 WHERE Player_id = ?`,
            [playerId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/player/:playerId/cards/available', async (req, res) => {
    const { playerId } = req.params;
    try {
        const [cards] = await pool.query(
            `SELECT * FROM Cards 
             WHERE Card_id NOT IN (
                 SELECT Card_id FROM Deck WHERE Player_id = ?
             )`,
            [playerId]
        );
        res.json({ success: true, cards });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
            `SELECT d.*, c.Card_name, c.Blood_cost, c.Damage, c.HP, c.Sprite_path
             FROM Deck d 
             JOIN Cards c ON d.Card_id = c.Card_id 
             WHERE d.Player_id = ? AND d.Card_gained = TRUE`,
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

// Inicializar deck con 5 cartas aleatorias
app.post('/api/player/:playerId/deck/initialize', async (req, res) => {
    const { playerId } = req.params;

    try {
        // Verificar si ya tiene cartas
        const [existingCards] = await pool.query(
            `SELECT COUNT(*) as count FROM Deck WHERE Player_id = ? AND Card_gained = TRUE`,
            [playerId]
        );

        if (existingCards[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El jugador ya tiene cartas en su deck'
            });
        }

        // Obtener 5 cartas aleatorias de las primeras 15 (comunes)
        const [randomCards] = await pool.query(
            `SELECT Card_id FROM Cards WHERE Card_id <= 15 ORDER BY RAND() LIMIT 5`
        );

        // Insertar las 5 cartas en el deck
        for (const card of randomCards) {
            await pool.query(
                `INSERT INTO Deck (Card_id, Player_id, Card_gained) 
                 VALUES (?, ?, TRUE)`,
                [card.Card_id, playerId]
            );
        }

        // Obtener las cartas insertadas con sus detalles
        const [newDeck] = await pool.query(
            `SELECT d.*, c.Card_name, c.Blood_cost, c.Damage, c.HP, c.Sprite_path
             FROM Deck d 
             JOIN Cards c ON d.Card_id = c.Card_id 
             WHERE d.Player_id = ? AND d.Card_gained = TRUE`,
            [playerId]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Deck inicializado con 5 cartas',
            cards: newDeck
        });

    } catch (error) {
        console.error('Error al inicializar deck:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

app.get('/api/secrets', async (req, res) => {
    try {
        const [secrets] = await pool.query('SELECT * FROM Secrets');
        res.json({ success: true, secrets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Obtener cartas temporales de un run (aún no guardadas)
app.get('/api/run/:runId/cards/temp', async (req, res) => {
    const { runId } = req.params;

    try {
        const [tempCards] = await pool.query(
            `SELECT d.*, c.Card_name, c.Blood_cost, c.Damage, c.HP, c.Sprite_path
             FROM Deck d 
             JOIN Cards c ON d.Card_id = c.Card_id 
             WHERE d.Run_id = ? AND d.Card_gained = FALSE`,
            [runId]
        );

        res.json({ 
            success: true, 
            tempCards: tempCards
        });

    } catch (error) {
        console.error('Error al obtener cartas temporales:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Recoger carta en laberinto (temporal, no guardada aún)
app.post('/api/run/:runId/card/collect', async (req, res) => {
    const { runId } = req.params;
    const { playerId, cardId } = req.body;

    if (!playerId || !cardId) {
        return res.status(400).json({ 
            success: false, 
            message: 'playerId y cardId son requeridos' 
        });
    }

    try {
        // Verificar que el run existe y pertenece al jugador
        const [run] = await pool.query(
            `SELECT * FROM Run WHERE Run_id = ? AND Player_id = ?`,
            [runId, playerId]
        );

        if (run.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Run no encontrado' 
            });
        }

        // Insertar carta temporal (Card_gained = FALSE)
        await pool.query(
            `INSERT INTO Deck (Card_id, Player_id, Run_id, Card_gained) 
             VALUES (?, ?, ?, FALSE)`,
            [cardId, playerId, runId]
        );

        // Incrementar contador de cartas encontradas en el run
        await pool.query(
            `UPDATE Run SET Cards_found = Cards_found + 1 WHERE Run_id = ?`,
            [runId]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Carta recogida (temporal)'
        });

    } catch (error) {
        console.error('Error al recoger carta:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Completar laberinto y guardar cartas permanentemente
app.post('/api/run/:runId/complete', async (req, res) => {
    const { runId } = req.params;
    const { playerId, timeTaken } = req.body;

    if (!playerId) {
        return res.status(400).json({ 
            success: false, 
            message: 'playerId es requerido' 
        });
    }

    try {
        // Verificar que el run existe
        const [run] = await pool.query(
            `SELECT * FROM Run WHERE Run_id = ? AND Player_id = ?`,
            [runId, playerId]
        );

        if (run.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Run no encontrado' 
            });
        }

        // Marcar run como completado
        await pool.query(
            `UPDATE Run 
             SET Completed = TRUE, 
                 Time_taken = ?,
                 Completed_at = CURRENT_TIMESTAMP
             WHERE Run_id = ?`,
            [timeTaken || 0, runId]
        );

        // Guardar PERMANENTEMENTE todas las cartas temporales de este run
        const [result] = await pool.query(
            `UPDATE Deck 
             SET Card_gained = TRUE 
             WHERE Run_id = ? AND Player_id = ? AND Card_gained = FALSE`,
            [runId, playerId]
        );

        const cardsGained = result.affectedRows;

        res.json({ 
            success: true, 
            message: 'Laberinto completado',
            cardsGained: cardsGained
        });

    } catch (error) {
        console.error('Error al completar laberinto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

app.get('/api/player/:playerId/cards/available', async (req, res) => {
    const { playerId } = req.params;
    try {
        const [cards] = await pool.query(
            `SELECT * FROM Cards 
             WHERE Card_id NOT IN (
                 SELECT Card_id FROM Deck WHERE Player_id = ?
             )`,
            [playerId]
        );
        res.json({ success: true, cards });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Fallar en laberinto y perder cartas temporales
app.post('/api/run/:runId/fail', async (req, res) => {
    const { runId } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
        return res.status(400).json({ 
            success: false, 
            message: 'playerId es requerido' 
        });
    }

    try {
        // Verificar que el run existe
        const [run] = await pool.query(
            `SELECT * FROM Run WHERE Run_id = ? AND Player_id = ?`,
            [runId, playerId]
        );

        if (run.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Run no encontrado' 
            });
        }

        // Contar cuántas cartas se perderán
        const [tempCards] = await pool.query(
            `SELECT COUNT(*) as count FROM Deck 
             WHERE Run_id = ? AND Player_id = ? AND Card_gained = FALSE`,
            [runId, playerId]
        );

        const cardsLost = tempCards[0].count;

        // ELIMINAR todas las cartas temporales de este run
        await pool.query(
            `DELETE FROM Deck 
             WHERE Run_id = ? AND Player_id = ? AND Card_gained = FALSE`,
            [runId, playerId]
        );

        // Marcar run como fallido
        await pool.query(
            `UPDATE Run 
             SET Completed = FALSE,
                 Completed_at = CURRENT_TIMESTAMP
             WHERE Run_id = ?`,
            [runId]
        );

        res.json({ 
            success: true, 
            message: 'Run fallido, cartas temporales perdidas',
            cardsLost: cardsLost
        });

    } catch (error) {
        console.error('Error al fallar laberinto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// ========== GESTIÓN DE RUNS ==========

// Crear nuevo run (iniciar laberinto)
app.post('/api/run/create', async (req, res) => {
    const { playerId, labyrinthId } = req.body;

    if (!playerId || !labyrinthId) {
        return res.status(400).json({ 
            success: false, 
            message: 'playerId y labyrinthId son requeridos' 
        });
    }

    try {
        // Crear nuevo run
        const [labyrinth] = await pool.query(
            `SELECT Level_id FROM Labyrinth WHERE Labyrinth_id = ?`,
            [labyrinthId]
        );

        if (labyrinth.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Laberinto no encontrado'
            });
        }

        const levelId = labyrinth[0].Level_id;

        const [result] = await pool.query(
            `INSERT INTO Run (Player_id, Labyrinth_id, Level_id, Completed, Cards_found) 
            VALUES (?, ?, ?, NULL, 0)`,
            [playerId, labyrinthId, levelId]
        );

        res.json({ 
            success: true, 
            runId: result.insertId
        });

    } catch (error) {
        console.error('Error al crear run:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor'
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
// ==================== ENDPOINTS TCG ====================

// Obtener pool de cartas para el TCG
app.get('/api/cards/pool', async (req, res) => {
    try {
        const [cards] = await pool.query(
            `SELECT Card_id, Card_name, Blood_cost AS Cost, Damage AS Attack, HP AS Life, Sprite_path 
             FROM Cards 
             ORDER BY Blood_cost, Card_name`
        );

        res.json(cards);

    } catch (error) {
        console.error('Error al obtener pool de cartas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Obtener datos del enemigo por nivel
app.get('/api/enemy/:levelId', async (req, res) => {
    const { levelId } = req.params;

    try {
        const [enemies] = await pool.query(
            `SELECT e.*, l.Level_name, l.Level_number
             FROM Enemy e
             JOIN Levels l ON e.Level_id = l.Level_id
             WHERE e.Level_id = ?`,
            [levelId]
        );

        if (enemies.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Enemigo no encontrado' 
            });
        }

        // Obtener cartas del enemigo
        const [enemyCards] = await pool.query(
            `SELECT c.Card_id, c.Card_name, c.Blood_cost AS Cost, c.Damage AS Attack, c.HP AS Life
             FROM Enemy_Cards ec
             JOIN Cards c ON ec.Card_id = c.Card_id
             WHERE ec.Enemy_id = ?`,
            [enemies[0].Enemy_id]
        );

        res.json({ 
            success: true,
            enemy: enemies[0],
            cards: enemyCards
        });

    } catch (error) {
        console.error('Error al obtener enemigo:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Iniciar nuevo combate
app.post('/api/combat/start', async (req, res) => {
    const { player_id, enemy_id, run_id, level_id } = req.body;

    if (!player_id || !enemy_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'player_id y enemy_id son requeridos' 
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO Combat (Player_id, Enemy_id, Run_id, Level_id, Started_at) 
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [player_id, enemy_id, run_id || null, level_id || 1]
        );

        res.status(201).json({ 
            success: true,
            combat_id: result.insertId,
            message: 'Combate iniciado'
        });

    } catch (error) {
        console.error('Error al iniciar combate:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Registrar un turno
app.post('/api/combat/:combatId/turn', async (req, res) => {
    const { combatId } = req.params;
    const { turn_number, active_player, blood_spent } = req.body;

    try {
        const [result] = await pool.query(
            `INSERT INTO Combat_Turns (Combat_id, Turn_number, Active_player, Blood_spent) 
             VALUES (?, ?, ?, ?)`,
            [combatId, turn_number, active_player, blood_spent || 0]
        );

        res.status(201).json({ 
            success: true,
            turn_id: result.insertId
        });

    } catch (error) {
        console.error('Error al registrar turno:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Registrar acción de carta
app.post('/api/combat/:combatId/action', async (req, res) => {
    const { combatId } = req.params;
    const { 
        turn_id, 
        card_id, 
        action_type, 
        used_by, 
        blood_spent, 
        damage_dealt, 
        hp_before, 
        hp_after, 
        card_dead 
    } = req.body;

    try {
        const [result] = await pool.query(
            `INSERT INTO Combat_Cards_Actions 
             (Combat_id, Turn_id, Card_id, Action_type, Used_by, Blood_spent, 
              Damage_dealt, HP_before, HP_after, Card_dead) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [combatId, turn_id, card_id, action_type, used_by, blood_spent || 0, 
             damage_dealt || 0, hp_before, hp_after, card_dead || false]
        );

        res.status(201).json({ 
            success: true,
            action_id: result.insertId
        });

    } catch (error) {
        console.error('Error al registrar acción:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Finalizar combate
app.put('/api/combat/:combatId/end', async (req, res) => {
    const { combatId } = req.params;
    const { 
        winner, 
        player_id,
        blood_used, 
        total_turns, 
        player_ko, 
        enemy_ko,
        cards_gained
    } = req.body;

    try {
        const result_text = winner === 'player' ? 'Win' : 'Lose';
        
        // Actualizar combate
        await pool.query(
            `UPDATE Combat 
             SET Result = ?,
                 Blood_used = ?,
                 Total_turns = ?,
                 Player_KO = ?,
                 Enemy_KO = ?,
                 Ended_at = CURRENT_TIMESTAMP
             WHERE Combat_id = ?`,
            [result_text, blood_used || 0, total_turns || 0, 
             player_ko || 0, enemy_ko || 0, combatId]
        );

        // Si ganó, agregar cartas al deck
        if (winner === 'player' && cards_gained && cards_gained.length > 0) {
            for (const cardId of cards_gained) {
                await pool.query(
                    `INSERT INTO Deck (Card_id, Player_id, Card_gained) 
                     VALUES (?, ?, TRUE)`,
                    [cardId, player_id]
                );
            }
        }

        res.json({ 
            success: true,
            message: `Combate finalizado: ${result_text}`
        });

    } catch (error) {
        console.error('Error al finalizar combate:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Obtener historial de combates del jugador
app.get('/api/player/:playerId/combats', async (req, res) => {
    const { playerId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const [combats] = await pool.query(
            `SELECT c.*, e.Enemy_name, l.Level_name
             FROM Combat c
             JOIN Enemy e ON c.Enemy_id = e.Enemy_id
             JOIN Levels l ON c.Level_id = l.Level_id
             WHERE c.Player_id = ?
             ORDER BY c.Started_at DESC
             LIMIT ?`,
            [playerId, limit]
        );

        res.json({ 
            success: true,
            combats: combats
        });

    } catch (error) {
        console.error('Error al obtener historial de combates:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// ==================== ENDPOINTS DE PRUEBA ====================

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
    console.log('  POST   /api/player/:playerId/deck/initialize - Inicializar con 5 cartas');
    console.log('  POST   /api/run/create         - Crear nuevo run');
    console.log('  GET    /api/run/:runId/cards/temp - Cartas temporales del run');
    console.log('  POST   /api/run/:runId/card/collect - Recoger carta en laberinto');
    console.log('  POST   /api/run/:runId/complete - Completar laberinto');
    console.log('  POST   /api/run/:runId/fail     - Fallar laberinto');
    console.log('  GET    /api/cards              - Todas las cartas');
    console.log('  GET    /api/labyrinth/:labyrinthId/chests - Cofres del laberinto');
    console.log('  GET    /api/player/:playerId/chests/opened - Cofres visitados');
    console.log('  POST   /api/player/:playerId/chest/:chestId/open - Marcar cofre visitado');
    console.log('  GET    /api/player/:playerId/item/:itemName - Verificar item');
    console.log('  POST   /api/player/:playerId/item/:itemName/give - Dar item');
    console.log('  GET    /api/leaderboard/cards  - Top jugadores por cartas');
    console.log('  GET    /api/leaderboard/secrets - Top jugadores por secretos');
    console.log('  GET    /api/leaderboard/playtime - Top jugadores por tiempo');
    console.log('\n  === TCG ENDPOINTS ===');
    console.log('  GET    /api/cards/pool         - Pool de cartas para TCG');
    console.log('  GET    /api/enemy/:levelId     - Obtener enemigo por nivel');
    console.log('  POST   /api/combat/start       - Iniciar combate');
    console.log('  POST   /api/combat/:combatId/turn - Registrar turno');
    console.log('  POST   /api/combat/:combatId/action - Registrar acción');
    console.log('  PUT    /api/combat/:combatId/end - Finalizar combate');
    console.log('  GET    /api/player/:playerId/combats - Historial de combates');
    console.log('\n  GET    /api/test               - Test de conexión');
}); 

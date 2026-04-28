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
    password: 'C4rl1t0s2023',
    database: 'endless'
};

const pool = mysql.createPool(dbConfig);

// =====================================================
// ENDPOINTS DE AUTENTICACIÓN
// =====================================================

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

        const [player] = await pool.query(
            'INSERT INTO Player (Player_name, Blood_current, Blood_max) VALUES (?, 100, 100)',
            [username]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Usuario registrado exitosamente',
            user_id: result.insertId,
            player_id: player.insertId
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
        const [users] = await pool.query(
            `SELECT u.User_id, u.Username, p.Player_id 
             FROM Users u
             LEFT JOIN Player p ON u.Username = p.Player_name
             WHERE u.Username = ? AND u.Password_user = ? AND u.Is_active = TRUE`,
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales inválidas' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Login exitoso',
            user: {
                user_id: users[0].User_id,
                username: users[0].Username,
                player_id: users[0].Player_id
            }
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

// =====================================================
// ENDPOINTS DE JUGADOR
// =====================================================

app.get('/api/player/:playerId', async (req, res) => {
    const { playerId } = req.params;

    try {
        const [player] = await pool.query(
            `SELECT Player_id, Player_name, Blood_current, Blood_max,
                    School_unlocked, Hospital_unlocked, Laboratory_unlocked
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

        res.json({ 
            success: true, 
            player: player[0] 
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

app.put('/api/player/:playerId', async (req, res) => {
    const { playerId } = req.params;
    const { blood_current, school_unlocked, hospital_unlocked, laboratory_unlocked } = req.body;

    try {
        await pool.query(
            `UPDATE Player 
             SET Blood_current = ?,
                 School_unlocked = ?,
                 Hospital_unlocked = ?,
                 Laboratory_unlocked = ?
             WHERE Player_id = ?`,
            [blood_current, school_unlocked, hospital_unlocked, laboratory_unlocked, playerId]
        );

        res.json({ 
            success: true, 
            message: 'Jugador actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar jugador:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// =====================================================
// ENDPOINTS TCG - CARTAS
// =====================================================

app.get('/api/cards/pool', async (req, res) => {
    try {
        const [cards] = await pool.query(
            `SELECT Cards_id as id, Cards_name as name, Cards_cost as cost, 
                    Cards_damage as atk, Cards_hp as hp, Cards_description as description
             FROM Cards
             WHERE Type_cards_id = 1
             ORDER BY Cards_id`
        );

        res.json({ 
            success: true, 
            cards: cards 
        });

    } catch (error) {
        console.error('Error al obtener pool de cartas:', error);
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
            `SELECT c.Cards_id as id, c.Cards_name as name, c.Cards_cost as cost,
                    c.Cards_damage as atk, c.Cards_hp as hp, d.Quantity as quantity
             FROM Player_Cards_Deck d
             JOIN Cards c ON d.Cards_id = c.Cards_id
             WHERE d.Player_id = ?
             ORDER BY c.Cards_id`,
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

// =====================================================
// ENDPOINTS TCG - ENEMIGOS
// =====================================================

app.get('/api/enemy/level/:levelId', async (req, res) => {
    const { levelId } = req.params;

    try {
        const [enemy] = await pool.query(
            `SELECT e.* 
             FROM Enemy e 
             WHERE e.Level_id = ?`,
            [levelId]
        );

        if (enemy.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Enemigo no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            enemy: enemy[0] 
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

// =====================================================
// ENDPOINTS TCG - COMBATE
// =====================================================

app.post('/api/combat/start', async (req, res) => {
    const { player_id, enemy_id } = req.body;

    if (!player_id || !enemy_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'player_id y enemy_id son requeridos' 
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO Combat (Player_id, Enemy_id, Combat_date, Combat_result) 
             VALUES (?, ?, NOW(), 'ongoing')`,
            [player_id, enemy_id]
        );

        res.json({ 
            success: true, 
            combat_id: result.insertId 
        });

    } catch (error) {
        console.error('Error al iniciar combate:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al iniciar combate',
            error: error.message 
        });
    }
});

app.post('/api/combat/:combatId/turn', async (req, res) => {
    const { combatId } = req.params;
    const { turn_number, active_player, blood_spent } = req.body;

    try {
        await pool.query(
            `INSERT INTO Combat_Turns (Combat_id, Turn_number, Active_player, Blood_spent) 
             VALUES (?, ?, ?, ?)`,
            [combatId, turn_number, active_player, blood_spent || 0]
        );

        res.json({ 
            success: true, 
            message: 'Turno registrado' 
        });

    } catch (error) {
        console.error('Error al registrar turno:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar turno',
            error: error.message 
        });
    }
});

app.post('/api/combat/:combatId/action', async (req, res) => {
    const { combatId } = req.params;
    const { turn_number, card_id, action_type, used_by, blood_spent, damage_dealt, hp_before, hp_after, card_dead } = req.body;

    try {
        await pool.query(
            `INSERT INTO Combat_Cards_Actions 
             (Combat_id, Turn_number, Card_id, Action_type, Used_by, Blood_spent, Damage_dealt, HP_before, HP_after, Card_dead) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [combatId, turn_number, card_id, action_type, used_by, blood_spent, damage_dealt, hp_before, hp_after, card_dead]
        );

        res.json({ 
            success: true, 
            message: 'Acción registrada' 
        });

    } catch (error) {
        console.error('Error al registrar acción:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar acción',
            error: error.message 
        });
    }
});

app.put('/api/combat/:combatId/end', async (req, res) => {
    const { combatId } = req.params;
    const { result, turns_played, duration } = req.body;

    try {
        await pool.query(
            `UPDATE Combat 
             SET Combat_result = ?,
                 Turns_played = ?,
                 Combat_duration = ?
             WHERE Combat_id = ?`,
            [result, turns_played, duration, combatId]
        );

        res.json({ 
            success: true, 
            message: 'Combate finalizado' 
        });

    } catch (error) {
        console.error('Error al finalizar combate:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al finalizar combate',
            error: error.message 
        });
    }
});

app.get('/api/player/:playerId/combats', async (req, res) => {
    const { playerId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const [combats] = await pool.query(
            `SELECT c.Combat_id, c.Combat_date, c.Combat_result, c.Turns_played, c.Combat_duration,
                    e.Enemy_name
             FROM Combat c
             JOIN Enemy e ON c.Enemy_id = e.Enemy_id
             WHERE c.Player_id = ?
             ORDER BY c.Combat_date DESC
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

// =====================================================
// LEADERBOARDS
// =====================================================

// Top jugadores por cartas coleccionadas
app.get('/api/leaderboard/cards', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const [players] = await pool.query(`
            SELECT p.Player_name, COUNT(pcd.Cards_id) as Total_cards
            FROM Player p
            LEFT JOIN Player_Cards_Deck pcd ON p.Player_id = pcd.Player_id
            GROUP BY p.Player_id, p.Player_name
            ORDER BY Total_cards DESC
            LIMIT ?
        `, [limit]);
        
        res.json(players);
    } catch (error) {
        console.error('Error en leaderboard cards:', error);
        res.status(500).json({ error: 'Error al obtener ranking de cartas' });
    }
});

// Top jugadores por secretos descubiertos (placeholder - sin datos aún)
app.get('/api/leaderboard/secrets', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Devolver lista vacía por ahora - no tenemos sistema de secretos implementado
        res.json([]);
    } catch (error) {
        console.error('Error en leaderboard secrets:', error);
        res.status(500).json({ error: 'Error al obtener ranking de secretos' });
    }
});

// Top jugadores por tiempo de juego (placeholder - sin datos aún)
app.get('/api/leaderboard/playtime', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Devolver lista vacía por ahora - no tenemos sistema de tiempo implementado
        res.json([]);
    } catch (error) {
        console.error('Error en leaderboard playtime:', error);
        res.status(500).json({ error: 'Error al obtener ranking de tiempo' });
    }
});

// =====================================================
// ENDPOINT DE TEST
// =====================================================

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  SERVIDOR API - ENDLESS NIGHTMARE`);
    console.log(`========================================\n`);
    console.log(`  Puerto: ${PORT}`);
    console.log(`  Base de datos: ${dbConfig.database}`);
    console.log(`  Estado: ACTIVO\n`);
    
    console.log(`  === ENDPOINTS DISPONIBLES ===\n`);
    console.log(`  AUTENTICACIÓN:`);
    console.log(`  POST   /api/register - Registrar usuario`);
    console.log(`  POST   /api/login - Iniciar sesión\n`);
    
    console.log(`  JUGADOR:`);
    console.log(`  GET    /api/player/:playerId - Obtener jugador`);
    console.log(`  PUT    /api/player/:playerId - Actualizar jugador\n`);
    
    console.log(`  TCG - CARTAS:`);
    console.log(`  GET    /api/cards/pool - Pool de cartas`);
    console.log(`  GET    /api/player/:playerId/deck - Deck del jugador\n`);
    
    console.log(`  TCG - COMBATE:`);
    console.log(`  GET    /api/enemy/level/:levelId - Obtener enemigo`);
    console.log(`  POST   /api/combat/start - Iniciar combate`);
    console.log(`  POST   /api/combat/:combatId/turn - Registrar turno`);
    console.log(`  POST   /api/combat/:combatId/action - Registrar acción`);
    console.log(`  PUT    /api/combat/:combatId/end - Finalizar combate`);
    console.log(`  GET    /api/player/:playerId/combats - Historial\n`);
    
    console.log(`  LEADERBOARDS:`);
    console.log(`  GET    /api/leaderboard/cards - Top por cartas`);
    console.log(`  GET    /api/leaderboard/secrets - Top por secretos`);
    console.log(`  GET    /api/leaderboard/playtime - Top por tiempo\n`);
    
    console.log(`  TEST:`);
    console.log(`  GET    /api/test - Test de conexión\n`);
    console.log(`========================================\n`);
});

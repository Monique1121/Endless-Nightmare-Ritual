const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'C4rl1t0s2023',
    database: process.env.DB_NAME || 'endless',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10)
};

const pool = mysql.createPool(dbConfig);
const USER_ROLES = new Set(['admin', 'ejecutivo']);
const DEFAULT_USER_ROLE = 'ejecutivo';

const CARD_SPRITE_ALIASES = {
    1: '1.png',
    2: 'espectro_nocturno.png',
    3: 'Grave_whisperer.png',
    4: 'sombra_voraz.png',
    5: 'latigo_umbral.png',
    6: 'criatura_niebla.png',
    7: 'pesadilla.png',
    8: 'e_oscuro.png',
    9: 'epstein.png',
    10: 'devorador_almas.png',
    11: 'viniJR.png',
    12: 'EmperadorJB.png',
    13: 'sarcedostista.png',
    14: 'Blood_stalker.png',
    15: 'TZA_bruja.png',
    16: 'golem_huesos.png',
    17: 'caballero_plaga.png',
    18: 'grumpy_daniel.png',
    19: 'hechicero_maldito.png',
    20: 'caballer_sangre.png',
    21: 'ReyJB.png',
    22: 'saka.png',
    23: 'senor_cripta.png',
    24: 'simmon.png',
    25: 'guardain_colosal.png',
    26: 'bestia_del_Abismo.png',
    27: 'sauron.png',
    28: 'lich.png',
    29: 'pandi.png',
    30: 'tragg.png',
    31: 'simmon_epico.png',
    32: 'mbappe.png',
    33: 'leviatan.png',
    34: 'JBcard.png',
    35: 'JBinmortal.png',
    36: 'pablo.png'
};

// Recalcula los desbloqueos del jugador segun los runs completados.
async function normalizePlayerUnlocks(player) {
    const playerId = player.Player_id;
    const [completedRuns] = await pool.query(
        `SELECT DISTINCT Labyrinth_id
         FROM Run
         WHERE Player_id = ? AND Completed = TRUE AND Labyrinth_id IN (1, 3, 4)`,
        [playerId]
    );

    const completedLabyrinths = new Set(completedRuns.map(run => Number(run.Labyrinth_id)));
    const laboratoryUnlocked = completedLabyrinths.has(1) || completedLabyrinths.has(4) || completedLabyrinths.has(3);
    const hospitalUnlocked = completedLabyrinths.has(4) || completedLabyrinths.has(3);

    if (
        Number(player.Laboratory_unlocked) !== Number(laboratoryUnlocked) ||
        Number(player.Hospital_unlocked) !== Number(hospitalUnlocked)
    ) {
        await pool.query(
            `UPDATE Player
             SET Laboratory_unlocked = ?, Hospital_unlocked = ?
             WHERE Player_id = ?`,
            [laboratoryUnlocked, hospitalUnlocked, playerId]
        );
    }

    return {
        ...player,
        Laboratory_unlocked: laboratoryUnlocked,
        Hospital_unlocked: hospitalUnlocked,
    };
}

// Convierte un nombre de archivo de carta en una URL publica del servidor.
function buildCardSpriteUrl(fileName) {
    return `http://localhost:${PORT}/assets/cards/${fileName}`;
}

// Normaliza la ruta del sprite para que frontend viejo y nuevo lean el mismo campo.
function normalizeCardSprite(card) {
    if (!card) {
        return card;
    }

    const normalizedCard = { ...card };
    const cardId = normalizedCard.Card_id ?? normalizedCard.id ?? null;
    const currentSprite = normalizedCard.Sprite_path ?? normalizedCard.sprite ?? null;
    const fileName = currentSprite
        ? path.basename(currentSprite)
        : (CARD_SPRITE_ALIASES[cardId] || '1.png');
    const spriteUrl = buildCardSpriteUrl(fileName);

    normalizedCard.Sprite_path = spriteUrl;
    if (Object.prototype.hasOwnProperty.call(normalizedCard, 'sprite')) {
        normalizedCard.sprite = spriteUrl;
    }

    return normalizedCard;
}

// Aplica la normalizacion de sprites a una lista completa de cartas.
function normalizeCardRows(cards) {
    return cards.map(normalizeCardSprite);
}

// Homologa el actor del combate para no mezclar opponent con enemy.
function normalizeCombatActor(actor) {
    return actor === 'opponent' ? 'enemy' : actor;
}

// Limpia el username antes de comparar o guardar sesion.
function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
}

// Fuerza que el rol solo quede en los valores permitidos por la API.
function normalizeUserRole(role) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    return USER_ROLES.has(normalizedRole) ? normalizedRole : DEFAULT_USER_ROLE;
}

// Marca rapido si un rol ya normalizado pertenece a administrador.
function isAdminRole(role) {
    return normalizeUserRole(role) === 'admin';
}

// Resuelve el usuario actual desde query o header y valida que siga activo.
async function resolveSessionUser(req) {
    const rawUserId = req.query.userId || req.headers['x-user-id'];
    const userId = Number.parseInt(rawUserId, 10);

    if (!Number.isInteger(userId) || userId <= 0) {
        return null;
    }

    const [rows] = await pool.query(
        'SELECT User_id, Username, User_role FROM Users WHERE User_id = ? AND Is_active = TRUE',
        [userId]
    );

    if (rows.length === 0) {
        return null;
    }

    return {
        userId: rows[0].User_id,
        username: rows[0].Username,
        userRole: normalizeUserRole(rows[0].User_role),
        isAdmin: isAdminRole(rows[0].User_role)
    };
}

// Centraliza la validacion de acceso al panel administrativo.
async function requireAdminUser(req) {
    const sessionUser = await resolveSessionUser(req);

    if (!sessionUser) {
        return {
            ok: false,
            status: 401,
            response: {
                success: false,
                message: 'Debes iniciar sesion como administrador.'
            }
        };
    }

    if (!sessionUser.isAdmin) {
        return {
            ok: false,
            status: 403,
            response: {
                success: false,
                message: 'Este panel solo esta disponible para administradores.'
            }
        };
    }

    return {
        ok: true,
        userId: sessionUser.userId,
        username: sessionUser.username
    };
}

// =====================================================
// ENDPOINTS DE AUTENTICACIÓN
// =====================================================

// Crea un usuario nuevo y valida el rol cuando se intenta registrar como admin.
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const requestedRole = String(req.body.userRole || DEFAULT_USER_ROLE).trim().toLowerCase();

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username y password son requeridos' 
        });
    }

    if (!USER_ROLES.has(requestedRole)) {
        return res.status(400).json({
            success: false,
            message: 'El rol debe ser admin o ejecutivo.'
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

        let assignedRole = requestedRole;
        if (assignedRole === 'admin') {
            const adminUser = await requireAdminUser(req);
            if (!adminUser.ok) {
                return res.status(adminUser.status).json({
                    ...adminUser.response,
                    message: 'Solo un administrador puede crear otro usuario administrador.'
                });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO Users (Username, Password_user, User_role, Is_active) VALUES (?, ?, ?, TRUE)',
            [username, password, assignedRole]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Usuario registrado exitosamente',
            userId: result.insertId,
            userRole: assignedRole,
            isAdmin: assignedRole === 'admin'
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

// Inicia sesion y devuelve el rol normalizado del usuario activo.
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
            `SELECT User_id, Username, User_role 
             FROM Users 
             WHERE Username = ? AND Password_user = ? AND Is_active = TRUE`,
            [username, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales inválidas' 
            });
        }

        await pool.query(
            'UPDATE Users SET Last_login = NOW() WHERE User_id = ?',
            [users[0].User_id]
        );

        res.json({ 
            success: true,
            userId: users[0].User_id,
            username: users[0].Username,
            userRole: normalizeUserRole(users[0].User_role),
            isAdmin: isAdminRole(users[0].User_role)
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor'
        });
    }
});

// =====================================================
// ENDPOINTS DE JUGADOR
// =====================================================

// Obtiene el perfil del jugador asociado a un usuario y recalcula desbloqueos.
app.get('/api/player/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [player] = await pool.query(
            `SELECT Player_id, User_id, Player_name, Blood_current, Blood_max,
                    Level, School_unlocked, Hospital_unlocked, Laboratory_unlocked,
                    Secrets_discovered, Total_playtime, Achievements_unlocked
             FROM Player 
             WHERE User_id = ?`,
            [userId]
        );

        if (player.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Jugador no encontrado' 
            });
        }

        const normalizedPlayer = await normalizePlayerUnlocks(player[0]);

        res.json({ 
            success: true, 
            player: normalizedPlayer 
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

// Crea el perfil de jugador inicial si la cuenta aun no lo tiene.
app.post('/api/player/create', async (req, res) => {
    const { userId, playerName } = req.body;

    if (!userId || !playerName) {
        return res.status(400).json({ 
            success: false, 
            message: 'userId y playerName son requeridos' 
        });
    }

    try {
        // Verificar si ya existe un jugador para este usuario
        const [existing] = await pool.query(
            'SELECT Player_id FROM Player WHERE User_id = ?',
            [userId]
        );

        if (existing.length > 0) {
            return res.json({ 
                success: true, 
                playerId: existing[0].Player_id,
                message: 'Jugador ya existe'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO Player (User_id, Player_name, Blood_current, Blood_max, Level) 
             VALUES (?, ?, 100, 100, 0)`,
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

// Actualiza solo los campos de progreso enviados desde el cliente.
app.put('/api/player/:playerId', async (req, res) => {
    const { playerId } = req.params;
    const updates = req.body;

    try {
        const fields = [];
        const values = [];

        // Construir UPDATE dinámicamente
        if (updates.blood_current !== undefined) {
            fields.push('Blood_current = ?');
            values.push(updates.blood_current);
        }
        if (updates.blood_max !== undefined) {
            fields.push('Blood_max = ?');
            values.push(updates.blood_max);
        }
        if (updates.level !== undefined) {
            fields.push('Level = ?');
            values.push(updates.level);
        }
        if (updates.school_unlocked !== undefined) {
            fields.push('School_unlocked = ?');
            values.push(updates.school_unlocked);
        }
        if (updates.hospital_unlocked !== undefined) {
            fields.push('Hospital_unlocked = ?');
            values.push(updates.hospital_unlocked);
        }
        if (updates.laboratory_unlocked !== undefined) {
            fields.push('Laboratory_unlocked = ?');
            values.push(updates.laboratory_unlocked);
        }
        if (updates.secrets_discovered !== undefined) {
            fields.push('Secrets_discovered = ?');
            values.push(updates.secrets_discovered);
        }

        if (fields.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No hay campos para actualizar' 
            });
        }

        values.push(playerId);

        await pool.query(
            `UPDATE Player SET ${fields.join(', ')} WHERE Player_id = ?`,
            values
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
// ENDPOINTS DE CARTAS Y DECK
// =====================================================

// Devuelve el pool completo de cartas disponibles en el juego.
app.get('/api/cards/pool', async (req, res) => {
    try {
        const [cards] = await pool.query(
            `SELECT Card_id as id, Card_name as name, Blood_cost as cost, 
                    Damage as damage, HP as hp, Sprite_path as sprite
             FROM Cards
             ORDER BY Card_id`
        );

        res.json({ 
            success: true, 
            cards: normalizeCardRows(cards)
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

// Obtiene el deck permanente del jugador junto con los datos de cada carta.
app.get('/api/player/:playerId/deck', async (req, res) => {
    const { playerId } = req.params;

    try {
        const [deck] = await pool.query(
            `SELECT d.Deck_id, d.Card_id, c.Card_name, c.Blood_cost, 
                    c.Damage, c.HP, c.Sprite_path, d.Card_gained
             FROM Deck d
             JOIN Cards c ON d.Card_id = c.Card_id
             WHERE d.Player_id = ?
             ORDER BY d.Created_at DESC`,
            [playerId]
        );

        res.json({ 
            success: true, 
            deck: normalizeCardRows(deck)
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

// Entrega el deck inicial del jugador la primera vez que entra al juego.
app.post('/api/player/:playerId/deck/initialize', async (req, res) => {
    const { playerId } = req.params;

    try {
        // Verificar si ya tiene cartas
        const [existing] = await pool.query(
            'SELECT COUNT(*) as count FROM Deck WHERE Player_id = ? AND Card_gained = TRUE',
            [playerId]
        );

        if (existing[0].count > 0) {
            return res.json({ 
                success: true, 
                message: 'Jugador ya tiene cartas iniciales'
            });
        }

        // Dar 5 cartas iniciales aleatorias (comunes, IDs 1-9)
        const initialCards = [];
        for (let i = 0; i < 5; i++) {
            const cardId = Math.floor(Math.random() * 9) + 1;
            initialCards.push([playerId, cardId, true]); // true = permanente
        }

        await pool.query(
            'INSERT INTO Deck (Player_id, Card_id, Card_gained) VALUES ?',
            [initialCards]
        );

        res.json({ 
            success: true, 
            message: 'Cartas iniciales otorgadas'
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

// =====================================================
// ENDPOINTS DE LABERINTO Y RUNS
// =====================================================

// Carga la configuracion base de un laberinto y su nivel asociado.
app.get('/api/labyrinth/:labyrinthId', async (req, res) => {
    const { labyrinthId } = req.params;

    try {
        const [labyrinth] = await pool.query(
            `SELECT l.*, lv.Level_name
             FROM Labyrinth l
             INNER JOIN Levels lv ON lv.Level_id = l.Level_id
             WHERE l.Labyrinth_id = ?`,
            [labyrinthId]
        );

        if (labyrinth.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Laberinto no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            labyrinth: labyrinth[0] 
        });

    } catch (error) {
        console.error('Error al obtener laberinto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Abre o reutiliza el run activo del jugador para un laberinto.
app.post('/api/run/create', async (req, res) => {
    const playerId = req.body.playerId || req.body.player_id;
    const labyrinthId = req.body.labyrinthId || req.body.labyrinth_id;
    let levelId = req.body.levelId || req.body.level_id;
    const conn = await pool.getConnection();

    if (!playerId || !labyrinthId) {
        conn.release();
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan parámetros requeridos (playerId, labyrinthId)' 
        });
    }

    try {
        await conn.beginTransaction();

        // Si no se manda levelId lo deducimos del laberinto
        if (!levelId) {
            const [lab] = await conn.query(
                'SELECT Level_id FROM Labyrinth WHERE Labyrinth_id = ?',
                [labyrinthId]
            );
            if (lab.length === 0) {
                await conn.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Laberinto no encontrado'
                });
            }
            levelId = lab[0].Level_id;
        }

        const [existingRuns] = await conn.query(
            `SELECT Run_id, Level_id
             FROM Run
             WHERE Player_id = ? AND Labyrinth_id = ? AND Completed IS NULL
             ORDER BY Run_id DESC
             LIMIT 1`,
            [playerId, labyrinthId]
        );

        if (existingRuns.length > 0) {
            await conn.commit();
            return res.json({
                success: true,
                runId: existingRuns[0].Run_id,
                levelId: existingRuns[0].Level_id || levelId,
                reused: true
            });
        }

        const [staleRuns] = await conn.query(
            `SELECT Run_id
             FROM Run
             WHERE Player_id = ? AND Completed IS NULL`,
            [playerId]
        );

        if (staleRuns.length > 0) {
            const staleRunIds = staleRuns.map((run) => run.Run_id);
            await conn.query('DELETE FROM Run_Cards_Temp WHERE Run_id IN (?)', [staleRunIds]);
            await conn.query(
                `UPDATE Run
                 SET Completed = FALSE,
                     Completed_at = NOW()
                 WHERE Run_id IN (?)`,
                [staleRunIds]
            );
        }

        const [result] = await conn.query(
            `INSERT INTO Run (Player_id, Labyrinth_id, Level_id, Completed) 
             VALUES (?, ?, ?, NULL)`,
            [playerId, labyrinthId, levelId]
        );

        await conn.commit();

        res.json({ 
            success: true, 
            runId: result.insertId,
            levelId: levelId
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error al crear run:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear run',
            error: error.message 
        });
    } finally {
        conn.release();
    }
});

app.put('/api/run/:runId/complete', completeRunHandler);

// =====================================================
// ENDPOINTS DE ENEMIGOS
// =====================================================

// Obtiene al enemigo del nivel junto con las cartas que puede usar.
app.get('/api/enemy/level/:levelId', async (req, res) => {
    const { levelId } = req.params;

    try {
        const [enemy] = await pool.query(
            'SELECT * FROM Enemy WHERE Level_id = ?',
            [levelId]
        );

        if (enemy.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Enemigo no encontrado' 
            });
        }

        // Obtener cartas del enemigo
        const [cards] = await pool.query(
            `SELECT c.* 
             FROM Enemy_Cards ec
             JOIN Cards c ON ec.Card_id = c.Card_id
             WHERE ec.Enemy_id = ?`,
            [enemy[0].Enemy_id]
        );

        res.json({ 
            success: true, 
            enemy: {
                ...enemy[0],
                cards: cards
            }
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
// ENDPOINTS DE COMBATE
// =====================================================

// Crea el registro inicial del combate y acepta nombres de campos legacy o nuevos.
app.post('/api/combat/start', async (req, res) => {
    const playerId = req.body.playerId || req.body.player_id;
    const enemyId = req.body.enemyId || req.body.enemy_id;
    const runId = req.body.runId || req.body.run_id;
    const levelId = req.body.levelId || req.body.level_id;

    if (!playerId || !enemyId || !levelId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan parámetros requeridos (playerId, enemyId, levelId)' 
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO Combat (Player_id, Enemy_id, Run_id, Level_id, Result) 
             VALUES (?, ?, ?, ?, NULL)`,
            [playerId, enemyId, runId || null, levelId]
        );

        // Devolver ambas formas (camelCase para legacy y snake_case para TCG)
        res.json({ 
            success: true, 
            combatId: result.insertId,
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

// Cierra un combate y guarda resultado, turnos, KO y sangre gastada.
app.put('/api/combat/:combatId/end', async (req, res) => {
    const { combatId } = req.params;
    const winner = req.body.winner;
    let result = req.body.result;
    if (!result && winner) {
        result = winner === 'player' ? 'victory' : 'defeat';
    }
    const totalTurns = req.body.totalTurns ?? req.body.total_turns ?? 0;
    const playerKO  = req.body.playerKO  ?? req.body.player_ko  ?? 0;
    const enemyKO   = req.body.enemyKO   ?? req.body.enemy_ko   ?? 0;
    const bloodUsed = req.body.bloodUsed ?? req.body.blood_used ?? 0;

    try {
        await pool.query(
            `UPDATE Combat 
             SET Result = ?,
                 Total_turns = ?,
                 Player_KO = ?,
                 Enemy_KO = ?,
                 Blood_used = ?,
                 Ended_at = NOW()
             WHERE Combat_id = ?`,
            [result, totalTurns, playerKO, enemyKO, bloodUsed, combatId]
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

// =====================================================
// ENDPOINTS DE SECRETOS
// =====================================================

// Devuelve un secreto individual por su id.
app.get('/api/secrets/:secretId', async (req, res) => {
    const { secretId } = req.params;

    try {
        const [secret] = await pool.query(
            'SELECT * FROM Secrets WHERE Secret_id = ?',
            [secretId]
        );

        if (secret.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Secreto no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            secret: secret[0] 
        });

    } catch (error) {
        console.error('Error al obtener secreto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// Registra que el jugador descubrio un secreto y refresca su contador.
app.post('/api/player/:playerId/secrets', async (req, res) => {
    const { playerId } = req.params;
    const { secretId } = req.body;

    try {
        await pool.query(
            'INSERT IGNORE INTO Player_Secrets (Player_id, Secret_id) VALUES (?, ?)',
            [playerId, secretId]
        );

        // Actualizar contador en Player
        await pool.query(
            `UPDATE Player 
             SET Secrets_discovered = (SELECT COUNT(*) FROM Player_Secrets WHERE Player_id = ?)
             WHERE Player_id = ?`,
            [playerId, playerId]
        );

        res.json({ 
            success: true, 
            message: 'Secreto descubierto' 
        });

    } catch (error) {
        console.error('Error al guardar secreto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor',
            error: error.message 
        });
    }
});

// =====================================================
// ENDPOINTS DE COFRES
// =====================================================

// Lista los cofres de un laberinto con su carta asociada si existe.
app.get('/api/chest/labyrinth/:labyrinthId', async (req, res) => {
    const { labyrinthId } = req.params;

    try {
        const [chests] = await pool.query(
            `SELECT c.*, cc.Card_id, ca.Card_name, ca.Sprite_path
             FROM Chest c
             LEFT JOIN Chest_card cc ON c.Chest_id = cc.Chest_id
             LEFT JOIN Cards ca ON cc.Card_id = ca.Card_id
             WHERE c.Labyrinth_id = ?`,
            [labyrinthId]
        );

        res.json({ 
            success: true, 
            chests: normalizeCardRows(chests)
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

// Marca un cofre como abierto y devuelve su contenido.
app.post('/api/chest/:chestId/open', async (req, res) => {
    const { chestId } = req.params;
    const { playerId, runId } = req.body;

    try {
        // Marcar cofre como abierto
        await pool.query(
            'INSERT IGNORE INTO Player_Chest_Opened (Player_id, Chest_id, Run_id) VALUES (?, ?, ?)',
            [playerId, chestId, runId]
        );

        // Obtener contenido del cofre
        const [chest] = await pool.query(
            `SELECT c.Blood_amount, c.Secret_id, cc.Card_id
             FROM Chest c
             LEFT JOIN Chest_card cc ON c.Chest_id = cc.Chest_id
             WHERE c.Chest_id = ?`,
            [chestId]
        );

        res.json({ 
            success: true, 
            chest: chest[0] 
        });

    } catch (error) {
        console.error('Error al abrir cofre:', error);
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

// Ranking de jugadores por cantidad de cartas obtenidas.
app.get('/api/leaderboard/cards', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const [players] = await pool.query(`
            SELECT p.Player_name, COUNT(DISTINCT d.Card_id) as Total_cards
            FROM Player p
            LEFT JOIN Deck d ON p.Player_id = d.Player_id AND d.Card_gained = TRUE
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

// Ranking de jugadores por secretos descubiertos.
app.get('/api/leaderboard/secrets', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const [players] = await pool.query(`
            SELECT p.Player_name, p.Secrets_discovered as Total_secrets
            FROM Player p
            WHERE p.Secrets_discovered > 0
            ORDER BY p.Secrets_discovered DESC
            LIMIT ?
        `, [limit]);
        
        res.json(players);
    } catch (error) {
        console.error('Error en leaderboard secrets:', error);
        res.status(500).json({ error: 'Error al obtener ranking de secretos' });
    }
});

// Ranking de jugadores por tiempo total acumulado.
app.get('/api/leaderboard/playtime', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const [players] = await pool.query(`
            SELECT p.Player_name, p.Total_playtime
            FROM Player p
            WHERE p.Total_playtime > 0
            ORDER BY p.Total_playtime DESC
            LIMIT ?
        `, [limit]);
        
        res.json(players);
    } catch (error) {
        console.error('Error en leaderboard playtime:', error);
        res.status(500).json({ error: 'Error al obtener ranking de tiempo' });
    }
});

// =====================================================
// ENDPOINTS EXTRA DE JUGADOR (stats, inventory, sync, reset, cards/available)
// =====================================================

// GET stats agregados del jugador (usado por TCG y lobby)
app.get('/api/player/:playerId/stats', async (req, res) => {
    const { playerId } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT Player_id, User_id, Player_name, Blood_current, Blood_max,
                    Level, School_unlocked, Hospital_unlocked, Laboratory_unlocked,
                    Secrets_discovered, Total_playtime, Achievements_unlocked
             FROM Player WHERE Player_id = ?`,
            [playerId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Jugador no encontrado' });
        }
        const normalizedStats = await normalizePlayerUnlocks(rows[0]);
        res.json({ success: true, stats: normalizedStats });
    } catch (error) {
        console.error('Error al obtener stats:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// GET inventario completo (cartas + secretos + sangre)
app.get('/api/player/:playerId/inventory', async (req, res) => {
    const { playerId } = req.params;
    try {
        const [pl] = await pool.query(
            `SELECT Blood_current, Blood_max, Secrets_discovered
             FROM Player WHERE Player_id = ?`,
            [playerId]
        );
        if (pl.length === 0) {
            return res.status(404).json({ success: false, message: 'Jugador no encontrado' });
        }

        const [cards] = await pool.query(
            `SELECT c.Card_id, c.Card_name, c.Blood_cost, c.Damage, c.HP, c.Sprite_path
             FROM Deck d
             JOIN Cards c ON d.Card_id = c.Card_id
             WHERE d.Player_id = ? AND d.Card_gained = TRUE
             ORDER BY d.Created_at DESC`,
            [playerId]
        );

        const [secrets] = await pool.query(
            `SELECT s.Secret_id, s.Secret_name, s.Content
             FROM Player_Secrets ps
             JOIN Secrets s ON ps.Secret_id = s.Secret_id
             WHERE ps.Player_id = ?
             ORDER BY ps.Discovered_at DESC`,
            [playerId]
        );

        res.json({
            success: true,
            inventory: {
                blood_current: pl[0].Blood_current,
                blood_max: pl[0].Blood_max,
                secrets_count: pl[0].Secrets_discovered,
                cards: normalizeCardRows(cards),
                secrets: secrets
            }
        });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// PUT sincronizar progreso desde el cliente (sangre + secretos)
app.put('/api/player/:playerId/sync', async (req, res) => {
    const { playerId } = req.params;
    const { blood_current, secrets_discovered } = req.body;
    try {
        const fields = [];
        const values = [];
        if (blood_current !== undefined) { fields.push('Blood_current = ?'); values.push(blood_current); }
        if (secrets_discovered !== undefined) { fields.push('Secrets_discovered = ?'); values.push(secrets_discovered); }

        if (fields.length === 0) {
            return res.json({ success: true, message: 'Nada que sincronizar' });
        }

        values.push(playerId);
        await pool.query(`UPDATE Player SET ${fields.join(', ')} WHERE Player_id = ?`, values);
        res.json({ success: true, message: 'Progreso sincronizado' });
    } catch (error) {
        console.error('Error en sync:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// POST reset del jugador (Nueva Partida) - mantiene la cuenta, limpia progreso y da 5 cartas
app.post('/api/player/:playerId/reset', async (req, res) => {
    const { playerId } = req.params;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        // Si dejamos los runs viejos, normalizePlayerUnlocks vuelve a abrir zonas al entrar al lobby.
        await conn.query('DELETE FROM Run WHERE Player_id = ?', [playerId]);
        await conn.query('DELETE FROM Deck WHERE Player_id = ?', [playerId]);
        await conn.query('DELETE FROM Player_Secrets WHERE Player_id = ?', [playerId]);
        await conn.query('DELETE FROM Player_Chest_Opened WHERE Player_id = ?', [playerId]);
        await conn.query(
            `UPDATE Player
             SET Blood_current = 100, Blood_max = 100, Level = 0,
                 School_unlocked = TRUE, Hospital_unlocked = FALSE, Laboratory_unlocked = FALSE,
                 Secrets_discovered = 0
             WHERE Player_id = ?`,
            [playerId]
        );

        // 5 cartas iniciales aleatorias del rango comun (1-10)
        const initialCardIds = [];
        const seen = new Set();
        while (initialCardIds.length < 5) {
            const id = Math.floor(Math.random() * 10) + 1;
            if (!seen.has(id)) { seen.add(id); initialCardIds.push(id); }
        }
        const insertRows = initialCardIds.map(id => [playerId, id, true]);
        await conn.query('INSERT INTO Deck (Player_id, Card_id, Card_gained) VALUES ?', [insertRows]);

        const [initialCards] = await conn.query(
            `SELECT c.Card_id, c.Card_name, c.Blood_cost, c.Damage, c.HP, c.Sprite_path
             FROM Cards c WHERE c.Card_id IN (?)`,
            [initialCardIds]
        );

        await conn.commit();
        res.json({ success: true, message: 'Jugador reseteado', initialCards: normalizeCardRows(initialCards) });
    } catch (error) {
        await conn.rollback();
        console.error('Error al resetear jugador:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    } finally {
        conn.release();
    }
});

// GET cartas disponibles que el jugador todavia NO posee
app.get('/api/player/:playerId/cards/available', async (req, res) => {
    const { playerId } = req.params;
    try {
        const [cards] = await pool.query(
            `SELECT c.Card_id, c.Card_name, c.Blood_cost, c.Damage, c.HP, c.Sprite_path
             FROM Cards c
             WHERE c.Card_id NOT IN (
                 SELECT Card_id FROM Deck WHERE Player_id = ? AND Card_gained = TRUE
             )`,
            [playerId]
        );
        res.json({ success: true, cards: normalizeCardRows(cards) });
    } catch (error) {
        console.error('Error en cards/available:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// =====================================================
// ENDPOINTS EXTRA DE SECRETOS
// =====================================================

// GET lista completa de secretos
app.get('/api/secrets', async (req, res) => {
    try {
        const [secrets] = await pool.query(
            'SELECT Secret_id, Secret_name, Content FROM Secrets ORDER BY Secret_id'
        );
        res.json({ success: true, secrets });
    } catch (error) {
        console.error('Error al listar secretos:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// POST descubrir secreto desde el laberinto
app.post('/api/player/:playerId/secret/:secretId/discover', async (req, res) => {
    const { playerId, secretId } = req.params;
    try {
        await pool.query(
            'INSERT IGNORE INTO Player_Secrets (Player_id, Secret_id) VALUES (?, ?)',
            [playerId, secretId]
        );
        await pool.query(
            `UPDATE Player
             SET Secrets_discovered = (SELECT COUNT(*) FROM Player_Secrets WHERE Player_id = ?)
             WHERE Player_id = ?`,
            [playerId, playerId]
        );
        res.json({ success: true, message: 'Secreto descubierto' });
    } catch (error) {
        console.error('Error al descubrir secreto:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// =====================================================
// ENDPOINTS EXTRA DE RUN (info, temp cards, complete/fail desde laberinto)
// =====================================================

// GET info de un run (laberinto la usa al cargar)
app.get('/api/run/:runId/info', async (req, res) => {
    const { runId } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM Run WHERE Run_id = ?', [runId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Run no encontrado' });
        }
        res.json({ success: true, run: rows[0] });
    } catch (error) {
        console.error('Error en run/info:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// GET cartas temporales recolectadas en un run (TCG las suma al pool)
app.get('/api/run/:runId/cards/temp', async (req, res) => {
    const { runId } = req.params;
    try {
        const [tempCards] = await pool.query(
            `SELECT c.Card_id, c.Card_name, c.Blood_cost, c.Damage, c.HP, c.Sprite_path
             FROM Run_Cards_Temp rct
             JOIN Cards c ON rct.Card_id = c.Card_id
             WHERE rct.Run_id = ?`,
            [runId]
        );
        res.json({ success: true, tempCards: normalizeCardRows(tempCards) });
    } catch (error) {
        console.error('Error en cards/temp:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// POST recolectar carta de cofre durante el run
app.post('/api/run/:runId/card/collect', async (req, res) => {
    const { runId } = req.params;
    const { playerId, cardId } = req.body;
    if (!playerId || !cardId) {
        return res.status(400).json({ success: false, message: 'Faltan playerId o cardId' });
    }
    try {
        await pool.query(
            'INSERT IGNORE INTO Run_Cards_Temp (Run_id, Card_id) VALUES (?, ?)',
            [runId, cardId]
        );
        const [card] = await pool.query(
            'SELECT Card_id, Card_name, Blood_cost, Damage, HP, Sprite_path FROM Cards WHERE Card_id = ?',
            [cardId]
        );
        res.json({ success: true, card: card[0] ? normalizeCardSprite(card[0]) : null });
    } catch (error) {
        console.error('Error en card/collect:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// Desbloquea la siguiente zona persistente cuando el jugador termina un laberinto.
async function unlockNextArea(conn, playerId, labyrinthId) {
    if (labyrinthId == 1) {
        await conn.query('UPDATE Player SET Laboratory_unlocked = TRUE WHERE Player_id = ?', [playerId]);
    } else if (labyrinthId == 4) {
        await conn.query('UPDATE Player SET Hospital_unlocked = TRUE WHERE Player_id = ?', [playerId]);
    }
}

// Cierra un run exitoso, consolida cartas temporales y actualiza progreso.
async function completeRunHandler(req, res) {
    const { runId } = req.params;
    const {
        playerId,
        timeTaken,
        secretsFound,
        bloodRecovered,
        cardsFound
    } = req.body || {};
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [runRows] = await conn.query('SELECT * FROM Run WHERE Run_id = ?', [runId]);
        if (runRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Run no encontrado' });
        }
        const run = runRows[0];
        const finalPlayerId = playerId || run.Player_id;

        // Consolidar cartas temp en Deck (permanente)
        const [tempCards] = await conn.query(
            'SELECT Card_id FROM Run_Cards_Temp WHERE Run_id = ?',
            [runId]
        );
        let cardsGained = 0;
        if (tempCards.length > 0) {
            const rows = tempCards.map(c => [finalPlayerId, c.Card_id, runId, true]);
            await conn.query('INSERT INTO Deck (Player_id, Card_id, Run_id, Card_gained) VALUES ?', [rows]);
            cardsGained = tempCards.length;
        }

        const finalCardsFound = cardsFound ?? cardsGained;
        const finalBloodRecovered = bloodRecovered ?? run.Blood_recovered ?? 0;
        const finalSecretsFound = secretsFound ?? 0;
        const finalTimeTaken = timeTaken ?? 0;

        await conn.query(
            `UPDATE Run
             SET Completed = TRUE,
                 Blood_recovered = ?,
                 Cards_found = ?,
                 Secrets_found = ?,
                 Time_taken = ?,
                 Completed_at = NOW()
             WHERE Run_id = ?`,
            [finalBloodRecovered, finalCardsFound, finalSecretsFound, finalTimeTaken, runId]
        );

        await unlockNextArea(conn, finalPlayerId, run.Labyrinth_id);

        // Limpiar la cache temporal del run
        await conn.query('DELETE FROM Run_Cards_Temp WHERE Run_id = ?', [runId]);

        await conn.commit();
        res.json({
            success: true,
            cardsGained,
            cardsFound: finalCardsFound,
            message: 'Run completado'
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error al completar run:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    } finally {
        conn.release();
    }
}

// POST completar run (consolida cartas temp en Deck y cierra run)
app.post('/api/run/:runId/complete', completeRunHandler);

// POST fallar run (descarta cartas temp)
app.post('/api/run/:runId/fail', async (req, res) => {
    const { runId } = req.params;
    try {
        await pool.query('DELETE FROM Run_Cards_Temp WHERE Run_id = ?', [runId]);
        await pool.query(
            `UPDATE Run SET Completed = FALSE, Completed_at = NOW() WHERE Run_id = ?`,
            [runId]
        );
        res.json({ success: true, message: 'Run fallido' });
    } catch (error) {
        console.error('Error al fallar run:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// =====================================================
// ENDPOINTS EXTRA DE COMBATE (turnos y acciones)
// =====================================================

// Guarda el resumen de un turno del combate para estadisticas y replay.
app.post('/api/combat/:combatId/turn', async (req, res) => {
    const { combatId } = req.params;
    const { turn_number, active_player, blood_spent } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO Combat_Turns (Combat_id, Turn_number, Active_player, Blood_spent)
             VALUES (?, ?, ?, ?)`,
            [combatId, turn_number, active_player, blood_spent || 0]
        );
        res.json({ success: true, turn_id: result.insertId });
    } catch (error) {
        console.error('Error al registrar turno:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// Guarda una accion puntual de carta dentro del turno actual.
app.post('/api/combat/:combatId/action', async (req, res) => {
    const { combatId } = req.params;
    const {
        turn_id, turn_number, card_id, action_type, used_by,
        blood_spent, damage_dealt, hp_before, hp_after, card_dead
    } = req.body;
    try {
        await pool.query(
            `INSERT INTO Combat_Cards_Actions
             (Combat_id, Turn_id, Turn_number, Card_id, Action_type, Used_by,
              Blood_spent, Damage_dealt, HP_before, HP_after, Card_dead)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [combatId, turn_id || null, turn_number || null, card_id, action_type, used_by,
             blood_spent || 0, damage_dealt || 0, hp_before, hp_after, card_dead ? 1 : 0]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error al registrar accion:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// Reconstruye el log completo del combate con turnos, acciones y resumen.
app.get('/api/combat/:combatId/log', async (req, res) => {
    const { combatId } = req.params;

    try {
        const [combatRows] = await pool.query(
            `SELECT c.*, p.Player_name, e.Enemy_name, COALESCE(l.Level_name, 'Sin nivel') AS Level_name,
                    TIMESTAMPDIFF(SECOND, c.Started_at, COALESCE(c.Ended_at, NOW())) AS Duration_seconds
             FROM Combat c
             JOIN Player p ON c.Player_id = p.Player_id
             JOIN Enemy e ON c.Enemy_id = e.Enemy_id
             LEFT JOIN Levels l ON c.Level_id = l.Level_id
             WHERE c.Combat_id = ?`,
            [combatId]
        );

        if (combatRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Combate no encontrado' });
        }

        const [turnRows] = await pool.query(
            `SELECT Turn_id, Turn_number, Active_player, Blood_spent, Turn_timestamp
             FROM Combat_Turns
             WHERE Combat_id = ?
             ORDER BY Turn_number, Turn_id`,
            [combatId]
        );

        const [actionRows] = await pool.query(
            `SELECT a.Action_id, a.Combat_id, a.Turn_id,
                    COALESCE(a.Turn_number, t.Turn_number) AS Turn_number,
                    a.Card_id, c.Card_name, c.Sprite_path,
                    a.Action_type, a.Used_by, a.Blood_spent, a.Damage_dealt,
                    a.HP_before, a.HP_after, a.Card_dead, a.Created_at
             FROM Combat_Cards_Actions a
             LEFT JOIN Combat_Turns t ON a.Turn_id = t.Turn_id
             LEFT JOIN Cards c ON a.Card_id = c.Card_id
             WHERE a.Combat_id = ?
             ORDER BY COALESCE(a.Turn_number, t.Turn_number), a.Action_id`,
            [combatId]
        );

        const [textLogs] = await pool.query(
            `SELECT Log_combat_id, Turn_id, Log_data, Created_at
             FROM Logs_combat
             WHERE Combat_id = ?
             ORDER BY Log_combat_id`,
            [combatId]
        );

        const turns = turnRows.map(turn => ({
            ...turn,
            Active_player: normalizeCombatActor(turn.Active_player),
            actions: []
        }));

        const turnById = new Map(turns.map(turn => [turn.Turn_id, turn]));
        const turnByNumber = new Map(turns.map(turn => [turn.Turn_number, turn]));
        const normalizedActions = normalizeCardRows(actionRows).map(action => ({
            ...action,
            Used_by: normalizeCombatActor(action.Used_by)
        }));

        for (const action of normalizedActions) {
            let targetTurn = action.Turn_id ? turnById.get(action.Turn_id) : null;
            if (!targetTurn && action.Turn_number !== null) {
                targetTurn = turnByNumber.get(action.Turn_number);
            }

            if (!targetTurn) {
                targetTurn = {
                    Turn_id: action.Turn_id || null,
                    Turn_number: action.Turn_number || turnByNumber.size + 1,
                    Active_player: action.Used_by,
                    Blood_spent: 0,
                    Turn_timestamp: action.Created_at,
                    actions: []
                };
                turns.push(targetTurn);
                if (targetTurn.Turn_id) {
                    turnById.set(targetTurn.Turn_id, targetTurn);
                }
                turnByNumber.set(targetTurn.Turn_number, targetTurn);
            }

            targetTurn.actions.push(action);
        }

        turns.sort((left, right) => left.Turn_number - right.Turn_number);

        const summary = {
            totalTurns: combatRows[0].Total_turns || turns.length,
            totalActions: normalizedActions.length,
            playerActions: normalizedActions.filter(action => action.Used_by === 'player').length,
            enemyActions: normalizedActions.filter(action => action.Used_by === 'enemy').length,
            playerDamage: normalizedActions
                .filter(action => action.Used_by === 'player')
                .reduce((acc, action) => acc + (action.Damage_dealt || 0), 0),
            enemyDamage: normalizedActions
                .filter(action => action.Used_by === 'enemy')
                .reduce((acc, action) => acc + (action.Damage_dealt || 0), 0),
            actionsByType: normalizedActions.reduce((acc, action) => {
                acc[action.Action_type] = (acc[action.Action_type] || 0) + 1;
                return acc;
            }, {})
        };

        res.json({
            success: true,
            combat: combatRows[0],
            summary,
            turns,
            textLogs
        });
    } catch (error) {
        console.error('Error al obtener log del combate:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// Devuelve estadisticas agregadas de combate por nivel, enemigo y tipo de accion.
app.get('/api/combat/stats', async (req, res) => {
    const playerId = req.query.playerId || null;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const filters = [];
    const values = [];

    if (playerId) {
        filters.push('c.Player_id = ?');
        values.push(playerId);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    try {
        const [summaryRows] = await pool.query(
            `SELECT COUNT(*) AS total_combats,
                    SUM(CASE WHEN c.Result = 'victory' THEN 1 ELSE 0 END) AS victories,
                    SUM(CASE WHEN c.Result = 'defeat' THEN 1 ELSE 0 END) AS defeats,
                    SUM(CASE WHEN c.Result IS NULL THEN 1 ELSE 0 END) AS unfinished,
                    COALESCE(ROUND(AVG(NULLIF(c.Total_turns, 0)), 2), 0) AS avg_turns,
                    COALESCE(ROUND(AVG(c.Blood_used), 2), 0) AS avg_blood_used,
                    COALESCE(ROUND(AVG(TIMESTAMPDIFF(SECOND, c.Started_at, COALESCE(c.Ended_at, NOW()))), 2), 0) AS avg_duration_seconds
             FROM Combat c
             ${whereClause}`,
            values
        );

        const [levelRows] = await pool.query(
            `SELECT COALESCE(l.Level_name, 'Sin nivel') AS label,
                    COUNT(*) AS total_combats,
                    SUM(CASE WHEN c.Result = 'victory' THEN 1 ELSE 0 END) AS victories,
                    SUM(CASE WHEN c.Result = 'defeat' THEN 1 ELSE 0 END) AS defeats,
                    COALESCE(ROUND(AVG(c.Total_turns), 2), 0) AS avg_turns,
                    COALESCE(ROUND(AVG(c.Blood_used), 2), 0) AS avg_blood_used
             FROM Combat c
             LEFT JOIN Levels l ON c.Level_id = l.Level_id
             ${whereClause}
             GROUP BY COALESCE(l.Level_name, 'Sin nivel')
             ORDER BY total_combats DESC, label`,
            values
        );

        const [enemyRows] = await pool.query(
            `SELECT e.Enemy_name AS label,
                    COUNT(*) AS total_combats,
                    SUM(CASE WHEN c.Result = 'victory' THEN 1 ELSE 0 END) AS victories,
                    SUM(CASE WHEN c.Result = 'defeat' THEN 1 ELSE 0 END) AS defeats,
                    COALESCE(ROUND(AVG(c.Total_turns), 2), 0) AS avg_turns,
                    COALESCE(ROUND(AVG(c.Blood_used), 2), 0) AS avg_blood_used
             FROM Combat c
             JOIN Enemy e ON c.Enemy_id = e.Enemy_id
             ${whereClause}
             GROUP BY e.Enemy_name
             ORDER BY total_combats DESC, e.Enemy_name`,
            values
        );

        const [actionRows] = await pool.query(
            `SELECT a.Action_type AS label,
                    COUNT(*) AS total_actions,
                    COALESCE(SUM(a.Damage_dealt), 0) AS total_damage
             FROM Combat_Cards_Actions a
             JOIN Combat c ON a.Combat_id = c.Combat_id
             ${whereClause}
             GROUP BY a.Action_type
             ORDER BY total_actions DESC, a.Action_type`,
            values
        );

        const [recentRows] = await pool.query(
            `SELECT c.Combat_id, p.Player_name, e.Enemy_name, COALESCE(l.Level_name, 'Sin nivel') AS Level_name,
                    c.Result, c.Total_turns, c.Blood_used, c.Player_KO, c.Enemy_KO,
                    c.Started_at, c.Ended_at,
                    TIMESTAMPDIFF(SECOND, c.Started_at, COALESCE(c.Ended_at, NOW())) AS Duration_seconds
             FROM Combat c
             JOIN Player p ON c.Player_id = p.Player_id
             JOIN Enemy e ON c.Enemy_id = e.Enemy_id
             LEFT JOIN Levels l ON c.Level_id = l.Level_id
             ${whereClause}
             ORDER BY c.Combat_id DESC
             LIMIT ?`,
            [...values, limit]
        );

        const summary = summaryRows[0] || {
            total_combats: 0,
            victories: 0,
            defeats: 0,
            unfinished: 0,
            avg_turns: 0,
            avg_blood_used: 0,
            avg_duration_seconds: 0
        };

        const totalCombats = Number(summary.total_combats || 0);
        const victories = Number(summary.victories || 0);

        res.json({
            success: true,
            filters: {
                playerId,
                limit
            },
            summary: {
                ...summary,
                win_rate: totalCombats > 0 ? Number(((victories / totalCombats) * 100).toFixed(2)) : 0
            },
            by_level: levelRows,
            by_enemy: enemyRows,
            by_action_type: actionRows,
            recent_combats: recentRows
        });
    } catch (error) {
        console.error('Error al obtener estadisticas de combate:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// Arma el dashboard administrativo con resumen general, ranking y tablas de gestion.
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const viewerUser = await resolveSessionUser(req);

        const [overviewRows] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM Users) AS total_users,
                (SELECT COUNT(*) FROM Users WHERE Is_active = TRUE) AS active_users,
                (SELECT COUNT(*) FROM Users WHERE Is_active = TRUE AND User_role = 'admin') AS total_admins,
                (SELECT COUNT(*) FROM Player) AS total_players,
                (SELECT COUNT(*) FROM Run) AS total_runs,
                (SELECT COUNT(*) FROM Run WHERE Completed = TRUE) AS completed_runs,
                (SELECT COUNT(*) FROM Run WHERE Completed = FALSE) AS failed_runs,
                (SELECT COUNT(*) FROM Run WHERE Completed IS NULL) AS active_runs,
                COALESCE((SELECT ROUND(AVG(NULLIF(Time_taken, 0)), 2) FROM Run WHERE Completed = TRUE), 0) AS avg_run_time,
                COALESCE((SELECT ROUND(AVG(Secrets_found), 2) FROM Run), 0) AS avg_secrets_per_run,
                (SELECT COUNT(*) FROM Combat) AS total_combats,
                (SELECT COUNT(*) FROM Combat WHERE Result = 'victory') AS combat_victories,
                (SELECT COUNT(*) FROM Combat WHERE Result = 'defeat') AS combat_defeats,
                COALESCE((SELECT ROUND(AVG(NULLIF(Total_turns, 0)), 2) FROM Combat), 0) AS avg_combat_turns
        `);

        const [playerProgressRows] = await pool.query(`
            SELECT 'Perfiles creados' AS label, COUNT(*) AS total FROM Player
            UNION ALL
            SELECT 'Escuela desbloqueada' AS label, COUNT(*) AS total FROM Player WHERE School_unlocked = TRUE
            UNION ALL
            SELECT 'Laboratorio desbloqueado' AS label, COUNT(*) AS total FROM Player WHERE Laboratory_unlocked = TRUE
            UNION ALL
            SELECT 'Hospital desbloqueado' AS label, COUNT(*) AS total FROM Player WHERE Hospital_unlocked = TRUE
        `);

        const [runStatusRows] = await pool.query(`
            SELECT 'Runs completados' AS label, COUNT(*) AS total FROM Run WHERE Completed = TRUE
            UNION ALL
            SELECT 'Runs fallidos' AS label, COUNT(*) AS total FROM Run WHERE Completed = FALSE
            UNION ALL
            SELECT 'Runs activos' AS label, COUNT(*) AS total FROM Run WHERE Completed IS NULL
        `);

        const [runsByLevelRows] = await pool.query(`
            SELECT l.Level_name AS label,
                   COUNT(r.Run_id) AS total_runs,
                   SUM(CASE WHEN r.Completed = TRUE THEN 1 ELSE 0 END) AS completed_runs,
                   SUM(CASE WHEN r.Completed = FALSE THEN 1 ELSE 0 END) AS failed_runs,
                   COALESCE(ROUND(AVG(NULLIF(r.Time_taken, 0)), 2), 0) AS avg_time
            FROM Levels l
            LEFT JOIN Run r ON r.Level_id = l.Level_id
            GROUP BY l.Level_id, l.Level_name, l.Level_number
            ORDER BY l.Level_number
        `);

        const [combatByLevelRows] = await pool.query(`
            SELECT l.Level_name AS label,
                   COUNT(c.Combat_id) AS total_combats,
                   SUM(CASE WHEN c.Result = 'victory' THEN 1 ELSE 0 END) AS victories,
                   SUM(CASE WHEN c.Result = 'defeat' THEN 1 ELSE 0 END) AS defeats
            FROM Levels l
            LEFT JOIN Combat c ON c.Level_id = l.Level_id
            GROUP BY l.Level_id, l.Level_name, l.Level_number
            ORDER BY l.Level_number
        `);

        const [resourceRows] = await pool.query(`
            SELECT 'Secretos descubiertos' AS label, COALESCE(SUM(Secrets_discovered), 0) AS total FROM Player
            UNION ALL
            SELECT 'Cofres abiertos' AS label, COUNT(*) AS total FROM Player_Chest_Opened
            UNION ALL
            SELECT 'Cartas obtenidas' AS label, COUNT(*) AS total FROM Deck WHERE Card_gained = TRUE
            UNION ALL
            SELECT 'Logros desbloqueados' AS label, COALESCE(SUM(Achievements_unlocked), 0) AS total FROM Player
        `);

        const [topPlayersRows] = await pool.query(`
            SELECT p.Player_name AS label,
                   COALESCE(run_stats.completed_runs, 0) AS completed_runs,
                   COALESCE(card_stats.total_cards, 0) AS total_cards,
                   p.Secrets_discovered AS total_secrets,
                   p.Total_playtime
            FROM Player p
            LEFT JOIN (
                SELECT Player_id,
                       SUM(CASE WHEN Completed = TRUE THEN 1 ELSE 0 END) AS completed_runs
                FROM Run
                GROUP BY Player_id
            ) run_stats ON run_stats.Player_id = p.Player_id
            LEFT JOIN (
                SELECT Player_id,
                       COUNT(DISTINCT Card_id) AS total_cards
                FROM Deck
                WHERE Card_gained = TRUE
                GROUP BY Player_id
            ) card_stats ON card_stats.Player_id = p.Player_id
            ORDER BY completed_runs DESC, total_cards DESC, p.Total_playtime DESC, p.Player_name
            LIMIT 8
        `);

        const [userRows] = await pool.query(`
            SELECT u.User_id,
                   u.Username,
                     u.User_role,
                   u.Is_active,
                   u.Created_at,
                   u.Last_login,
                   p.Player_name,
                   COALESCE(run_stats.total_runs, 0) AS total_runs,
                   COALESCE(run_stats.completed_runs, 0) AS completed_runs,
                   COALESCE(card_stats.total_cards, 0) AS total_cards
            FROM Users u
            LEFT JOIN Player p ON p.User_id = u.User_id
            LEFT JOIN (
                SELECT Player_id,
                       COUNT(*) AS total_runs,
                       SUM(CASE WHEN Completed = TRUE THEN 1 ELSE 0 END) AS completed_runs
                FROM Run
                GROUP BY Player_id
            ) run_stats ON run_stats.Player_id = p.Player_id
            LEFT JOIN (
                SELECT Player_id,
                       COUNT(DISTINCT Card_id) AS total_cards
                FROM Deck
                WHERE Card_gained = TRUE
                GROUP BY Player_id
            ) card_stats ON card_stats.Player_id = p.Player_id
            ORDER BY u.Is_active DESC, u.Created_at DESC, u.Username
        `);

        const overview = overviewRows[0] || {};
        const totalCombats = Number(overview.total_combats || 0);
        const combatVictories = Number(overview.combat_victories || 0);
        const canDeleteUsers = Boolean(viewerUser && viewerUser.isAdmin);

        res.json({
            success: true,
            viewer: viewerUser ? {
                userId: viewerUser.userId,
                username: viewerUser.username,
                userRole: viewerUser.userRole,
                isAdmin: viewerUser.isAdmin
            } : null,
            management: {
                can_delete_users: canDeleteUsers
            },
            overview: {
                ...overview,
                combat_win_rate: totalCombats > 0
                    ? Number(((combatVictories / totalCombats) * 100).toFixed(2))
                    : 0
            },
            player_progress: playerProgressRows,
            run_status: runStatusRows,
            runs_by_level: runsByLevelRows,
            combat_by_level: combatByLevelRows,
            resource_totals: resourceRows,
            top_players: topPlayersRows,
            users: userRows.map((row) => ({
                ...row,
                user_role: normalizeUserRole(row.User_role),
                is_admin: isAdminRole(row.User_role)
            }))
        });
    } catch (error) {
        console.error('Error al obtener dashboard admin:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// Desactiva usuarios no administradores desde el panel de administracion.
app.delete('/api/admin/users/:userId', async (req, res) => {
    try {
        const adminUser = await requireAdminUser(req);
        if (!adminUser.ok) {
            return res.status(adminUser.status).json(adminUser.response);
        }

        const targetUserId = Number.parseInt(req.params.userId, 10);
        if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
            return res.status(400).json({ success: false, message: 'User_id invalido.' });
        }

        if (targetUserId === adminUser.userId) {
            return res.status(400).json({ success: false, message: 'No puedes borrar tu propio usuario admin.' });
        }

        const [rows] = await pool.query(
            'SELECT User_id, Username, User_role, Is_active FROM Users WHERE User_id = ?',
            [targetUserId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        if (isAdminRole(rows[0].User_role)) {
            return res.status(403).json({ success: false, message: 'No se pueden borrar usuarios administradores.' });
        }

        if (!rows[0].Is_active) {
            return res.json({ success: true, message: 'El usuario ya estaba eliminado.' });
        }

        await pool.query(
            'UPDATE Users SET Is_active = FALSE WHERE User_id = ?',
            [targetUserId]
        );

        res.json({
            success: true,
            message: `Usuario ${rows[0].Username} eliminado correctamente.`
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
});

// =====================================================
// ENDPOINT DE TEST
// =====================================================

// Verifica rapido si la API esta viva.
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
    console.log(`========================================\n`);
});

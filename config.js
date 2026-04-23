/**
 * Configuración centralizada para Endless Nightmare Ritual
 * Este archivo contiene todas las constantes y configuraciones del juego
 */

const CONFIG = {
    // Configuración de la API
    API: {
        URL: 'http://localhost:3000/api',
        TIMEOUT: 5000, // 5 segundos
        RETRY_ATTEMPTS: 3
    },
    
    // Configuración del juego
    GAME: {
        // Canvas
        CANVAS_WIDTH: 1600,
        CANVAS_HEIGHT: 900,
        
        // Jugador
        PLAYER_BLOOD_MAX: 100,
        PLAYER_BLOOD_REGEN: 2,
        
        // TCG
        TCG: {
            MAX_HAND_SIZE: 10,
            MAX_CARDS_PER_TURN: 3,
            INITIAL_HAND_SIZE: 5,
            CARDS_DRAW_PER_TURN: 2,
            SACRIFICE_COST: 15,
            SACRIFICE_ATK_BONUS: 3,
            SACRIFICE_HP_BONUS: 2,
            KNOCKOUTS_TO_WIN: 6,
            BENCH_SLOTS: 4
        },
        
        // Laberinto
        MAZE: {
            CELL_SIZE: 40,
            PLAYER_SPEED: 2,
            LIGHT_RADIUS: 3
        },
        
        // Niveles
        LEVELS: {
            TUTORIAL: 0,
            ESCUELA: 1,
            HOSPITAL: 2,
            LABORATORIO: 3
        }
    },
    
    // Configuración de localStorage keys
    STORAGE: {
        AUTH_TOKEN: 'authToken',
        USER_ID: 'userId',
        PLAYER_ID: 'playerId',
        USERNAME: 'username',
        PLAYER_NAME: 'playerName',
        CURRENT_LEVEL: 'currentLevel',
        GAME_STATE: 'gameState'
    },
    
    // Colores del juego
    COLORS: {
        BACKGROUND: '#0a0a0a',
        PRIMARY: '#cc0000',
        SECONDARY: '#4a0000',
        TEXT: '#ffffff',
        TEXT_DARK: '#666666',
        SUCCESS: '#00ff00',
        ERROR: '#ff0000',
        WARNING: '#ffaa00',
        CARD_BORDER: '#ffffff',
        CARD_DISABLED: '#1a1a1a',
        CARD_SELECTED: '#cc0000',
        CARD_AVAILABLE: '#4a0000'
    },
    
    // Rutas de assets
    ASSETS: {
        CARDS: 'assets/cards/',
        SPRITES: 'assets/sprites/',
        SOUNDS: 'assets/sounds/',
        MUSIC: 'assets/music/'
    },
    
    // Mensajes del juego
    MESSAGES: {
        ERROR: {
            NO_CONNECTION: 'Error de conexión con el servidor',
            NO_AUTH: 'No estás autenticado',
            CARD_LOAD_FAILED: 'Error al cargar las cartas',
            COMBAT_START_FAILED: 'Error al iniciar combate',
            COMBAT_END_FAILED: 'Error al finalizar combate'
        },
        SUCCESS: {
            LOGIN: 'Login exitoso',
            REGISTER: 'Usuario registrado',
            COMBAT_WIN: '¡VICTORIA!',
            COMBAT_LOSE: 'DERROTA'
        }
    },
    
    // Configuración de desarrollo
    DEV: {
        DEBUG_MODE: false,
        LOG_API_CALLS: true,
        SKIP_AUTH: false
    }
};

// Hacer CONFIG disponible globalmente
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

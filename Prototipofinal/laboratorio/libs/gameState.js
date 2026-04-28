/**
 * ENDLESS NIGHTMARE RITUAL - SISTEMA DE INVENTARIO GLOBAL
 * ========================================================
 * Sistema centralizado para manejar inventario, sangre y secretos del jugador
 * Persiste datos en localStorage para mantener progreso entre escenas
 */

const GameState = {
    
    /**
     * Obtener clave de almacenamiento única por jugador
     * @returns {string} Clave de localStorage
     */
    _getStorageKey() {
        const playerId = localStorage.getItem('playerId');
        return playerId ? `playerData_${playerId}` : 'playerData';
    },
    
    /**
     * Inicializar datos del jugador
     * @param {string} username - Nombre del usuario logueado
     * @returns {object} Datos del jugador
     */
    init(username) {
        const existing = localStorage.getItem(this._getStorageKey());
        if (existing) {
            const data = JSON.parse(existing);
            data.username = username;
            this.save(data);
            return data;
        }
        const newPlayer = {
            username: username,
            blood: 100,
            maxBlood: 100,
            
            inventory: {
                demonCards: [],
                loreCards: []
            },
            
            stats: {
                secretsDiscovered: 0,
                labyrinthsCompleted: 0,
                combatsWon: 0,
                combatsLost: 0,
                chestsOpened: 0
            },
            
            currentLevel: "escuela",
            chestsOpened: [] // IDs de cofres ya abiertos
        };
        
        this.save(newPlayer);
        return newPlayer;
    },
    
    /**
     * Guardar datos en localStorage
     * @param {object} playerData - Datos del jugador a guardar
     */
    save(playerData) {
        localStorage.setItem(this._getStorageKey(), JSON.stringify(playerData));
    },
    
    /**
     * Cargar datos desde localStorage
     * @returns {object|null} Datos del jugador o null si no existen
     */
    load() {
        const data = localStorage.getItem(this._getStorageKey());
        return data ? JSON.parse(data) : null;
    },
    
    /**
     * Resetear todos los datos del jugador
     */
    reset() {
        localStorage.removeItem(this._getStorageKey());
    },
    
    /**
     * SINCRONIZACIÓN CON API - Guardar progreso en el servidor
     */
    async sync() {
        const API_URL = 'http://localhost:3000/api';
        const playerId = localStorage.getItem('playerId');
        
        if (!playerId) {
            console.warn('No se puede sincronizar: sin playerId');
            return false;
        }
        
        const data = this.load();
        if (!data) {
            console.warn('No hay datos para sincronizar');
            return false;
        }
        
        try {
            const response = await fetch(`${API_URL}/player/${playerId}/sync`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    blood_current: data.blood,
                    secrets_discovered: data.stats.secretsDiscovered
                })
            });
            
            if (response.ok) {
                console.log('Progreso guardado en el servidor');
                return true;
            } else {
                console.error('Error al guardar:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('Error de red al guardar:', error);
            return false;
        }
    }
};

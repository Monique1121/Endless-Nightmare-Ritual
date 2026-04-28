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
            
            areasUnlocked: {
                school: true,
                hospital: false,
                laboratory: false
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
     * Actualizar sangre del jugador
     * @param {number} amount - Cantidad a sumar/restar (puede ser negativo)
     * @returns {number} Nueva cantidad de sangre
     */
    updateBlood(amount) {
        const data = this.load();
        if (!data) return 0;
        
        data.blood = Math.min(Math.max(data.blood + amount, 0), data.maxBlood);
        this.save(data);
        
        // Sincronizar con servidor
        this.sync();
        
        return data.blood;
    },
    
    /**
     * Obtener sangre actual
     * @returns {number} Sangre actual
     */
    getBlood() {
        const data = this.load();
        return data ? data.blood : 100;
    },
    
    /**
     * Establecer sangre a un valor específico
     * @param {number} value - Valor de sangre
     */
    setBlood(value) {
        const data = this.load();
        if (!data) return;
        
        data.blood = Math.min(Math.max(value, 0), data.maxBlood);
        this.save(data);
        
        // Sincronizar con servidor
        this.sync();
    },
    
    /**
     * Añadir carta de demonio al inventario
     * @param {number} cardId - ID de la carta
     * @param {string} cardName - Nombre de la carta
     * @param {string} cardImage - Ruta de la imagen (opcional)
     */
    addDemonCard(cardId, cardName, cardImage = null) {
        const data = this.load();
        if (!data) return;
        
        const existing = data.inventory.demonCards.find(c => c.id === cardId);
        if (existing) {
            existing.quantity++;
        } else {
            data.inventory.demonCards.push({
                id: cardId,
                name: cardName,
                image: cardImage || `../../assets/cards/${cardName.replace(/\s/g, '_')}.png`,
                quantity: 1
            });
        }
        
        this.save(data);
    },
    
    /**
     * Añadir carta de lore/secreto al inventario
     * @param {number} loreId - ID del secreto
     * @param {string} title - Título del secreto
     * @param {string} text - Texto/descripción del secreto
     */
    addLoreCard(loreId, title, text) {
        const data = this.load();
        if (!data) return;
        
        const existing = data.inventory.loreCards.find(c => c.id === loreId);
        if (!existing) {
            data.inventory.loreCards.push({
                id: loreId,
                title: title,
                description: text
            });
            data.stats.secretsDiscovered++;
            this.save(data);
        }
    },
    
    /**
     * Verificar si un cofre ya fue abierto
     * @param {string} chestId - ID único del cofre
     * @returns {boolean} true si ya fue abierto
     */
    isChestOpened(chestId) {
        const data = this.load();
        return data ? data.chestsOpened.includes(chestId) : false;
    },
    
    /**
     * Marcar cofre como abierto
     * @param {string} chestId - ID único del cofre
     */
    openChest(chestId) {
        const data = this.load();
        if (!data) return;
        
        if (!data.chestsOpened.includes(chestId)) {
            data.chestsOpened.push(chestId);
            data.stats.chestsOpened++;
            this.save(data);
        }
    },
    
    /**
     * Obtener todas las cartas de demonio
     * @returns {array} Array de cartas
     */
    getDemonCards() {
        const data = this.load();
        return data ? data.inventory.demonCards : [];
    },
    
    /**
     * Obtener todos los secretos/lore
     * @returns {array} Array de secretos
     */
    getLoreCards() {
        const data = this.load();
        return data ? data.inventory.loreCards : [];
    },
    
    /**
     * Actualizar estadísticas
     * @param {string} stat - Nombre de la estadística
     * @param {number} increment - Cantidad a incrementar (default: 1)
     */
    updateStat(stat, increment = 1) {
        const data = this.load();
        if (!data || !data.stats.hasOwnProperty(stat)) return;
        
        data.stats[stat] += increment;
        this.save(data);
        
        // Sincronizar con la API después de actualizar estadísticas
        this.sync();
    },
    
    /**
     * Obtener estadísticas
     * @returns {object} Objeto con todas las estadísticas
     */
    getStats() {
        const data = this.load();
        return data ? data.stats : null;
    },
    // SINCRONIZACIÓN CON API
    
    /**
     * Sincronizar datos del jugador con el servidor
     * Envía el estado actual de localStorage a la base de datos
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
                console.log('Estado sincronizado con el servidor');
                return true;
            } else {
                console.error('Error al sincronizar:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('Error de red al sincronizar:', error);
            return false;
        }
    },
    
    /**
     * Cargar datos del jugador desde el servidor
     * Sobrescribe localStorage con los datos de la BD
     */
    async loadFromServer() {
        const API_URL = 'http://localhost:3000/api';
        const playerId = localStorage.getItem('playerId');
        const username = localStorage.getItem('username');
        
        if (!playerId) {
            console.warn('No se puede cargar desde servidor: sin playerId');
            return false;
        }
        
        try {
            // Cargar inventario completo
            const response = await fetch(`${API_URL}/player/${playerId}/inventory`);
            
            if (!response.ok) {
                throw new Error('Error al cargar datos del servidor');
            }
            
            const { inventory } = await response.json();
            const localData = this.load() || this.init(username);
            
            localData.blood = inventory.blood_current || 100;
            localData.maxBlood = inventory.blood_max || 100;
            localData.stats.secretsDiscovered = inventory.secrets_count || 0;
            
            localData.inventory.demonCards = inventory.cards.map(card => ({
                id: card.Card_id,
                name: card.Card_name,
                image: card.Sprite_path || `../assets/cards/default.png`,
                bloodCost: card.Blood_cost,
                damage: card.Damage,
                hp: card.HP,
                quantity: 1
            }));
            
            const seen = {};
            localData.inventory.demonCards = localData.inventory.demonCards.filter(card => {
                if (seen[card.id]) {
                    return false;
                }
                seen[card.id] = true;
                return true;
            });
            
            // Cargar secretos descubiertos
            localData.inventory.loreCards = (inventory.secrets || []).map(secret => ({
                id: secret.Secret_id,
                title: secret.Secret_name,
                description: secret.Content
            }));
            
            // Cargar estado de áreas desbloqueadas desde el servidor
            try {
                const statsResponse = await fetch(`${API_URL}/player/${playerId}/stats`);
                if (statsResponse.ok) {
                    const { stats } = await statsResponse.json();
                    localData.areasUnlocked = {
                        school: stats.School_unlocked || false,
                        hospital: stats.Hospital_unlocked || false,
                        laboratory: stats.Laboratory_unlocked || false
                    };
                    console.log('Areas desbloqueadas:', localData.areasUnlocked);
                }
            } catch (err) {
                console.error('Error cargando estado de áreas:', err);
                localData.areasUnlocked = { school: true, hospital: false, laboratory: false };
            }
            
            this.save(localData);
            console.log(`Sangre: ${localData.blood}/${localData.maxBlood}`);
            console.log(`Cartas: ${inventory.cards.length}`);
            console.log(`Secretos: ${inventory.secrets ? inventory.secrets.length : 0}`);
            return true;
        } catch (error) {
            console.error('Error al cargar desde servidor:', error);
            return false;
        }
    },
    
    /**
     * Verificar si un área está desbloqueada
     * @param {string} area - 'school', 'hospital' o 'laboratory'
     * @returns {boolean}
     */
    isAreaUnlocked(area) {
        const data = this.load();
        if (!data || !data.areasUnlocked) return false;
        return data.areasUnlocked[area] || false;
    }
};

// Este helper se hizo para no revolver la recoleccion de cartas con toda la logica del laberinto.
// Aqui solo se resuelve deck, run activo y lo que se gana o se pierde en cofres.

class LabyrinthCardSystem {
    constructor(apiUrl = 'http://localhost:3000/api') {
        this.apiUrl = apiUrl;
        this.currentRunId = null;
        this.playerId = this.getPlayerId();
    }

    // Obtener ID del jugador desde localStorage
    getPlayerId() {
        const playerData = localStorage.getItem('player');
        if (playerData) {
            const player = JSON.parse(playerData);
            return player.Player_id || player.playerId;
        }
        return null;
    }

    // PASO 1: Verificar si el jugador tiene cartas (llamar al login)
    async ensurePlayerHasDeck() {
        if (!this.playerId) return false;

        try {
            const response = await fetch(`${this.apiUrl}/player/${this.playerId}/deck`);
            const data = await response.json();

            if (data.deck.length === 0) {
                // Dar 5 cartas iniciales
                await fetch(`${this.apiUrl}/player/${this.playerId}/deck/initialize`, { 
                    method: 'POST' 
                });
                console.log('Jugador recibio 5 cartas iniciales');
            }
            return true;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    // PASO 2: Iniciar laberinto (llamar al entrar)
    async startRun(labyrinthId) {
        try {
            // Aqui se abre el run antes de entrar al laberinto para que todo quede ligado al player.
            const response = await fetch(`${this.apiUrl}/run/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.playerId, labyrinthId })
            });

            const data = await response.json();
            if (data.success) {
                this.currentRunId = data.runId;
                localStorage.setItem('activeRunId', data.runId);
                return data.runId;
            }
            return null;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    // PASO 3: Recoger carta de cofre
    async collectCard(cardId) {
        if (!this.currentRunId) {
            this.currentRunId = localStorage.getItem('activeRunId');
        }

        try {
            // La carta se guarda en temporal hasta que el run se complete de verdad.
            const response = await fetch(`${this.apiUrl}/run/${this.currentRunId}/card/collect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.playerId, cardId })
            });

            const data = await response.json();
            if (data.success) {
                console.log('Carta recolectada:', data.card.Card_name);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    // PASO 4A: Completar laberinto (guardar cartas)
    async completeLabyrinth() {
        try {
            const response = await fetch(`${this.apiUrl}/run/${this.currentRunId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.playerId, timeTaken: 0 })
            });

            const data = await response.json();
            if (data.success) {
                console.log(`Laberinto completado: ${data.cardsGained} cartas guardadas`);
                this.currentRunId = null;
                localStorage.removeItem('activeRunId');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    // PASO 4B: Fallar laberinto (perder cartas)
    async failLabyrinth() {
        try {
            const response = await fetch(`${this.apiUrl}/run/${this.currentRunId}/fail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.playerId })
            });

            const data = await response.json();
            if (data.success) {
                console.log(`Laberinto fallido: ${data.cardsLost} cartas perdidas`);
                this.currentRunId = null;
                localStorage.removeItem('activeRunId');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    // Ver deck permanente del jugador
    async getPermanentDeck() {
        try {
            const response = await fetch(`${this.apiUrl}/player/${this.playerId}/deck`);
            const data = await response.json();
            return data.success ? data.deck : [];
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }
}

// ============================================================
// EJEMPLO DE USO
// ============================================================
/*
// 1. Al iniciar sesión
const cardSystem = new LabyrinthCardSystem();
await cardSystem.ensurePlayerHasDeck();

// 2. Al entrar al laberinto
await cardSystem.startRun(1);

// 3. Cuando encuentra cofre con carta
await cardSystem.collectCard(16);

// 4A. Al completar laberinto
await cardSystem.completeLabyrinth();

// 4B. Al morir en laberinto
await cardSystem.failLabyrinth();
*/

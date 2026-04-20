# ENDLESS NIGHTMARE RITUAL - Sistema de Juego Completo
## Versión Final 1.0

### 📁 Estructura de Archivos

```
PruebaJohann/
├── menu.html           ← MENÚ PRINCIPAL (Inicio del juego)
├── forest-map.html     ← Mapa del Bosque (Selección de niveles jugable)
├── index.html          ← Laberinto de la Escuela Abandonada
├── battle.html         ← Sistema de Combate TCG
├── game.js             ← Lógica del TCG
├── style.css           ← Estilos del TCG
└── README_MENU.md      ← Esta documentación
```

### 🎮 Flujo del Juego

#### **IMPORTANTE:** Inicia el juego abriendo `menu.html`

```
1. menu.html (Menú Principal)
      ↓
   [Jugar]
      ↓
2. forest-map.html (Mapa del Bosque)
   - Camina con WASD
   - Explora el bosque
   - Acércate a edificios
      ↓
   [Presiona E en la Escuela]
      ↓
3. index.html (Laberinto)
   - Escapa del laberinto
   - Usa la linterna
   - Encuentra la salida
      ↓
   [Llegar a la salida]
      ↓
4. battle.html (Combate TCG)
   - Sistema de cartas
   - Derrota al rival
      ↓
   [Volver al mapa]
      ↓
   Regresa a forest-map.html
```

### 🌲 Mapa del Bosque (`forest-map.html`)

**Características:**
- Mapa top-down jugable estilo RPG retro
- Controles: **WASD** o Flechas para moverte
- **E** para interactuar con edificios

**Edificios disponibles:**
- 🏫 **Escuela Abandonada** ✅ (Funcional)
  - Nivel 1: Laberinto procedural
  - Nivel 2: Combate TCG
- 🏥 **Hospital Abandonado** 🔒 (Próximamente)
- 🔬 **Laboratorio Abandonado** 🔒 (Próximamente)

**Mecánica:**
1. Camina por el bosque
2. Acércate a un edificio
3. Aparece el mensaje "Presiona E"
4. Pulsa **E** para ver información
5. Haz clic en "Entrar" para acceder al nivel

### 🌀 Laberinto - Escuela Abandonada (`index.html`)

**Objetivo:** Escapar del laberinto antes de que se acabe el tiempo

**Características:**
- Laberinto procedural generado aleatoriamente
- Sistema de linterna con visibilidad limitada
- Límite de tiempo (60 segundos)
- Portal demoníaco en la salida

**Controles:**
- **WASD / Flechas**: Moverte
- **R**: Regenerar laberinto
- **Mouse**: Apuntar linterna
- **Botón ◄ Menú**: Volver al menú principal

**Victoria:** Al llegar a la salida (portal rojo), automáticamente pasa al combate TCG

### ⚔️ Sistema de Combate TCG (`battle.html`)

**Objetivo:** Derrotar al rival reduciendo su sangre a 0 o eliminando 6 de sus cartas

**Mecánicas:**
- 50 puntos de sangre (se regeneran +2 por turno)
- Máximo 3 cartas por turno
- Sistema de sacrificio para ganar poder
- Banco de 4 cartas defensivas
- 1 carta activa ofensiva

**Controles:**
- **Clic en carta**: Seleccionar de tu mano
- **Clic en slot**: Colocar carta
- **⚔️ ATACAR**: Atacar al rival
- **⚡ SACRIFICAR**: Sacrificar carta en banco por +5 sangre
- **⏸️ TERMINAR TURNO**: Pasar turno
- **◄ Mapa**: Volver al mapa del bosque

### 🎯 Navegación Completa

### 🎯 Navegación Completa

**Desde cualquier pantalla:**
- Desde **Mapa del Bosque**: Botón "◄ Menú Principal" (esquina inferior izquierda)
- Desde **Laberinto**: Botón "◄ Menú" (HUD superior)
- Desde **Combate TCG**: Botón "◄ Mapa" (header)

**Atajos de teclado:**
- **ESC**: Cerrar diálogos / Volver
- **Enter**: Confirmar / Jugar (en menú principal)
- **E**: Interactuar (en mapa del bosque)

### 🎨 Características del Sistema

✨ **Menú Principal:**
- Logo con efecto glitch
- Partículas animadas de sangre
- Viñeta atmosférica
- Efectos hover en botones

🌲 **Mapa del Bosque:**
- Gráficos pixel art estilo top-down
- Colisiones con edificios
- Sistema de interacción contextual
- Indicadores de proximidad

🌀 **Laberinto:**
- Generación procedural
- Sistema de iluminación dinámico
- Efecto de linterna ajustable
- Temporizador de cuenta regresiva

⚔️ **Sistema TCG:**
- 10 cartas únicas
- Mecánicas de sacrificio
- Sistema de turnos
- Registro de eventos (log)

### 📝 Notas para Desarrollo

#### Agregar nuevos niveles al mapa:

1. Edita `forest-map.html`
2. Agrega el edificio en el array `buildings`:
   ```javascript
   {
     name: 'NUEVO NIVEL',
     desc: 'Descripción...',
     x: 10,  // posición X en grid
     y: 10,  // posición Y en grid
     width: 4,
     height: 3,
     color: '#8b7355',
     icon: '🏢',
     url: 'nuevo-nivel.html',
     unlocked: true
   }
   ```

#### Conectar un nivel al TCG:

En el archivo HTML del nivel, detecta la victoria y redirecciona:
```javascript
// Cuando el jugador gana
window.location.href = 'battle.html';
```

### 🚀 Para Jugar

**1.** Abre [menu.html](menu.html)  
**2.** Haz clic en "Jugar"  
**3.** Camina por el bosque con **WASD**  
**4.** Acércate a la 🏫 Escuela  
**5.** Presiona **E** y haz clic en "Entrar"  
**6.** Escapa del laberinto  
**7.** ¡Sobrevive al combate TCG!

### 🎭 Paleta de Colores

El juego mantiene una estética consistente:
- **Fondo**: Gradiente oscuro (#000 a #0a0308)
- **Acentos primarios**: Rojo sangre (#d24444, #ff6b6b)
- **Acentos secundarios**: Azul oscuro (para botones de navegación)
- **Texto**: Blanco/Crema (#ffdede, #ddd)
- **Fuentes**: 
  - Logo: 'Creepster' (horror)
  - UI: 'VT323' (retro pixel)

---

**Estado del Proyecto:**
- ✅ Menú Principal
- ✅ Mapa del Bosque (Selección jugable)
- ✅ Nivel 1: Laberinto de la Escuela
- ✅ Sistema de Combate TCG
- ✅ Flujo completo: Menú → Mapa → Laberinto → TCG
- 🔒 Hospital Abandonado (Próximamente)
- 🔒 Laboratorio Abandonado (Próximamente)

**Desarrollado por:** Tu Equipo de Desarrollo  
**Versión:** 1.0  
**Fecha:** Abril 2026

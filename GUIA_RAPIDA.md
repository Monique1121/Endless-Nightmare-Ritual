# 🎮 ENDLESS NIGHTMARE RITUAL - Guía Rápida
### Flujo del Juego

```
┌─────────────────────────────────────────────────────────────────┐
│                      MENÚ PRINCIPAL                             │
│                      (menu.html)                                │
│                                                                 │
│  ╔═══════════════════════════════════════╗                     │
│  ║   ENDLESS NIGHTMARE RITUAL            ║                     │
│  ║                                       ║                     │
│  ║   [Jugar]                            ║                     │
│  ║   [Opciones]                         ║                     │
│  ║   [Créditos]                         ║                     │
│  ║   [Salir del Juego]                  ║                     │
│  ╚═══════════════════════════════════════╝                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Click en [Jugar]
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MAPA DEL BOSQUE                               │
│                 (forest-map.html)                               │
│                                                                 │
│     🌲    🌲    🌲    🌲    🌲    🌲    🌲    🌲                │
│         🏫            🏥           🔬                           │
│       ESCUELA      HOSPITAL    LABORATORIO                     │
│     [DESBLOQUEADA]  [BLOQUEADO]  [BLOQUEADO]                  │
│                                                                 │
│            🚶 ← Personaje (Controla con WASD)                  │
│                                                                 │
│     Acércate a la Escuela y presiona [E]                       │
│                                                                 │
│     [◄ Menú Principal] (Botón abajo-izquierda)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Presiona E + Entrar
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              LABERINTO - ESCUELA ABANDONADA                     │
│                    (index.html)                                 │
│                                                                 │
│  ╔═════════════════════════════════════════════════╗           │
│  ║  ███████  ███  ███   Tiempo: 00:60              ║           │
│  ║  █     █  █ █  █ █                              ║           │
│  ║  █  🚶  ·  · ·  █ █   💡 Linterna: ON            ║           │
│  ║  █           ██  █ █                            ║           │
│  ║  ██████████  ·   · ·   [WASD] Moverte          ║           │
│  ║         █ █  ·   ███   [R] Regenerar           ║           │
│  ║  ███    · ·  ·   · 🔴 ← SALIDA (Portal)        ║           │
│  ║  █ █    ███  ████  █                            ║           │
│  ╚═════════════════════════════════════════════════╝           │
│                                                                 │
│  Objetivo: Llega al Portal 🔴 antes de que se acabe el tiempo  │
│                                                                 │
│  [◄ Menú] (Botón superior)                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Al llegar a la salida 🔴
                              ▼
                    ¡Escapaste del laberinto!
                   Pero tu pesadilla apenas comienza...
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  COMBATE - RITUAL TCG                           │
│                    (battle.html)                                │
│                                                                 │
│  ╔══════════════════════════════════════════════════════════╗  │
│  ║  RIVAL                    Sangre: 50/50                  ║  │
│  ║  Cartas Perdidas: 0/6                                    ║  │
│  ║                                                          ║  │
│  ║  [🂠] [🂠] [🂠] [🂠] ← Mano del Rival                     ║  │
│  ║                                                          ║  │
│  ║    [____] [____] [____] [____] ← Banco Rival            ║  │
│  ║              [________]  ← Carta Activa Rival           ║  │
│  ║                                                          ║  │
│  ║    ─────────── VS ───────────                           ║  │
│  ║                                                          ║  │
│  ║              [________]  ← Carta Activa Jugador         ║  │
│  ║    [____] [____] [____] [____] ← Banco Jugador          ║  │
│  ║                                                          ║  │
│  ║  Tu Mano: [📇] [📇] [📇] [📇] [📇]                       ║  │
│  ║                                                          ║  │
│  ║  [⚔️ ATACAR] [⚡ SACRIFICAR] [⏸️ TERMINAR TURNO]         ║  │
│  ╚══════════════════════════════════════════════════════════╝  │
│                                                                 │
│  Objetivo: Reduce la sangre del rival a 0                      │
│           O elimina 6 de sus cartas                            │
│                                                                 │
│  [◄ Mapa] (Volver al bosque) [Reiniciar] (Nueva batalla)      │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Controles Rápidos

| Pantalla | Controles |
|----------|-----------|
| **Menú Principal** | Click en botones |
| **Mapa del Bosque** | WASD/Flechas = Moverse<br>E = Interactuar |
| **Laberinto** | WASD/Flechas = Moverse<br>R = Regenerar<br>Mouse = Apuntar linterna |
| **Combate TCG** | Click = Seleccionar/Jugar cartas<br>Botones = Acciones de combate |

## 📋 Checklist para Jugar

- [ ] 1. Abre `menu.html`
- [ ] 2. Haz clic en "Jugar"
- [ ] 3. Camina con WASD hasta la 🏫 Escuela
- [ ] 4. Presiona E cuando aparezca "Presiona E"
- [ ] 5. Click en "Entrar"
- [ ] 6. Escapa del laberinto llegando al portal 🔴
- [ ] 7. ¡Sobrevive al combate de cartas!

## 🔄 Bucle de Juego

```
Mapa del Bosque
     ↓
  Nivel 1
     ↓
  Combate
     ↓
Volver al Mapa ────┐
     ↑             │
     └─────────────┘
   (Repite para otros niveles)
```

---
**¡Disfruta tu pesadilla! 😈**

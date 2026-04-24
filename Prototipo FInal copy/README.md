# Juego Endless Nightmare Ritual
# Juan Carlos Luz Gallardo
# Aranaza Monique
# Julian Berges

## Cómo ejecutar

Abre el archivo `login/index.html` en el navegador. Desde ahí inicia sesión y empieza el juego.
El usuario y contraseña momentaneo con 4 caracteres

usuario: juan
contraseña: 1234

## Controles

### Lobby y áreas de exploración
- **WASD** - Movimiento del personaje
- **E** - Interactuar con zonas especiales (hospital, laboratorio, escuela)

### Laberinto
- Brujula para saber donde esta la salida
- Tienes 60 segundos para llegar a la salida
- Si se acaba el tiempo, regresas al lobby

### TCG (Juego de Cartas)
- **Click** - Seleccionar cartas y objetivos
- **Botones en pantalla**:
  - ATACAR - Ataca con tu carta activa
  - TERMINAR - Termina tu turno
  - SACRIFICIO - Sacrifica una carta del banco para obtener sangre

## Qué funciona

### Completado
- Sistema de login básico
- Menú principal
- Lobby con movimiento libre
- Entrada a tres áreas: Hospital, Laboratorio y Escuela
- Laberinto procedural con sistema de tiempo límite
- Juego de cartas TCG completo (sistema de combate, puntos de vida, knockouts)
- Flujo completo: Si pasas el laberinto vas al TCG, si ganas vuelves al lobby

### En desarrollo
- Hospital - La zona existe pero aún no tiene mecánicas implementadas
- Laboratorio - Mismo caso, falta contenido interno
- Balance del TCG - Los valores de las cartas necesitan ajustes
- Sistema de guardado - Por ahora no se guarda progreso

## Notas

El prototipo está pensado para jugar todo de corrido. No cierres las ventanas del navegador o perderás el progreso.

La navegación entre escenas usa iframes en algunos lugares, así que si algo no funciona bien pruebe recargar desde el login profe jajaja, no logre saber como quitar que aveces se trabe eso.

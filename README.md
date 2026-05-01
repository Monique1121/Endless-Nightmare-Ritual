## Endless Nightmare Ritual

Endless Nightmare Ritual es un TCG roguelite donde encarnas a un detective atrapado en un mundo tomado por un culto demoníaco. Cada laberinto es generado
aleatoriamente y esconde cartas y secretos que podrás usar en combates estratégicos por turnos, donde la sangre es tu único recurso.

En este repositorio, el proyecto está organizado de manera diferente a las carpetas requeridas en la entrega por cuestiones por funcionalidad dado que
al crecer el proyecto y tener ya rutas asignadas para cada archivo, el mover todo a las carpetas pedidas terminaría resultando en que se rompa el juego.
Debido al tiempo y otros factores, se mantendrá el orden original del equipo procurando especificar de forma correcta como correr el juego.

El frontend vive en pagina_principal/, menu/, login/, lobby/, TCG/ y 
las pantallas de escenario (Maze/, hospital/, laboratorio/). El backend está en API/ y la base de datos en base_datos/.

Estado actual del proyecto:

- El frontend está implementado con HTML, CSS y JavaScript.
- El juego incluye flujo de título, login, lobby, laberinto y sistema de combate por cartas.
- El backend expone una API REST en Express para autenticación, gestión de partidas y estadísticas.
- La base de datos está modelada y disponible en base_datos/.
- El juego cuenta con música y assets propios organizados en musica/ y assets/.

Requisitos (herramienta y versión recomendada:
Node.js - 18 o superior
npm - 9 o superior
MySQL - 8 o superior

Estructura del proyecto:

Endless-Nightmare-Ritual/
└── Codigo/
    ├── TCG/      # Contiene el combate de cartas.
    │   ├── game.html
    │   ├── game.js
    │   └── style.css
    ├── pagina_principal/      # Contiene los archivos de la página web.
    │   ├── Backend/
    │   ├── css/
    │   ├── html/
    │   │   ├── index.html      ### NOTA IMPORTANTE: Abrir este archivo para ingresar a la página web y todo el proyecto.
    │   │   ├── login.html
    │   │   ├── logros.html
    │   │   └── tutorial.html
    │   ├── js/
    │   ├── login/
    │   │   ├── assets/
    │   │   ├── css/
    │   │   ├── html/
    │   │   │   ├── creditos.html
    │   │   │   ├── estadisticas.html
    │   │   │   ├── historia.html
    │   │   │   ├── inicio.html 
    │   │   │   ├── jugar.html
    │   │   │   └── tutorial.html
    │   │   ├── js/
    │   │   ├── index.html
    │   │   ├── login.js
    │   │   ├── main.html
    │   │   ├── main.js
    │   │   └── styles.css
    │   ├── index.html
    │   ├── login.js
    │   ├── main.html
    │   ├── main.js
    │   └── styles.css
    ├── musica/      # Contiene la música del juego.
    │   ├── Dark Drone.flac
    │   ├── Jesús Lastra - Abandoned.mp3
    │   └── my_white_noiz_.ogg
    ├── menu/      # Contiene el menú del juego.
    │   ├── assets/
    │   ├── menu.html
    │   ├── menu.js
    │   └── menu-style.css
    ├── Maze/      # Contiene el laberinto del juego.
    │   ├── assets/
    │   ├── css/
    │   ├── html/
    │   │   └── laberinto_cofres.html
    │   └── js/
    ├── login/      # Contiene el sistema de login del juego.
    │   ├── index.html
    │   ├── login.js
    │   ├── main.html
    │   ├── main.js
    │   └── styles.css
    ├── lobby/      # Contiene el lobby del juego.
    │   ├── assets/
    │   ├── libs/
    │   ├── lobbyV1.html
    │   ├── lobbyV1.js
    │   └── styles.css
    ├── laboratorio/      # Contiene el mapa del laberinto del juego.
    │   ├── assets/
    │   ├── libs/
    │   ├── laboratorio.html
    │   ├── laboratorio.js
    │   └── styles.css
    ├── hospital/      # Contiene el mapa del hospital del juego.
    │   ├── assets/
    │   ├── libs/
    │   ├── hospital.html
    │   ├── hospital.js
    │   └── styles.css
    ├── base_datos/      # Contiene la base de datos del juego.
    │   └── endless-schema.sql
    ├── assets/      # Contiene los assets utilizados en el juego.
    │   ├── cards/
    │   ├── backgroundMusic.js
    │   ├── bosqueescuela.png
    │   ├── gracias.png
    │   └── menu.png
    └── API/      # Contiene la API del juego para realizar la conexión con la base de datos.
        ├── node_modules/
        ├── .env.example
        ├── package.json
        ├── package-lock.json
        └── server.js

Instalación del backend desde la terminal

0. Instala Node.js desde https://nodejs.org (versión 18 o superior)

1. Entra a la carpeta del servidor:

cd codigo/API

2. Instala dependencias:

npm install

3. Instala los paquetes necesarios:

npm install express cors mysql2 dotenv

4. Crea la base de datos y carga el esquema:

Primera opción:

Carga el esquema en MySQL Workbench:

Abre MySQL Workbench y conéctate a tu servidor local
Ve a File > Open SQL Script y selecciona Codigo/base_datos/endless-schema.sql
Ejecuta el script con el botón ⚡ o Ctrl + Shift + Enter

Segunda opción:

mysql -u tu_usuario -p < ../base_datos/endless-schema.sql

> El esquema de la base de datos se encuentra en `Codigo/base_datos/endless-schem

5. Crea tu archivo .env a partir del ejemplo:

cp .env.example .env

Contenido base de .env.example:

PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=endless
DB_PORT=3306

Corre el siguiente comando:

node server.js

6. Inicia el servidor:

npm run dev

El cliente del juego está en: Código/pagina_principal/html/index.html

## Flujo de juego actual

1. Pantalla de título / página principal
2. Login o registro 
3. Lobby
4. Selección de escenario (Hospital, Laberinto o Laboratorio)
5. Laberinto
6. Combate automático por rondas con cartas
7. Reporte de combate al finalizar
8. Repetición del ciclo hasta completar la run o ser derrotado


## Mecánicas principales implementadas

- Múltiples escenarios con temática de horror (Hospital, Laberinto, Laboratorio)
- Progresión roguelite: cada run genera condiciones únicas
- Reportes detallados de combate
- Login y registro con persistencia de progreso
- Música y efectos de sonido integrados
- Assets visuales propios

## API disponible

Todas las rutas corren bajo `API/server.js` en el prefijo `/api/`:

Rutas principales:

- POST /register, POST /login
- GET/POST/PUT /player/:id, /player/:id/stats, /inventory, /sync, /reset
- GET /cards/pool, GET/POST /player/:id/deck
- POST /run/create, GET /run/:id/info, POST /run/:id/complete, POST /run/:id/fail
- POST /combat/start, PUT /combat/:id/end, GET /combat/:id/log`, GET /combat/stats
- GET /labyrinth/:id, GET /enemy/level/:id
- GET /secrets, POST /player/:id/secrets, POST /chest/:id/open
- GET /admin/dashboard, DELETE /admin/users/:id

Tecnologías usadas

- **Frontend:** HTML5, CSS, JavaScript
- **Backend:** Node.js, Express
- **Base de datos:** MySQL 8
- **Audio:** archivos de música integrados en `musica/`
- **Persistencia local adicional:** localStorage

  
Equipo:

- Arantza Monique Mercado Moreno
- Julián Berges Navarrete
- Juan Carlos Luz Gallardo

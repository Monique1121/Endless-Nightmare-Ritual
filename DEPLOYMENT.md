# 🚀 Guía de Despliegue — Endless Nightmare Ritual

Este documento explica cómo levantar la página web tanto en un entorno **local** como en un servidor **externo**.

---

## 📋 Requisitos previos

| Herramienta | Versión mínima | Uso |
|-------------|---------------|-----|
| [Node.js](https://nodejs.org/) | 14+ | Servidor local |
| Navegador moderno | — | Chrome, Firefox, Edge, Safari |

> **Alternativa sin Node.js:** también puedes servir el proyecto con Python (ver sección [Otras formas de servir en local](#otras-formas-de-servir-en-local)).

---

## 🖥️ Entorno Local (localhost)

### Opción 1 — Servidor Node.js incluido (recomendado)

1. Clona el repositorio o descarga el código fuente:
   ```bash
   git clone https://github.com/Monique1121/Endless-Nightmare-Ritual.git
   cd Endless-Nightmare-Ritual
   ```

2. Inicia el servidor:
   ```bash
   node server.js
   ```
   O usando el script de npm:
   ```bash
   npm start
   ```

3. Abre el navegador y accede a:
   ```
   http://localhost:3000
   ```
   El servidor redirige automáticamente al menú principal del juego (`/PrototipoV1/menu.html`).

4. Para cambiar el puerto, define la variable de entorno `PORT` antes de iniciar:
   ```bash
   PORT=8080 node server.js
   ```

5. Para detener el servidor presiona **Ctrl + C** en la terminal.

---

### Otras formas de servir en local

#### Python 3
```bash
python -m http.server 3000
# Luego abre: http://localhost:3000/PrototipoV1/menu.html
```

#### Python 2
```bash
python -m SimpleHTTPServer 3000
# Luego abre: http://localhost:3000/PrototipoV1/menu.html
```

#### VS Code — extensión Live Server
1. Instala la extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
2. Abre el archivo `PrototipoV1/menu.html` en VS Code.
3. Haz clic en **"Go Live"** en la barra de estado inferior.
4. El navegador se abrirá automáticamente.

---

## 🌐 Entorno Externo (GitHub Pages)

El repositorio incluye un flujo de trabajo de **GitHub Actions** (`.github/workflows/pages.yml`) que despliega el proyecto automáticamente en [GitHub Pages](https://pages.github.com/) cada vez que se hace `push` a la rama `main`.

### Pasos para activar GitHub Pages

1. Ve a la pestaña **Settings** de tu repositorio en GitHub.
2. En el menú lateral izquierdo, selecciona **Pages**.
3. En **Source**, elige **GitHub Actions**.
4. Haz un `push` a `main` (o ejecuta el workflow manualmente desde la pestaña **Actions**).
5. Una vez que el workflow finalice, la URL de tu sitio aparecerá en la sección **Pages**:
   ```
   https://<usuario>.github.io/Endless-Nightmare-Ritual/
   ```
6. Para llegar al menú principal del juego, accede a:
   ```
   https://<usuario>.github.io/Endless-Nightmare-Ritual/PrototipoV1/menu.html
   ```

> **Nota:** el primer despliegue puede tardar unos minutos. Los siguientes se ejecutan en segundos.

### Ejecutar el workflow manualmente

1. Ve a la pestaña **Actions** del repositorio.
2. Selecciona el workflow **"Deploy to GitHub Pages"**.
3. Haz clic en **"Run workflow"** → **"Run workflow"**.

---

## 🗂️ Estructura del proyecto

```
Endless-Nightmare-Ritual/
├── PrototipoV1/          ← Versión jugable principal
│   ├── menu.html         ← Menú principal (punto de entrada)
│   ├── forest-map.html   ← Mapa del bosque
│   ├── index.html        ← Laberinto
│   └── battle.html       ← Combate TCG
├── prototipoV2/          ← Segunda versión (en desarrollo)
├── DB/                   ← Esquema de base de datos
├── server.js             ← Servidor local (Node.js)
├── package.json          ← Configuración Node.js
└── .github/
    └── workflows/
        └── pages.yml     ← Despliegue automático a GitHub Pages
```

---

## 🔌 Conexión con API y base de datos

El juego en su estado actual es **frontend puro** (HTML + CSS + JS) y no requiere base de datos ni API para funcionar. El archivo `DB/EndlessDB.sql` contiene el esquema de la base de datos para una futura versión con backend.

Cuando se integre un backend, deberá:

1. Definir la URL base de la API según el entorno:
   ```javascript
   // En el código JavaScript del juego
   const API_URL =
       window.location.hostname === "localhost"
           ? "http://localhost:3000/api"          // Local
           : "https://api.tu-dominio.com/api";    // Externo
   ```

2. Arrancar el servidor de base de datos antes de iniciar el servidor local.

---

## ✅ Lista de verificación antes de desplegar

- [ ] El servidor local arranca sin errores (`npm start`)
- [ ] El menú principal se muestra en `http://localhost:3000`
- [ ] La navegación entre pantallas funciona correctamente en local
- [ ] El workflow de GitHub Actions finaliza con estado **success**
- [ ] El menú principal es accesible en la URL de GitHub Pages
- [ ] La navegación entre pantallas funciona correctamente en GitHub Pages

---

## ❓ Solución de problemas comunes

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| `Cannot find module 'http'` | Node.js no instalado | Instala Node.js desde nodejs.org |
| `EADDRINUSE: port already in use` | Puerto 3000 ocupado | Usa `PORT=8080 node server.js` |
| Imágenes o assets no cargan | Rutas relativas rotas | Abre el juego desde el servidor, no con `file://` |
| GitHub Pages muestra 404 | Pages no configurado | Activa GitHub Pages en Settings → Pages → GitHub Actions |
| Fuentes de Google no cargan | Sin conexión a internet | Verifica tu conexión a internet |

# Endless Nightmare Ritual – REST API

Node.js / Express backend that connects the game, web frontend and MySQL database.

---

## Setup

### 1. Install dependencies

```bash
cd api
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in DB credentials and JWT secret
```

| Variable          | Description                                | Default       |
|-------------------|--------------------------------------------|---------------|
| `PORT`            | Port the server listens on                 | `3000`        |
| `NODE_ENV`        | Environment (`development` / `production`) | `development` |
| `DB_HOST`         | MySQL host                                 | `localhost`   |
| `DB_PORT`         | MySQL port                                 | `3306`        |
| `DB_USER`         | MySQL user                                 | `root`        |
| `DB_PASSWORD`     | MySQL password                             | –             |
| `DB_NAME`         | MySQL database name                        | `endless`     |
| `JWT_SECRET`      | Secret used to sign/verify JWT tokens      | –             |
| `JWT_EXPIRES_IN`  | Token expiry duration                      | `1h`          |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins. In development, localhost defaults are used when absent. In production an empty value blocks all cross-origin requests. | –  |

### 3. Prepare the database

Apply the schema before starting the server:

```bash
mysql -u root -p endless < ../DB/EndlessDB.sql
```

> **Note:** The `Player` table needs a `password_hash` column added to the original schema:
> ```sql
> ALTER TABLE Player ADD COLUMN password_hash CHAR(60) NOT NULL AFTER Blood_current;
> ```

### 4. Start

```bash
# Production
npm start

# Development (auto-restart on file change)
npm run dev
```

---

## Running tests

```bash
npm test
```

Tests use mocked database connections – no real MySQL instance required.

---

## Authentication

All endpoints except `POST /api/auth/register` and `POST /api/auth/login` require a valid JWT
in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained from the login/register endpoints and expire after 1 hour by default.

---

## Endpoints

### Health

| Method | Path          | Auth | Description         |
|--------|---------------|------|---------------------|
| GET    | `/api/health` | –    | Server health check |

---

### Auth

| Method | Path                    | Auth | Description              |
|--------|-------------------------|------|--------------------------|
| POST   | `/api/auth/register`    | –    | Create a player account  |
| POST   | `/api/auth/login`       | –    | Login and receive a JWT  |

#### POST `/api/auth/register`

**Request body:**
```json
{ "player_name": "Alice", "password": "secret123" }
```

**Response `201`:**
```json
{ "player_id": 1, "player_name": "Alice", "token": "<jwt>" }
```

#### POST `/api/auth/login`

**Request body:**
```json
{ "player_name": "Alice", "password": "secret123" }
```

**Response `200`:**
```json
{ "player_id": 1, "player_name": "Alice", "token": "<jwt>" }
```

---

### Players

| Method | Path               | Auth | Description                        |
|--------|--------------------|------|------------------------------------|
| GET    | `/api/players/:id` | ✅   | Get player profile                 |
| PUT    | `/api/players/:id` | ✅   | Update player stats (owner only)   |
| DELETE | `/api/players/:id` | ✅   | Delete player account (owner only) |

#### PUT `/api/players/:id`

**Request body (all fields optional):**
```json
{ "blood_max": 120, "blood_current": 80 }
```

---

### Cards

| Method | Path             | Auth | Description         |
|--------|------------------|------|---------------------|
| GET    | `/api/cards`     | ✅   | List all cards      |
| GET    | `/api/cards/:id` | ✅   | Get a single card   |

---

### Levels

| Method | Path               | Auth | Description        |
|--------|--------------------|------|--------------------|
| GET    | `/api/levels`      | ✅   | List all levels    |
| GET    | `/api/levels/:id`  | ✅   | Get a single level |

---

### Runs

| Method | Path            | Auth | Description                           |
|--------|-----------------|------|---------------------------------------|
| GET    | `/api/runs`     | ✅   | List all runs for the logged-in player |
| GET    | `/api/runs/:id` | ✅   | Get a single run                      |
| POST   | `/api/runs`     | ✅   | Start a new run                       |
| PUT    | `/api/runs/:id` | ✅   | Update run progress / completion      |

#### POST `/api/runs`

```json
{ "labyrinth_id": 1, "level_id": 1 }
```

#### PUT `/api/runs/:id`

**Request body (all fields optional):**
```json
{
  "blood_recovered": 20,
  "cards_found": 3,
  "secrets_found": 1,
  "completed": true,
  "time_taken": 600
}
```

---

### Combat

| Method | Path               | Auth | Description                              |
|--------|--------------------|------|------------------------------------------|
| GET    | `/api/combat`      | ✅   | List all combats for the logged-in player |
| GET    | `/api/combat/:id`  | ✅   | Get a single combat record               |
| POST   | `/api/combat`      | ✅   | Start a new combat encounter             |
| PUT    | `/api/combat/:id`  | ✅   | Update combat state / result             |

#### POST `/api/combat`

```json
{ "enemy_id": 2, "run_id": 5, "level_id": 1 }
```

#### PUT `/api/combat/:id`

**Request body (all fields optional):**
```json
{
  "result": "victory",
  "blood_used": 30,
  "player_lives": 2,
  "enemy_lives": 0
}
```

---

## Frontend integration

Include `prototipoV2/libs/api_client.js` in your HTML page before other game scripts:

```html
<script src="../../libs/api_client.js"></script>
```

Then use the `API` global object:

```js
// Register / login
const { token } = await API.auth.login("Alice", "password123");
API.setToken(token);

// Fetch cards
const cards = await API.cards.list();

// Start a run
const run = await API.runs.create({ labyrinth_id: 1, level_id: 1 });

// Update run when player finishes
await API.runs.update(run.Run_id, { completed: true, time_taken: 300 });
```

---

## Security measures

| Layer                  | Mechanism                                           |
|------------------------|-----------------------------------------------------|
| Authentication         | JWT (HS256) – token required for all game endpoints |
| Password storage       | bcrypt with salt rounds = 10                        |
| HTTP headers           | `helmet` sets secure defaults (CSP, HSTS, etc.)     |
| CORS                   | Restricted to configured `ALLOWED_ORIGINS`          |
| Rate limiting          | 100 requests / 15 min per IP via `express-rate-limit` |
| Ownership enforcement  | PUT/DELETE on player/run/combat check `player_id`   |
| SQL injection          | Parameterised queries via `mysql2`                  |

# Sportz

A real-time sports match tracking API built with Express 5, WebSockets, Drizzle ORM, and Neon Postgres.

Sportz provides a REST API for managing sports matches and live commentary, with a WebSocket server that pushes real-time updates to connected clients as matches are created, scores change, and commentary is added.

## Tech Stack

- **Runtime:** Node.js 22+ (ES Modules)
- **Framework:** Express 5
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM with Drizzle Kit migrations
- **Validation:** Zod v4
- **WebSockets:** ws (with ping/pong heartbeat)
- **Testing:** Node.js built-in test runner

## Project Structure

```
sportz/
├── frontend/                      # React + Vite SPA
│   ├── src/
│   │   ├── api.js                 # API client
│   │   ├── App.jsx, main.jsx     # App entry & layout
│   │   ├── hooks/useWebSocket.jsx # WebSocket + toasts
│   │   ├── pages/                 # MatchList, CreateMatch, MatchDetail
│   │   └── App.css
│   ├── index.html
│   ├── vite.config.js
│   └── README.md                  # How to run frontend
├── drizzle/                       # Generated migration files
├── src/
│   ├── db/
│   │   ├── db.js                  # Database client (node-postgres pool)
│   │   └── schema.js              # Drizzle table definitions
│   ├── middleware/
│   │   └── error-handler.js       # Centralized error handling
│   ├── routes/
│   │   ├── matches.js             # Match CRUD endpoints
│   │   └── commentary.js          # Commentary CRUD endpoints
│   ├── utils/
│   │   ├── env.js                 # Environment validation
│   │   ├── match-status.js        # Status derivation logic
│   │   └── status-sync.js         # Periodic status sync job
│   ├── validation/
│   │   ├── matches.js             # Match request schemas
│   │   └── commentary.js          # Commentary request schemas
│   ├── ws/
│   │   └── server.js              # WebSocket server with heartbeat
│   └── index.js                   # App entrypoint
├── tests/
│   ├── match-status.test.js       # Status logic tests
│   └── validation.test.js         # Schema validation tests
├── drizzle.config.js
├── package.json
└── .env                           # Connection string (not committed)
```

## Getting Started

### Prerequisites

- Node.js >= 22
- A [Neon](https://neon.tech) Postgres database (or any PostgreSQL instance)

### Installation

```bash
git clone https://github.com/<your-username>/sportz.git
cd sportz
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
PORT=8000
HOST=0.0.0.0
NODE_ENV=development
```

The server validates required environment variables at startup and fails fast with a clear message if any are missing.

### Database Setup

Generate and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

### Run the Server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

The server starts on `http://localhost:8000` with a WebSocket endpoint at `ws://localhost:8000/ws`.

### Run the Frontend (React)

1. **Start the API** (from project root): `npm run dev` — keep it running on port 8000.
2. **In a second terminal**, from project root: `cd frontend`, then `npm install` (first time only), then `npm run dev`.
3. Open [http://localhost:5173](http://localhost:5173).

See **`frontend/README.md`** for step-by-step instructions and how to see real-time updates.

## API Reference

### Health Check

```
GET /
```

Returns `{ "message": "Welcome to Sportz API" }`.

---

### Matches

#### List Matches

```
GET /matches?limit=25&offset=0
```

| Query Param | Type    | Default | Description                |
|-------------|---------|---------|----------------------------|
| `limit`     | integer | 50      | Max rows to return (1-100) |
| `offset`    | integer | 0       | Rows to skip (pagination)  |

**Response:** `200 OK`

```json
{
  "data": [ ... ],
  "pagination": { "limit": 25, "offset": 0 }
}
```

#### Get Match

```
GET /matches/:id
```

**Response:** `200 OK`

```json
{ "data": { "id": 1, "sport": "football", ... } }
```

#### Create Match

```
POST /matches
Content-Type: application/json
```

| Field       | Type    | Required | Description                         |
|-------------|---------|----------|-------------------------------------|
| `sport`     | string  | Yes      | Sport name                          |
| `homeTeam`  | string  | Yes      | Home team name                      |
| `awayTeam`  | string  | Yes      | Away team name                      |
| `startTime` | string  | Yes      | ISO 8601 datetime                   |
| `endTime`   | string  | Yes      | ISO 8601 datetime (must be > start) |
| `homeScore` | integer | No       | Defaults to 0                       |
| `awayScore` | integer | No       | Defaults to 0                       |

**Response:** `201 Created`

#### Update Match

```
PUT /matches/:id
Content-Type: application/json
```

Accepts any subset of: `sport`, `homeTeam`, `awayTeam`, `startTime`, `endTime`, `status`. At least one field is required.

**Response:** `200 OK`

#### Update Score

```
PATCH /matches/:id/score
Content-Type: application/json
```

| Field       | Type    | Required | Description |
|-------------|---------|----------|-------------|
| `homeScore` | integer | Yes      | Home score  |
| `awayScore` | integer | Yes      | Away score  |

**Response:** `200 OK`

#### Delete Match

```
DELETE /matches/:id
```

**Response:** `200 OK` with the deleted match data.

---

### Commentary

#### List Commentary

```
GET /matches/:matchId/commentary?limit=50&offset=0&eventType=goal
```

| Query Param | Type    | Default | Description                         |
|-------------|---------|---------|-------------------------------------|
| `limit`     | integer | 50      | Max rows to return (1-100)          |
| `offset`    | integer | 0       | Rows to skip (pagination)           |
| `eventType` | string  | —       | Filter by event type                |

**Response:** `200 OK`

#### Add Commentary

```
POST /matches/:matchId/commentary
Content-Type: application/json
```

| Field       | Type     | Required | Description                    |
|-------------|----------|----------|--------------------------------|
| `message`   | string   | Yes      | Commentary text                |
| `minute`    | integer  | No       | Match minute                   |
| `sequence`  | integer  | No       | Sequence within the minute     |
| `period`    | string   | No       | Match period (e.g. "1H", "2H") |
| `eventType` | string   | No       | Event type (e.g. "goal")       |
| `actor`     | string   | No       | Player or person involved      |
| `team`      | string   | No       | Team involved                  |
| `metadata`  | object   | No       | Arbitrary JSON data            |
| `tags`      | string[] | No       | Categorization tags            |

**Response:** `201 Created`

#### Delete Commentary

```
DELETE /matches/:matchId/commentary/:id
```

**Response:** `200 OK` with the deleted entry.

---

## WebSocket

Connect to `ws://localhost:8000/ws` to receive real-time events.

### Events

| Event Type         | Trigger                     | Payload                                      |
|--------------------|-----------------------------|----------------------------------------------|
| `welcome`          | On connection               | `{ type: "welcome" }`                        |
| `match_created`    | Match created via POST      | `{ type: "match_created", data: <match> }`   |
| `score_update`     | Score updated via PATCH      | `{ type: "score_update", data: <match> }`    |
| `commentary_added` | Commentary added via POST   | `{ type: "commentary_added", data: <entry> }`|
| `status_change`    | Status sync job transitions | `{ type: "status_change", data: <match> }`   |

The server runs a **ping/pong heartbeat** every 30 seconds to detect and clean up dead connections.

## Status Sync

A background job runs every 60 seconds to automatically transition match statuses:

- `scheduled` → `live` when the current time passes `startTime`
- `live` → `finished` when the current time passes `endTime`

Status changes are broadcast to all WebSocket clients as `status_change` events.

## Error Handling

All errors flow through a centralized error handler:

- **Client errors (4xx):** Return the error message and validation details.
- **Server errors (5xx):** Return a generic `"Internal Server Error"` message in production. In development (`NODE_ENV=development`), the full error details and stack trace are included.

## Testing

Run the test suite with:

```bash
npm test
```

Tests use Node.js built-in test runner (no extra dependencies) and cover:

- Match status derivation logic (scheduled/live/finished/invalid)
- All Zod validation schemas (createMatch, updateScore, updateMatch, matchIdParam, listMatchesQuery)

## Scripts

| Command              | Description                           |
|----------------------|---------------------------------------|
| `npm start`          | Start the production server           |
| `npm run dev`        | Start with `--watch` for development  |
| `npm run db:generate`| Generate migration from schema        |
| `npm run db:migrate` | Apply migrations to the database      |
| `npm test`           | Run the test suite                    |

## License

ISC

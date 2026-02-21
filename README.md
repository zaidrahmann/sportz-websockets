# Sportz

A real-time sports match tracking API built with Express 5, WebSockets, Drizzle ORM, and Neon Postgres.

Sportz provides a REST API for managing sports matches and a WebSocket server that pushes live updates to connected clients as matches are created.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM with Drizzle Kit migrations
- **Validation:** Zod v4
- **WebSockets:** ws
- **Environment:** dotenv

## Project Structure

```
sportz/
├── drizzle/                   # Generated migration files
│   └── 0000_last_timeslip.sql
├── src/
│   ├── db/
│   │   ├── db.js              # Database client (node-postgres pool)
│   │   └── schema.js          # Drizzle table definitions
│   ├── routes/
│   │   └── matches.js         # Match CRUD endpoints
│   ├── utils/
│   │   └── match-status.js    # Status derivation logic
│   ├── validation/
│   │   └── matches.js         # Zod request schemas
│   ├── ws/
│   │   └── server.js          # WebSocket server with heartbeat
│   └── index.js               # App entrypoint
├── drizzle.config.js
├── package.json
└── .env                       # Connection string (not committed)
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
```

### Database Setup

Generate and apply the migration to create the `matches` and `commentary` tables:

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

## API Reference

### Health Check

```
GET /
```

Returns `{ "message": "Welcome to Sportz API" }`.

### List Matches

```
GET /matches?limit=25
```

| Query Param | Type    | Default | Description               |
|-------------|---------|---------|---------------------------|
| `limit`     | integer | 50      | Max rows to return (1-100)|

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "sport": "football",
      "homeTeam": "Manchester City",
      "awayTeam": "JSM United",
      "status": "scheduled",
      "startTime": "2026-02-01T12:00:00.000Z",
      "endTime": "2026-02-01T13:45:00.000Z",
      "homeScore": 0,
      "awayScore": 0,
      "createdAt": "2026-02-21T10:00:00.000Z"
    }
  ]
}
```

### Create Match

```
POST /matches
Content-Type: application/json
```

| Field       | Type    | Required | Description                          |
|-------------|---------|----------|--------------------------------------|
| `sport`     | string  | Yes      | Sport name                           |
| `homeTeam`  | string  | Yes      | Home team name                       |
| `awayTeam`  | string  | Yes      | Away team name                       |
| `startTime` | string  | Yes      | ISO 8601 datetime                    |
| `endTime`   | string  | Yes      | ISO 8601 datetime (must be > start)  |
| `homeScore` | integer | No       | Defaults to 0                        |
| `awayScore` | integer | No       | Defaults to 0                        |

**Response:** `201 Created`

```json
{
  "data": {
    "id": 1,
    "sport": "football",
    "homeTeam": "Manchester City",
    "awayTeam": "JSM United",
    "status": "scheduled",
    "homeScore": 0,
    "awayScore": 0
  }
}
```

## WebSocket

Connect to `ws://localhost:8000/ws` to receive real-time events.

### Events

| Event Type      | Trigger                  | Payload              |
|-----------------|--------------------------|----------------------|
| `welcome`       | On connection            | `{ type: "welcome" }`|
| `match_created` | When a match is created  | `{ type: "match_created", data: <match> }` |

The server runs a **ping/pong heartbeat** every 30 seconds to detect and clean up dead connections.

## Database Schema

### `matches`

| Column       | Type          | Notes                                |
|--------------|---------------|--------------------------------------|
| `id`         | serial (PK)   | Auto-increment                       |
| `sport`      | text          | Not null                             |
| `home_team`  | text          | Not null                             |
| `away_team`  | text          | Not null                             |
| `status`     | match_status  | Enum: scheduled, live, finished      |
| `start_time` | timestamp     | Not null                             |
| `end_time`   | timestamp     | Nullable                             |
| `home_score` | integer       | Default 0                            |
| `away_score` | integer       | Default 0                            |
| `created_at` | timestamp     | Default now()                        |

### `commentary`

| Column       | Type          | Notes                                |
|--------------|---------------|--------------------------------------|
| `id`         | serial (PK)   | Auto-increment                       |
| `match_id`   | integer (FK)  | References matches.id                |
| `minute`     | integer       | Nullable                             |
| `sequence`   | integer       | Nullable                             |
| `period`     | text          | Nullable                             |
| `event_type` | text          | Nullable                             |
| `actor`      | text          | Nullable                             |
| `team`       | text          | Nullable                             |
| `message`    | text          | Not null                             |
| `metadata`   | jsonb         | Nullable                             |
| `tags`       | text[]        | Nullable                             |
| `created_at` | timestamp     | Default now()                        |

## Scripts

| Command              | Description                        |
|----------------------|------------------------------------|
| `npm start`          | Start the production server        |
| `npm run dev`        | Start with `--watch` for dev       |
| `npm run db:generate`| Generate migration from schema     |
| `npm run db:migrate` | Apply migrations to the database   |

## License

ISC

# Sportz Frontend (React)

React SPA for the Sportz API: match list, create match, match detail with live score updates and commentary. Real-time toasts via WebSocket.

## How to see everything

### 1. Start the backend (API + WebSocket)

From the **project root** (the `sportz` folder, not `frontend`):

```bash
npm run dev
```

Leave this running. You should see:

- `Server running at http://localhost:8000`
- `WebSocket server running at ws://localhost:8000/ws`

### 2. Install frontend dependencies (first time only)

Open a **second terminal**. Go to the frontend folder and install:

```bash
cd frontend
npm install
```

### 3. Start the React dev server

Still in the `frontend` folder:

```bash
npm run dev
```

Vite will start and show something like:

- `Local:   http://localhost:5173/`

### 4. Open the app in your browser

Open **http://localhost:5173** (or the URL Vite printed).

You should see:

- **Matches** – list of matches (or “No matches yet” and a **Create match** button).
- **New match** (top right or “Create match”) – form to add sport, home/away teams, start/end time, optional scores.
- Click a match card → **Match detail**: big score card, “Update score” form, “Commentary” list + “Add commentary” form, “Delete match” at the bottom.

The frontend proxies `/api` and `/ws` to `localhost:8000`, so both backend and frontend must be running.

### 5. See real-time updates

With the app open:

- Create a match from another tab or Postman → a green toast appears and the list can refresh.
- Update a score or add commentary → toasts for “Score updated live” / “New commentary”.

---

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start Vite dev server    |
| `npm run build`| Production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Stack

- React 18
- React Router (hash routing for simple deployment)
- Vite 6
- No UI library; custom CSS (Outfit font, dark theme, accent green)

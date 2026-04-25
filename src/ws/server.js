import WebSocket, { WebSocketServer } from 'ws';

const HEARTBEAT_INTERVAL_MS = 30_000;

const matchSubscribers = new Map();

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function subscribe(matchId, socket) {
  let set = matchSubscribers.get(matchId);
  if (!set) {
    set = new Set();
    matchSubscribers.set(matchId, set);
  }
  set.add(socket);
}

function unsubscribe(matchId, socket) {
  const set = matchSubscribers.get(matchId);
  if (set) {
    set.delete(socket);
    if (set.size === 0) matchSubscribers.delete(matchId);
  }
}

function cleanupSubscriptions(socket) {
  for (const [matchId, set] of matchSubscribers) {
    if (set.has(socket)) set.delete(socket);
    if (set.size === 0) matchSubscribers.delete(matchId);
  }
}

function broadcastToMatch(matchId, payload) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;
  const message = JSON.stringify(payload);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

function broadcastToAll(wss, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(message);
  }
}

export function attachWebSocketServer(server, wsArcjet = null) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024,
  });

  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  wss.on('close', () => clearInterval(heartbeat));

  wss.on('connection', async (socket, req) => {
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          const code = decision.reason?.isRateLimit?.() ? 1013 : 1008;
          const reason = decision.reason?.isRateLimit?.() ? 'Rate limit exceeded' : 'Access denied';
          socket.close(code, reason);
          return;
        }
      } catch (e) {
        console.error('WS connection error', e);
        socket.close(1011, 'Service Unavailable');
        return;
      }
    }

    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('error', console.error);
    socket.on('close', () => cleanupSubscriptions(socket));

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const matchId = msg?.matchId != null ? String(msg.matchId).trim() : '';
        if (!matchId) return;
        if (msg?.type === 'subscribe') {
          subscribe(matchId, socket);
          sendJson(socket, { type: 'subscribed', matchId });
        } else if (msg?.type === 'unsubscribe') {
          unsubscribe(matchId, socket);
          sendJson(socket, { type: 'unsubscribed', matchId });
        }
      } catch {
        // ignore malformed messages
      }
    });

    sendJson(socket, { type: 'welcome' });
  });

  function broadcastMatchCreated(match) {
    broadcastToAll(wss, { type: 'match_created', data: match });
  }

  function broadcastScoreUpdate(match) {
    broadcastToAll(wss, { type: 'score_update', data: match });
  }

  function broadcastCommentaryAdded(entry) {
    if (entry?.matchId != null) {
      broadcastToMatch(String(entry.matchId), { type: 'commentary_added', data: entry });
    }
  }

  function broadcastStatusChange(match) {
    broadcastToAll(wss, { type: 'status_change', data: match });
  }

  return {
    broadcastToAll: (payload) => broadcastToAll(wss, payload),
    broadcastToMatch,
    subscribe,
    unsubscribe,
    broadcastMatchCreated,
    broadcastScoreUpdate,
    broadcastCommentaryAdded,
    broadcastStatusChange,
  };
}

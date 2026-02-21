import WebSocket, { WebSocketServer } from 'ws';

const HEARTBEAT_INTERVAL_MS = 30_000;

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
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

    sendJson(socket, { type: 'welcome' });
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: 'match_created', data: match });
  }

  function broadcastScoreUpdate(match) {
    broadcast(wss, { type: 'score_update', data: match });
  }

  function broadcastCommentaryAdded(entry) {
    broadcast(wss, { type: 'commentary_added', data: entry });
  }

  function broadcastStatusChange(match) {
    broadcast(wss, { type: 'status_change', data: match });
  }

  return {
    broadcastMatchCreated,
    broadcastScoreUpdate,
    broadcastCommentaryAdded,
    broadcastStatusChange,
  };
}

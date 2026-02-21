import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { wsUrl } from '../config.js';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const commentaryHandlers = useRef(new Map());

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const subscribeToMatch = useCallback((matchId) => {
    if (matchId == null || matchId === '') return;
    const s = typeof matchId === 'number' ? String(matchId) : String(matchId).trim();
    if (!s) return;
    const socket = wsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribe', matchId: s }));
    }
  }, []);

  const unsubscribeFromMatch = useCallback((matchId) => {
    if (matchId == null || matchId === '') return;
    const s = typeof matchId === 'number' ? String(matchId) : String(matchId).trim();
    if (!s) return;
    const socket = wsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'unsubscribe', matchId: s }));
    }
  }, []);

  const registerCommentaryHandler = useCallback((matchId, callback) => {
    const key = typeof matchId === 'number' ? String(matchId) : String(matchId).trim();
    commentaryHandlers.current.set(key, callback);
  }, []);

  const unregisterCommentaryHandler = useCallback((matchId) => {
    const key = typeof matchId === 'number' ? String(matchId) : String(matchId).trim();
    commentaryHandlers.current.delete(key);
  }, []);

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;

    function connect() {
      if (socket?.readyState === WebSocket.OPEN) return;
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;
      setWs(socket);

      socket.onopen = () => {};
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'match_created') {
            addToast(`${msg.data?.homeTeam ?? ''} vs ${msg.data?.awayTeam ?? ''} — match created`, 'success');
          } else if (msg.type === 'score_update') {
            addToast('Score updated live', 'info');
          } else if (msg.type === 'commentary_added') {
            const entry = msg.data;
            const matchKey = entry?.matchId != null ? String(entry.matchId) : '';
            const handler = matchKey ? commentaryHandlers.current.get(matchKey) : null;
            if (handler) handler(entry);
            else addToast('New commentary', 'info');
          } else if (msg.type === 'status_change') {
            addToast(`Match is now ${msg.data?.status ?? ''}`, 'info');
          }
        } catch (_) {}
      };
      socket.onclose = () => {
        wsRef.current = null;
        setWs(null);
        reconnectTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => {};
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current = null;
      socket?.close();
    };
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        ws,
        toasts,
        addToast,
        removeToast,
        subscribeToMatch,
        unsubscribeFromMatch,
        registerCommentaryHandler,
        unregisterCommentaryHandler,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
}

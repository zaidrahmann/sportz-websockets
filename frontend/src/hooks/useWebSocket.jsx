import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wsUrl } from '../config.js';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [ws, setWs] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;

    function connect() {
      if (socket?.readyState === WebSocket.OPEN) return;
      socket = new WebSocket(wsUrl);
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
            addToast('New commentary', 'info');
          } else if (msg.type === 'status_change') {
            addToast(`Match is now ${msg.data?.status ?? ''}`, 'info');
          }
        } catch (_) {}
      };
      socket.onclose = () => {
        setWs(null);
        reconnectTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => {};
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, toasts, addToast, removeToast }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
}

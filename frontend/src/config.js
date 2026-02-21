export const apiBase = import.meta.env.VITE_API_BASE ?? '/api';
export const wsUrl =
  import.meta.env.VITE_WS_URL ??
  `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;

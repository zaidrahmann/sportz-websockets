import { apiBase } from './config.js';

async function request(path, options = {}) {
  const url = `${apiBase}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data;
}

export const matchesApi = {
  list(params = {}) {
    const q = new URLSearchParams(params).toString();
    return request(`/matches${q ? `?${q}` : ''}`);
  },
  get(id) {
    return request(`/matches/${id}`);
  },
  create(body) {
    return request('/matches', { method: 'POST', body: JSON.stringify(body) });
  },
  update(id, body) {
    return request(`/matches/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  updateScore(id, body) {
    return request(`/matches/${id}/score`, { method: 'PATCH', body: JSON.stringify(body) });
  },
  delete(id) {
    return request(`/matches/${id}`, { method: 'DELETE' });
  },
};

export const commentaryApi = {
  list(matchId, params = {}) {
    const q = new URLSearchParams(params).toString();
    return request(`/matches/${matchId}/commentary${q ? `?${q}` : ''}`);
  },
  add(matchId, body) {
    return request(`/matches/${matchId}/commentary`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  delete(matchId, id) {
    return request(`/matches/${matchId}/commentary/${id}`, { method: 'DELETE' });
  },
};

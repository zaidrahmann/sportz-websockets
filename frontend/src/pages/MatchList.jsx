import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { matchesApi } from '../api.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function MatchList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);

  const [data, setData] = useState({ data: [], pagination: { limit: 12, offset: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    matchesApi
      .list({ limit, offset })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [limit, offset]);

  const matches = data.data || [];
  const pagination = data.pagination || { limit: 12, offset: 0 };
  const hasPrev = pagination.offset > 0;
  const hasNext = matches.length >= pagination.limit;

  if (error) {
    return (
      <div className="page">
        <div className="error-card">
          <p>{error}</p>
          <p className="error-hint">Make sure the API is running: <code>npm run dev</code> in the project root (port 8000).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Matches</h1>
        <p className="page-subtitle">Live scores and real-time updates</p>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card card-skeleton" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◇</div>
          <h2>No matches yet</h2>
          <p>Create your first match to get started.</p>
          <Link to="/create" className="btn btn-primary">Create match</Link>
        </div>
      ) : (
        <>
          <div className="match-grid">
            {matches.map((m) => (
              <Link key={m.id} to={`/match/${m.id}`} className="card match-card">
                <div className="match-card-sport">{m.sport}</div>
                <div className="match-card-teams">
                  <span className="team">{m.homeTeam}</span>
                  <span className="score">
                    {m.homeScore} <em>–</em> {m.awayScore}
                  </span>
                  <span className="team">{m.awayTeam}</span>
                </div>
                <div className="match-card-meta">
                  <span className={`status status-${m.status}`}>{m.status}</span>
                  <span className="match-time">{formatDate(m.startTime)}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="pagination">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!hasPrev}
              onClick={() => setSearchParams({ offset: Math.max(0, offset - limit), limit })}
            >
              Previous
            </button>
            <span className="pagination-info">
              {pagination.offset + 1}–{pagination.offset + matches.length}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!hasNext}
              onClick={() => setSearchParams({ offset: offset + limit, limit })}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

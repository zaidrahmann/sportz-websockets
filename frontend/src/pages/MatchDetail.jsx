import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchesApi, commentaryApi } from '../api.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreForm, setScoreForm] = useState({ homeScore: 0, awayScore: 0 });
  const [scoreSaving, setScoreSaving] = useState(false);
  const [commentForm, setCommentForm] = useState({ message: '', minute: '', eventType: '' });
  const [commentSaving, setCommentSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      matchesApi.get(id).then((r) => r.data),
      commentaryApi.list(id).then((r) => r.data),
    ])
      .then(([m, c]) => {
        setMatch(m);
        setCommentary(c);
        setScoreForm({ homeScore: m.homeScore, awayScore: m.awayScore });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleScoreSubmit(e) {
    e.preventDefault();
    setScoreSaving(true);
    try {
      const res = await matchesApi.updateScore(id, scoreForm);
      setMatch(res.data);
      setScoreForm({ homeScore: res.data.homeScore, awayScore: res.data.awayScore });
    } catch (err) {
      setError(err.message);
    } finally {
      setScoreSaving(false);
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentForm.message.trim()) return;
    setCommentSaving(true);
    try {
      const body = {
        message: commentForm.message.trim(),
        minute: commentForm.minute ? parseInt(commentForm.minute, 10) : undefined,
        eventType: commentForm.eventType.trim() || undefined,
      };
      const res = await commentaryApi.add(id, body);
      setCommentary((prev) => [res.data, ...prev]);
      setCommentForm({ message: '', minute: '', eventType: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentSaving(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await commentaryApi.delete(id, commentId);
      setCommentary((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteMatch() {
    if (!confirm('Delete this match? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await matchesApi.delete(id);
      window.location.hash = '#/';
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-detail" />
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="page">
        <div className="error-card">
          <p>{error}</p>
          <Link to="/" className="btn btn-secondary">Back to matches</Link>
        </div>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/" className="back-link">← Back to matches</Link>
        <div className="match-detail-meta">
          <span className="match-detail-sport">{match.sport}</span>
          <span className={`status status-${match.status}`}>{match.status}</span>
          <span className="match-time">{formatDate(match.startTime)} – {formatDate(match.endTime)}</span>
        </div>
      </div>

      <section className="score-card">
        <div className="score-team">
          <span className="score-team-name">{match.homeTeam}</span>
          <span className="score-value">{match.homeScore}</span>
        </div>
        <span className="score-divider">–</span>
        <div className="score-team">
          <span className="score-value">{match.awayScore}</span>
          <span className="score-team-name">{match.awayTeam}</span>
        </div>
      </section>

      <section className="card section-card">
        <h2>Update score</h2>
        <form onSubmit={handleScoreSubmit} className="form form-inline">
          <div className="form-row">
            <div className="form-group">
              <label>Home</label>
              <input
                type="number"
                min={0}
                value={scoreForm.homeScore}
                onChange={(e) => setScoreForm((p) => ({ ...p, homeScore: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div className="form-group">
              <label>Away</label>
              <input
                type="number"
                min={0}
                value={scoreForm.awayScore}
                onChange={(e) => setScoreForm((p) => ({ ...p, awayScore: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={scoreSaving}>
            {scoreSaving ? 'Saving…' : 'Save score'}
          </button>
        </form>
      </section>

      <section className="card section-card">
        <h2>Commentary</h2>
        <form onSubmit={handleCommentSubmit} className="form">
          <div className="form-group">
            <label>Message</label>
            <input
              type="text"
              placeholder="e.g. Goal! 1-0"
              value={commentForm.message}
              onChange={(e) => setCommentForm((p) => ({ ...p, message: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Minute</label>
              <input
                type="number"
                min={0}
                placeholder="45"
                value={commentForm.minute}
                onChange={(e) => setCommentForm((p) => ({ ...p, minute: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Event type</label>
              <input
                type="text"
                placeholder="goal, card, substitution"
                value={commentForm.eventType}
                onChange={(e) => setCommentForm((p) => ({ ...p, eventType: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={commentSaving}>
            {commentSaving ? 'Adding…' : 'Add commentary'}
          </button>
        </form>
        <ul className="commentary-list">
          {commentary.length === 0 ? (
            <li className="commentary-empty">No commentary yet.</li>
          ) : (
            commentary.map((c) => (
              <li key={c.id} className="commentary-item">
                <span className="commentary-meta">
                  {c.minute != null ? `${c.minute}'` : ''} {c.eventType || ''}
                </span>
                <span className="commentary-message">{c.message}</span>
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  onClick={() => handleDeleteComment(c.id)}
                  aria-label="Delete"
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="danger-zone">
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDeleteMatch}
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete match'}
        </button>
      </section>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

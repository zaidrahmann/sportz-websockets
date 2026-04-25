import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { matchesApi } from '../api.js';

export function CreateMatch() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const defaultEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const [form, setForm] = useState({
    sport: '',
    homeTeam: '',
    awayTeam: '',
    startTime: defaultStart.toISOString().slice(0, 16),
    endTime: defaultEnd.toISOString().slice(0, 16),
    homeScore: 0,
    awayScore: 0,
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'homeScore' || name === 'awayScore' ? parseInt(value, 10) || 0 : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      const res = await matchesApi.create(body);
      navigate(`/match/${res.data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create match');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/" className="back-link">← Back to matches</Link>
        <h1>New match</h1>
        <p className="page-subtitle">Schedule a new match with start and end times.</p>
      </div>

      <div className="card form-card">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="sport">Sport</label>
            <input
              id="sport"
              name="sport"
              type="text"
              required
              placeholder="e.g. football, basketball"
              value={form.sport}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="homeTeam">Home team</label>
              <input
                id="homeTeam"
                name="homeTeam"
                type="text"
                required
                value={form.homeTeam}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="awayTeam">Away team</label>
              <input
                id="awayTeam"
                name="awayTeam"
                type="text"
                required
                value={form.awayTeam}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start time</label>
              <input
                id="startTime"
                name="startTime"
                type="datetime-local"
                required
                value={form.startTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End time</label>
              <input
                id="endTime"
                name="endTime"
                type="datetime-local"
                required
                value={form.endTime}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="homeScore">Home score (optional)</label>
              <input
                id="homeScore"
                name="homeScore"
                type="number"
                min={0}
                value={form.homeScore}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="awayScore">Away score (optional)</label>
              <input
                id="awayScore"
                name="awayScore"
                type="number"
                min={0}
                value={form.awayScore}
                onChange={handleChange}
              />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create match'}
            </button>
            <Link to="/" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

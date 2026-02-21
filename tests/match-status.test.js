import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMatchStatus } from '../src/utils/match-status.js';

describe('getMatchStatus', () => {
  const past = '2020-01-01T00:00:00Z';
  const future = '2030-01-01T00:00:00Z';
  const farFuture = '2035-01-01T00:00:00Z';

  it('returns "scheduled" when now is before startTime', () => {
    const result = getMatchStatus(future, farFuture, new Date('2025-06-01'));
    assert.equal(result, 'scheduled');
  });

  it('returns "live" when now is between startTime and endTime', () => {
    const result = getMatchStatus(past, farFuture, new Date('2025-06-01'));
    assert.equal(result, 'live');
  });

  it('returns "finished" when now is after endTime', () => {
    const result = getMatchStatus(past, '2024-01-01T00:00:00Z', new Date('2025-06-01'));
    assert.equal(result, 'finished');
  });

  it('returns "finished" when now equals endTime', () => {
    const end = '2025-06-01T00:00:00Z';
    const result = getMatchStatus(past, end, new Date(end));
    assert.equal(result, 'finished');
  });

  it('returns null for invalid startTime', () => {
    assert.equal(getMatchStatus('not-a-date', future), null);
  });

  it('returns null for invalid endTime', () => {
    assert.equal(getMatchStatus(past, 'not-a-date'), null);
  });

  it('returns null when both dates are invalid', () => {
    assert.equal(getMatchStatus('bad', 'bad'), null);
  });

  it('uses current time when now is not provided', () => {
    const result = getMatchStatus(past, farFuture);
    assert.equal(result, 'live');
  });
});

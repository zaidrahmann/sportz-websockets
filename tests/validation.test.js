import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMatchSchema,
  updateScoreSchema,
  updateMatchSchema,
  matchIdParamSchema,
  listMatchesQuerySchema,
} from '../src/validation/matches.js';

const validMatch = {
  sport: 'football',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  startTime: '2026-03-01T12:00:00Z',
  endTime: '2026-03-01T14:00:00Z',
};

describe('createMatchSchema', () => {
  it('accepts valid match data', () => {
    const result = createMatchSchema.safeParse(validMatch);
    assert.equal(result.success, true);
  });

  it('accepts optional scores', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, homeScore: 2, awayScore: 1 });
    assert.equal(result.success, true);
    assert.equal(result.data.homeScore, 2);
  });

  it('rejects missing required fields', () => {
    const result = createMatchSchema.safeParse({ sport: 'football' });
    assert.equal(result.success, false);
  });

  it('rejects empty sport string', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, sport: '' });
    assert.equal(result.success, false);
  });

  it('rejects invalid ISO date string', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, startTime: 'not-a-date' });
    assert.equal(result.success, false);
  });

  it('rejects endTime before startTime', () => {
    const result = createMatchSchema.safeParse({
      ...validMatch,
      startTime: '2026-03-01T14:00:00Z',
      endTime: '2026-03-01T12:00:00Z',
    });
    assert.equal(result.success, false);
  });

  it('rejects endTime equal to startTime', () => {
    const result = createMatchSchema.safeParse({
      ...validMatch,
      endTime: validMatch.startTime,
    });
    assert.equal(result.success, false);
  });

  it('rejects negative scores', () => {
    const result = createMatchSchema.safeParse({ ...validMatch, homeScore: -1 });
    assert.equal(result.success, false);
  });
});

describe('updateScoreSchema', () => {
  it('accepts valid scores', () => {
    const result = updateScoreSchema.safeParse({ homeScore: 3, awayScore: 1 });
    assert.equal(result.success, true);
  });

  it('coerces string numbers', () => {
    const result = updateScoreSchema.safeParse({ homeScore: '2', awayScore: '0' });
    assert.equal(result.success, true);
    assert.equal(result.data.homeScore, 2);
    assert.equal(result.data.awayScore, 0);
  });

  it('rejects negative scores', () => {
    assert.equal(updateScoreSchema.safeParse({ homeScore: -1, awayScore: 0 }).success, false);
  });

  it('rejects missing fields', () => {
    assert.equal(updateScoreSchema.safeParse({ homeScore: 1 }).success, false);
    assert.equal(updateScoreSchema.safeParse({}).success, false);
  });
});

describe('updateMatchSchema', () => {
  it('accepts partial updates', () => {
    const result = updateMatchSchema.safeParse({ sport: 'basketball' });
    assert.equal(result.success, true);
  });

  it('rejects empty object', () => {
    const result = updateMatchSchema.safeParse({});
    assert.equal(result.success, false);
  });

  it('accepts valid status enum', () => {
    const result = updateMatchSchema.safeParse({ status: 'live' });
    assert.equal(result.success, true);
  });

  it('rejects invalid status', () => {
    const result = updateMatchSchema.safeParse({ status: 'cancelled' });
    assert.equal(result.success, false);
  });
});

describe('matchIdParamSchema', () => {
  it('coerces string to positive integer', () => {
    const result = matchIdParamSchema.safeParse({ id: '5' });
    assert.equal(result.success, true);
    assert.equal(result.data.id, 5);
  });

  it('rejects zero', () => {
    assert.equal(matchIdParamSchema.safeParse({ id: '0' }).success, false);
  });

  it('rejects negative values', () => {
    assert.equal(matchIdParamSchema.safeParse({ id: '-1' }).success, false);
  });

  it('rejects non-numeric strings', () => {
    assert.equal(matchIdParamSchema.safeParse({ id: 'abc' }).success, false);
  });
});

describe('listMatchesQuerySchema', () => {
  it('accepts empty query (all fields optional)', () => {
    const result = listMatchesQuerySchema.safeParse({});
    assert.equal(result.success, true);
  });

  it('accepts valid limit and offset', () => {
    const result = listMatchesQuerySchema.safeParse({ limit: '25', offset: '10' });
    assert.equal(result.success, true);
    assert.equal(result.data.limit, 25);
    assert.equal(result.data.offset, 10);
  });

  it('rejects limit over 100', () => {
    assert.equal(listMatchesQuerySchema.safeParse({ limit: '200' }).success, false);
  });

  it('rejects negative offset', () => {
    assert.equal(listMatchesQuerySchema.safeParse({ offset: '-5' }).success, false);
  });
});

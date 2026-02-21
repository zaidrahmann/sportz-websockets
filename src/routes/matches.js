import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import {
  createMatchSchema,
  listMatchesQuerySchema,
  matchIdParamSchema,
  updateMatchSchema,
  updateScoreSchema,
} from '../validation/matches.js';
import { matches } from '../db/schema.js';
import { db } from '../db/db.js';
import { getMatchStatus } from '../utils/match-status.js';
import { AppError } from '../middleware/error-handler.js';

export const matchRouter = Router();

// GET /matches
matchRouter.get('/', async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError('Invalid query parameters', 400, parsed.error.issues);

  const limit = parsed.data.limit ?? 50;
  const offset = parsed.data.offset ?? 0;

  const allMatches = await db
    .select()
    .from(matches)
    .orderBy(desc(matches.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ data: allMatches, pagination: { limit, offset } });
});

// GET /matches/:id
matchRouter.get('/:id', async (req, res) => {
  const parsed = matchIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw new AppError('Invalid match ID', 400, parsed.error.issues);

  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, parsed.data.id));

  if (!match) throw new AppError('Match not found', 404);

  res.json({ data: match });
});

// POST /matches
matchRouter.post('/', async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Invalid payload', 400, parsed.error.issues);

  const { startTime, endTime, homeScore, awayScore } = parsed.data;

  const [created] = await db
    .insert(matches)
    .values({
      ...parsed.data,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      homeScore: homeScore ?? 0,
      awayScore: awayScore ?? 0,
      status: getMatchStatus(startTime, endTime),
    })
    .returning();

  if (req.app.locals.broadcastMatchCreated) {
    req.app.locals.broadcastMatchCreated(created);
  }

  res.status(201).json({ data: created });
});

// PUT /matches/:id
matchRouter.put('/:id', async (req, res) => {
  const params = matchIdParamSchema.safeParse(req.params);
  if (!params.success) throw new AppError('Invalid match ID', 400, params.error.issues);

  const parsed = updateMatchSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Invalid payload', 400, parsed.error.issues);

  const values = { ...parsed.data };
  if (values.startTime) values.startTime = new Date(values.startTime);
  if (values.endTime) values.endTime = new Date(values.endTime);

  const [updated] = await db
    .update(matches)
    .set(values)
    .where(eq(matches.id, params.data.id))
    .returning();

  if (!updated) throw new AppError('Match not found', 404);

  res.json({ data: updated });
});

// PATCH /matches/:id/score
matchRouter.patch('/:id/score', async (req, res) => {
  const params = matchIdParamSchema.safeParse(req.params);
  if (!params.success) throw new AppError('Invalid match ID', 400, params.error.issues);

  const parsed = updateScoreSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Invalid payload', 400, parsed.error.issues);

  const [updated] = await db
    .update(matches)
    .set({ homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore })
    .where(eq(matches.id, params.data.id))
    .returning();

  if (!updated) throw new AppError('Match not found', 404);

  if (req.app.locals.broadcastScoreUpdate) {
    req.app.locals.broadcastScoreUpdate(updated);
  }

  res.json({ data: updated });
});

// DELETE /matches/:id
matchRouter.delete('/:id', async (req, res) => {
  const params = matchIdParamSchema.safeParse(req.params);
  if (!params.success) throw new AppError('Invalid match ID', 400, params.error.issues);

  const [deleted] = await db
    .delete(matches)
    .where(eq(matches.id, params.data.id))
    .returning();

  if (!deleted) throw new AppError('Match not found', 404);

  res.json({ data: deleted });
});

export default matchRouter;

import { Router } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/db.js';
import { matches, commentary } from '../db/schema.js';
import { AppError } from '../middleware/error-handler.js';
import {
  commentaryParamsSchema,
  commentaryIdParamSchema,
  listCommentaryQuerySchema,
  createCommentarySchema,
  matchIdParamSchema,
} from '../validation/commentary.js';

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

async function ensureMatchExists(matchId) {
  const [match] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.id, matchId));

  if (!match) throw new AppError('Match not found', 404);
  return match;
}

commentaryRouter.get('/', async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({
      error: 'Invalid match ID.',
      details: paramsResult.error.issues,
    });
  }

  const queryResult = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({
      error: 'Invalid query parameters.',
      details: queryResult.error.issues,
    });
  }

  await ensureMatchExists(paramsResult.data.matchId);

  const limit = Math.min(queryResult.data.limit ?? 100, MAX_LIMIT);

  try {
    const entries = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, paramsResult.data.matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.json({ data: entries, pagination: { limit } });
  } catch (error) {
    console.error('Failed to list commentary:', error);
    return res.status(500).json({ error: 'Failed to list commentary.' });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({
      error: 'Invalid match ID.',
      details: paramsResult.error.issues,
    });
  }

  const bodyResult = createCommentarySchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(400).json({
      error: 'Invalid commentary payload.',
      details: bodyResult.error.issues,
    });
  }

  await ensureMatchExists(paramsResult.data.matchId);

  try {
    const { minute, ...rest } = bodyResult.data;
    const [result] = await db
      .insert(commentary)
      .values({
        matchId: paramsResult.data.matchId,
        minute,
        ...rest,
      })
      .returning();

    if (req.app.locals.broadcastCommentaryAdded) {
      req.app.locals.broadcastCommentaryAdded(result);
    }

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create commentary:', error);
    return res.status(500).json({ error: 'Failed to create commentary.' });
  }
});

commentaryRouter.delete('/:id', async (req, res) => {
  const params = commentaryIdParamSchema.safeParse(req.params);
  if (!params.success) throw new AppError('Invalid parameters', 400, params.error.issues);

  const [deleted] = await db
    .delete(commentary)
    .where(
      and(
        eq(commentary.id, params.data.id),
        eq(commentary.matchId, params.data.matchId),
      )
    )
    .returning();

  if (!deleted) throw new AppError('Commentary entry not found', 404);

  res.json({ data: deleted });
});

export default commentaryRouter;

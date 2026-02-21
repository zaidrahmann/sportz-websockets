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
} from '../validation/commentary.js';

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
  const params = commentaryParamsSchema.safeParse(req.params);
  if (!params.success) throw new AppError('Invalid match ID', 400, params.error.issues);

  const query = listCommentaryQuerySchema.safeParse(req.query);
  if (!query.success) throw new AppError('Invalid query parameters', 400, query.error.issues);

  await ensureMatchExists(params.data.matchId);

  const limit = query.data.limit ?? 50;
  const offset = query.data.offset ?? 0;

  const conditions = [eq(commentary.matchId, params.data.matchId)];
  if (query.data.eventType) {
    conditions.push(eq(commentary.eventType, query.data.eventType));
  }

  const entries = await db
    .select()
    .from(commentary)
    .where(and(...conditions))
    .orderBy(desc(commentary.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ data: entries, pagination: { limit, offset } });
});

commentaryRouter.post('/', async (req, res) => {
  const params = commentaryParamsSchema.safeParse(req.params);
  if (!params.success) throw new AppError('Invalid match ID', 400, params.error.issues);

  const parsed = createCommentarySchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('Invalid payload', 400, parsed.error.issues);

  await ensureMatchExists(params.data.matchId);

  const [entry] = await db
    .insert(commentary)
    .values({ ...parsed.data, matchId: params.data.matchId })
    .returning();

  if (req.app.locals.broadcastCommentaryAdded) {
    req.app.locals.broadcastCommentaryAdded(entry);
  }

  res.status(201).json({ data: entry });
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

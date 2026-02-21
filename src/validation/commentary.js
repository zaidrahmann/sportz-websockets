import { z } from 'zod';

export const commentaryParamsSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

export const commentaryIdParamSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  eventType: z.string().optional(),
});

export const createCommentarySchema = z.object({
  minute: z.coerce.number().int().nonnegative().optional(),
  sequence: z.coerce.number().int().nonnegative().optional(),
  period: z.string().optional(),
  eventType: z.string().optional(),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().nonempty(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

import { z } from 'zod';

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
  minute: z.coerce.number().int().nonnegative().optional(),
  sequence: z.coerce.number().int().nonnegative().optional(),
  period: z.string().optional(),
  eventType: z.string().optional(),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

export const matchIdParamSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

export const commentaryParamsSchema = matchIdParamSchema;

export const commentaryIdParamSchema = z.object({
  matchId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});

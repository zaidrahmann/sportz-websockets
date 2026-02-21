import { z } from 'zod';

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const isoDateString = z
  .string()
  .nonempty()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string',
  });

export const createMatchSchema = z
  .object({
    sport: z.string().nonempty(),
    homeTeam: z.string().nonempty(),
    awayTeam: z.string().nonempty(),
    startTime: isoDateString,
    endTime: isoDateString,
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime must be after startTime',
      });
    }
  });

export const updateMatchSchema = z
  .object({
    sport: z.string().nonempty(),
    homeTeam: z.string().nonempty(),
    awayTeam: z.string().nonempty(),
    startTime: isoDateString,
    endTime: isoDateString,
    status: z.enum(['scheduled', 'live', 'finished']),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});

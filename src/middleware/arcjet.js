import arcjet, { shield, slidingWindow, detectBot } from '@arcjet/node';

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.NODE_ENV === 'production' ? 'LIVE' : 'LIVE';

const sharedRules = [
  shield({ mode: arcjetMode }),
  detectBot({
    mode: arcjetMode,
    allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
  }),
];

export const httpArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        ...sharedRules,
        slidingWindow({ mode: arcjetMode, interval: 10, max: 50 }),
      ],
    })
  : null;

export const wsArcjet = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        ...sharedRules,
        slidingWindow({ mode: arcjetMode, interval: 2, max: 5 }),
      ],
    })
  : null;

export function securityMiddleware(req, res, next) {
  if (!httpArcjet) return next();

  httpArcjet
    .protect(req)
    .then((decision) => {
      if (decision.isDenied()) {
        if (decision.reason?.isRateLimit?.()) {
          return res.status(429).json({ error: 'Too many requests.' });
        }
        return res.status(403).json({ error: 'Forbidden.' });
      }
      next();
    })
    .catch((err) => {
      console.error('Arcjet middleware error', err);
      res.status(503).json({ error: 'Service Unavailable' });
    });
}

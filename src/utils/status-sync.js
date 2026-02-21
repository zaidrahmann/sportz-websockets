import { eq, or } from 'drizzle-orm';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { getMatchStatus } from './match-status.js';

const SYNC_INTERVAL_MS = 60_000;

export function startStatusSyncJob(onStatusChange) {
  const interval = setInterval(async () => {
    try {
      const activeMatches = await db
        .select()
        .from(matches)
        .where(
          or(
            eq(matches.status, 'scheduled'),
            eq(matches.status, 'live'),
          )
        );

      for (const match of activeMatches) {
        const newStatus = getMatchStatus(match.startTime, match.endTime);
        if (newStatus && newStatus !== match.status) {
          const [updated] = await db
            .update(matches)
            .set({ status: newStatus })
            .where(eq(matches.id, match.id))
            .returning();

          if (onStatusChange) onStatusChange(updated);
        }
      }
    } catch (e) {
      console.error('Status sync error:', e.message);
    }
  }, SYNC_INTERVAL_MS);

  console.log(`Status sync job running every ${SYNC_INTERVAL_MS / 1000}s`);
  return () => clearInterval(interval);
}

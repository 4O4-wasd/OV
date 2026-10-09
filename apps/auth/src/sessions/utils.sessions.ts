import { and, desc, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { sessions } from '../db/schema.js';
import { evictToken, type Auth } from '../auth/session-cache.auth.js';

const fail = (status: 400 | 404, message: string) =>
  new HTTPException(status, { message });

export async function listSessions(auth: Auth) {
  return db
    .select({
      id: sessions.id,
      createdAt: sessions.createdAt,
      ip: sessions.ip,
      userAgent: sessions.userAgent,
    })
    .from(sessions)
    .where(eq(sessions.userId, auth.user.id))
    .orderBy(desc(sessions.createdAt));
}

export async function deleteSession(auth: Auth, id: string) {
  if (id === auth.sessionId) {
    throw fail(400, 'Cannot delete the current session');
  }

  const session = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, auth.user.id)))
    .get();
  if (!session) {
    throw fail(404, 'Session not found');
  }

  await db.delete(sessions).where(eq(sessions.id, session.id));
  await evictToken(session.tokenHash);
}

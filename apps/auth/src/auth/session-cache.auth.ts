import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import { redisDel, redisGet, redisSetEx } from '../shared/redis.shared.js';
import { hashToken } from '../shared/token.shared.js';
import { SESSION_TTL_SECONDS, sessionKey } from '../shared/redis-keys.shared.js';

export interface UserSnapshot {
  id: string;
  email: string;
  name: string;
  handle: string;
  emailVerified: boolean;
  createdAt?: Date;
}

export interface SessionSnapshot {
  sessionId: string;
  tokenHash: string;
  user: UserSnapshot;
}

export interface Auth {
  sessionId: string;
  tokenHash: string;
  user: UserSnapshot;
}

function toUserSnapshot(user: typeof users.$inferSelect): UserSnapshot {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    handle: user.handle,
    emailVerified: !!user.emailVerified,
    createdAt: user.createdAt ?? undefined,
  };
}

function writeSnapshot(
  sessionId: string,
  tokenHash: string,
  user: UserSnapshot,
) {
  const snapshot: SessionSnapshot = { sessionId, tokenHash, user };
  return redisSetEx(
    sessionKey(tokenHash),
    SESSION_TTL_SECONDS,
    JSON.stringify(snapshot),
  );
}

export async function resolveSession(token: string) {
  const key = sessionKey(hashToken(token));

  const hit = await redisGet(key);
  if (hit) {
    return JSON.parse(hit) as SessionSnapshot;
  }

  const row = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, hashToken(token)))
    .get();
  if (!row) {
    return null;
  }

  const user = toUserSnapshot(row.user);
  await writeSnapshot(row.session.id, row.session.tokenHash, user);
  return { sessionId: row.session.id, tokenHash: row.session.tokenHash, user };
}

export async function evictToken(tokenHash: string) {
  await redisDel(sessionKey(tokenHash));
}

export async function evictUserSessions(userId: string) {
  const rows = await db
    .select({ tokenHash: sessions.tokenHash })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  await redisDel(...rows.map((s) => sessionKey(s.tokenHash)));
}

export async function refreshUserSessions(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return;

  const rows = await db
    .select({ id: sessions.id, tokenHash: sessions.tokenHash })
    .from(sessions)
    .where(eq(sessions.userId, userId));

  const snapshot = toUserSnapshot(user);
  await Promise.all(rows.map((s) => writeSnapshot(s.id, s.tokenHash, snapshot)));
}

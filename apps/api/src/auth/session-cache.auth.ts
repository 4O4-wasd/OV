import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import { sessions, users } from '../shared/db/schema.js';
import type { ClientInfo } from '../shared/client-info.shared.js';
import { redis } from '../shared/redis.shared.js';

const SESSION_TTL_SECONDS = 60;

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

export function toUserSnapshot(user: typeof users.$inferSelect): UserSnapshot {
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
  return redis.set(
    `sess:${tokenHash}`,
    JSON.stringify(snapshot),
    'EX',
    SESSION_TTL_SECONDS,
  );
}

export async function resolveSession(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('base64');
  const key = `sess:${tokenHash}`;

  const hit = await redis.get(key);
  if (hit) {
    return JSON.parse(hit) as SessionSnapshot;
  }

  const row = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .get();
  if (!row) {
    return null;
  }

  const user = toUserSnapshot(row.user);
  await writeSnapshot(row.session.id, row.session.tokenHash, user);
  return { sessionId: row.session.id, tokenHash: row.session.tokenHash, user };
}

export async function evictToken(tokenHash: string) {
  await redis.del(`sess:${tokenHash}`);
}

export async function evictUserSessions(userId: string) {
  const rows = await db
    .select({ tokenHash: sessions.tokenHash })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  if (rows.length) {
    await redis.del(...rows.map((s) => `sess:${s.tokenHash}`));
  }
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

export async function createSession(
  user: typeof users.$inferSelect,
  client: ClientInfo,
) {
  const token = randomBytes(48).toString('base64');
  await db.insert(sessions).values({
    userId: user.id,
    tokenHash: createHash('sha256').update(token).digest('base64'),
    ip: client.ip,
    userAgent: client.userAgent,
  });
  return token;
}

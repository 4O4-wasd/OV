import { and, eq, ne } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import {
  evictToken,
  refreshUserSessions,
  type Auth,
} from '../auth/session-cache.auth.js';
import { hashPassword } from '../shared/password.shared.js';
import { serializeUser } from '../auth/utils.auth.js';
import type { UpdateUserDto } from './dto.user.js';

const fail = (status: 400 | 409, message: string) =>
  new HTTPException(status, { message });

export async function updateUser(auth: Auth, dto: UpdateUserDto) {
  const set: {
    name?: string;
    handle?: string;
    passwordHash?: string;
  } = {};

  if (dto.name !== undefined) {
    set.name = dto.name;
  }
  if (dto.handle !== undefined) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.handle, dto.handle), ne(users.id, auth.user.id)))
      .get();
    if (existing) {
      throw fail(409, 'Handle is already taken');
    }
    set.handle = dto.handle;
  }
  if (dto.password !== undefined) {
    set.passwordHash = await hashPassword(dto.password);
  }

  const [user] = await db
    .update(users)
    .set(set)
    .where(eq(users.id, auth.user.id))
    .returning();

  await refreshUserSessions(user.id);
  return serializeUser(user);
}

export async function deleteUser(auth: Auth) {
  const rows = await db
    .select({ tokenHash: sessions.tokenHash })
    .from(sessions)
    .where(eq(sessions.userId, auth.user.id));

  await db.delete(users).where(eq(users.id, auth.user.id));

  await Promise.all(rows.map((s) => evictToken(s.tokenHash)));

  return { message: 'Account deleted' };
}

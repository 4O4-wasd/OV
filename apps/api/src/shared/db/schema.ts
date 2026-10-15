import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const createdAt = () => integer('created_at', { mode: 'timestamp_ms' });

const uuid = () => text('id').$defaultFn(() => crypto.randomUUID());

export const users = sqliteTable(
  'user',
  {
    id: uuid().primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    handle: text('handle').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: createdAt()
      .notNull()
      .$defaultFn(() => new Date()),
    emailVerified: integer('email_verified', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (t) => [
    uniqueIndex('user_email_unique').on(t.email),
    uniqueIndex('user_handle_unique').on(t.handle),
  ],
);

export const sessions = sqliteTable(
  'session',
  {
    id: uuid().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    createdAt: createdAt()
      .notNull()
      .$defaultFn(() => new Date()),
    ip: text('ip'),
    userAgent: text('user_agent'),
  },
  (t) => [
    uniqueIndex('session_token_hash_unique').on(t.tokenHash),
    index('session_user_id_index').on(t.userId),
  ],
);

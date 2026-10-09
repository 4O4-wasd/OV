import { drizzle } from 'drizzle-orm/libsql';

export const db = drizzle({
  connection: {
    url: process.env.LIBSQL_URL ?? 'sqlite.db',
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  },
  jit: true,
});

export type Db = typeof db;

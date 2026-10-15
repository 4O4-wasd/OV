import { drizzle } from "drizzle-orm/libsql";
import { env } from "../../env.js";

export const db = drizzle({
    connection: {
        url: env.LIBSQL_URL ?? "sqlite.db",
        authToken: env.LIBSQL_AUTH_TOKEN,
    },
    jit: true,
});

export type Db = typeof db;

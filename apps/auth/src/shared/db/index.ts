import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "../../env.js";
import * as schema from "./schema.js";

const relations = defineRelations(schema);

export const db = drizzle({
    connection: {
        url: env.LIBSQL_URL ?? "sqlite.db",
        authToken: env.LIBSQL_AUTH_TOKEN,
    },
    relations: { ...relations, ...schema.authRelations },
    jit: true,
});

export type Db = typeof db;

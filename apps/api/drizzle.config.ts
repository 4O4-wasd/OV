import { defineConfig } from "drizzle-kit";
import { env } from "./src/env";

export default defineConfig({
    dialect: "turso",
    schema: "./src/shared/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: env.LIBSQL_URL,
        authToken: env.LIBSQL_AUTH_TOKEN,
    },
});

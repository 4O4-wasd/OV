import "dotenv/config";
import { z } from "zod";

const domainRegex =
    /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export const envSchema = z.object({
    LIBSQL_URL: z.string().min(1),
    LIBSQL_AUTH_TOKEN: z.string().optional(),
    RESEND_API_KEY: z.string().startsWith("re_"),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().optional(),
    DNS: z.string().regex(domainRegex).catch("localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

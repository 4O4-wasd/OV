# OV Auth

Authentication service built with Hono and [Better Auth](https://better-auth.com), Drizzle (libSQL/Turso) and Resend.

Better Auth is mounted at `/api/auth/*`. Email and password sign-in with 6-digit email OTPs for verification and password reset, bearer tokens, session management and account deletion.

OpenAPI spec at `/openapi.json`, Scalar UI at `/`.

## Env

```
LIBSQL_URL, LIBSQL_AUTH_TOKEN, RESEND_API_KEY, BETTER_AUTH_SECRET, BETTER_AUTH_URL, DNS
```

`BETTER_AUTH_SECRET` must be at least 32 characters (`openssl rand -base64 32`).

## Scripts

```bash
pnpm dev        # tsx watch
pnpm build      # tsc → dist/
pnpm start      # node dist/server.js
pnpm check      # tsc --noEmit
pnpm email:dev  # email template preview
pnpm auth:generate  # regenerate the Better Auth Drizzle schema
pnpm db:push    # apply schema changes to the database
pnpm db:generate
pnpm openapi    # write packages/api-client/openapi.json
```

After changing Better Auth plugins or options, run `pnpm auth:generate` to refresh `src/shared/db/schema.ts`, then migrate.

## Deploy

Vercel (framework: hono, region bom1). `src/index.ts` default-exports the app.

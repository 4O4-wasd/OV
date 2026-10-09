# OV Auth API

Auth service built with Hono, hono-openapi, Drizzle (libSQL/Turso), Redis, and Resend.

| Method | Path                             | Auth   |
| ------ | -------------------------------- | ------ |
| POST   | `/api/sign-up`                   | -      |
| POST   | `/api/sign-in`                   | -      |
| POST   | `/api/forgot-password`           | -      |
| POST   | `/api/change-forgotten-password` | -      |
| POST   | `/api/verify-email`              | Bearer |
| GET    | `/api/me`                        | Bearer |
| PATCH  | `/api/me`                        | Bearer |
| DELETE | `/api/me`                        | Bearer |
| GET    | `/api/sessions`                  | Bearer |
| DELETE | `/api/session/:id`               | Bearer |

OpenAPI spec at `/openapi.json`, Scalar UI at `/`.

## Env

```
LIBSQL_URL, LIBSQL_AUTH_TOKEN, RESEND_API_KEY, REDIS_URL, APP_URL, PORT
```

## Scripts

```bash
pnpm dev        # tsx watch
pnpm build      # tsc → dist/
pnpm start      # node dist/server.js
pnpm typecheck
pnpm email:dev  # email template preview
pnpm db:push    # apply schema changes to the database
pnpm db:generate
```

## Deploy

Vercel (framework: hono, region bom1). `src/index.ts` default-exports the app.

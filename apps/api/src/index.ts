import { Scalar } from "@scalar/hono-api-reference";
import "dotenv/config";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { HTTPException } from "hono/http-exception";
import authRoutes from "./auth/index.auth.js";
import { env } from "./env.js";
import sessionRoutes from "./sessions/index.sessions.js";
import type { AppEnv } from "./types.js";
import userRoutes from "./user/index.user.js";

const app = new Hono<AppEnv>();

const serverUrl = `https://api.${env.DNS}`;

app.get(
    "/openapi.json",
    openAPIRouteHandler(app, {
        documentation: {
            info: {
                title: "OV API",
                version: "1.0",
                license: { name: "MIT", identifier: "MIT" },
            },
            servers: [{ url: serverUrl }],
            tags: [
                { name: "auth", description: "Authentication" },
                { name: "sessions", description: "Sessions" },
                { name: "user", description: "User account" },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },
        exclude: ["/"],
    }),
);

app.get(
    "/",
    Scalar({
        theme: "saturn",
        mcp: { disabled: true },
        agent: { disabled: true },
        url: "/openapi.json",
    }),
);

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        if (err.res) {
            return err.res;
        }
        return c.json({ message: err.message }, err.status);
    }
    console.error(err);
    return c.json({ message: "Internal server error" }, 500);
});

app.basePath("/api")
    .route("/", authRoutes)
    .route("/", userRoutes)
    .route("/", sessionRoutes);

export default app;

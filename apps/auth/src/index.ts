import { Scalar } from "@scalar/hono-api-reference";
import "dotenv/config";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { HTTPException } from "hono/http-exception";
import authRoutes from "./auth/index.auth.js";
import sessionRoutes from "./sessions/index.sessions.js";
import type { AppEnv } from "./types.js";
import userRoutes from "./user/index.user.js";

const app = new Hono<AppEnv>();

const serverUrl =
    process.env.APP_URL || `http://localhost:${process.env.PORT ?? 3000}`;

app.get(
    "/openapi.json",
    openAPIRouteHandler(app, {
        documentation: {
            info: {
                title: "OV API",
                version: "1.0",
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

app.basePath("/api")
    .route("/", authRoutes)
    .route("/", userRoutes)
    .route("/", sessionRoutes)

    .onError((err, c) => {
        if (err instanceof HTTPException) {
            return err.getResponse();
        }
        console.error(err);
        return c.json({ message: "Internal server error" }, 500);
    });

export default app;

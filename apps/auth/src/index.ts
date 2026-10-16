import { Scalar } from "@scalar/hono-api-reference";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth.js";
import { appUrl } from "./env.js";
import { getOpenApiDocument } from "./openapi.js";

const app = new Hono();

app.use(
    "/api/auth/*",
    cors({
        origin: [appUrl],
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        exposeHeaders: ["Content-Length", "set-auth-token"],
        credentials: true,
        maxAge: 600,
    }),
);

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/openapi.json", async (c) => c.json(await getOpenApiDocument()));

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

export default app;

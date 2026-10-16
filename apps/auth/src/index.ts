import { Scalar } from "@scalar/hono-api-reference";
import "dotenv/config";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth.js";
import { getOpenApiDocument } from "./openapi.js";

const app = new Hono();

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

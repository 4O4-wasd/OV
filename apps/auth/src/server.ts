import { serve } from "@hono/node-server";
import app from "./index.js";

const port = Number(process.env.PORT ?? 3000);

serve({ ...app, port }, (info) => {
    console.log(`OV Auth API listening on http://localhost:${info.port}`);
});

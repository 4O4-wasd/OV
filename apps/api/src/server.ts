import { serve } from "@hono/node-server";
import app from "./index.js";

serve(app, () => {
    console.log(`OV API listening on http://localhost:3000`);
});

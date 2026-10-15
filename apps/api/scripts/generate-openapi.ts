import { writeFileSync } from "node:fs";
import app from "../src/index.js";

const res = await app.request("/openapi.json");

if (!res.ok) {
    console.error(`Failed to generate OpenAPI spec: ${res.status}`);
    process.exit(1);
}

const spec = await res.json();
writeFileSync("openapi.json", `${JSON.stringify(spec, null, 2)}\n`);
console.log("Wrote openapi.json");
process.exit(0);

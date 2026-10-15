import { writeFileSync } from "node:fs";
import app from "../src/index.js";

const res = await app.request("/openapi.json");

if (!res.ok) {
    console.error(`Failed to generate OpenAPI spec: ${res.status}`);
    process.exit(1);
}

function toOpenApi30(node: unknown): void {
    if (Array.isArray(node)) {
        node.forEach(toOpenApi30);
        return;
    }
    if (node === null || typeof node !== "object") {
        return;
    }
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.type)) {
        const types = obj.type.filter((t) => t !== "null");
        if (types.length !== obj.type.length) {
            obj.nullable = true;
        }
        obj.type = types[0];
    }
    if ("const" in obj) {
        obj.enum = [obj.const];
        delete obj.const;
    }
    Object.values(obj).forEach(toOpenApi30);
}

const spec = await res.json();
toOpenApi30(spec);
spec.openapi = "3.0.3";

const out = new URL("../../../packages/api-client/openapi.json", import.meta.url);
writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
console.log("Wrote packages/api-client/openapi.json");
process.exit(0);

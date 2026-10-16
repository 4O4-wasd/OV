import { writeFileSync } from "node:fs";
import { getOpenApiDocument } from "../src/openapi.js";

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

function addOperationIds(paths: Record<string, Record<string, unknown>>) {
    for (const [path, item] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(item)) {
            const op = operation as { operationId?: string };
            if (typeof operation !== "object" || op.operationId) continue;
            const name = path
                .split(/[^a-zA-Z0-9]+/)
                .filter(Boolean)
                .map((part) => part[0].toUpperCase() + part.slice(1))
                .join("");
            op.operationId = `${method}${name}`;
        }
    }
}

function stripErrorBodies(paths: Record<string, Record<string, unknown>>) {
    for (const item of Object.values(paths)) {
        for (const operation of Object.values(item)) {
            const responses = (operation as { responses?: Record<string, { content?: unknown }> }).responses;
            if (!responses) continue;
            for (const [status, response] of Object.entries(responses)) {
                if (!status.startsWith("2")) delete response.content;
            }
        }
    }
}

const spec = await getOpenApiDocument();
toOpenApi30(spec);
addOperationIds(spec.paths as Record<string, Record<string, unknown>>);
stripErrorBodies(spec.paths as Record<string, Record<string, unknown>>);
spec.openapi = "3.0.3";

const out = new URL("../../../packages/api-client/openapi.json", import.meta.url);
writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
console.log("Wrote packages/api-client/openapi.json");
process.exit(0);

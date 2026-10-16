import { auth } from "./auth.js";
import { env } from "./env.js";

export async function getOpenApiDocument() {
    const document = await auth.api.generateOpenAPISchema();
    return {
        ...document,
        info: {
            title: "OV Auth API",
            version: "1.0",
            description:
                "Authentication API with email and password sign-in, OTP email verification, password reset, and session management.",
            license: { name: "MIT", identifier: "MIT" },
        },
        servers: [
            {
                url: `${env.BETTER_AUTH_URL ?? `https://${env.DNS}`}/api/auth`,
            },
        ],
    };
}

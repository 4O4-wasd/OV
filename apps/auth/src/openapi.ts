import { auth } from "./auth.js";
import { authUrl } from "./env.js";

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
        components: {
            ...document.components,
            securitySchemes: {
                bearerAuth: document.components.securitySchemes.bearerAuth,
            },
        },
        security: [{ bearerAuth: [] }],
        servers: [
            {
                url: `${authUrl}/api/auth`,
            },
        ],
    };
}

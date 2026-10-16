import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { waitUntil } from "@vercel/functions";
import { hash, verify } from "argon2";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { bearer } from "better-auth/plugins/bearer";
import { emailOTP } from "better-auth/plugins/email-otp";
import { username } from "better-auth/plugins/username";
import "./env.js";
import { sendOtpEmail } from "./mail/index.mail.js";
import { db } from "./shared/db/index.js";
import * as schema from "./shared/db/schema.js";

export const auth = betterAuth({
    appName: "OV",
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        revokeSessionsOnPasswordReset: true,
        password: {
            hash,
            verify: ({ password, hash }) =>
                verify(hash, password).catch(() => false),
        },
    },
    emailVerification: {
        autoSignInAfterVerification: true,
    },
    user: {
        deleteUser: { enabled: true },
    },
    session: {
        cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    rateLimit: {
        enabled: true,
        storage: "database",
        customRules: {
            "/sign-in/email": { window: 15 * 60, max: 10 },
            "/sign-up/email": { window: 60 * 60, max: 5 },
        },
    },
    advanced: {
        database: {
            joins: true,
        },
        ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
        backgroundTasks: { handler: (promise) => waitUntil(promise) },
    },
    plugins: [
        bearer(),
        username(),
        emailOTP({
            otpLength: 6,
            expiresIn: 15 * 60,
            storeOTP: "hashed",
            allowedAttempts: 5,
            rateLimit: { window: 60, max: 3 },
            sendVerificationOnSignUp: true,
            overrideDefaultEmailVerification: true,
            sendVerificationOTP: async ({ email, otp, type }) => {
                if (type === "sign-in" || type === "change-email") return;
                await sendOtpEmail(
                    email,
                    otp,
                    type === "email-verification" ? "verify-email" : (
                        "reset-password"
                    ),
                );
            },
        }),
        openAPI({ disableDefaultReference: true }),
    ],
});

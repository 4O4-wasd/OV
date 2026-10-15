import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { sessions, users } from "./db/schema.js";

export const MessageResponseSchema = z.object({
    message: z.string(),
});

export const UserSchema = createSelectSchema(users, {
    id: z.uuid().describe("The user's id"),
    name: (s) => s.min(1).describe("The user's display name"),
    handle: (s) => s.min(1).describe("The user's unique handle"),
    email: z.email().describe("The user's email address"),
    createdAt: z.iso.datetime().describe("When the account was created"),
});

export const SessionSchema = createSelectSchema(sessions, {
    id: z.uuid().describe("The session's id"),
    createdAt: z.iso.datetime().describe("When the session was created"),
});

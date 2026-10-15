import { SessionSchema } from '../shared/dto.shared.js';

export const SessionResponseSchema = SessionSchema.pick({
  id: true,
  createdAt: true,
  ip: true,
  userAgent: true,
});

export const SessionIdParamSchema = SessionSchema.pick({ id: true });

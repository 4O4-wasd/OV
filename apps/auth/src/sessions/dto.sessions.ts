import { z } from 'zod';

export const SessionIdParamSchema = z.object({
  id: z.uuid().describe('The id of the session to delete'),
});

export const SessionResponseSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
});

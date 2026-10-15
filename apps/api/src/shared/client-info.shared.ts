import type { Context } from 'hono';

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

export const clientInfo = (c: Context): ClientInfo => ({
  ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim(),
  userAgent: c.req.header('user-agent'),
});

import { Hono } from 'hono';
import { listSessionsRoute } from './routes/list-sessions.sessions.js';
import { deleteSessionRoute } from './routes/delete-session.sessions.js';
import type { AppEnv } from '../types.js';

const sessionRoutes = new Hono<AppEnv>()
  .route('/', listSessionsRoute)
  .route('/', deleteSessionRoute);

export default sessionRoutes;

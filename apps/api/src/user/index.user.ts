import { Hono } from 'hono';
import { updateUserRoute } from './routes/update-user.user.js';
import { deleteUserRoute } from './routes/delete-user.user.js';
import type { AppEnv } from '../types.js';

const userRoutes = new Hono<AppEnv>()
  .route('/', updateUserRoute)
  .route('/', deleteUserRoute);

export default userRoutes;

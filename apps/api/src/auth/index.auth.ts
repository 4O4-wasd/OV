import { Hono } from 'hono';
import { signUpRoute } from './routes/sign-up.auth.js';
import { signInRoute } from './routes/sign-in.auth.js';
import { forgotPasswordRoute } from './routes/forgot-password.auth.js';
import { changeForgottenPasswordRoute } from './routes/change-forgotten-password.auth.js';
import { verifyEmailRoute } from './routes/verify-email.auth.js';
import { meRoute } from './routes/me.auth.js';
import type { AppEnv } from '../types.js';

const authRoutes = new Hono<AppEnv>()
  .route('/', signUpRoute)
  .route('/', signInRoute)
  .route('/', forgotPasswordRoute)
  .route('/', changeForgottenPasswordRoute)
  .route('/', verifyEmailRoute)
  .route('/', meRoute);

export default authRoutes;

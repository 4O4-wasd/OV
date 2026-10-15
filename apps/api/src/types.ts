import type { Auth } from './auth/session-cache.auth.js';

export type AppEnv = {
  Variables: {
    auth: Auth;
  };
};

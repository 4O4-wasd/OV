import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionSnapshot, UserSnapshot } from './session-cache.service.js';

export interface CurrentAuth {
  
  session: Pick<SessionSnapshot, 'sessionId' | 'tokenHash'> & {
    id: number;
  };
  
  user: import('../entities/user.entity.js').User;
  
  userSnapshot: UserSnapshot;
}

export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentAuth => {
    const request = ctx.switchToHttp().getRequest();
    const session = request.currentSession;
    return {
      session: { ...session, id: session.id },
      user: request.currentUser,
      userSnapshot: request.currentUserSnapshot,
    };
  },
);

import { EntityManager } from '@mikro-orm/core';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../entities/user.entity.js';
import { SessionCacheService } from './session-cache.service.js';
import { SKIP_EMAIL_VERIFICATION_KEY } from './skip-verification.meta.js';

export const SkipEmailVerification = () =>
  SetMetadata(SKIP_EMAIL_VERIFICATION_KEY, true);

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly em: EntityManager,
    private readonly sessionCache: SessionCacheService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['authorization'];
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    const snapshot = await this.sessionCache.resolve(token);
    if (!snapshot) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_EMAIL_VERIFICATION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!snapshot.user.emailVerified && !skip) {
      throw new ForbiddenException('Email is not verified');
    }

    request.currentSession = {
      id: snapshot.sessionId,
      tokenHash: snapshot.tokenHash,
    };
    request.currentUser = this.em.getReference(User, snapshot.user.id);
    request.currentUserSnapshot = snapshot.user;
    return true;
  }
}

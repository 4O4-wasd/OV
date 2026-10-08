import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Session } from '../entities/session.entity.js';
import { SessionCacheService } from './session-cache.service.js';
import { CurrentAuth } from './current-auth.decorator.js';

@Injectable()
export class SessionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly sessionCache: SessionCacheService,
  ) {}

  
  async list(auth: CurrentAuth) {
    const sessions = await this.em.find(
      Session,
      { user: auth.user },
      { orderBy: { createdAt: 'desc' } },
    );
    return sessions.map((s) => ({ id: s.id, createdAt: s.createdAt }));
  }

  
  async delete(auth: CurrentAuth, id: number) {
    if (id === auth.session.id) {
      throw new BadRequestException('Cannot delete the current session');
    }

    const session = await this.em.findOne(Session, {
      id,
      user: auth.user,
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.em.remove(session).flush();
    await this.sessionCache.evictToken(session.tokenHash);
  }
}

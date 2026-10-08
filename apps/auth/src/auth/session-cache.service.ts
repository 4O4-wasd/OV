import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Session } from '../entities/session.entity.js';
import { RedisService } from '../redis/redis.module.js';
import { hashToken } from './token.util.js';
import { SESSION_TTL_SECONDS, sessionKey } from './redis-keys.js';

export interface UserSnapshot {
  id: number;
  email: string;
  name: string;
  handle: string;
  emailVerified: boolean;
  createdAt?: Date;
}

export interface SessionSnapshot {
  sessionId: number;
  tokenHash: string;
  user: UserSnapshot;
}

@Injectable()
export class SessionCacheService {
  constructor(
    private readonly redis: RedisService,
    private readonly em: EntityManager,
  ) {}

  async resolve(token: string): Promise<SessionSnapshot | null> {
    const key = sessionKey(hashToken(token));

    const hit = await this.redis.get(key);
    if (hit) {
      return JSON.parse(hit) as SessionSnapshot;
    }

    const session = await this.em.findOne(
      Session,
      { tokenHash: hashToken(token) },
      { populate: ['user'] },
    );
    if (!session) {
      return null;
    }

    const snapshot: SessionSnapshot = {
      sessionId: session.id,
      tokenHash: session.tokenHash,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        handle: session.user.handle,
        emailVerified: !!session.user.emailVerified,
        createdAt: session.user.createdAt,
      },
    };
    await this.redis.setEx(key, SESSION_TTL_SECONDS, JSON.stringify(snapshot));
    return snapshot;
  }

  async evictToken(tokenHash: string): Promise<void> {
    await this.redis.del(sessionKey(tokenHash));
  }

  
  async evictUserSessions(userId: number): Promise<void> {
    const sessions = await this.em.find(Session, { user: userId });
    await this.redis.del(...sessions.map((s) => sessionKey(s.tokenHash)));
  }
}

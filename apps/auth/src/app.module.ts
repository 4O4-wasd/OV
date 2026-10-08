import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/libsql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { Session, User } from './entities/index.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { SessionGuard } from './auth/session.guard.js';
import { SessionsController } from './auth/sessions.controller.js';
import { SessionsService } from './auth/sessions.service.js';
import { MailModule } from './mail/mail.module.js';
import { RedisModule } from './redis/redis.module.js';
import { SessionCacheService } from './auth/session-cache.service.js';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...defineConfig({
        metadataProvider: ReflectMetadataProvider,
        dbName: process.env.LIBSQL_URL ?? 'sqlite.db',
        password: process.env.LIBSQL_AUTH_TOKEN,
        entities: [User, Session],
      }),
    }),
    MailModule,
    RedisModule,
  ],
  controllers: [AuthController, SessionsController],
  providers: [AuthService, SessionsService, SessionGuard, SessionCacheService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly orm: MikroORM) {}

  
  async onApplicationBootstrap() {
    await this.orm.schema.update();
  }
}

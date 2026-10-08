import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Session } from '../entities/session.entity.js';
import { User } from '../entities/user.entity.js';
import { MailService } from '../mail/mail.service.js';
import { RedisService } from '../redis/redis.module.js';
import { SessionCacheService } from './session-cache.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ClientInfo } from './client-info.decorator.js';
import {
  generateOtp,
  generateToken,
  hashToken,
  OtpPurpose,
} from './token.util.js';
import {
  otpCooldownKey,
  otpKey,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
} from './redis-keys.js';
import { UserSnapshot } from './session-cache.service.js';

const require = createRequire(import.meta.url);

const DISPOSABLE_DOMAINS: string[] = JSON.parse(
  readFileSync(require.resolve('disposable-email-domains'), 'utf8'),
);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly redis: RedisService,
    private readonly sessionCache: SessionCacheService,
    private readonly mail: MailService,
  ) {}

  async signUp(dto: SignUpDto, client: ClientInfo) {
    const domain = dto.email.split('@')[1]?.toLowerCase();
    if (!domain || DISPOSABLE_DOMAINS.includes(domain)) {
      throw new BadRequestException(
        'Disposable email addresses are not allowed',
      );
    }

    const existing = await this.em.findOne(User, [
      { email: dto.email },
      { handle: dto.handle },
    ]);
    if (existing) {
      throw new ConflictException(
        existing.email === dto.email
          ? 'Email is already in use'
          : 'Handle is already taken',
      );
    }

    const user = this.em.create(User, {
      email: dto.email,
      name: dto.name,
      handle: dto.handle,
      passwordHash: await bcrypt.hash(dto.password, 10),
      emailVerified: false,
    });
    await this.em.persist(user).flush();

    const token = await this.createSession(user, client);
    await this.sendOtp(user, 'verify-email');

    return { token, user: this.serialize(user) };
  }

  async signIn(dto: SignInDto, client: ClientInfo) {
    const user = await this.em.findOne(User, { email: dto.email });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.createSession(user, client);
    if (!user.emailVerified) {
      await this.sendOtp(user, 'verify-email');
    }

    return { token, user: this.serialize(user) };
  }

  
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.em.findOne(User, { email: dto.email });
    if (!user) return;
    await this.sendOtp(user, 'reset-password');
  }

  
  async changePassword(dto: ChangePasswordDto) {
    const user = await this.em.findOne(User, { email: dto.email });
    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.assertOtp('reset-password', user.id, dto.otp);

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.em.persist(user).flush();
    await this.sessionCache.evictUserSessions(user.id);
  }

  
  async verifyEmail(user: User, dto: VerifyEmailDto) {
    await this.assertOtp('verify-email', user.id, dto.otp);

    user.emailVerified = true;
    await this.em.persist(user).flush();
    await this.sessionCache.evictUserSessions(user.id);

    return this.serialize(user);
  }

  
  private async assertOtp(purpose: OtpPurpose, userId: number, otp: string) {
    const key = otpKey(purpose, userId);
    const stored = await this.redis.get(key);
    if (!stored || stored !== hashToken(otp)) {
      throw new BadRequestException('Invalid OTP');
    }
    await this.redis.del(key);
  }

  
  private async sendOtp(user: User, purpose: OtpPurpose) {
    const fresh = await this.redis.setNxEx(
      otpCooldownKey(purpose, user.id),
      OTP_RESEND_COOLDOWN_SECONDS,
    );
    if (!fresh) return;

    const otp = generateOtp();
    await this.redis.setEx(
      otpKey(purpose, user.id),
      OTP_TTL_SECONDS,
      hashToken(otp),
    );
    try {
      await this.mail.sendOtp(user.email, otp, purpose);
    } catch (err) {
      this.logger.error(
        `Failed to send ${purpose} OTP to ${user.email}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async createSession(
    user: User,
    client: ClientInfo,
  ): Promise<string> {
    const token = generateToken();
    const session = this.em.create(Session, {
      user,
      tokenHash: hashToken(token),
      ip: client.ip,
      userAgent: client.userAgent,
    });
    await this.em.persist(session).flush();
    return token;
  }

  serialize(user: User | UserSnapshot) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      handle: user.handle,
      emailVerified: !!user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}

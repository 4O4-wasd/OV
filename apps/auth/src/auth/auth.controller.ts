import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentAuth } from './current-auth.decorator.js';
import { ClientInfo } from './client-info.decorator.js';
import { AuthService } from './auth.service.js';
import { SessionGuard, SkipEmailVerification } from './session.guard.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';

/**
 * Authentication
 */
@ApiTags('auth')
@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Create a new account, start a session, and email a verification OTP
   */
  @Post('sign-up')
  signUp(
    @Body() dto: SignUpDto,
    @ClientInfo() client: ClientInfo,
  ) {
    return this.authService.signUp(dto, client);
  }

  /**
   * Sign in with email and password, starting a new session.
   * Unverified accounts get a fresh verification OTP by email.
   */
  @Post('sign-in')
  @HttpCode(200)
  signIn(
    @Body() dto: SignInDto,
    @ClientInfo() client: ClientInfo,
  ) {
    return this.authService.signIn(dto, client);
  }

  /**
   * Request a password-reset OTP by email
   */
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * Set a new password using the OTP emailed by forgot-password
   */
  @Post('change-password')
  @HttpCode(200)
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(dto);
  }

  /**
   * Verify the signed-in user's email with the OTP from sign-up
   */
  @Post('verify-email')
  @HttpCode(200)
  @SkipEmailVerification()
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  verifyEmail(@CurrentAuth() auth: CurrentAuth, @Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(auth.user, dto);
  }

  /**
   * Get the currently signed-in user
   */
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  me(@CurrentAuth() auth: CurrentAuth) {
    return this.authService.serialize(auth.userSnapshot);
  }
}
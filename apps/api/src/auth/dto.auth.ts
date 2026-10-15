import { z } from 'zod';
import { UserSchema } from '../shared/dto.shared.js';
import { UserResponseSchema } from '../user/dto.user.js';

const password = z.string().min(1).describe("The user's password");
const otp = z.string().min(1).describe('The OTP sent to the email address');

export const SignUpSchema = UserSchema.pick({
  name: true,
  handle: true,
  email: true,
}).extend({ password });

export const SignInSchema = UserSchema.pick({ email: true }).extend({
  password,
});

export const ForgotPasswordSchema = UserSchema.pick({ email: true });

export const ChangeForgottenPasswordSchema = UserSchema.pick({
  email: true,
}).extend({
  otp,
  newPassword: z.string().min(1).describe('The new password'),
});

export const VerifyEmailSchema = z.object({ otp });

export const SignUpResponseSchema = z.object({
  token: z.string(),
});

export const SignInResponseSchema = SignUpResponseSchema.extend({
  user: UserResponseSchema,
});

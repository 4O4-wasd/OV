import { z } from 'zod';
import { UserResponseSchema } from '../user/dto.user.js';

export const SignUpSchema = z.object({
  name: z.string().min(1).describe("The user's display name"),
  handle: z.string().min(1).describe("The user's unique handle"),
  email: z.email().describe("The user's email address"),
  password: z.string().min(1).describe("The user's password"),
});

export const SignInSchema = z.object({
  email: z.email().describe("The user's email address"),
  password: z.string().min(1).describe("The user's password"),
});

export const ForgotPasswordSchema = z.object({
  email: z.email().describe('The email address of the account to reset'),
});

export const ChangeForgottenPasswordSchema = z.object({
  email: z.email().describe('The email address of the account'),
  otp: z.string().min(1).describe('The OTP sent to the email address'),
  newPassword: z.string().min(1).describe('The new password'),
});

export const VerifyEmailSchema = z.object({
  otp: z.string().min(1).describe("The OTP sent to the account's email address"),
});

export const SignUpResponseSchema = z.object({
  token: z.string(),
});

export const SignInResponseSchema = z.object({
  token: z.string(),
  user: UserResponseSchema,
});

export type SignUpDto = z.infer<typeof SignUpSchema>;
export type SignInDto = z.infer<typeof SignInSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ChangeForgottenPasswordDto = z.infer<
  typeof ChangeForgottenPasswordSchema
>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;

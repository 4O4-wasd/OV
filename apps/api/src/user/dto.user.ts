import { z } from 'zod';
import { UserSchema } from '../shared/dto.shared.js';

export const UserResponseSchema = UserSchema.omit({ passwordHash: true });

export const UpdateUserSchema = UserSchema.pick({
  name: true,
  handle: true,
})
  .extend({ password: z.string().min(1).describe('The new password') })
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'At least one field is required',
  });

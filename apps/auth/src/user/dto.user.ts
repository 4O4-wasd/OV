import { z } from 'zod';

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).describe('The new display name').optional(),
    handle: z.string().min(1).describe('The new unique handle').optional(),
    password: z.string().min(1).describe('The new password').optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'At least one field is required',
  });

export const UserResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  name: z.string(),
  handle: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

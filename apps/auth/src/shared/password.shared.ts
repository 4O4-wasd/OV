import { hash, verify } from '@node-rs/argon2';

export const hashPassword = (password: string) => hash(password);

export const verifyPassword = async (stored: string, password: string) => {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
};

import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

export const redisGet = (key: string) => redis.get(key);

export const redisSetEx = (key: string, ttlSeconds: number, value: string) =>
  redis.set(key, value, 'EX', ttlSeconds);

export const redisSetNxEx = async (key: string, ttlSeconds: number) =>
  (await redis.set(key, '1', 'EX', ttlSeconds, 'NX')) === 'OK';

export const redisDel = (...keys: string[]) =>
  keys.length ? redis.del(...keys).then(() => undefined) : Promise.resolve();

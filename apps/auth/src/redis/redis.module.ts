import { Injectable, Module } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  readonly client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  
  async setNxEx(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) {
      await this.client.del(...keys);
    }
  }
}

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

import { Injectable } from '@nestjs/common'
import { InjectRedis } from '@liaoliaots/nestjs-redis'
import Redis from 'ioredis'

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly client: Redis) {}

  getClient(): Redis {
    return this.client
  }

  /**
   * @param key
   * @param val
   * @param seconds
   */
  async set(key: string, val: string, seconds?: number) {
    if (!seconds) return this.client.set(key, val)
    return this.client.set(key, val, 'EX', seconds)
  }

  /**
   * @param key
   */
  async get(key: string): Promise<string> {
    if (!key || key === '*') return null
    return this.client.get(key)
  }

  /**
   * @param keys
   */
  async del(keys: string | Array<string>): Promise<number> {
    if (!keys || keys === '*') return 0
    if (typeof keys === 'string') keys = [keys]
    return this.client.del(...keys)
  }
}

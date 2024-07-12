import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { nanoid } from 'nanoid/non-secure'

import { RedisService } from '../../cache/redis/redis.service'
import { LoginUser } from '../../base/user/login-user'
import { JwtConst } from '../../constant/index'

@Injectable()
export class AuthJwtService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Config.Application>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 创建token
   * @param claims 用户登录信息
   */
  async createToken<T extends LoginUser>(claims: T): Promise<string> {
    claims.token = nanoid(32)
    await this.refreshToken(claims)
    return this.jwtService.sign(claims)
  }

  /**
   * 刷新token
   * @param user 用户登录信息
   */
  async refreshToken<T extends LoginUser>(user: T): Promise<void> {
    let { expires } = this.configService.get<Config.Jwt>('jwt')
    if (!expires) expires = 30
    const expireTime = expires * 1000
    user.loginTime = Date.now()
    user.expireTime = user.loginTime + expireTime
    const key = this.getRedisKey(user.platform, user.token)
    await this.redisService.set(key, JSON.stringify(user), expireTime)
  }

  /**
   * 解析token
   * @param token
   */
  parseToken<T extends LoginUser>(token: string): T {
    const payload = this.jwtService.verify(token)
    return JSON.stringify(payload) as T
  }

  /**
   * 获取token
   * @param tokenKey
   */
  getToken(tokenKey?: string): null | string {
    if (!tokenKey) return null
    if (tokenKey.startsWith(JwtConst.JwtHeaderPrefix)) {
      return tokenKey.replace(JwtConst.JwtHeaderPrefix, '')
    }
    return tokenKey
  }

  async getLoginUser<T extends LoginUser>(platform: string, key: string): Promise<T | null> {
    const tokenKey = this.getToken(key)
    if (!tokenKey) return
    const token = this.jwtService.verify(tokenKey)
    const redisKey = this.getRedisKey(platform, token)
    const user = await this.redisService.get(redisKey)
    if (!user) return null
    return JSON.parse(user) as T
  }

  getRedisKey(platform: string, key: string) {
    return `auth:${platform}:${key}`
  }
}

import { Injectable } from '@nestjs/common'
import { LoginUser } from '../../base/user/login-user'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../../cache/redis/redis.service'

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
    const token = '1'
    claims.token = token
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
    const key = `${user.platform}:${user.token}`
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
}

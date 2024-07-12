import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common'
import { Observable } from 'rxjs'
import { FastifyRequest } from 'fastify'

import { RouterWhiteService } from '../init/router-white.service'
import { ConfigService } from '@nestjs/config'
import { AuthJwtService } from '../../core/auth/jwt/auth-jwt.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(RouterWhiteService)
    private readonly routerWhiteService: RouterWhiteService,
    private readonly configService: ConfigService<Config.Application>,
    private readonly authJwtService: AuthJwtService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>()
    const { ip, url } = req
    // 装饰器白名单
    const routerWhiteList = this.routerWhiteService.whiteList
    if (routerWhiteList.includes(url)) return true
    const { platformHeader } = this.configService.get<Config.App>('app')
    const { header } = this.configService.get<Config.Jwt>('jwt')
    const platform = req.headers[platformHeader]
    if (!platform) return false
    const currentUser = this.authJwtService.getLoginUser(platform, req.headers[header])
    if (currentUser) return false
    // 把用户存入ctx
    // req.context.loginUser = currentUser
    return false
  }
}

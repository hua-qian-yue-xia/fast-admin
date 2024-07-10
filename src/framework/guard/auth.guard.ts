import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common'
import { Observable } from 'rxjs'
import { RouterWhiteService } from '../init/router-white.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(RouterWhiteService)
    private readonly routerWhiteService: RouterWhiteService,
  ) {}
  canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const { ip, url } = req
    // 装饰器白名单
    const routerWhiteList = this.routerWhiteService.whiteList
    if (routerWhiteList.includes(url)) return true
    return false
  }
}

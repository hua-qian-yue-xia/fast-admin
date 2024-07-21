import { Controller, Get } from '@nestjs/common'
import { Anonymous } from '../../../framework/decorators/req/anonymous'

@Controller('/admin/user')
export class SysUserController {
  @Get('/login')
  @Anonymous()
  login() {
    return '登录成功'
  }

  @Get('/list')
  list() {
    return 'list'
  }
}

import { Controller, Param, Req } from '@nestjs/common'
import {ApiTags} from '@nestjs/swagger'
import {AspenGet} from '../../../framework/decorators/req/aspen-req.decorators'
import { AspenRateLimit } from '../../../framework/decorators'

@ApiTags('操作日志')
@Controller('/admin/common/chang-log')
export class ChangeLogController {
  @AspenGet({
    path: '/list',
    summary: '查询操作日志列表',
    isLog: true,
    isAnonymous: true,
  })
  @AspenRateLimit()
  list(@Param() id: string) {
    return 'list'
  }
}

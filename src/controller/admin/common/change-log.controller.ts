import {Controller, Get} from '@nestjs/common'
import {Log, LogOption} from '../../../framework/decorators/req/log'
import {Anonymous} from '../../../framework/decorators/req/anonymous'

@Controller('/admin/common/chang-log')
export class ChangeLogController {
  @Log({summary: '测试'})
  @Get('/list')
  @Anonymous()
  list() {
    return 'list'
  }
}

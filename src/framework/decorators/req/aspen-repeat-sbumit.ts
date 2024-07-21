import {SetMetadata} from '@nestjs/common'

export const ASPEN_REPEAT_SUBMIT = 'aspen_repeat_submit'

export type AspenRepeatSubmitOption = {
  /**
   * 间隔时间(s)
   * @default 5
   */
  interval: number
  /**
   * 提示消息
   * @default 请勿重复提交
   */
  message: string
}

const defaultAspenRateLimitOption: AspenRepeatSubmitOption = {
  interval: 5,
  message: '请勿重复提交',
}

export const AspenRepeatSubmit = (options?: AspenRepeatSubmitOption) => {
  return SetMetadata(ASPEN_REPEAT_SUBMIT, {...defaultAspenRateLimitOption, ...options})
}

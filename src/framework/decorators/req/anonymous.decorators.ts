import {SetMetadata} from '@nestjs/common'

export const ANONYMOUS = 'Anonymous'

export const Anonymous = () => SetMetadata(ANONYMOUS, true)

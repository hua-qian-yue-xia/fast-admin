import {SetMetadata} from '@nestjs/common'

export const ASPEN_ANONYMOUS = 'aspen_anonymous'

export const Anonymous = () => SetMetadata(ASPEN_ANONYMOUS, true)

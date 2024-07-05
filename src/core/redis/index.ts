import { Provider } from '@nestjs/common/interfaces/modules/provider.interface'

export const setupRedisCache = (): Provider => {
  return {
    provide: 'REDIS_CATCH',
    useFactory: () => {
      return
    },
  }
}

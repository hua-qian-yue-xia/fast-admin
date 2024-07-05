import { Provider } from '@nestjs/common/interfaces/modules/provider.interface'

export const setupMysqlDataBase = (): Provider => {
  return {
    provide: 'DATA_SOURCE',
    useFactory: () => {
      return
    },
  }
}

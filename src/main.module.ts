import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [],
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class MainModule {}

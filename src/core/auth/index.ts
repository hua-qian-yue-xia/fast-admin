import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthJwtService } from './jwt/auth-jwt.service'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      extraProviders: [AuthJwtService],
      useFactory: (config: ConfigService) => {
        const { secret, expires } = config.get<Config.Jwt>('jwt')
        let expiresIn = ''
        if (!expires) expiresIn = '1y'
        if (expires) expiresIn = `${expires}m`
        return {
          global: true,
          secret: secret,
          signOptions: {
            expiresIn: expiresIn,
          },
        }
      },
    }),
  ],
})
export class AuthModule {}

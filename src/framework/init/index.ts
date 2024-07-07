import { Global, Module } from '@nestjs/common'
import { RouterWhiteService } from './router-white.service'
import { DiscoveryService } from '@nestjs/core'
import { MetadataScanner } from '@nestjs/core/metadata-scanner'

@Global()
@Module({
  providers: [RouterWhiteService, DiscoveryService, MetadataScanner],
  exports: [RouterWhiteService],
})
export class InitModule {}

import { Injectable, OnModuleInit } from '@nestjs/common'
import { DiscoveryService, Reflector } from '@nestjs/core'
import { MetadataScanner } from '@nestjs/core/metadata-scanner'
import { PATH_METADATA } from '@nestjs/common/constants'
import { ANONYMOUS } from '../decorators/anonymous'

@Injectable()
export class RouterWhiteService implements OnModuleInit {
  whiteList: Array<string> = []

  constructor(
    private readonly reflector: Reflector,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit(): void {
    this.getWhiteList()
  }

  getWhiteList() {
    this.discoveryService
      .getControllers()
      .filter(wrapper => wrapper.isDependencyTreeStatic())
      .filter(wrapper => wrapper.instance)
      .forEach(v => {
        const { instance } = v
        const controllerPath = this.reflector.get(PATH_METADATA, v.metatype)
        this.metadataScanner.getAllMethodNames(instance).forEach(name => {
          const path = this.reflector.get(PATH_METADATA, instance[name])
          const anonymous = this.reflector.get(ANONYMOUS, instance[name])
          const whitePath = `${controllerPath}${path}`
          if (anonymous && anonymous === true) {
            this.whiteList.push(whitePath)
          }
        })
      })
  }
}

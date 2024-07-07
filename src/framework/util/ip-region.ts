import IP2Region from 'ip2region'
import { Global, Injectable, Module } from '@nestjs/common'

@Global()
@Module({ providers: [IpRegion], exports: [IpRegion] })
export class IpRegion {
  private query: IP2Region
  constructor() {
    this.query = new IP2Region({ disableIpv6: false })
  }
  search(ip: string) {
    return this.query.search(ip)
  }
}

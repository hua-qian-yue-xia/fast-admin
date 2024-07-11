declare namespace Config {
  interface Application {
    app: App
    database: Database
    redis: Redis
    jwt: Jwt
  }

  interface App {
    prefix: string
    port: number
    // 平台header
    platformHeader: string
  }

  interface Database {
    host?: string
    port?: number
    username?: string
    password?: string
    database?: string
  }

  interface Redis {
    host?: string
    port?: number
    password?: string
    db?: number
  }
  interface Jwt {
    secret?: string
    // 过期时间单位分钟
    expires?: number
    // jwt-header
    header?: string
  }
}

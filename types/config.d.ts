declare namespace Config {
  interface Application {
    app: App
    database: Database
    redis: Redis
  }

  interface App {
    prefix: string
    port: number
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
}

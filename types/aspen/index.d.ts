declare namespace AspenConf {
	type Application = {
		app: AppConf
		redis: RedisConf
		database: DatabaseConf
		jwt: JwtConf
		localFile: LocalFileConf
		logger: LoggerConf
		tempo: TempoConf
		prometheus: PrometheusConf
		doc: DocConf
		syncStorage: SyncStorageConf
	}

	/**
	 * 配置
	 * 'DEV' 开发环境
	 * 'PROD' 生产环境
	 * '' 默认配置
	 */
	type Active = "DEV" | "PROD" | ""

	/**
	 * app配置
	 */
	type AppConf = {
		/**
		 * app名称(不能是中文)
		 */
		name: string
		/**
		 * app描述
		 */
		description: string
		/**
		 * 版本号
		 */
		version: string
		/**
		 * 全局路由前缀
		 */
		prefix: string
		/**
		 * 服务运行端口
		 * @default 7001
		 */
		port: number
		/**
		 * 是否开启cors
		 * @default false
		 */
		enableCors: boolean
	}

	type RedisConf = {
		/**
		 * redis访问地址
		 */
		host?: string
		/**
		 * redis访问端口
		 * @define 6379
		 */
		port?: number
		/**
		 * redis密码
		 * @define ""
		 */
		password?: string
		/**
		 * 数据库
		 * @default 0
		 */
		db?: number
	}

	type DatabaseConf = {
		/**
		 * 数据库类型
		 * @default mysql
		 */
		type?: "mysql" | "postgres"
		/**
		 * database 访问地址
		 * @define localhost
		 */
		host?: string
		/**
		 * database 访问端口
		 * @define 3306
		 */
		port?: number
		/**
		 * database 用户名
		 */
		username?: string
		/**
		 * database 密码
		 */
		password?: string
		/**
		 * database 名称
		 */
		database?: string
		/**
		 * 每次建立连接时删除架构
		 * 请注意此选项,不要在生产环境中使用它,否则将丢失所有生产数据.但是此选项在调试和开发期间非常有用
		 * @define false
		 */
		dropSchema?: boolean
		/**
		 * 是否在每次应用程序启动时自动创建数据库架构
		 * 请注意此选项,不要在生产环境中使用它,否则将丢失所有生产数据.但是此选项在调试和开发期间非常有用
		 * @define false
		 */
		synchronize?: boolean
	}

	type JwtConf = {
		/**
		 * 密钥
		 */
		secret: string
		/**
		 * token过期时间,默认一天过期
		 * @see https://www.npmjs.com/package/ms
		 * @default '1D'
		 */
		accessExpiresIn?: import("ms").StringValue
		/**
		 * refresh token过期时间,默认7天过期
		 * @see https://www.npmjs.com/package/ms
		 * @default '7D'
		 */
		refreshExpiresIn?: import("ms").StringValue
	}

	interface LocalFileConf {
		/**
		 * 本地文件存储路径
		 * @default '/upload'
		 */
		basePath?: string
		/**
		 * 分块文件存储路径
		 * @default '/chunks'
		 */
		chunkPath?: string
		/**
		 * 最大文件大小(M)
		 * @default 20
		 */
		maxFileSize?: number
	}

	type LoggerConf = {
		/**
		 * 日志级别
		 * @default 'info'
		 */
		level?: ""

		/**
		 * 是否压缩归档
		 * @default true
		 */
		zippedArchive?: boolean

		/**
		 * 单文件最大大小
		 * @default '20m'
		 */
		maxSize?: string

		/**
		 * 保留日志文件时间
		 * @default '30D'
		 */
		maxFiles?: import("ms").StringValue

		/**
		 * loki主机地址
		 */
		lokiHost?: string

		/**
		 * 日志传输方式
		 * @default console | file
		 * console: 控制台输出
		 * file: 文件输出
		 * loki: loki输出
		 */
		transports?: Array<"console" | "file" | "loki">
	}

	type TempoConf = {
		/**
		 * 是否开启 Tempo trace 上报
		 * @default false
		 */
		enabled?: boolean

		/**
		 * OTLP HTTP traces 端点.
		 * 既支持完整路径 `http://127.0.0.1:4318/v1/traces`,
		 * 也支持基础地址 `http://127.0.0.1:4318`.
		 */
		otlpHttpUrl?: string

		/**
		 * 自定义上报请求头.
		 * 常用于 Grafana Cloud / Gateway Token 鉴权.
		 */
		headers?: Record<string, string>
		/**
		 * OTLP 请求超时时间,单位毫秒
		 * @default 10000
		 */
		timeoutMs?: number
	}

	type PrometheusConf = {
		/**
		 * 是否开启 Prometheus metrics 暴露
		 * @default false
		 */
		enabled?: boolean

		/**
		 * metrics 暴露路径
		 * @default '/metrics'
		 */
		path?: string

		/**
		 * 是否启用 prom-client 默认指标采集
		 * @default true
		 */
		defaultMetricsEnabled?: boolean

		/**
		 * prom-client 默认指标前缀
		 * 例如设置为 `node_` 后,会生成 `node_process_cpu_seconds_total`
		 */
		defaultMetricPrefix?: string

		/**
		 * 通过 `makeCounterProvider` 等方式创建的自定义指标统一前缀
		 * 框架会自动补齐 `_`
		 */
		customMetricPrefix?: string

		/**
		 * 默认指标标签,会与 service/version/environment 自动标签合并
		 */
		defaultLabels?: Record<string, string>
	}

	type DocConf = {
		/**
		 * swagger文档路径前缀
		 * @default '/doc'
		 */
		pathPrefix?: string
		/**
		 * 是否开启
		 * @default false
		 */
		enable?: boolean
	}

	type SyncStorageConf = {
		/**
		 * 异步存储配置
		 */
		storage?: {
			/**
			 * 在`middleware`阶段中要存入`async-storage`的key
			 */
			middlewareKeys: Array<string>
			/**
			 * 在`guard`阶段中要存入`async-storage`的key
			 */
			guardKeys: Array<string>
			/**
			 * 在`interceptor`阶段中要存入`async-storage`的key
			 */
			interceptorKeys: Array<string>
		}
	}
}

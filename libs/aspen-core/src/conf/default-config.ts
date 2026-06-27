export const DEFAULT_CONF: AspenConf.Application = {
	app: {
		name: "",
		description: "",
		version: "",
		prefix: "",
		port: 7001,
		enableCors: false,
	},
	redis: {
		host: "",
		port: 6379,
		password: "",
		db: 0,
	},
	database: {
		type: "mysql",
		host: "localhost",
		port: 3306,
		username: "",
		password: "",
		database: "",
		dropSchema: false,
		synchronize: false,
	},
	jwt: {
		secret: "",
		accessExpiresIn: "1D",
		refreshExpiresIn: "7D",
	},
	logger: {
		level: "",
		zippedArchive: true,
		maxSize: "20m",
		maxFiles: "30D",
		lokiHost: "",
		transports: ["console", "file"],
	},
	tempo: {
		enabled: false,
		otlpHttpUrl: "",
		headers: {},
		timeoutMs: 10000,
	},
	doc: {
		pathPrefix: "/doc",
		enable: false,
	},
	syncStorage: {
		storage: {
			middlewareKeys: [],
			guardKeys: [],
			interceptorKeys: [],
		},
	},
}

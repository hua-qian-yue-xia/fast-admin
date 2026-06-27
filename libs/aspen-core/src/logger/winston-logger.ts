import * as os from "node:os"

import { Injectable, Scope, LoggerService } from "@nestjs/common"

import { createLogger, format, transports, config, Logger } from "winston"
import * as DailyRotateFile from "winston-daily-rotate-file"

import { ColorTool, OsTool } from "../tool"

declare const __non_webpack_require__: NodeJS.Require | undefined

@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLogger implements LoggerService {
	private context?: string

	private readonly winstonLogger: Logger

	constructor(winstonLogger: Logger) {
		this.winstonLogger = winstonLogger
	}

	// Nest 标准 log → Winston info
	public log(message: any, context?: string): any {
		context = context || this.context
		if (!!message && "object" === typeof message) {
			const { message: msg, level = "info", ...meta } = message
			return this.winstonLogger.log(level, msg as string, { context, ...meta })
		}
		return this.winstonLogger.info(message, { context })
	}

	// Nest 标准 fatal → Winston fatal
	public fatal(message: any, trace?: string, context?: string): any {
		context = context || this.context
		if (message instanceof Error) {
			const { message: msg, name, stack, ...meta } = message
			return this.winstonLogger.log({
				level: "fatal",
				message: msg,
				context,
				stack: [trace || stack],
				error: message,
				...meta,
			})
		}
		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message
			return this.winstonLogger.log({ level: "fatal", message: msg, context, stack: [trace], ...meta })
		}
		return this.winstonLogger.log({ level: "fatal", message, context, stack: [trace] })
	}

	// Nest warn → Winston warn
	public warn(message: any, context?: string) {
		context = context || this.context
		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message
			return this.winstonLogger.warn(msg as string, { context, ...meta })
		}
		return this.winstonLogger.warn(message, { context })
	}

	// Nest error → Winston error
	public error(message: any, trace?: string, context?: string): any {
		context = context || this.context
		if (message instanceof Error) {
			const { message: msg, name, stack, ...meta } = message
			return this.winstonLogger.error(msg, { context, stack: [trace || message.stack], error: message, ...meta })
		}
		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message

			return this.winstonLogger.error(msg as string, { context, stack: [trace], ...meta })
		}
		return this.winstonLogger.error(message, { context, stack: [trace] })
	}

	// Nest debug → Winston debug
	public debug?(message: any, context?: string): any {
		context = context || this.context
		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message
			return this.winstonLogger.debug(msg as string, { context, ...meta })
		}
		return this.winstonLogger.debug(message, { context })
	}

	// Nest verbose → Winston verbose
	public verbose?(message: any, context?: string): any {
		context = context || this.context
		if (!!message && "object" === typeof message) {
			const { message: msg, ...meta } = message
			return this.winstonLogger.verbose(msg as string, { context, ...meta })
		}
		return this.winstonLogger.verbose(message, { context })
	}

	public getWinstonLogger(): Logger {
		return this.winstonLogger
	}
}

const pad = (s: any, w: number) => {
	const str = (s ?? "").toString()
	return str.length >= w ? str.slice(0, w) : str.padEnd(w, " ")
}

const colorLevel = (raw: string, fixed: string) => {
	switch ((raw || "").toLowerCase()) {
		case "error":
			return ColorTool.wrap(fixed, "red")
		case "warn":
			return ColorTool.wrap(fixed, "yellow")
		case "info":
			return ColorTool.wrap(fixed, "green")
		case "http":
			return ColorTool.wrap(fixed, "cyan")
		case "debug":
			return ColorTool.wrap(fixed, "blue")
		case "verbose":
			return ColorTool.wrap(fixed, "magenta")
		case "silly":
			return ColorTool.wrap(fixed, "gray")
		default:
			return fixed
	}
}

const loadLokiTransport = () => {
	const runtimeRequire =
		typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : (Function("return require")() as NodeJS.Require)
	const lokiTransport = runtimeRequire("winston-loki")
	return lokiTransport.default || lokiTransport
}

const writeInternalLoggerMessage = (tag: string, level: "INFO" | "ERROR", message: string, error?: unknown) => {
	const output = `[WinstonLogger] [${tag}] [${level}] ${message}`
	if (level === "ERROR") {
		const errorMessage = error instanceof Error ? `\n${error.stack ?? error.message}` : error ? `\n${String(error)}` : ""
		process.stderr.write(`${output}${errorMessage}\n`)
		return
	}
	process.stdout.write(`${output}\n`)
}

export const createWinstonLogger = (appConfig: AspenConf.AppConf, loggerConfig: AspenConf.LoggerConf) => {
	// 控制台彩色可读格式(开发友好)
	const consoleFormat = format.combine(
		// 不使用全局 colorize，避免影响对齐；改为在 printf 内对 level 上色
		format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
		format.errors({ stack: true }),
		format.printf(({ timestamp, level, message, context, ...rest }) => {
			const lvl = `[${colorLevel(level, pad(level.toUpperCase(), 5))}]`
			const ctxFixed = context ? `[${pad(context, 20)}] ` : "[]"
			const msg = typeof message === "string" ? message : JSON.stringify(message)
			return `${timestamp} ${lvl} ${ctxFixed}${msg}`
		}),
	)

	// 文件 JSON 格式（便于 Promtail/Loki 采集）
	const jsonFormat = format.combine(format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), format.errors({ stack: true }), format.json())

	// 兼容 default 导出与命名空间导出
	const RotateClass: any = (DailyRotateFile as any).default || (DailyRotateFile as any)
	const enabledTransports = loggerConfig.transports ?? []

	const labels = {
		app: appConfig.name,
		env: process.env.NODE_ENV,
		os: os.hostname(),
		ip: OsTool.getLocalIp(),
		instance: OsTool.getResolveInstance(),
	}

	const consoleTransports = () => {
		return new transports.Console({
			level: loggerConfig.level,
			format: consoleFormat,
			handleExceptions: true,
			handleRejections: true,
		})
	}

	const fileTransports = () => {
		return new RotateClass({
			dirname: `logs/${appConfig.name}`,
			filename: `${appConfig.name}-%DATE%.log`,
			datePattern: "YYYY-MM-DD",
			zippedArchive: loggerConfig.zippedArchive,
			maxSize: loggerConfig.maxSize,
			maxFiles: loggerConfig.maxFiles,
			handleExceptions: true,
			handleRejections: true,
			format: jsonFormat,
		})
	}

	const lokiTransports = () => {
		try {
			const LokiClass: any = loadLokiTransport()
			const transport = new LokiClass({
				host: loggerConfig.lokiHost,
				labels: labels,
				json: true,
				// 是否开启批量推送
				batching: true,
				// 批量推送间隔(秒)
				interval: 5,
				// 是否用日志中的 timestamp 替换 loki 中的 timestamp
				replaceTimestamp: true,
				level: loggerConfig.level,
				onConnectionError: (error: unknown) => {
					writeInternalLoggerMessage("Loki", "ERROR", `日志推送失败,host=${loggerConfig.lokiHost}`, error)
				},
				onConnectionSuccess: () => {
					writeInternalLoggerMessage("Loki", "INFO", `transport 已连接,host=${loggerConfig.lokiHost}`)
				},
			})

			transport.on?.("error", (error: unknown) => {
				writeInternalLoggerMessage("Loki", "ERROR", `transport 运行异常,host=${loggerConfig.lokiHost}`, error)
			})

			writeInternalLoggerMessage("Loki", "INFO", `transport 已初始化,host=${loggerConfig.lokiHost}`)
			return transport
		} catch (error) {
			writeInternalLoggerMessage("Loki", "ERROR", `transport 初始化失败,host=${loggerConfig.lokiHost}`, error)
			throw error
		}
	}

	const transportList = []
	if (enabledTransports.includes("console")) {
		transportList.push(consoleTransports())
	}
	if (enabledTransports.includes("file")) {
		transportList.push(fileTransports())
	}
	if (enabledTransports.includes("loki")) {
		transportList.push(lokiTransports())
	}

	return createLogger({
		levels: config.npm.levels,
		level: loggerConfig.level,
		exitOnError: false,
		defaultMeta: labels,
		transports: transportList,
	})
}

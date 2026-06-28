import { Type } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify"

import { ApplicationModule } from "./application-module"
import { AppCtx } from "./application-ctx"

import { OsTool } from "../tool/index"
import { ConfTool } from "../conf/config"
import { registerSwaggerDoc } from "../doc/swagger"

/**
 * 应用静态启动器
 * 类似 SpringApplication.run(...)
 */
export class Application {
	/**
	 * 当前 Nest 应用实例
	 */
	private static app: NestFastifyApplication

	/**
	 * 当前服务本机 IP
	 */
	public static localIp: string

	/**
	 * 全局配置服务
	 */
	public static config: ConfigService<AspenConf.Application, true>

	/**
	 * 创建应用并完成基础自动装配
	 * 1. 加载 YAML 配置
	 * 2. 创建 Fastify 应用
	 * 3. 初始化全局配置与本机 IP
	 * 4. 自动处理 CORS 与全局路由前缀
	 */
	private static async bootstrap(module: Type<any>, cwdPath: string): Promise<NestFastifyApplication> {
		const bootstrapConfig = ConfTool.readActiveYamlFile(cwdPath) as unknown as AspenConf.Application

		this.app = await NestFactory.create<NestFastifyApplication>(
			ApplicationModule.forRoot([bootstrapConfig], module),
			new FastifyAdapter({
				logger: false,
			}),
			{ bufferLogs: true },
		)
		AppCtx.init(this.app)
		this.config = this.app.get(ConfigService)
		// 获取本机 IP,用于启动日志输出
		this.localIp = OsTool.getLocalIp()

		const appConfig = this.config.getOrThrow("app", { infer: true })
		// 自动启用 CORS
		if (appConfig.enableCors) {
			this.app.enableCors()
		}
		// 自动设置全局路由前缀
		if (appConfig.prefix) {
			this.app.setGlobalPrefix(appConfig.prefix)
		}

		registerSwaggerDoc(this.app, this.localIp)

		return this.app
	}

	/**
	 * 按配置启动 HTTP 服务
	 */
	private static async listen(): Promise<NestFastifyApplication> {
		const appConfig = this.config.getOrThrow("app", { infer: true })
		await this.app.listen(appConfig.port, "0.0.0.0")
		const normalizedPrefix = appConfig.prefix ? `/${appConfig.prefix.replace(/^\/+|\/+$/g, "")}` : ""
		const startupUrl = `http://${this.localIp}:${appConfig.port}${normalizedPrefix || "/"}`
		console.log(`|应用启动| 地址: ${startupUrl}`)
		return this.app
	}

	/**
	 * 统一启动入口
	 * 默认从当前工作目录读取 YAML 配置并完成应用启动
	 */
	static async run(module: Type<any>, cwdPath = process.cwd()): Promise<NestFastifyApplication> {
		await this.bootstrap(module, cwdPath)
		return this.listen()
	}
}

import * as os from "node:os"

import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { NodeSDK } from "@opentelemetry/sdk-node"

import { TEMPO_DEFAULT_OTLP_TRACES_PATH, TEMPO_LOG_TAG, TEMPO_MODULE_OPTIONS } from "./tempo-constant"
import { createTempoInstrumentations } from "./tempo-instrumentation"
import { TempoModuleOptions } from "./tempo-module"

import { OsTool } from "../tool"

const writeInternalTempoMessage = (tag: string, level: "INFO" | "WARN" | "ERROR", message: string, error?: unknown) => {
	const output = `[TempoService] [${tag}] [${level}] ${message}`
	if (level === "ERROR") {
		const errorMessage = error instanceof Error ? `\n${error.stack ?? error.message}` : error ? `\n${String(error)}` : ""
		process.stderr.write(`${output}${errorMessage}\n`)
		return
	}
	process.stdout.write(`${output}\n`)
}

@Injectable()
export class TempoService implements OnModuleInit, OnApplicationShutdown {
	private sdk: NodeSDK | null = null

	private startPromise: Promise<void> | null = null

	constructor(
		private readonly configService: ConfigService<AspenConf.Application, true>,
		@Inject(TEMPO_MODULE_OPTIONS) private readonly options: TempoModuleOptions,
	) {}

	async onModuleInit() {
		await this.start()
	}

	async onApplicationShutdown() {
		await this.shutdown()
	}

	async start() {
		if (!this.options.enabled) {
			return
		}
		if (this.sdk || this.startPromise) {
			return this.startPromise ?? Promise.resolve()
		}

		const tempoConfig = this.configService.get("tempo", { infer: true })
		if (!tempoConfig?.enabled) {
			return
		}

		const endpoint = this.normalizeOtlpHttpUrl(tempoConfig.otlpHttpUrl)
		if (!endpoint) {
			writeInternalTempoMessage(TEMPO_LOG_TAG, "WARN", "tracing 已启用，但未配置 otlpHttpUrl，已跳过初始化")
			return
		}

		const appConfig = this.configService.get("app", { infer: true })
		const serviceName = appConfig?.name?.trim() || "unknown-service"
		const serviceVersion = appConfig?.version?.trim() || "unknown"
		const environment = process.env.NODE_ENV || "unknown"
		const timeoutMs = tempoConfig.timeoutMs ?? 10000

		this.startPromise = (async () => {
			try {
				const sdk = new NodeSDK({
					resource: resourceFromAttributes({
						"service.name": serviceName,
						"service.version": serviceVersion,
						"deployment.environment.name": environment,
						"service.instance.id": OsTool.getResolveInstance(),
						"host.name": os.hostname(),
						"host.ip": OsTool.getLocalIp(),
					}),
					traceExporter: new OTLPTraceExporter({
						url: endpoint,
						headers: tempoConfig.headers,
						timeoutMillis: timeoutMs,
					}),
					instrumentations: createTempoInstrumentations(),
				})

				await Promise.resolve(sdk.start())
				this.sdk = sdk
				writeInternalTempoMessage(TEMPO_LOG_TAG, "INFO", `tracing 已启动,endpoint=${endpoint},service=${serviceName}`)
			} catch (error) {
				writeInternalTempoMessage(
					TEMPO_LOG_TAG,
					"ERROR",
					`tracing 启动失败:${error instanceof Error ? error.message : String(error)}`,
					error,
				)
				throw error
			} finally {
				this.startPromise = null
			}
		})()

		return this.startPromise
	}

	async shutdown() {
		if (!this.sdk) {
			return
		}

		const sdk = this.sdk
		this.sdk = null

		try {
			await Promise.resolve(sdk.shutdown())
			writeInternalTempoMessage(TEMPO_LOG_TAG, "INFO", "tracing 已关闭")
		} catch (error) {
			writeInternalTempoMessage(TEMPO_LOG_TAG, "ERROR", `tracing 关闭失败:${error instanceof Error ? error.message : String(error)}`, error)
		}
	}

	private normalizeOtlpHttpUrl(rawUrl?: string) {
		const normalized = rawUrl?.trim()
		if (!normalized) {
			return ""
		}
		if (normalized.endsWith(TEMPO_DEFAULT_OTLP_TRACES_PATH)) {
			return normalized
		}
		return `${normalized.replace(/\/+$/g, "")}${TEMPO_DEFAULT_OTLP_TRACES_PATH}`
	}
}

import { DynamicModule, Global, Logger, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { PrometheusModule as NestPrometheusModule, PrometheusOptions } from "@willsoto/nestjs-prometheus"

export const PROMETHEUS_TAG = "prometheus"

export type PrometheusModuleOptions = {
	/**
	 * 是否启用 Prometheus 模块
	 */
	enabled: boolean
}

@Global()
@Module({})
export class PrometheusModule {
	static forRoot(options: PrometheusModuleOptions): DynamicModule {
		if (!options.enabled) {
			return {
				global: true,
				module: PrometheusModule,
			}
		}

		return {
			global: true,
			module: PrometheusModule,
			imports: [
				ConfigModule,
				NestPrometheusModule.registerAsync({
					global: true,
					imports: [ConfigModule],
					inject: [ConfigService],
					useFactory: async (config: ConfigService<AspenConf.Application, true>): Promise<PrometheusOptions> => {
						const logger = new Logger(PROMETHEUS_TAG)
						const prometheusConfig = config.get("prometheus", { infer: true })
						const appConfig = config.get("app", { infer: true })

						const path = this.normalizeMetricsPath(prometheusConfig?.path)
						const publicPath = this.normalizePublicMetricsPath(appConfig?.prefix, path)
						const defaultMetricsEnabled = prometheusConfig?.defaultMetricsEnabled ?? true
						const defaultMetricPrefix = prometheusConfig?.defaultMetricPrefix?.trim()
						const customMetricPrefix = prometheusConfig?.customMetricPrefix?.trim()
						const environment = process.env.NODE_ENV?.trim()
						const serviceName = appConfig?.name?.trim() || "unknown-service"
						const defaultLabels = this.compactLabels({
							service: serviceName,
							version: appConfig?.version?.trim(),
							environment,
							...prometheusConfig?.defaultLabels,
						})

						logger.log(
							`Prometheus 指标已启用 服务名:<${serviceName}> 对外路径:<${publicPath}> 内部路径:<${path}> 端口:<${appConfig?.port ?? ""}>`,
						)
						logger.debug(
							`Prometheus 标签:<${JSON.stringify(defaultLabels)}> 默认指标采集:<${defaultMetricsEnabled}> 默认指标前缀:<${defaultMetricPrefix ?? ""}> 自定义指标前缀:<${customMetricPrefix ?? ""}>`,
						)

						return {
							path,
							defaultLabels,
							customMetricPrefix,
							defaultMetrics: {
								enabled: defaultMetricsEnabled,
								config: defaultMetricPrefix ? { prefix: defaultMetricPrefix } : {},
							},
						}
					},
				}),
			],
			exports: [NestPrometheusModule],
		}
	}

	private static normalizeMetricsPath(path?: string) {
		const normalized = path?.trim()
		if (!normalized) {
			return "/metrics"
		}
		return normalized.startsWith("/") ? normalized : `/${normalized}`
	}

	private static normalizePublicMetricsPath(prefix: string | undefined, path: string) {
		const normalizedPrefix = prefix?.trim().replace(/^\/+|\/+$/g, "")
		if (!normalizedPrefix) {
			return path
		}
		return `/${normalizedPrefix}${path}`
	}

	private static compactLabels(labels: Record<string, string | undefined>) {
		return Object.fromEntries(
			Object.entries(labels).filter((entry): entry is [string, string] => {
				const [, value] = entry
				return typeof value === "string" && value.trim().length > 0
			}),
		)
	}
}

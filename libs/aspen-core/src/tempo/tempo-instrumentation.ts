import { FastifyInstrumentation } from "@opentelemetry/instrumentation-fastify"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core"

/**
 * 当前仅启用与项目主链路最相关的自动采集:
 * 1. http: 入站/出站 HTTP 基础 span
 * 2. fastify: Fastify 适配层请求链路
 * 3. nestjs-core: Nest 控制器/处理函数链路
 */
export const createTempoInstrumentations = () => {
	return [new HttpInstrumentation(), new FastifyInstrumentation(), new NestInstrumentation()]
}

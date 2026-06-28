import { Injectable, Logger } from "@nestjs/common"
import { Job } from "bullmq"

import { QuartzTaskEntity } from "../../entity"
import { quartzEnums } from "../../common"

type QuartzTriggerType = (typeof quartzEnums.triggerType.named)[keyof typeof quartzEnums.triggerType.named]["raw"]["code"]

/**
 * 单次任务执行上下文.
 *
 * 该上下文会在真正执行业务处理器时传递给外部注册的 handler,
 * 方便业务侧拿到:
 * - 当前任务数据库配置;
 * - BullMQ 原始 job;
 * - 本次触发来源;
 * - 调用方附带的输入参数.
 */
export interface QuartzTaskExecuteContext {
	task: QuartzTaskEntity
	job: Job<QuartzJobData, Record<string, any>>
	triggerType: QuartzTriggerType
	requestPayload?: Record<string, any>
}

/**
 * 队列任务数据结构.
 *
 * 该对象会直接写入 BullMQ 的 `job.data` 中,用于 worker 端恢复执行上下文.
 */
export interface QuartzJobData {
	taskId: string
	taskCode: string
	triggerType: QuartzTriggerType
	requestPayload?: Record<string, any>
}

/**
 * 业务处理器函数签名.
 *
 * 约定返回对象会被写入执行日志的 `responsePayload` 中,
 * 若无返回值则按 `undefined` 处理.
 */
export type QuartzTaskHandler = (ctx: QuartzTaskExecuteContext) => Promise<Record<string, any>>

/**
 * 定时任务处理器注册中心.
 *
 * 设计目的:
 * 1. `Quartz` 模块只负责"调度"和"执行基础设施";
 * 2. 真实业务逻辑由其他模块在运行时注册进来;
 * 3. 避免在 `Quartz` 模块内部硬编码订单,报表,同步等业务.
 *
 * 使用方式:
 * - 其他模块注入该 share;
 * - 在 `onModuleInit()` 中调用 `register()` 注册 handler;
 * - 后台任务表的 `handlerName` 与注册名对应即可.
 */
@Injectable()
export class QuartzHandlerShare {
	private readonly logger = new Logger(QuartzHandlerShare.name)

	/**
	 * 统一的 handler 注册表.
	 *
	 * key: handlerName
	 * value: 实际执行函数
	 */
	private readonly handlerMap = new Map<string, QuartzTaskHandler>()

	constructor() {
		/**
		 * 注册一个内置空处理器,方便系统联调和环境验证.
		 *
		 * 业务上如果只是想验证 BullMQ 调度,日志落库,任务启停是否正常,
		 * 可以直接创建 `handlerName = SYSTEM_NOOP` 的任务.
		 */
		this.register("SYSTEM_NOOP", async (ctx) => {
			this.logger.debug(`执行内置空任务:${ctx.task.taskCode}`)
			return {
				message: "SYSTEM_NOOP executed",
				taskCode: ctx.task.taskCode,
			}
		})
	}

	/**
	 * 注册任务处理器.
	 *
	 * 同名处理器会被覆盖,并记录一条 warning,方便排查重复注册问题.
	 */
	register(handlerName: string, handler: QuartzTaskHandler) {
		if (this.handlerMap.has(handlerName)) {
			this.logger.warn(`任务处理器"${handlerName}"已存在,将被新的实现覆盖`)
		}
		this.handlerMap.set(handlerName, handler)
	}

	/**
	 * 判断处理器是否已注册.
	 */
	has(handlerName: string): boolean {
		return this.handlerMap.has(handlerName)
	}

	/**
	 * 获取已注册处理器.
	 */
	get(handlerName: string): QuartzTaskHandler | undefined {
		return this.handlerMap.get(handlerName)
	}

	/**
	 * 返回所有已注册处理器名.
	 *
	 * 该能力适合提供给后台下拉框或系统自检接口使用.
	 */
	listHandlerNames(): Array<string> {
		return [...this.handlerMap.keys()].sort()
	}

	/**
	 * 执行指定处理器.
	 *
	 * 若处理器不存在,调用方应自行决定抛错还是兜底.
	 */
	async execute(handlerName: string, ctx: QuartzTaskExecuteContext) {
		const handler = this.get(handlerName)
		if (!handler) {
			throw new Error(`任务处理器"${handlerName}"未注册`)
		}
		return await handler(ctx)
	}
}

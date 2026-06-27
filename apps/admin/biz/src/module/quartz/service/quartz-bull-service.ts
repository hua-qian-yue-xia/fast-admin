import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"
import { Job, JobsOptions, Queue, QueueEvents, RepeatOptions, Worker } from "bullmq"
import { Repository } from "typeorm"

import { RedisTool } from "@aspen/aspen-core"

import {
	QUARTZ_CONSTANT,
	QUARTZ_DELAY_JOB_PREFIX,
	QUARTZ_JOB_NAME,
	QUARTZ_JOB_SCHEDULER_PREFIX,
	QUARTZ_MANUAL_JOB_PREFIX,
	QUARTZ_QUEUE_NAME,
	quartzEnums,
} from "../common"
import { QuartzTaskEntity, QuartzTaskLogEntity } from "../entity"
import { QuartzHandlerShare, QuartzJobData } from "../share/quartz-handler-share"

type QuartzTriggerType = (typeof quartzEnums.triggerType.named)[keyof typeof quartzEnums.triggerType.named]["raw"]["code"]

/**
 * BullMQ 适配层。
 *
 * 该服务是 `Quartz` 模块的核心基础设施，负责：
 * 1. 初始化 `Queue / Worker / QueueEvents`；
 * 2. 将数据库里的任务定义同步到 BullMQ；
 * 3. 在 worker 中调度已注册的业务 handler；
 * 4. 统一维护任务最近执行状态与执行日志。
 *
 * 这里刻意不把业务逻辑写死在模块内部，而是通过 `QuartzHandlerShare`
 * 做运行时分发。这样其它模块只需要注册 handler，不需要关心 BullMQ 细节。
 */
@Injectable()
export class QuartzBullService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(QuartzBullService.name)

	private queue?: Queue<QuartzJobData, Record<string, any>, string>
	private worker?: Worker<QuartzJobData, Record<string, any>, string>
	private queueEvents?: QueueEvents

	constructor(
		@InjectRepository(QuartzTaskEntity)
		private readonly quartzTaskRepo: Repository<QuartzTaskEntity>,
		@InjectRepository(QuartzTaskLogEntity)
		private readonly quartzTaskLogRepo: Repository<QuartzTaskLogEntity>,
		private readonly configService: ConfigService<AspenConf.Application, true>,
		private readonly redisTool: RedisTool,
		private readonly quartzHandlerShare: QuartzHandlerShare,
	) {}

	/**
	 * 模块启动时初始化 BullMQ，并将数据库中处于启用状态的任务重新同步到队列。
	 *
	 * 这样即使服务重启，也能根据数据库配置恢复调度状态。
	 */
	async onModuleInit() {
		await this.bootstrap()
		await this.syncEnabledTasks()
	}

	/**
	 * 模块销毁时主动关闭 BullMQ 资源，避免 Redis 连接泄漏。
	 */
	async onModuleDestroy() {
		await Promise.allSettled(
			[this.worker?.close(), this.queueEvents?.close(), this.queue?.close()].filter(Boolean) as Array<Promise<unknown>>,
		)
	}

	/**
	 * 初始化 Queue / Worker / QueueEvents。
	 *
	 * 该方法具备幂等性，多次调用只会真正初始化一次。
	 */
	async bootstrap() {
		if (this.queue && this.worker && this.queueEvents) {
			return
		}

		const connection = this.getRedisConnection()

		this.queue = new Queue<QuartzJobData, Record<string, any>, string>(QUARTZ_QUEUE_NAME, { connection })
		this.queueEvents = new QueueEvents(QUARTZ_QUEUE_NAME, { connection })
		this.worker = new Worker<QuartzJobData, Record<string, any>, string>(QUARTZ_QUEUE_NAME, async (job) => await this.processJob(job), {
			connection,
			/**
			 * 这里的并发度控制的是 worker 级别的“最多同时处理多少个 job”，
			 * 单任务是否允许并发，仍由数据库字段 `allowConcurrent` + Redis 锁决定。
			 */
			concurrency: 10,
		})

		this.worker.on("error", (error) => {
			this.logger.error(`BullMQ Worker 异常:${error.message}`, error.stack)
		})

		this.queueEvents.on("error", (error) => {
			this.logger.error(`BullMQ QueueEvents 异常:${error.message}`, error.stack)
		})

		await this.queue.waitUntilReady()
		await this.worker.waitUntilReady()
		await this.queueEvents.waitUntilReady()
	}

	/**
	 * 将所有启用中的任务同步到 BullMQ。
	 *
	 * 通常在服务启动时调用，用于恢复调度状态。
	 */
	async syncEnabledTasks() {
		await this.bootstrap()
		const taskList = await this.quartzTaskRepo.find({ where: { enable: true } })
		for (const task of taskList) {
			try {
				await this.syncTask(task)
			} catch (error) {
				this.logger.error(`同步任务"${task.taskCode}"失败:${this.getErrorMessage(error)}`, this.getErrorStack(error))
			}
		}
	}

	/**
	 * 将单个任务同步到 BullMQ。
	 *
	 * 同步策略：
	 * - `CRON / INTERVAL`：使用 `upsertJobScheduler`，保证编辑任务时可以稳定覆盖；
	 * - `DELAY`：创建一个一次性延迟 job；
	 * - `enable = false`：删除调度器/延迟任务，并清空 `nextTriggerAt`。
	 */
	async syncTask(task: QuartzTaskEntity) {
		await this.bootstrap()
		await this.removeTaskScheduler(task)

		if (!task.enable) {
			await this.quartzTaskRepo.update({ taskId: task.taskId }, { nextTriggerAt: null })
			return
		}

		this.validateTaskSchedule(task)

		if (task.scheduleType === quartzEnums.scheduleType.named.DELAY.raw.code) {
			await this.queue!.add(QUARTZ_JOB_NAME, this.buildJobData(task, quartzEnums.triggerType.named.DELAY.raw.code), {
				...this.buildJobOptions(task),
				jobId: this.buildDelayJobId(task.taskId),
				delay: task.delayMs ?? 0,
			})
			await this.quartzTaskRepo.update(
				{ taskId: task.taskId },
				{
					nextTriggerAt: new Date(Date.now() + (task.delayMs ?? 0)),
					lastStatus: quartzEnums.taskStatus.named.WAITING.raw.code,
				},
			)
			return
		}

		await this.queue!.upsertJobScheduler(this.buildSchedulerId(task.taskId), this.buildRepeatOptions(task), {
			name: QUARTZ_JOB_NAME,
			data: this.buildJobData(task, this.resolveAutoTriggerType(task)),
			opts: this.buildJobOptions(task),
		})

		await this.quartzTaskRepo.update(
			{ taskId: task.taskId },
			{
				nextTriggerAt: await this.resolveSchedulerNextTriggerAt(task.taskId),
				lastStatus: quartzEnums.taskStatus.named.WAITING.raw.code,
			},
		)
	}

	/**
	 * 移除任务在 BullMQ 中的调度信息。
	 *
	 * 注意：
	 * - 重复调度任务删除的是 scheduler；
	 * - 一次性延迟任务删除的是固定 jobId 对应的 delayed job。
	 */
	async removeTask(task: QuartzTaskEntity) {
		await this.bootstrap()
		await this.removeTaskScheduler(task)
		await this.quartzTaskRepo.update({ taskId: task.taskId }, { nextTriggerAt: null })
	}

	/**
	 * 立即触发一次任务执行。
	 *
	 * 手动触发不会改变原有 `CRON / INTERVAL` 调度器，只是额外插入一条立即执行 job。
	 */
	async triggerTaskNow(task: QuartzTaskEntity, requestPayload?: Record<string, any>) {
		await this.bootstrap()
		return await this.queue!.add(QUARTZ_JOB_NAME, this.buildJobData(task, quartzEnums.triggerType.named.MANUAL.raw.code, requestPayload), {
			...this.buildJobOptions(task),
			jobId: this.buildManualJobId(task.taskId),
		})
	}

	/**
	 * 真正的 BullMQ worker 处理逻辑。
	 *
	 * 执行流程：
	 * 1. 校验任务是否仍存在；
	 * 2. 写入一条运行中日志；
	 * 3. 按配置决定是否加分布式锁，阻止同任务并发；
	 * 4. 通过 `handlerName` 调用已注册的业务处理器；
	 * 5. 回写执行日志与任务最近状态。
	 */
	private async processJob(job: Job<QuartzJobData, Record<string, any>>) {
		const task = await this.quartzTaskRepo.findOneBy({ taskId: job.data.taskId })
		if (!task) {
			throw new Error(`任务"${job.data.taskId}"不存在，无法继续执行`)
		}

		/**
		 * 规则说明：
		 * - 自动调度任务如果已被禁用，应拒绝执行；
		 * - 手动触发允许在任务禁用时执行，便于管理员调试。
		 */
		if (!task.enable && job.data.triggerType !== quartzEnums.triggerType.named.MANUAL.raw.code) {
			throw new Error(`任务"${task.taskCode}"已被禁用，自动调度已拒绝执行`)
		}

		const triggerAt = new Date(job.timestamp)
		const startAt = new Date()
		const retryIndex = job.attemptsMade
		const actualTriggerType = retryIndex > 0 ? quartzEnums.triggerType.named.RETRY.raw.code : job.data.triggerType

		const log = await this.quartzTaskLogRepo.save({
			taskId: task.taskId,
			jobId: job.id,
			triggerType: actualTriggerType,
			triggerAt,
			startAt,
			status: quartzEnums.taskStatus.named.RUNNING.raw.code,
			executeNode: `pid:${process.pid}`,
			requestPayload: job.data.requestPayload,
			retryIndex,
		})

		await this.quartzTaskRepo.update(
			{ taskId: task.taskId },
			{
				lastTriggerAt: startAt,
				lastStatus: quartzEnums.taskStatus.named.RUNNING.raw.code,
			},
		)

		let lockKey: string | undefined
		try {
			/**
			 * 不允许并发的任务，在同一时刻只允许一个实例真正进入 handler。
			 *
			 * 这里使用 Redis 分布式锁兜底，避免多实例部署时出现重复执行。
			 */
			if (!task.allowConcurrent) {
				lockKey = QUARTZ_CONSTANT.quartz.lock.redis("task", task.taskId)
				const lockSeconds = Math.max(5, Math.ceil((task.timeoutMs ?? 5000) / 1000) + 5)
				const locked = await this.redisTool.tryLock(lockKey, lockSeconds)
				if (!locked) {
					throw new Error(`任务"${task.taskCode}"正在执行中，本次触发被拒绝`)
				}
			}

			const responsePayload = await this.runWithTimeout(
				this.quartzHandlerShare.execute(task.handlerName, {
					task,
					job,
					triggerType: actualTriggerType,
					requestPayload: job.data.requestPayload,
				}),
				task.timeoutMs,
			)

			const endAt = new Date()
			await this.quartzTaskLogRepo.update(
				{ logId: log.logId },
				{
					endAt,
					duration: endAt.getTime() - startAt.getTime(),
					status: quartzEnums.taskStatus.named.SUCCESS.raw.code,
					message: "执行成功",
					responsePayload,
				},
			)

			await this.quartzTaskRepo.update(
				{ taskId: task.taskId },
				{
					lastSuccessAt: endAt,
					lastStatus: quartzEnums.taskStatus.named.SUCCESS.raw.code,
					nextTriggerAt: await this.resolveNextTriggerAtAfterRun(task),
					enable: this.shouldDisableDelayTask(task) ? false : task.enable,
				},
			)

			return responsePayload
		} catch (error) {
			const endAt = new Date()
			const finalFail = this.isFinalAttempt(job)

			await this.quartzTaskLogRepo.update(
				{ logId: log.logId },
				{
					endAt,
					duration: endAt.getTime() - startAt.getTime(),
					status: quartzEnums.taskStatus.named.FAIL.raw.code,
					message: this.getErrorMessage(error),
					errorStack: this.getErrorStack(error),
				},
			)

			await this.quartzTaskRepo.update(
				{ taskId: task.taskId },
				{
					lastFailAt: endAt,
					lastStatus: quartzEnums.taskStatus.named.FAIL.raw.code,
					nextTriggerAt: finalFail ? await this.resolveNextTriggerAtAfterRun(task) : task.nextTriggerAt,
					enable: this.shouldDisableDelayTask(task) && finalFail ? false : task.enable,
				},
			)

			throw error
		} finally {
			if (lockKey) {
				await this.redisTool.unlock(lockKey)
			}
		}
	}

	/**
	 * 构造 BullMQ repeat 配置。
	 */
	private buildRepeatOptions(task: QuartzTaskEntity): Omit<RepeatOptions, "key"> {
		if (task.scheduleType === quartzEnums.scheduleType.named.CRON.raw.code) {
			return {
				pattern: task.cronExpression,
			}
		}

		return {
			every: task.repeatEvery,
		}
	}

	/**
	 * 构造 BullMQ job 配置。
	 *
	 * 说明：
	 * - `retryCount` 表示“额外重试次数”，所以 BullMQ 的 `attempts = retryCount + 1`；
	 * - 完成后的 Redis job 数据默认清理，失败的保留 100 条，日志细节统一存数据库。
	 */
	private buildJobOptions(task: QuartzTaskEntity): JobsOptions {
		const attempts = Math.max(1, (task.retryCount ?? 0) + 1)
		return {
			attempts,
			backoff: task.retryInterval && task.retryInterval > 0 ? { type: "fixed", delay: task.retryInterval } : undefined,
			removeOnComplete: true,
			removeOnFail: 100,
		}
	}

	/**
	 * 根据任务实体构造统一的 `job.data`。
	 */
	private buildJobData(task: QuartzTaskEntity, triggerType: QuartzTriggerType, requestPayload?: Record<string, any>): QuartzJobData {
		return {
			taskId: task.taskId,
			taskCode: task.taskCode,
			triggerType,
			requestPayload,
		}
	}

	/**
	 * 删除任务已有的调度器/延迟 job。
	 *
	 * 该方法会在“任务编辑”“任务停用”“任务删除”前统一调用，
	 * 以确保旧调度不会残留。
	 */
	private async removeTaskScheduler(task: QuartzTaskEntity) {
		if (!this.queue) return
		try {
			await this.queue.removeJobScheduler(this.buildSchedulerId(task.taskId))
		} catch (error) {
			if (!this.isSchedulerNotFoundError(error)) {
				throw error
			}
			this.logger.warn(`任务"${task.taskCode}"对应的调度器不存在，跳过删除`)
		}

		const delayJob = await this.queue.getJob(this.buildDelayJobId(task.taskId))
		if (delayJob) {
			await delayJob.remove()
		}
	}

	/**
	 * 解析调度任务的下一次触发时间。
	 *
	 * 仅适用于 `CRON / INTERVAL`，`DELAY` 类型不使用 scheduler 元数据。
	 */
	private async resolveSchedulerNextTriggerAt(taskId: string): Promise<Date | null> {
		if (!this.queue) return null
		const scheduler = await this.queue.getJobScheduler(this.buildSchedulerId(taskId))
		return scheduler?.next ? new Date(scheduler.next) : null
	}

	/**
	 * 执行完成后推导 `nextTriggerAt`。
	 *
	 * 规则：
	 * - `CRON / INTERVAL`：取 scheduler 中计算出的下一次时间；
	 * - `DELAY`：一次性任务执行后不再有下一次触发时间。
	 */
	private async resolveNextTriggerAtAfterRun(task: QuartzTaskEntity): Promise<Date | null> {
		if (task.scheduleType === quartzEnums.scheduleType.named.DELAY.raw.code) {
			return null
		}
		return await this.resolveSchedulerNextTriggerAt(task.taskId)
	}

	/**
	 * 校验调度配置是否完整。
	 *
	 * 该校验放在 BullMQ 适配层的原因是：
	 * service 负责业务流程，Bull 层负责调度语义校验，职责更清晰。
	 */
	private validateTaskSchedule(task: QuartzTaskEntity) {
		if (task.scheduleType === quartzEnums.scheduleType.named.CRON.raw.code && !task.cronExpression) {
			throw new Error(`任务"${task.taskCode}"缺少 cronExpression`)
		}
		if (task.scheduleType === quartzEnums.scheduleType.named.INTERVAL.raw.code && (!task.repeatEvery || task.repeatEvery <= 0)) {
			throw new Error(`任务"${task.taskCode}"缺少合法的 repeatEvery`)
		}
		if (
			task.scheduleType === quartzEnums.scheduleType.named.DELAY.raw.code &&
			(task.delayMs === undefined || task.delayMs === null || task.delayMs < 0)
		) {
			throw new Error(`任务"${task.taskCode}"缺少合法的 delayMs`)
		}
	}

	/**
	 * 根据任务调度类型解析自动触发来源。
	 */
	private resolveAutoTriggerType(task: QuartzTaskEntity): QuartzTriggerType {
		if (task.scheduleType === quartzEnums.scheduleType.named.CRON.raw.code) {
			return quartzEnums.triggerType.named.CRON.raw.code
		}
		if (task.scheduleType === quartzEnums.scheduleType.named.INTERVAL.raw.code) {
			return quartzEnums.triggerType.named.INTERVAL.raw.code
		}
		return quartzEnums.triggerType.named.DELAY.raw.code
	}

	/**
	 * 判断一次性延迟任务在本次执行结束后是否应该自动停用。
	 *
	 * 这里选择自动停用，是为了避免服务重启后再次被重新投递。
	 */
	private shouldDisableDelayTask(task: QuartzTaskEntity) {
		return task.scheduleType === quartzEnums.scheduleType.named.DELAY.raw.code
	}

	/**
	 * 判断当前失败是否已经到达最终失败态。
	 *
	 * BullMQ 的 `attempts` 表示总尝试次数，因此最终失败条件是：
	 * 当前已执行次数 >= attempts。
	 */
	private isFinalAttempt(job: Job<QuartzJobData, Record<string, any>>) {
		const totalAttempts = typeof job.opts.attempts === "number" ? job.opts.attempts : 1
		return job.attemptsMade + 1 >= totalAttempts
	}

	/**
	 * 构造 BullMQ scheduler id。
	 */
	private buildSchedulerId(taskId: string) {
		return `${QUARTZ_JOB_SCHEDULER_PREFIX}:${taskId}`
	}

	/**
	 * 构造一次性延迟任务 jobId。
	 */
	private buildDelayJobId(taskId: string) {
		return `${QUARTZ_DELAY_JOB_PREFIX}:${taskId}`
	}

	/**
	 * 构造立即执行任务 jobId。
	 */
	private buildManualJobId(taskId: string) {
		return `${QUARTZ_MANUAL_JOB_PREFIX}:${taskId}:${Date.now()}`
	}

	/**
	 * 从统一配置中心读取 Redis 连接参数。
	 */
	private getRedisConnection() {
		const redis = this.configService.get("redis", { infer: true })
		return {
			host: redis.host ?? "127.0.0.1",
			port: redis.port ?? 6379,
			password: redis.password,
			db: redis.db ?? 0,
		}
	}

	/**
	 * 统一提取错误消息。
	 */
	private getErrorMessage(error: unknown) {
		if (error instanceof Error) {
			return error.message
		}
		return String(error)
	}

	/**
	 * 统一提取错误堆栈。
	 */
	private getErrorStack(error: unknown) {
		if (error instanceof Error) {
			return error.stack
		}
		return undefined
	}

	/**
	 * 判断删除调度器时报错是否属于“调度器不存在”。
	 *
	 * `BullMQ` 在删除不存在的 scheduler 时可能直接抛错。
	 * 这类场景对当前系统来说属于幂等删除，应当安全忽略。
	 */
	private isSchedulerNotFoundError(error: unknown) {
		const message = this.getErrorMessage(error).toLowerCase()
		return message.includes("scheduler") && (message.includes("not found") || message.includes("missing"))
	}

	/**
	 * 为业务 handler 提供超时保护。
	 *
	 * BullMQ v5 的 `JobsOptions` 不再提供旧版的 `timeout` 字段，
	 * 因此这里使用 `Promise.race` 在应用层做超时兜底。
	 */
	private async runWithTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
		if (!timeoutMs || timeoutMs <= 0) {
			return await promise
		}

		return await Promise.race([
			promise,
			new Promise<T>((_, reject) => {
				setTimeout(() => {
					reject(new Error(`任务执行超时，超时时间:${timeoutMs}ms`))
				}, timeoutMs)
			}),
		])
	}
}

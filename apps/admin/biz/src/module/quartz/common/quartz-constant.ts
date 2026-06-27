import { KeyTool } from "libs/aspen-core/src/tool"
import { AbstractEnumGroup, GenGroupDict } from "@aspen/aspen-fram"

/**
 * `Quartz` 模块统一常量入口。
 *
 * 这里集中维护：
 * 1. Redis 锁和缓存 key 前缀；
 * 2. BullMQ 队列名、任务名、调度器前缀；
 * 3. 任务调度类型、执行状态、触发来源等枚举值。
 *
 * 统一出口的好处是：
 * - 避免控制器、服务、BullMQ 适配层重复写魔法字符串；
 * - 便于后续拆分到其他服务或 worker 进程时保持一致；
 * - 降低后续修改命名规范时的维护成本。
 */
export const QUARTZ_CONSTANT = {
	quartz: {
		root: new KeyTool("quartz"),
		task: new KeyTool("quartz", "task"),
		log: new KeyTool("quartz", "log"),
		lock: new KeyTool("quartz", "lock"),
		queue: new KeyTool("quartz", "queue"),
	},
} as const

/**
 * BullMQ 实际使用的队列名称。
 *
 * 当前实现统一将所有后台任务放在同一个系统级队列中，
 * 由数据库里的 `taskCode / handlerName / scheduleType` 做业务区分。
 *
 * 注意：
 * BullMQ 明确要求 queue name 不能包含 `:`，
 * 因此这里使用短横线而不是 Redis 风格冒号命名。
 */
export const QUARTZ_QUEUE_NAME = "quartz-task"

/**
 * BullMQ 中单次执行任务的统一任务名。
 *
 * 队列里真实的业务差异通过 `job.data.taskId / taskCode` 区分，
 * 这里保留一个固定 name，便于集中处理。
 */
export const QUARTZ_JOB_NAME = "quartz:task:execute"

/**
 * BullMQ 调度器 id 前缀。
 *
 * 对于 `CRON / INTERVAL` 类型，使用 `upsertJobScheduler` 创建调度器，
 * 调度器 id 必须稳定且可重复计算，便于任务修改和停用时精确覆盖/删除。
 */
export const QUARTZ_JOB_SCHEDULER_PREFIX = "scheduler"

/**
 * 一次性延迟任务的 jobId 前缀。
 *
 * `DELAY` 类型任务本质上不是重复调度器，而是一个一次性的延迟任务，
 * 因此使用固定 jobId，便于重新编辑任务时先删旧任务、再建新任务。
 */
export const QUARTZ_DELAY_JOB_PREFIX = "delay"

/**
 * 立即执行任务的 jobId 前缀。
 *
 * 手动触发通常允许重复执行，所以 jobId 采用前缀 + 时间戳/随机值方式生成。
 */
export const QUARTZ_MANUAL_JOB_PREFIX = "manual"

@GenGroupDict({
	key: "quartz",
	summary: "定时任务",
})
export class QuartzEnums extends AbstractEnumGroup {
	/**
	 * 调度类型。
	 *
	 * - `CRON`：使用 cron 表达式重复调度；
	 * - `INTERVAL`：按固定毫秒间隔重复调度；
	 * - `DELAY`：一次性延迟执行。
	 */
	readonly scheduleType = this.create("schedule_type", "调度类型", {
		CRON: { code: "CRON", summary: "Cron 表达式" },
		INTERVAL: { code: "INTERVAL", summary: "固定间隔" },
		DELAY: { code: "DELAY", summary: "延迟执行" },
	})

	/**
	 * 任务执行状态。
	 *
	 * 主要用于数据库中的 `lastStatus` 和执行日志 `status` 字段。
	 */
	readonly taskStatus = this.create("task_status", "任务执行状态", {
		WAITING: { code: "WAITING", summary: "等待执行" },
		RUNNING: { code: "RUNNING", summary: "执行中" },
		SUCCESS: { code: "SUCCESS", summary: "执行成功" },
		FAIL: { code: "FAIL", summary: "执行失败" },
	})

	/**
	 * 触发类型。
	 *
	 * - `MANUAL`：后台手动触发；
	 * - `CRON`：cron 表达式触发；
	 * - `INTERVAL`：固定间隔触发；
	 * - `DELAY`：一次性延迟触发；
	 * - `RETRY`：任务失败后 BullMQ 自动重试。
	 */
	readonly triggerType = this.create("trigger_type", "触发类型", {
		MANUAL: { code: "MANUAL", summary: "手动触发" },
		CRON: { code: "CRON", summary: "Cron 触发" },
		INTERVAL: { code: "INTERVAL", summary: "固定间隔触发" },
		DELAY: { code: "DELAY", summary: "延迟触发" },
		RETRY: { code: "RETRY", summary: "失败重试" },
	})
}

export const quartzEnums = new QuartzEnums()

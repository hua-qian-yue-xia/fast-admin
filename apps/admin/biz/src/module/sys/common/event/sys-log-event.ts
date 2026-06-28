import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"

import { AspenLogRecord, EMIT_KEY } from "@aspen/aspen-fram"

import { SysLogService } from "../../service"

@Injectable()
export class SysLogEvent implements OnApplicationShutdown {
	private readonly logger = new Logger(SysLogEvent.name)

	/**
	 * 运行期日志事件缓冲区.
	 */
	private readonly pendingLogQueue: Array<AspenLogRecord> = []

	/**
	 * 定时批量写库的窗口时间,单位毫秒.
	 */
	private readonly flushIntervalMs = 5000

	/**
	 * 达到阈值后立即批量写库.
	 */
	private readonly flushThreshold = 10

	/**
	 * 当前定时刷盘任务句柄.
	 */
	private flushTimer?: NodeJS.Timeout

	/**
	 * 当前是否存在进行中的刷库任务.
	 */
	private flushInFlight: Promise<void> | null = null

	constructor(private readonly sysLogService: SysLogService) {}

	@OnEvent(EMIT_KEY.Log)
	handleLogCreatedEvent(payload: AspenLogRecord) {
		this.pendingLogQueue.push(payload)

		if (this.pendingLogQueue.length >= this.flushThreshold) {
			this.clearFlushTimer()
			void this.flushPendingLogs("threshold")
			return
		}

		this.ensureFlushTimer()
	}

	async onApplicationShutdown() {
		this.clearFlushTimer()
		await this.drainPendingLogsOnShutdown()
	}

	/**
	 * 确保缓冲区在固定窗口内至少会被刷一次,避免低频请求长期滞留内存.
	 */
	private ensureFlushTimer() {
		if (this.flushTimer) {
			return
		}

		this.flushTimer = setTimeout(() => {
			this.flushTimer = undefined
			void this.flushPendingLogs("timer")
		}, this.flushIntervalMs)
	}

	private clearFlushTimer() {
		if (!this.flushTimer) {
			return
		}

		clearTimeout(this.flushTimer)
		this.flushTimer = undefined
	}

	/**
	 * 服务关闭时循环清空缓冲区,尽量避免最后一批日志丢失.
	 */
	private async drainPendingLogsOnShutdown() {
		while (this.flushInFlight || this.pendingLogQueue.length) {
			if (this.flushInFlight) {
				await this.flushInFlight
				continue
			}

			await this.flushPendingLogs("shutdown")
		}
	}

	/**
	 * 将当前缓冲区中的运行期日志批量写入数据库.
	 */
	private async flushPendingLogs(trigger: "timer" | "threshold" | "shutdown") {
		if (this.flushInFlight) {
			return this.flushInFlight
		}
		if (!this.pendingLogQueue.length) {
			return
		}

		this.clearFlushTimer()
		const currentBatch = this.pendingLogQueue.splice(0, this.pendingLogQueue.length)
		this.flushInFlight = (async () => {
			try {
				await this.sysLogService.batchSaveLogs(currentBatch)
				this.logger.log(`系统日志批量处理完成,触发方式 ${trigger},本次写入 ${currentBatch.length} 条`)
			} catch (error) {
				this.logger.error(
					`系统日志批量处理失败:${error instanceof Error ? error.message : String(error)}`,
					error instanceof Error ? error.stack : undefined,
				)
				this.pendingLogQueue.unshift(...currentBatch)
			} finally {
				this.flushInFlight = null

				if (this.pendingLogQueue.length >= this.flushThreshold) {
					void this.flushPendingLogs("threshold")
				} else if (this.pendingLogQueue.length > 0) {
					this.ensureFlushTimer()
				}
			}
		})()

		return this.flushInFlight
	}
}

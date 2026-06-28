import { Injectable, Logger } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { debounce } from "es-toolkit"

import { EMIT_KEY, AspenTagRecord } from "@aspen/aspen-fram"
import { SysApiService } from "../../service"

@Injectable()
export class SysApiEvent {
	private readonly logger = new Logger(SysApiEvent.name)

	/**
	 * 接口发现事件的内存缓冲区.
	 */
	private readonly pendingTagQueue: Array<AspenTagRecord> = []

	/**
	 * 防抖窗口时间,单位毫秒.
	 */
	private readonly debounceMs = 1000

	/**
	 * 使用 `es-toolkit` 提供的防抖函数,把高频事件回调收敛为一次批量处理.
	 */
	private readonly scheduleFlush = debounce(() => {
		void this.flushPendingTags()
	}, this.debounceMs)

	constructor(private readonly sysApiService: SysApiService) {}

	@OnEvent(EMIT_KEY.Tag)
	handleApiTagDiscoveredEvent(payload: AspenTagRecord) {
		this.pendingTagQueue.push(payload)
		this.scheduleFlush()
	}

	/**
	 * 将当前缓冲区中的接口发现记录批量写入数据库.
	 */
	private async flushPendingTags() {
		if (!this.pendingTagQueue.length) {
			return
		}
		const currentBatch = this.pendingTagQueue.splice(0, this.pendingTagQueue.length)
		try {
			await this.sysApiService.batchSyncDiscoveredApiTags(currentBatch)
			this.logger.log(`接口 tag 批量处理完成,本次合并 ${currentBatch.length} 条事件`)
		} catch (error) {
			this.logger.error(
				`接口 tag 批量处理失败:${error instanceof Error ? error.message : String(error)}`,
				error instanceof Error ? error.stack : undefined,
			)
			this.pendingTagQueue.unshift(...currentBatch)
		}
	}
}

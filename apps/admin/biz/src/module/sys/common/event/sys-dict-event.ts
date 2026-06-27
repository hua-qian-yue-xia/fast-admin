import { Injectable, Logger } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { debounce } from "es-toolkit"

import { EMIT_KEY, AspenGenDictRecord } from "@aspen/aspen-fram"
import { SysDictService } from "../../service"

@Injectable()
export class SysDictEvent {
	private readonly logger = new Logger(SysDictEvent.name)

	/**
	 * 字典发现事件的内存缓冲区。
	 */
	private readonly pendingDictQueue: Array<AspenGenDictRecord> = []

	/**
	 * 防抖窗口时间，单位毫秒。
	 */
	private readonly debounceMs = 1000

	/**
	 * 使用 `es-toolkit` 提供的防抖函数，把启动阶段密集的字典发现事件合并成一次批量处理。
	 */
	private readonly scheduleFlush = debounce(() => {
		void this.flushPendingDicts()
	}, this.debounceMs)

	constructor(private readonly sysDictService: SysDictService) {}

	@OnEvent(EMIT_KEY.GenDict)
	handleDictCreatedEvent(payload: AspenGenDictRecord) {
		this.pendingDictQueue.push(payload)
		this.scheduleFlush()
	}

	/**
	 * 将当前缓冲区中的字典发现记录批量写入数据库。
	 */
	private async flushPendingDicts() {
		if (!this.pendingDictQueue.length) {
			return
		}
		const currentBatch = this.pendingDictQueue.splice(0, this.pendingDictQueue.length)
		try {
			await this.sysDictService.batchSyncDiscoveredDicts(currentBatch)
			this.logger.log(`自动字典批量处理完成，本次合并 ${currentBatch.length} 条事件`)
		} catch (error) {
			this.logger.error(
				`自动字典批量处理失败:${error instanceof Error ? error.message : String(error)}`,
				error instanceof Error ? error.stack : undefined,
			)
			this.pendingDictQueue.unshift(...currentBatch)
		}
	}
}

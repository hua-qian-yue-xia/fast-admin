import { Injectable, Logger } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"

import { EMIT_KEY, AspenTagRecord } from "@aspen/aspen-fram"

@Injectable()
export class SysLogEvent {
	private readonly logger = new Logger(SysLogEvent.name)

	constructor() {}

	@OnEvent(EMIT_KEY.Log)
	handleLogCreatedEvent(payload: AspenTagRecord) {
		this.logger.log(`日志记录:${JSON.stringify(payload)}`)
	}
}

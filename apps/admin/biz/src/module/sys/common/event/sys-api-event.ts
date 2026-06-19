import { Injectable, Logger } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"

import { EMIT_KEY, AspenTagRecord } from "@aspen/aspen-fram"

@Injectable()
export class SysApiEvent {
	private readonly logger = new Logger(SysApiEvent.name)

	constructor() {}

	@OnEvent(EMIT_KEY.Tag)
	handleApiTagDiscoveredEvent(payload: AspenTagRecord) {
		this.logger.log(`接口tag发现:${JSON.stringify(payload)}`)
	}
}

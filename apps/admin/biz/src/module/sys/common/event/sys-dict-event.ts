import { Injectable, Logger } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"

import { EMIT_KEY, AspenGenDictRecord } from "@aspen/aspen-fram"

@Injectable()
export class SysDictEvent {
	private readonly logger = new Logger(SysDictEvent.name)

	constructor() {}

	@OnEvent(EMIT_KEY.GenDict)
	handleDictCreatedEvent(payload: AspenGenDictRecord) {
		this.logger.log(`字典创建:${JSON.stringify(payload)}`)
	}
}

import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"

import { Repository } from "typeorm"

import { UpmUserEntity, UpmUserQueryDto } from "../entity"

@Injectable()
export class UpmUserService {
	private readonly logger = new Logger(UpmUserService.name)

	constructor(@InjectRepository(UpmUserEntity) private readonly upmUserRepo: Repository<UpmUserEntity>) {}

	async scopePage(dto: UpmUserQueryDto) {}

	async getByUserId(userId: string) {}

	async delByIds(userIds: string[]) {
		throw new Error("Method not implemented.")
	}
	async edit(dto: UpmUserEntity) {
		throw new Error("Method not implemented.")
	}
	async save(dto: UpmUserEntity) {
		throw new Error("Method not implemented.")
	}
}

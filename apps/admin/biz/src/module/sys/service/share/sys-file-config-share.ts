import { Injectable, Logger } from "@nestjs/common"
import { Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import * as _ from "es-toolkit/compat"

import { RedisTool, RandomTool } from "@aspen/aspen-core"

import { SysFileConfigEntity } from "../../entity/sys-file-config.entity"

@Injectable()
export class SysFileConfigShare {
	private readonly logger = new Logger(SysFileConfigShare.name)
	constructor(
		@InjectRepository(SysFileConfigEntity) private readonly sysFileConfigRep: Repository<SysFileConfigEntity>,
		private readonly redisTool: RedisTool,
	) {}

	// 配置名称是否重复
	async isConfigNameDuplicate(entity: SysFileConfigEntity): Promise<boolean> {
		const queryBuilder = this.sysFileConfigRep.createQueryBuilder("a").where("a.name = :name", { name: entity.name })
		if (entity.configId) {
			queryBuilder.andWhere("a.config_id != :configId", { configId: entity.configId })
		}
		const count = await queryBuilder.getCount()
		return count > 0
	}

	// 生成8位配置唯一code
	async generateUniqueCode(): Promise<string> {
		const _uniqueCode = RandomTool.alphanumeric(8)
		// 是否重复
		const count = await this.sysFileConfigRep.count({ where: { uniqueCode: _uniqueCode } })
		if (count > 0) {
			return await this.generateUniqueCode()
		}
		return _uniqueCode
	}
}

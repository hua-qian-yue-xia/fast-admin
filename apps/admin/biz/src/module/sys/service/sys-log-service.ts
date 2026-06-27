import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

import { AspenLogRecord } from "@aspen/aspen-fram"

import { SysLogEntity } from "../entity"

@Injectable()
export class SysLogService {
	private readonly logger = new Logger(SysLogService.name)

	constructor(@InjectRepository(SysLogEntity) private readonly sysLogRepo: Repository<SysLogEntity>) {}

	/**
	 * 批量保存运行期采集到的接口日志。
	 */
	async batchSaveLogs(records: Array<AspenLogRecord>) {
		if (!records.length) {
			return
		}

		const entityList = records.map((record) => {
			const entity = new SysLogEntity()
			entity.tag = record.tag
			entity.summary = record.summary
			entity.description = record.description ?? null
			entity.reqParams = record.reqParams ?? null
			entity.reqBody = record.reqBody ?? null
			entity.resBody = record.resBody ?? null
			entity.errorMsg = record.errorMsg ?? null
			entity.errorSatck = record.errorStack ?? null
			entity.cost = record.cost
			entity.httpCode = record.httpCode
			entity.ip = record.ip ?? ""
			entity.ipAddress = null
			entity.uri = record.uri
			entity.uriMethod = record.uriMethod
			entity.createAt = record.createTime ?? new Date()
			entity.createBy = "system"
			entity.updateBy = null
			entity.updateAt = null
			entity.delBy = null
			return entity
		})

		await this.sysLogRepo.save(entityList)
		this.logger.log(`系统日志批量写入完成，本次写入 ${entityList.length} 条`)
	}
}

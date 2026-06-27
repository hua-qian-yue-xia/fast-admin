import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

import { QuartzTaskLogEntity, QuartzTaskLogQueryDto } from "../entity"

/**
 * 定时任务执行日志服务。
 *
 * 该服务保持“只读”为主的职责边界：
 * - 分页查询执行日志；
 * - 查看单条执行记录详情。
 *
 * 执行日志的写入由 `QuartzBullService` 统一负责，
 * 避免多个地方同时写日志造成状态不一致。
 */
@Injectable()
export class QuartzTaskLogService {
	private readonly logger = new Logger(QuartzTaskLogService.name)

	constructor(
		@InjectRepository(QuartzTaskLogEntity)
		private readonly quartzTaskLogRepo: Repository<QuartzTaskLogEntity>,
	) {}

	/**
	 * 日志分页。
	 */
	async page(dto: QuartzTaskLogQueryDto) {
		return await dto.createQueryBuilder(this.quartzTaskLogRepo).pageMany(dto.getSimplePageObj())
	}

	/**
	 * 根据日志 id 查询执行明细。
	 */
	async getByLogId(logId: string) {
		return await this.quartzTaskLogRepo.findOne({
			where: { logId },
			relations: {
				task: true,
			},
		})
	}
}

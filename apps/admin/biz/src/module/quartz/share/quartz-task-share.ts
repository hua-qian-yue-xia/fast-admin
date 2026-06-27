import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

import { exception } from "@aspen/aspen-fram"

import { QuartzTaskEntity } from "../entity"
import { QuartzBullService } from "../service/quartz-bull-service"

/**
 * 定时任务共享能力。
 *
 * 主要给以下场景复用：
 * - 任务是否存在；
 * - 任务名称/编码是否重复；
 * - 其他模块按 `taskCode` 主动触发一个系统任务；
 * - 其他模块在业务变更后要求重新同步某个任务调度。
 */
@Injectable()
export class QuartzTaskShare {
	constructor(
		@InjectRepository(QuartzTaskEntity)
		private readonly quartzTaskRepo: Repository<QuartzTaskEntity>,
		private readonly quartzBullService: QuartzBullService,
	) {}

	/**
	 * 根据任务 id 获取任务。
	 */
	async getByTaskId(taskId: string) {
		return await this.quartzTaskRepo.findOne({
			where: { taskId },
			relations: {
				category: true,
			},
		})
	}

	/**
	 * 根据任务编码获取任务。
	 */
	async getByTaskCode(taskCode: string) {
		return await this.quartzTaskRepo.findOne({
			where: { taskCode },
			relations: {
				category: true,
			},
		})
	}

	/**
	 * 检查任务是否存在，不存在则抛出异常。
	 */
	async checkThrowExist(taskId: string) {
		const task = await this.getByTaskId(taskId)
		if (!task) {
			throw new exception.validator(`定时任务"${taskId}"不存在`)
		}
		return task
	}

	/**
	 * 判断任务名称是否重复。
	 */
	async isTaskNameDuplicate(entity: QuartzTaskEntity) {
		const query = this.quartzTaskRepo.createQueryBuilder("task").where("task.task_name = :taskName", { taskName: entity.taskName })
		if (entity.taskId) {
			query.andWhere("task.task_id != :taskId", { taskId: entity.taskId })
		}
		return (await query.getCount()) > 0
	}

	/**
	 * 判断任务编码是否重复。
	 */
	async isTaskCodeDuplicate(entity: QuartzTaskEntity) {
		const query = this.quartzTaskRepo.createQueryBuilder("task").where("task.task_code = :taskCode", { taskCode: entity.taskCode })
		if (entity.taskId) {
			query.andWhere("task.task_id != :taskId", { taskId: entity.taskId })
		}
		return (await query.getCount()) > 0
	}

	/**
	 * 根据任务编码手动触发一次任务执行。
	 *
	 * 该方法适合被其他业务模块直接调用，例如：
	 * - 某个管理操作完成后，要求立即触发一次补偿任务；
	 * - 某个配置更新后，需要重新执行一次同步任务。
	 */
	async runByTaskCode(taskCode: string, requestPayload?: Record<string, any>) {
		const task = await this.getByTaskCode(taskCode)
		if (!task) {
			throw new exception.validator(`任务编码"${taskCode}"不存在`)
		}
		await this.quartzBullService.triggerTaskNow(task, requestPayload)
		return task
	}

	/**
	 * 重新同步某个任务的 BullMQ 调度配置。
	 */
	async syncByTaskId(taskId: string) {
		const task = await this.checkThrowExist(taskId)
		await this.quartzBullService.syncTask(task)
		return task
	}
}

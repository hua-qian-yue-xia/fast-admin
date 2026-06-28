import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { exception } from "@aspen/aspen-fram"

import { quartzEnums } from "../common"
import { QuartzTaskEntity, QuartzTaskQueryDto, QuartzTaskSaveDto } from "../entity"
import { QuartzHandlerShare } from "./share/quartz-handler-share"
import { QuartzTaskCategoryShare } from "./share/quartz-task-category-share"
import { QuartzTaskShare } from "./share/quartz-task-share"
import { QuartzBullService } from "./quartz-bull-service"

/**
 * 定时任务服务。
 *
 * 该服务负责后台“任务定义”本身的管理能力：
 * - 分页与详情查询；
 * - 新增、修改、删除；
 * - 启用、停用、立即执行；
 * - 与 BullMQ 调度状态保持同步。
 */
@Injectable()
export class QuartzTaskService {
	constructor(
		@InjectRepository(QuartzTaskEntity)
		private readonly quartzTaskRepo: Repository<QuartzTaskEntity>,
		private readonly quartzTaskShare: QuartzTaskShare,
		private readonly quartzTaskCategoryShare: QuartzTaskCategoryShare,
		private readonly quartzHandlerShare: QuartzHandlerShare,
		private readonly quartzBullService: QuartzBullService,
	) {}

	/**
	 * 任务分页。
	 */
	async page(dto: QuartzTaskQueryDto) {
		return await dto.createQueryBuilder(this.quartzTaskRepo).pageMany(dto.getSimplePageObj())
	}

	/**
	 * 根据任务 id 查询任务详情。
	 */
	async getByTaskId(taskId: string) {
		return await this.quartzTaskShare.getByTaskId(taskId)
	}

	/**
	 * 获取当前系统中已注册的 handler 列表。
	 *
	 * 这个接口很适合给后台表单的“执行器下拉框”直接使用。
	 */
	allHandlerName() {
		return this.quartzHandlerShare.listHandlerNames()
	}

	/**
	 * 新增任务。
	 *
	 * 保存成功后会立刻同步到 BullMQ；
	 * 若配置了 `runOnCreate = true`，还会额外触发一次立即执行。
	 */
	async save(dto: QuartzTaskSaveDto) {
		const entity = dto.toEntity()
		await this.validateTaskEntity(entity)

		const saveObj = await this.quartzTaskRepo.save(entity)
		await this.quartzBullService.syncTask(saveObj)

		if (saveObj.runOnCreate) {
			await this.quartzBullService.triggerTaskNow(saveObj, {
				source: "RUN_ON_CREATE",
			})
		}

		return await this.quartzTaskShare.getByTaskId(saveObj.taskId)
	}

	/**
	 * 修改任务。
	 *
	 * 修改后会先覆盖数据库，再把最新配置同步到 BullMQ。
	 */
	async edit(dto: QuartzTaskSaveDto) {
		if (!dto.taskId) {
			throw new exception.validator("修改任务时 taskId 不能为空")
		}

		await this.quartzTaskShare.checkThrowExist(dto.taskId)
		const entity = dto.toEntity()
		await this.validateTaskEntity(entity)

		await this.quartzTaskRepo.update({ taskId: dto.taskId }, entity)
		const latestTask = await this.quartzTaskShare.checkThrowExist(dto.taskId)
		await this.quartzBullService.syncTask(latestTask)
	}

	/**
	 * 批量删除任务。
	 *
	 * 删除前会先移除 BullMQ 中的调度器或延迟任务，确保调度状态被一并清理。
	 */
	async delByIds(taskIds: Array<string>) {
		const taskList = await this.quartzTaskRepo.find({
			where: {
				taskId: In(taskIds),
			},
		})
		if (!taskList.length) {
			return 0
		}

		for (const task of taskList) {
			await this.quartzBullService.removeTask(task)
		}

		const { affected } = await this.quartzTaskRepo.softDelete(taskList.map((item) => item.taskId))
		return affected ?? 0
	}

	/**
	 * 切换任务启用状态。
	 *
	 * - 启用：重新同步调度；
	 * - 停用：删除调度器并清空下一次执行时间。
	 */
	async changeEnable(taskId: string, enable: boolean) {
		await this.quartzTaskShare.checkThrowExist(taskId)
		await this.quartzTaskRepo.update({ taskId }, { enable })
		const latestTask = await this.quartzTaskShare.checkThrowExist(taskId)
		await this.quartzBullService.syncTask(latestTask)
		return await this.quartzTaskShare.getByTaskId(taskId)
	}

	/**
	 * 立即执行一次任务。
	 *
	 * 不会影响原有调度器，仅插入一条立即执行的 job。
	 */
	async runNow(taskId: string, requestPayload?: Record<string, any>) {
		const task = await this.quartzTaskShare.checkThrowExist(taskId)
		await this.quartzBullService.triggerTaskNow(task, requestPayload)
		return task
	}

	/**
	 * 重新同步某个任务到 BullMQ。
	 *
	 * 适合用于后台“修复调度”“重新加载配置”等运维操作。
	 */
	async syncTask(taskId: string) {
		const task = await this.quartzTaskShare.checkThrowExist(taskId)
		await this.quartzBullService.syncTask(task)
		return await this.quartzTaskShare.getByTaskId(taskId)
	}

	/**
	 * 统一业务校验入口。
	 *
	 * 这里做的是“任务定义层”的严格校验，目的是尽量在保存前就发现问题，
	 * 避免错误配置进入队列执行阶段。
	 */
	private async validateTaskEntity(entity: QuartzTaskEntity) {
		if (await this.quartzTaskShare.isTaskNameDuplicate(entity)) {
			throw new exception.validator(`任务名称"${entity.taskName}"重复`)
		}
		if (await this.quartzTaskShare.isTaskCodeDuplicate(entity)) {
			throw new exception.validator(`任务编码"${entity.taskCode}"重复`)
		}

		if (entity.categoryId) {
			await this.quartzTaskCategoryShare.checkThrowExist(entity.categoryId)
		}

		if (!this.quartzHandlerShare.has(entity.handlerName)) {
			throw new exception.validator(`任务处理器"${entity.handlerName}"未注册`)
		}

		if (entity.scheduleType === quartzEnums.scheduleType.named.CRON.raw.code && !entity.cronExpression) {
			throw new exception.validator("CRON 类型任务必须填写 cronExpression")
		}
		if (entity.scheduleType === quartzEnums.scheduleType.named.INTERVAL.raw.code && (!entity.repeatEvery || entity.repeatEvery <= 0)) {
			throw new exception.validator("INTERVAL 类型任务必须填写大于 0 的 repeatEvery")
		}
		if (
			entity.scheduleType === quartzEnums.scheduleType.named.DELAY.raw.code &&
			(entity.delayMs === undefined || entity.delayMs === null || entity.delayMs < 0)
		) {
			throw new exception.validator("DELAY 类型任务必须填写合法的 delayMs")
		}
	}
}

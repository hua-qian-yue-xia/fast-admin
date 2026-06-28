import { Body, Param, ParseArrayPipe } from "@nestjs/common"
import { R, router } from "@aspen/aspen-fram"

import { QuartzTaskEntity, QuartzTaskQueryDto, QuartzTaskSaveDto } from "../entity"
import { QuartzTaskService } from "../service"

/**
 * 定时任务控制器.
 *
 * 主要面向后台任务管理界面,覆盖:
 * - 任务分页与详情;
 * - 新增,编辑,删除;
 * - 启停控制;
 * - 立即执行;
 * - 调度同步;
 * - 已注册处理器查询.
 */
@router.controller({ summary: "定时任务管理", prefix: "/quartz/task" })
export class QuartzTaskController {
	constructor(private readonly quartzTaskService: QuartzTaskService) {}

	@router.post({
		summary: "定时任务分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: QuartzTaskEntity,
		},
	})
	async page(@Body() dto: QuartzTaskQueryDto) {
		const list = await this.quartzTaskService.page(dto)
		return R.success(list)
	}

	@router.get({
		summary: "查询已注册的任务处理器",
		router: "/handler/all",
		resType: {
			wrapper: "list",
			type: String,
		},
	})
	async allHandlerName() {
		const list = this.quartzTaskService.allHandlerName()
		return R.success(list)
	}

	@router.get({
		summary: "根据任务id查询定时任务",
		router: "/id/:taskId",
		resType: {
			type: QuartzTaskEntity,
		},
	})
	async getByTaskId(@Param("taskId") taskId: string) {
		const detail = await this.quartzTaskService.getByTaskId(taskId)
		return R.success(detail)
	}

	@router.post({
		summary: "新增定时任务",
		router: "",
		log: {
			tag: "INSERT",
		},
	})
	async save(@Body() dto: QuartzTaskSaveDto) {
		const detail = await this.quartzTaskService.save(dto)
		return R.success(detail?.taskId)
	}

	@router.put({
		summary: "修改定时任务",
		router: "",
		log: {
			tag: "UPDATE",
		},
	})
	async edit(@Body() dto: QuartzTaskSaveDto) {
		await this.quartzTaskService.edit(dto)
		return R.success()
	}

	@router.put({
		summary: "启用或停用定时任务",
		router: "/enable/:taskId",
		log: {
			tag: "UPDATE",
		},
	})
	async changeEnable(@Param("taskId") taskId: string, @Body("enable") enable: boolean) {
		const detail = await this.quartzTaskService.changeEnable(taskId, enable)
		return R.success(detail)
	}

	@router.post({
		summary: "立即执行一次定时任务",
		router: "/run/:taskId",
		log: {
			tag: "OTHER",
		},
	})
	async runNow(@Param("taskId") taskId: string, @Body() requestPayload: Record<string, any>) {
		const detail = await this.quartzTaskService.runNow(taskId, requestPayload)
		return R.success(detail.taskId)
	}

	@router.post({
		summary: "重新同步定时任务到BullMQ",
		router: "/sync/:taskId",
		log: {
			tag: "OTHER",
		},
	})
	async syncTask(@Param("taskId") taskId: string) {
		const detail = await this.quartzTaskService.syncTask(taskId)
		return R.success(detail?.taskId)
	}

	@router.delete({
		summary: "批量删除定时任务",
		router: "/delete/:taskIds",
		log: {
			tag: "DELETE",
		},
	})
	async delByIds(
		@Param("taskIds", new ParseArrayPipe({ items: String, separator: "," }))
		taskIds: Array<string>,
	) {
		const count = await this.quartzTaskService.delByIds(taskIds)
		return R.success(count)
	}
}

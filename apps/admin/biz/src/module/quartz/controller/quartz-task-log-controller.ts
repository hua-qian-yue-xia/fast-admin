import { Body, Param } from "@nestjs/common"
import { R, router } from "@aspen/aspen-fram"

import { QuartzTaskLogEntity, QuartzTaskLogQueryDto } from "../entity"
import { QuartzTaskLogService } from "../service"

/**
 * 定时任务执行日志控制器
 *
 * 日志侧以查询能力为主,不直接开放写入接口
 */
@router.controller({ summary: "定时任务执行日志", prefix: "/quartz/log" })
export class QuartzTaskLogController {
	constructor(private readonly quartzTaskLogService: QuartzTaskLogService) {}

	@router.post({
		summary: "定时任务执行日志分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: QuartzTaskLogEntity,
		},
	})
	async page(@Body() dto: QuartzTaskLogQueryDto) {
		const list = await this.quartzTaskLogService.page(dto)
		return R.success(list)
	}

	@router.get({
		summary: "根据日志id查询执行日志详情",
		router: "/id/:logId",
		resType: {
			type: QuartzTaskLogEntity,
		},
	})
	async getByLogId(@Param("logId") logId: string) {
		const detail = await this.quartzTaskLogService.getByLogId(logId)
		return R.success(detail)
	}
}

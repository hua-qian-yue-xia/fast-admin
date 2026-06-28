import { Body, Param } from "@nestjs/common"

import { R, router } from "@aspen/aspen-fram"

import { SysLogEntity, SysLogQueryDto } from "../entity"
import { SysLogService } from "../service"

@router.controller({ summary: "日志管理", prefix: "/sys/log" })
export class SysLogController {
	constructor(private readonly sysLogService: SysLogService) {}

	@router.post({
		summary: "日志分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: SysLogEntity,
		},
	})
	async page(@Body() dto: SysLogQueryDto) {
		const list = await this.sysLogService.page(dto)
		return R.success(list)
	}

	@router.get({
		summary: "根据日志id查询日志详情",
		router: "/id/:logCode",
		resType: {
			type: SysLogEntity,
		},
	})
	async getByLogCode(@Param("logCode") logCode: string) {
		const detail = await this.sysLogService.getByLogCode(logCode)
		return R.success(detail)
	}
}

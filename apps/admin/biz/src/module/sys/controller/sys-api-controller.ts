import { Body, Param } from "@nestjs/common"

import { R, router } from "@aspen/aspen-fram"

import { SysApiEntity, SysApiQueryDto } from "../entity"
import { SysApiService } from "../service"

@router.controller({ summary: "系统接口", prefix: "/sys/api" })
export class SysApiController {
	constructor(private readonly sysApiService: SysApiService) {}

	@router.post({
		summary: "系统接口分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: SysApiEntity,
		},
	})
	async page(@Body() dto: SysApiQueryDto) {
		const list = await this.sysApiService.page(dto)
		return R.success(list)
	}

	@router.get({
		summary: "根据接口id查询系统接口详情",
		router: "/id/:apiId",
		resType: {
			type: SysApiEntity,
		},
	})
	async getByApiId(@Param("apiId") apiId: string) {
		const detail = await this.sysApiService.getByApiId(apiId)
		return R.success(detail)
	}
}

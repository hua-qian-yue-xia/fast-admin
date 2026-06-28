import { Body, Param, ParseArrayPipe } from "@nestjs/common"

import { R, router } from "@aspen/aspen-fram"

import { SysFileConfigService } from "../service"
import { SysFileConfigEntity, SysFileConfigQueryDto, SysFileConfigSaveDto } from "../entity"

@router.controller({ summary: "文件配置管理", prefix: "/sys/file/config" })
export class SysFileConfigController {
	constructor(private readonly sysFileConfigService: SysFileConfigService) {}

	@router.post({
		summary: "文件配置分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: SysFileConfigEntity,
		},
	})
	async page(@Body() dto: SysFileConfigQueryDto) {
		const list = await this.sysFileConfigService.page(dto)
		return R.success(list)
	}

	@router.get({
		summary: "根据configId查询文件配置(有缓存)",
		router: "/:configId",
		resType: {
			type: SysFileConfigEntity,
		},
	})
	async getByConfigId(@Param("configId") configId: string) {
		const configDetail = await this.sysFileConfigService.getByConfigId(configId)
		return R.success(configDetail)
	}

	@router.post({
		summary: "新增文件配置",
		router: "",
	})
	async save(@Body() body: SysFileConfigSaveDto) {
		const save = await this.sysFileConfigService.save(body)
		return R.success(save)
	}

	@router.put({
		summary: "更新文件配置",
		router: "",
	})
	async edit(@Body() body: SysFileConfigSaveDto) {
		await this.sysFileConfigService.edit(body)
		return R.success()
	}

	@router.delete({
		summary: "删除文件配置",
		router: "/:configIds",
	})
	async delete(
		@Param("configIds", new ParseArrayPipe({ items: String, separator: "," }))
		configIds: Array<string>,
	) {
		const delCount = await this.sysFileConfigService.delByIds(configIds)
		return R.success(delCount)
	}
}

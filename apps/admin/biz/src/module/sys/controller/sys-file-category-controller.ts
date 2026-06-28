import { Body, Param, ParseArrayPipe } from "@nestjs/common"

import { R, router } from "@aspen/aspen-fram"

import { SysFileCategoryService } from "../service"
import { SysFileCategoryEntity, SysFileCategoryQueryDto, SysFileCategorySaveDto } from "../entity/index"

@router.controller({ prefix: "/sys/file-category", summary: "文件分类" })
export class SysFileCategoryController {
	constructor(private readonly sysFileCategoryService: SysFileCategoryService) {}

	@router.post({
		summary: "查询所有文件分类",
		router: "/all",
		resType: {
			wrapper: "list",
			type: SysFileCategoryEntity,
		},
	})
	async all(@Body() dto: SysFileCategoryQueryDto) {
		const list = await this.sysFileCategoryService.all(dto)
		return R.success(list)
	}

	@router.get({
		summary: "根据categoryId查询文件分类(有缓存)",
		router: "/:categoryId",
		resType: {
			type: SysFileCategoryEntity,
		},
	})
	async getByCategoryId(@Param("categoryId") categoryId: string) {
		const categoryDetail = await this.sysFileCategoryService.getByCategoryId(categoryId)
		return R.success(categoryDetail)
	}

	@router.post({
		summary: "新增文件分类",
		router: "",
	})
	async save(@Body() body: SysFileCategorySaveDto) {
		const save = await this.sysFileCategoryService.save(body)
		return R.success(save)
	}

	@router.put({
		summary: "更新文件分类",
		router: "",
	})
	async edit(@Body() body: SysFileCategorySaveDto) {
		await this.sysFileCategoryService.edit(body)
		return R.success()
	}

	@router.delete({
		summary: "删除文件分类",
		router: "/:categoryIds",
	})
	async delete(
		@Param("categoryIds", new ParseArrayPipe({ items: String, separator: "," }))
		categoryIds: Array<string>,
	) {
		const delCount = await this.sysFileCategoryService.delByIds(categoryIds)
		return R.success(delCount)
	}
}

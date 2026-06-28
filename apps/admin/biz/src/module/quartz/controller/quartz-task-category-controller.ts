import { Body, Param, ParseArrayPipe } from "@nestjs/common"
import { R, router } from "@aspen/aspen-fram"

import { QuartzTaskCategoryEntity, QuartzTaskCategoryQueryDto, QuartzTaskCategorySaveDto } from "../entity"
import { QuartzTaskCategoryService } from "../service"

/**
 * 定时任务分类控制器.
 *
 * 提供后台分类管理所需的标准 CRUD 接口.
 */
@router.controller({ summary: "定时任务分类管理", prefix: "/quartz/category" })
export class QuartzTaskCategoryController {
	constructor(private readonly quartzTaskCategoryService: QuartzTaskCategoryService) {}

	@router.post({
		summary: "定时任务分类分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: QuartzTaskCategoryEntity,
		},
	})
	async page(@Body() dto: QuartzTaskCategoryQueryDto) {
		const list = await this.quartzTaskCategoryService.page(dto)
		return R.success(list)
	}

	@router.get({
		summary: "查询全部定时任务分类",
		router: "/all",
		resType: {
			wrapper: "list",
			type: QuartzTaskCategoryEntity,
		},
	})
	async all() {
		const list = await this.quartzTaskCategoryService.all()
		return R.success(list)
	}

	@router.get({
		summary: "根据分类id查询定时任务分类",
		router: "/id/:categoryId",
		resType: {
			type: QuartzTaskCategoryEntity,
		},
	})
	async getByCategoryId(@Param("categoryId") categoryId: string) {
		const detail = await this.quartzTaskCategoryService.getByCategoryId(categoryId)
		return R.success(detail)
	}

	@router.post({
		summary: "新增定时任务分类",
		router: "",
		log: {
			tag: "INSERT",
		},
	})
	async save(@Body() dto: QuartzTaskCategorySaveDto) {
		const detail = await this.quartzTaskCategoryService.save(dto)
		return R.success(detail.categoryId)
	}

	@router.put({
		summary: "修改定时任务分类",
		router: "",
		log: {
			tag: "UPDATE",
		},
	})
	async edit(@Body() dto: QuartzTaskCategorySaveDto) {
		await this.quartzTaskCategoryService.edit(dto)
		return R.success()
	}

	@router.delete({
		summary: "批量删除定时任务分类",
		router: "/delete/:categoryIds",
		log: {
			tag: "DELETE",
		},
	})
	async delByIds(
		@Param("categoryIds", new ParseArrayPipe({ items: String, separator: "," }))
		categoryIds: Array<string>,
	) {
		const count = await this.quartzTaskCategoryService.delByIds(categoryIds)
		return R.success(count)
	}
}

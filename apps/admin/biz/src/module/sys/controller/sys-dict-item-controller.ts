import { R, router } from "@aspen/aspen-fram"
import { Body, Param, ParseArrayPipe } from "@nestjs/common"

import { SysDictItemService } from "../service"
import { SysDictItemEntity, SysDictItemQueryDto, SysDictItemSaveDto } from "../entity"

@router.controller({ summary: "字典项管理", prefix: "/sys/dict/item" })
export class SysDictItemController {
	constructor(private readonly sysDictItemService: SysDictItemService) {}

	@router.post({
		summary: "字典项分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: SysDictItemEntity,
		},
	})
	async page(@Body() dto: SysDictItemQueryDto) {
		const list = await this.sysDictItemService.page(dto)
		return R.success(list)
	}

	@router.get({
		summary: "根据dictItemId查询字典项(有缓存)",
		router: "/:dictItemId",
		resType: {
			type: SysDictItemEntity,
		},
	})
	async getByDictItemId(@Param("dictItemId") dictItemId: string) {
		const dictDetail = await this.sysDictItemService.getByDictItemId(dictItemId)
		return R.success(dictDetail)
	}

	@router.get({
		summary: "根据dictId查询字典项(有缓存)",
		router: "/dictCode/:dictCode",
		resType: {
			wrapper: "list",
			type: SysDictItemEntity,
		},
	})
	async getListBydictCode(@Param("dictCode") dictCode: string) {
		const dictDetail = await this.sysDictItemService.getListBydictCode(dictCode)
		return R.success(dictDetail)
	}

	@router.post({
		summary: "新增字典项",
		router: "",
	})
	async save(@Body() body: SysDictItemSaveDto) {
		const list = await this.sysDictItemService.save(body)
		return R.success(list)
	}

	@router.put({
		summary: "修改字典项",
		router: "",
	})
	async edit(@Body() body: SysDictItemSaveDto) {
		await this.sysDictItemService.edit(body)
		return R.success()
	}

	@router.delete({
		summary: "删除字典项",
		router: "/:dictItemIds",
	})
	async dictItemDelete(
		@Param("dictItemIds", new ParseArrayPipe({ items: Number, separator: "," }))
		dictItemIds: Array<number>,
	) {
		const delCount = await this.sysDictItemService.delByIds(dictItemIds)
		return R.success(delCount)
	}
}

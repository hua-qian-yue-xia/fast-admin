import { Body, Param, ParseArrayPipe } from "@nestjs/common"
import { R, router } from "@aspen/aspen-fram"

import { SysDictService } from "../service"
import { SysDictEntity, SysDictQueryDto, SysDictSaveDto } from "../entity"

@router.controller({ summary: "字典管理", prefix: "/sys/dict" })
export class SysDictController {
	constructor(private readonly sysDictService: SysDictService) {}

	@router.post({
		summary: "字典分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: SysDictEntity,
		},
	})
	async page(@Body() dto: SysDictQueryDto) {
		const list = await this.sysDictService.page(dto)
		return R.success(list)
	}

	@router.get({
		summary: "查询所有字典code",
		router: "/all/dict-code",
		tagList: ["white"],
		resType: {
			wrapper: "list",
			type: String,
		},
	})
	async allDictCode() {
		const list = await this.sysDictService.allDictCode()
		return R.success(list)
	}

	@router.get({
		summary: "根据dictId查询字典(有缓存)",
		router: "/:dictId",
		resType: {
			type: SysDictEntity,
		},
	})
	async getByDictId(@Param("dictId") dictId: string) {
		const dictDetail = await this.sysDictService.getByDictId(dictId)
		return R.success(dictDetail)
	}

	@router.post({
		summary: "新增字典",
		router: "",
	})
	async save(@Body() body: SysDictSaveDto) {
		const list = await this.sysDictService.save(body)
		return R.success(list)
	}

	@router.put({
		summary: "修改字典",
		router: "",
	})
	async edit(@Body() body: SysDictSaveDto) {
		await this.sysDictService.edit(body)
		return R.success()
	}

	@router.delete({
		summary: "删除字典",
		router: "/:dictIds",
	})
	async delete(
		@Param("dictIds", new ParseArrayPipe({ items: String, separator: "," }))
		dictIds: Array<string>,
	) {
		const delCount = await this.sysDictService.delByIds(dictIds)
		return R.success(delCount)
	}
}

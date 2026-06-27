import { Body, Param, ParseArrayPipe } from "@nestjs/common"

import { R, router } from "@aspen/aspen-fram"

import { UpmDeptEntity, UpmDeptQueryDto, UpmDeptSaveDto } from "../entity"
import { UpmDeptService } from "../service"

@router.controller({ summary: "部门管理", prefix: "/upm/dept" })
export class UpmDeptController {
	constructor(private readonly upmDeptService: UpmDeptService) {}

	@router.post({
		summary: "分页",
		router: "/page",
		resType: {
			type: UpmDeptEntity,
			wrapper: "page",
		},
	})
	async page(@Body() body: UpmDeptQueryDto) {
		const list = await this.upmDeptService.scopePage(body)
		return R.success(list)
	}

	@router.post({
		summary: "下拉",
		description: "没有权限控制",
		router: "/select",
		resType: {
			type: UpmDeptEntity,
			wrapper: "page",
		},
	})
	async select(@Body() body: UpmDeptQueryDto) {
		const list = await this.upmDeptService.scopePage(body)
		return R.success(list)
	}

	@router.post({
		summary: "树状结构",
		description: "",
		router: "/tree",
		resType: {
			type: UpmDeptEntity,
			wrapper: "tree",
		},
	})
	async tree(@Body() query: UpmDeptQueryDto) {
		const treeList = await this.upmDeptService.tree(query)
		return R.success(treeList)
	}

	@router.get({
		summary: "根据部门id查询部门(有缓存)",
		router: "/id/:deptId",
		resType: {
			type: UpmDeptEntity,
		},
		log: {
			tag: "OTHER",
		},
	})
	async getByDeptId(@Param("deptId") deptId: string) {
		const deptDetail = await this.upmDeptService.getByDeptId(deptId)
		return R.success(deptDetail)
	}

	@router.post({
		summary: "新增",
		router: "",
	})
	async save(@Body() dto: UpmDeptSaveDto) {
		const roleDetail = await this.upmDeptService.save(dto)
		return R.success(roleDetail.deptId)
	}

	@router.put({
		summary: "修改",
		router: "",
	})
	async edit(@Body() dto: UpmDeptSaveDto) {
		await this.upmDeptService.update(dto)
		return R.success()
	}

	@router.delete({
		summary: "删除",
		router: "/:deptIds",
	})
	async delete(
		@Param("deptIds", new ParseArrayPipe({ items: String, separator: "," }))
		deptIds: Array<string>,
	) {
		await this.upmDeptService.delete(deptIds)
		return R.success()
	}
}

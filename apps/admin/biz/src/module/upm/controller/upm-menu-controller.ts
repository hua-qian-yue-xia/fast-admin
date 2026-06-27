import { Body, Param, ParseArrayPipe } from "@nestjs/common"

import { R, router } from "@aspen/aspen-fram"

import { UpmMenuService } from "../service"
import { UpmMenuEntity, UpmMenuQueryDto, UpmMenuSaveDto } from "../entity"

@router.controller({ summary: "菜单管理", prefix: "/upm/menu" })
export class UpmMenuController {
	constructor(private readonly upmMenuService: UpmMenuService) {}

	@router.post({
		summary: "树状结构",
		router: "/tree",
		resType: {
			type: UpmMenuEntity,
			wrapper: "tree",
		},
	})
	async tree(@Body() query: UpmMenuQueryDto) {
		const tree = await this.upmMenuService.tree(query)
		return R.success(tree)
	}

	@router.post({
		summary: "下拉(没有权限控制)",
		router: "/select",
		resType: {
			type: UpmMenuEntity,
			wrapper: "page",
		},
	})
	async select(@Body() query: UpmMenuQueryDto) {
		const list = await this.upmMenuService.scopePage(query)
		return R.success(list)
	}

	@router.get({
		summary: "根据菜单id查询用户",
		description: "有缓存",
		router: "/id/:menuId",
		resType: {
			type: UpmMenuEntity,
		},
	})
	async getByMenuId(@Param("menuId") menuId: string) {
		const detail = await this.upmMenuService.getByMenuId(menuId)
		return R.success(detail)
	}

	@router.patch({
		summary: "根据部门id查询部门(有缓存)",
		router: "/id/:menuId",
	})
	async getByRoleId(@Param("menuId") menuId: string) {
		const menuDetail = await this.upmMenuService.getByMenuId(menuId)
		return R.success(menuDetail)
	}

	@router.post({
		summary: "新增菜单",
		description: "有缓存",
		router: "/",
	})
	async save(@Body() dto: UpmMenuSaveDto) {
		await this.upmMenuService.save(dto)
		return R.success()
	}

	@router.put({
		summary: "修改菜单",
		description: "有缓存",
		router: "/",
		rateLimit: {},
	})
	async edit(@Body() dto: UpmMenuSaveDto) {
		await this.upmMenuService.edit(dto)
		return R.success()
	}

	@router.delete({
		summary: "根据菜单ids删除菜单",
		router: "/:menuIds",
	})
	async delete(
		@Param("menuIds", new ParseArrayPipe({ items: String, separator: "," }))
		menuIds: Array<string>,
	) {
		const delCount = await this.upmMenuService.delByIds(menuIds)
		return R.success(delCount)
	}
}

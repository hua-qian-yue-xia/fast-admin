import { Body, Param, ParseArrayPipe } from "@nestjs/common"
import { R, router } from "@aspen/aspen-fram"

import { UpmRoleService } from "../service/upm-role-service"
import { UpmRoleEntity, UpmRoleQueryDto, UpmRoleSaveDto } from "../entity/upm-role.entity"

@router.controller({ summary: "角色管理", prefix: "/upm/role" })
export class UpmRoleController {
	constructor(private readonly sysRoleService: UpmRoleService) {}

	@router.post({
		summary: "分页结构",
		router: "/scopePage",
		resType: {
			wrapper: "page",
			type: UpmRoleEntity,
		},
	})
	async scopePage(@Body() dto: UpmRoleQueryDto) {
		const list = await this.sysRoleService.scopePage(dto)
		return R.success(list)
	}

	@router.post({
		summary: "下拉(没有权限控制)",
		router: "/select",
		resType: {
			wrapper: "page",
			type: UpmRoleEntity,
		},
	})
	async select(@Body() pa: UpmRoleQueryDto) {
		const list = await this.sysRoleService.scopePage(pa)
		return R.success(list)
	}

	@router.get({
		summary: "根据角色id查询角色(有缓存)",
		router: "/id/:roleId",
		resType: {
			type: UpmRoleEntity,
		},
		log: {
			tag: "OTHER",
		},
	})
	async getByRoleId(@Param("roleId") roleId: string) {
		const roleDetail = await this.sysRoleService.getByRoleId(roleId)
		return R.success(roleDetail)
	}

	@router.get({
		summary: "根据角色code查询角色(有缓存)",
		router: "/code/:roleCode",
		resType: {
			type: UpmRoleEntity,
		},
		log: {
			tag: "OTHER",
		},
	})
	async getByRoleCode(@Param("roleCode") roleCode: string) {
		const roleDetail = await this.sysRoleService.getByRoleCode(roleCode)
		return R.success(roleDetail)
	}

	@router.post({
		summary: "新增角色(限流、日志)",
		router: "",
		log: {
			tag: "INSERT",
		},
		rateLimit: {
			limitType: "IP",
		},
	})
	async save(@Body() dto: UpmRoleSaveDto) {
		const roleDetail = await this.sysRoleService.save(dto)
		return R.success(roleDetail.roleId)
	}

	@router.put({
		summary: "修改角色(限流、日志)",
		router: "",
	})
	async edit(@Body() dto: UpmRoleSaveDto) {
		await this.sysRoleService.edit(dto)
		return R.success()
	}

	@router.delete({
		summary: "根据角色ids删除角色",
		router: "/delete/:roleIds",
	})
	async delByIds(
		@Param("roleIds", new ParseArrayPipe({ items: String, separator: "," }))
		roleIds: Array<string>,
	) {
		const delCount = await this.sysRoleService.delByIds(roleIds)
		return R.success(delCount)
	}
}

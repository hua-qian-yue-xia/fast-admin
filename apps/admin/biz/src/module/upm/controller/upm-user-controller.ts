import { Body, Param, ParseArrayPipe } from "@nestjs/common"

import { R, router } from "@aspen/aspen-fram"

import { UpmUserService } from "../service/upm-user-service"

import { UpmUserEntity, UpmUserQueryDto } from "../entity/upm-user.entity"

@router.controller({ summary: "用户管理", prefix: "/upm/user" })
export class UpmUserController {
	constructor(private readonly upmUserService: UpmUserService) {}

	@router.post({
		summary: "分页",
		router: "/page",
		resType: {
			type: UpmUserEntity,
			wrapper: "page",
		},
	})
	async page(@Body() dto: UpmUserQueryDto) {
		return R.success(await this.upmUserService.scopePage(dto))
	}

	@router.get({
		summary: "下拉",
		description: "没有权限控制",
		router: "/select",
		resType: {
			type: UpmUserEntity,
			wrapper: "page",
		},
	})
	async select(@Body() dto: UpmUserQueryDto) {
		return R.success(await this.upmUserService.scopePage(dto))
	}

	@router.get({
		summary: "根据用户id查询用户",
		description: "有缓存",
		router: "/id/:userId",
		resType: {
			type: UpmUserEntity,
		},
	})
	async getByUserId(@Param("userId") userId: string) {
		const detail = await this.upmUserService.getByUserId(userId)
		return R.success(detail)
	}

	@router.post({
		summary: "新增用户",
		description: "有缓存",
		router: "/",
	})
	async save(@Body() dto: UpmUserEntity) {
		await this.upmUserService.save(dto)
		return R.success()
	}

	@router.put({
		summary: "修改用户",
		description: "有缓存",
		router: "/",
		rateLimit: {},
	})
	async edit(@Body() dto: UpmUserEntity) {
		await this.upmUserService.edit(dto)
		return R.success()
	}

	@router.delete({
		summary: "根据用户ids删除用户",
		router: "/:userIds",
	})
	async delete(
		@Param("userIds", new ParseArrayPipe({ items: String, separator: "," }))
		userIds: Array<string>,
	) {
		const delCount = await this.upmUserService.delByIds(userIds)
		return R.success(delCount)
	}
}

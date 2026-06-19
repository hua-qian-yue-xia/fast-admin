import { AbstractEnumGroup } from "@aspen/aspen-fram"

/*
 * ---------------------------------------------------------------
 * ## 用户相关枚举
 * ---------------------------------------------------------------
 */
export class UpmUserEnum extends AbstractEnumGroup {
	readonly status = this.create("status", "用户状态", {
		ACTIVE: {
			code: "100",
			summary: "正常",
		},
		INACTIVE: {
			code: "200",
			summary: "停用",
		},
	})
	readonly type = this.create("type", "用户类型", {
		ADMIN_USER: {
			code: "100",
			summary: "ADMIN管理后台用户",
		},
		WECHAT_USER: {
			code: "200",
			summary: "WECHAT小程序用户",
		},
	})
}

export const upmUserEnum = new UpmUserEnum()

/*
 * ---------------------------------------------------------------
 * ## 菜单相关枚举
 * ---------------------------------------------------------------
 */
export class UpmMenuEnum extends AbstractEnumGroup {
	readonly type = this.create("type", "菜单类型", {
		MENU: {
			code: "100",
			summary: "菜单",
		},
		CATALOGUE: {
			code: "200",
			summary: "目录",
		},
		PERM: {
			code: "300",
			summary: "能力/权限",
		},
	})
}

export const upmMenuEnum = new UpmMenuEnum()

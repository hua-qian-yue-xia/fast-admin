import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

import { AspenSummary, BaseRecordDb, comEnums } from "@aspen/aspen-fram"

import { upmMenuEnum } from "../common/upm.enum"

/*
 * ---------------------------------------------------------------
 * ## 菜单表
 * ---------------------------------------------------------------
 */
@Entity({ comment: "菜单", name: "upm_menu" })
export class UpmMenuEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "菜单id" })
	@AspenSummary({ summary: "菜单id" })
	menuId: string

	@Column({ type: "varchar", length: 36, comment: "菜单父id" })
	@AspenSummary({ summary: "菜单父id" })
	parentId?: string

	@Column({ type: "varchar", length: 64, comment: "菜单名" })
	@AspenSummary({ summary: "菜单名" })
	menuName: string

	@Column({
		type: "enum",
		enum: upmMenuEnum.type.meta.code,
		comment: "菜单类型",
	})
	@AspenSummary({ summary: "菜单类型" })
	type: string

	@Column({ type: "varchar", length: 64, nullable: true, comment: "图标" })
	@AspenSummary({ summary: "图标" })
	icon?: string

	@Column({ type: "varchar", length: 128, nullable: true, comment: "路由地址" })
	@AspenSummary({ summary: "路由地址" })
	path?: string

	@Column({ type: "varchar", length: 128, nullable: true, comment: "权限标识" })
	@AspenSummary({ summary: "权限标识" })
	perm?: string

	@Column({
		type: "enum",
		enum: comEnums.bool.meta.code,
		default: comEnums.active.named.NO.raw.code,
		comment: "是否显示",
	})
	@AspenSummary({ summary: "是否显示" })
	visible: string

	@Column({
		type: "enum",
		enum: comEnums.bool.meta.code,
		default: comEnums.active.named.NO.raw.code,
		comment: "是否缓存",
	})
	@AspenSummary({ summary: "是否缓存" })
	keepAlive: string

	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序" })
	sort: number
}

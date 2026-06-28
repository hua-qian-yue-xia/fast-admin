import { Brackets, Column, Entity, PrimaryGeneratedColumn, Repository } from "typeorm"
import * as _ from "es-toolkit/compat"
import * as classValidator from "class-validator"

import { AspenRule, AspenSummary, BasePage, BaseRecordDb, comEnums } from "@aspen/aspen-fram"

import { upmMenuEnum } from "../common"
import { plainToInstance } from "class-transformer"

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
/*
 * ---------------------------------------------------------------
 * ## 菜单-查询
 * ---------------------------------------------------------------
 */
export class UpmMenuQueryDto extends BasePage {
	@AspenSummary({ summary: "菜单父id", rule: AspenRule() })
	menuId?: string

	@AspenSummary({ summary: "菜单父ids", rule: AspenRule() })
	menuIds?: Array<string>

	@AspenSummary({ summary: "是否包含`menuIds`条件", rule: AspenRule() })
	includeMenuIds?: boolean

	@AspenSummary({ summary: "菜单父id", rule: AspenRule() })
	parentId?: string

	@AspenSummary({ summary: "菜单名,路由地址", rule: AspenRule() })
	quick?: string

	@AspenSummary({ summary: "菜单类型", rule: AspenRule() })
	type?: string

	createQueryBuilder(repo: Repository<UpmMenuEntity>) {
		const queryBuilder = repo.createQueryBuilder("a")
		if (!_.isEmpty(this.menuId)) {
			queryBuilder.where("a.menu_id = :menuId", { menuId: this.menuId })
		}
		if (!_.isEmpty(this.menuIds)) {
			if (this.includeMenuIds === false) {
				queryBuilder.andWhere("a.menu_id NOT IN (:...menuIds)", { menuIds: this.menuIds })
			} else {
				queryBuilder.andWhere("a.menu_id IN (:...menuIds)", { menuIds: this.menuIds })
			}
		}
		if (!_.isEmpty(this.parentId)) {
			queryBuilder.andWhere("a.parent_id = :parentId", { parentId: this.parentId })
		}
		if (!_.isEmpty(this.quick)) {
			queryBuilder.andWhere(
				new Brackets((qb) =>
					qb.where(`a.menu_name like :quick`, { quick: `%${this.quick}%` }).orWhere(`a.path like :quick`, { quick: `%${this.quick}%` }),
				),
			)
		}
		if (!_.isEmpty(this.type)) {
			queryBuilder.andWhere("a.type = :type", { type: this.type })
		}
		queryBuilder.orderBy("a.sort", "DESC").addOrderBy("a.menu_id", "DESC")
		return queryBuilder
	}
}

/*
 * ---------------------------------------------------------------
 * ## 菜单-新增
 * ---------------------------------------------------------------
 */
export class UpmMenuSaveDto {
	@AspenSummary({ summary: "菜单id", rule: AspenRule() })
	menuId?: string

	@AspenSummary({ summary: "菜单父id", rule: AspenRule() })
	parentId?: string

	@AspenSummary({ summary: "菜单名", rule: AspenRule().isNotEmpty() })
	menuName: string

	@AspenSummary({ summary: "菜单类型", rule: AspenRule().isNotEmpty() })
	type: string

	@AspenSummary({ summary: "菜单位置", rule: AspenRule() })
	position?: string

	@AspenSummary({ summary: "图标", rule: AspenRule() })
	icon?: string

	@AspenSummary({ summary: "路由地址", rule: AspenRule() })
	path?: string

	@AspenSummary({ summary: "权限标识", rule: AspenRule() })
	perm?: string

	@AspenSummary({ summary: "是否显示", rule: AspenRule() })
	visible?: string

	@AspenSummary({ summary: "是否缓存", rule: AspenRule() })
	keepAlive?: string

	@AspenSummary({ summary: "排序", rule: AspenRule() })
	sort?: number

	toEntity() {
		if (this.type == upmMenuEnum.type.named.CATALOGUE.raw.code) {
			return this.toCatalogueEntity()
		}
		if (this.type == upmMenuEnum.type.named.PERM.raw.code) {
			return this.toPermEntity()
		}
		return this.toMenuEntity()
	}

	// 转换到菜单实体
	toMenuEntity() {
		const obj = plainToInstance(UpmMenuEntity, this)
		if (_.isEmpty(obj.menuId)) obj.menuId = undefined
		if (_.isEmpty(obj.parentId)) obj.parentId = undefined
		if (_.isEmpty(obj.sort)) obj.sort = 0
		classValidator.isEmpty(obj.icon)
		classValidator.isEmpty(obj.path)
		return obj
	}

	// 转换到目录实体
	toCatalogueEntity() {
		const obj = plainToInstance(UpmMenuEntity, this)
		if (_.isEmpty(obj.menuId)) obj.menuId = undefined
		if (_.isEmpty(obj.parentId)) obj.parentId = undefined
		if (_.isEmpty(obj.sort)) obj.sort = 0
		classValidator.isEmpty(obj.icon)
		classValidator.isEmpty(obj.path)
		return obj
	}

	// 转换到能力/权限实体
	toPermEntity() {
		const obj = plainToInstance(UpmMenuEntity, this)
		if (_.isEmpty(obj.menuId)) obj.menuId = undefined
		if (_.isEmpty(obj.parentId)) obj.parentId = undefined
		if (_.isEmpty(obj.sort)) obj.sort = 0
		classValidator.isEmpty(obj.perm)
		return obj
	}
}

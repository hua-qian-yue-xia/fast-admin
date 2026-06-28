import { Brackets, Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn, Repository } from "typeorm"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BasePage, BaseRecordDb } from "@aspen/aspen-fram"

import { UpmUserEntity } from "./upm-user.entity"
import { UpmMenuEntity } from "./upm-menu.entity"
import { plainToInstance } from "class-transformer"

/*
 * ---------------------------------------------------------------
 * ## 角色表
 * ---------------------------------------------------------------
 */
@Entity({ comment: "角色", name: "upm_role" })
export class UpmRoleEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "角色id" })
	@AspenSummary({ summary: "角色id" })
	roleId: string

	@Column({ type: "varchar", length: 64, comment: "角色名" })
	@AspenSummary({ summary: "角色名" })
	roleName: string

	@Index()
	@Column({ type: "varchar", length: 64, comment: "角色编码" })
	@AspenSummary({ summary: "角色编码" })
	roleCode: string

	@Index()
	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序" })
	sort: number

	@ManyToMany(() => UpmUserEntity)
	users: Array<UpmUserEntity>

	@ManyToMany(() => UpmMenuEntity)
	@JoinTable({ name: "upm_rule_menu", joinColumn: { name: "role_id" }, inverseJoinColumn: { name: "menu_id" } })
	menus: Array<UpmMenuEntity>
}

export class UpmRoleQueryDto extends BasePage {
	@AspenSummary({ summary: "角色id", rule: AspenRule() })
	roleId?: string

	@AspenSummary({ summary: "角色名,角色编码", rule: AspenRule() })
	quick?: string

	createQueryBuilder(repo: Repository<UpmRoleEntity>) {
		const queryBuilder = repo.createQueryBuilder("a")
		if (!_.isEmpty(this.roleId)) {
			queryBuilder.where("a.role_id = :roleId", { roleId: this.roleId })
		}
		if (!_.isEmpty(this.quick)) {
			queryBuilder.where(
				new Brackets((qb) =>
					qb
						.where(`a.role_name like :quick`, { quick: `%${this.quick}%` })
						.orWhere(`LOWER(a.role_code) like :quick`, { quick: `%${this.quick?.toLowerCase()}%` }),
				),
			)
		}
		queryBuilder.orderBy("a.sort", "DESC")
		return queryBuilder
	}
}

/*
 * ---------------------------------------------------------------
 * ## 角色-新增
 * ---------------------------------------------------------------
 */
export class UpmRoleSaveDto {
	@AspenSummary({ summary: "角色id", rule: AspenRule() })
	roleId?: string

	@AspenSummary({ summary: "角色名", rule: AspenRule().isNotEmpty() })
	roleName: string

	@AspenSummary({ summary: "角色编码", rule: AspenRule().isNotEmpty() })
	roleCode: string

	@AspenSummary({ summary: "排序" })
	sort: number

	toEntity(): UpmRoleEntity {
		const obj = plainToInstance(UpmRoleEntity, this)
		if (_.isEmpty(obj.roleId)) obj.roleId = undefined
		if (_.isEmpty(obj.sort)) obj.sort = 0
		return obj
	}
}

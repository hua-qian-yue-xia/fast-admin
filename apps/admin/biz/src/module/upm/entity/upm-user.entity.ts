import { Brackets, Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn, Repository } from "typeorm"
import { Exclude } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BaseUserDb } from "@aspen/aspen-fram"

import { UpmRoleEntity } from "./upm-role.entity"
import { UpmDeptEntity } from "./upm-dept.entity"

/*
 * ---------------------------------------------------------------
 * ## 用户表
 * ---------------------------------------------------------------
 */
@Entity({ comment: "用户", name: "upm_user" })
export class UpmUserEntity extends BaseUserDb {
	@PrimaryGeneratedColumn("uuid", { comment: "用户id" })
	@AspenSummary({ summary: "登录名" })
	override userId: string

	@Index()
	@Column({ type: "varchar", length: 64, comment: "登录名" })
	@AspenSummary({ summary: "登录名" })
	override username: string

	@Column({ type: "varchar", length: 64, comment: "用户昵称" })
	@AspenSummary({ summary: "用户昵称" })
	override userNickname: string

	@Column({ type: "varchar", length: 128, comment: "用户密码" })
	@AspenSummary({ summary: "用户密码" })
	@Exclude()
	override password: string

	@Index()
	@Column({ type: "varchar", length: 128, comment: "用户手机号" })
	@AspenSummary({ summary: "用户手机号" })
	override mobile: string

	@Column({ type: "bit", default: true, comment: "是否启用" })
	@AspenSummary({ summary: "是否启用" })
	override enable: boolean

	@Index()
	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序" })
	sort: number

	@ManyToMany(() => UpmRoleEntity)
	@JoinTable({ name: "upm_user_role", joinColumn: { name: "user_id" }, inverseJoinColumn: { name: "role_id" } })
	userRoles: Array<UpmRoleEntity>

	@ManyToMany(() => UpmDeptEntity)
	@JoinTable({ name: "upm_user_dept", joinColumn: { name: "user_id" }, inverseJoinColumn: { name: "dept_id" } })
	userDepts: Array<UpmDeptEntity>
}

export class UpmUserQueryDto {
	@AspenSummary({ summary: "登录名,用户昵称,用户手机号", rule: AspenRule() })
	quick?: string

	@AspenSummary({ summary: "是否启用", rule: AspenRule() })
	enable?: string

	@AspenSummary({ summary: "部门id列表", rule: AspenRule() })
	deptIds?: Array<string>

	@AspenSummary({ summary: "是否包含`deptIds`条件", rule: AspenRule() })
	includeDeptIds?: boolean

	@AspenSummary({ summary: "角色id列表", rule: AspenRule() })
	roleIds?: Array<string>

	createQueryBuilder(repo: Repository<UpmUserEntity>) {
		const queryBuilder = repo.createQueryBuilder("a").leftJoinAndSelect("a.userRoles", "role").leftJoinAndSelect("a.userDepts", "dept")
		if (!_.isEmpty(this.quick)) {
			queryBuilder.where(
				new Brackets((qb) =>
					qb
						.where(`a.username like :quick`, { quick: `%${this.quick}%` })
						.orWhere(`a.user_nickname like :quick`, { quick: `%${this.quick}%` })
						.orWhere(`a.mobile like :quick`, { quick: `%${this.quick}%` }),
				),
			)
		}
		if (!_.isEmpty(this.enable)) {
			queryBuilder.andWhere("a.enable = :enable", { enable: this.enable })
		}
		if (!_.isEmpty(this.deptIds)) {
			if (this.includeDeptIds === false) {
				queryBuilder.andWhere("dept.deptId NOT IN (:...deptIds)", { deptIds: this.deptIds })
			} else {
				queryBuilder.andWhere("dept.deptId IN (:...deptIds)", { deptIds: this.deptIds })
			}
		}
		if (!_.isEmpty(this.roleIds)) {
			queryBuilder.andWhere("role.roleId IN (:...roleIds)", { roleIds: this.roleIds })
		}
		queryBuilder.orderBy("a.sort", "DESC").addOrderBy("a.userId", "DESC")
		return queryBuilder
	}
}

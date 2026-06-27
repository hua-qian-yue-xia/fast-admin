import { Column, Entity, Index, ManyToMany, PrimaryGeneratedColumn, Repository } from "typeorm"
import { plainToInstance } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BasePage, BaseRecordDb } from "@aspen/aspen-fram"

import { UpmUserEntity } from "./upm-user.entity"
import { SysDeptCountTotalBO } from "../service/BO"

/*
 * ---------------------------------------------------------------
 * ## 部门表
 * ---------------------------------------------------------------
 */
@Entity({ comment: "部门", name: "upm_dept" })
export class UpmDeptEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "部门id" })
	@AspenSummary({ summary: "部门id" })
	deptId: string

	@Column({ type: "varchar", length: 36, comment: "部门父id", nullable: true })
	@AspenSummary({ summary: "部门父id" })
	deptParentId?: string

	@Index()
	@Column({ type: "varchar", length: 64, comment: "部门名" })
	@AspenSummary({ summary: "部门名" })
	deptName: string

	@Index()
	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序" })
	sort: number

	@ManyToMany(() => UpmUserEntity)
	users?: Array<UpmUserEntity>

	// 获取根部门id
	static getRootDeptId() {
		return "-1"
	}
}

/*
 * ---------------------------------------------------------------
 * ## 部门-查询
 * ---------------------------------------------------------------
 */
export class UpmDeptQueryDto extends BasePage {
	@AspenSummary({ summary: "部门父id", rule: AspenRule() })
	deptParentId?: string

	@AspenSummary({ summary: "部门名", rule: AspenRule() })
	deptNameLike?: string

	@AspenSummary({ summary: "部门id列表", rule: AspenRule() })
	deptIds?: Array<string>

	createQueryBuilder(repo: Repository<UpmDeptEntity>) {
		const queryBuilder = repo.createQueryBuilder("upm_dept")
		if (!_.isEmpty(this.deptParentId)) {
			queryBuilder.andWhere("upm_dept.dept_parent_id = :deptParentId", { deptParentId: this.deptParentId })
		}
		if (!_.isEmpty(this.deptNameLike)) {
			queryBuilder.andWhere(`upm_dept.dept_name like :deptNameLike`, { deptNameLike: `%${this.deptNameLike}%` })
		}
		if (!_.isEmpty(this.deptIds)) {
			queryBuilder.andWhere("upm_dept.dept_id IN (:...deptIds)", { deptIds: this.deptIds })
		}
		queryBuilder.orderBy("upm_dept.sort", "DESC").addOrderBy("upm_dept.dept_id", "DESC")
		return queryBuilder
	}
}

/*
 * ---------------------------------------------------------------
 * ## 部门-新增
 * ---------------------------------------------------------------
 */
export class UpmDeptSaveDto {
	@AspenSummary({ summary: "部门id", rule: AspenRule() })
	deptId?: string

	@AspenSummary({ summary: "部门父id", rule: AspenRule() })
	deptParentId?: string

	@AspenSummary({ summary: "部门名", rule: AspenRule().isNotEmpty() })
	deptName: string

	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序" })
	sort?: number

	toEntity() {
		const obj = plainToInstance(UpmDeptEntity, this)
		if (_.isEmpty(obj.deptId)) obj.deptId = undefined
		if (_.isEmpty(obj.deptParentId)) obj.deptParentId = UpmDeptEntity.getRootDeptId()
		if (_.isEmpty(obj.sort)) obj.sort = 0
		return obj
	}
}

/*
 * ---------------------------------------------------------------
 * ## 部门-返回
 * ---------------------------------------------------------------
 */
export class UpmDeptVO extends UpmDeptEntity {
	@AspenSummary({ summary: "子部门总数" })
	countTotal?: SysDeptCountTotalBO
}

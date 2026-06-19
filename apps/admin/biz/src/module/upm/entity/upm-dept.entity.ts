import { Column, Entity, Index, ManyToMany, PrimaryGeneratedColumn } from "typeorm"

import { AspenSummary, BaseRecordDb } from "@aspen/aspen-fram"
import { UpmUserEntity } from "./upm-user.entity"

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

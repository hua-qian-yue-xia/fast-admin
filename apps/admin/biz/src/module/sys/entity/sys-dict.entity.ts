import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"

import { AspenRule, AspenSummary, BaseDb } from "@aspen/aspen-fram"

import { SysDictItemEntity } from "./sys-dict-item.entity"

/*
 * ---------------------------------------------------------------
 * ## 字典表
 * ---------------------------------------------------------------
 */
@Entity({ comment: "字典", name: "sys_dict" })
export class SysDictEntity extends BaseDb {
	@PrimaryGeneratedColumn("uuid", { comment: "字典id" })
	@AspenSummary({ summary: "字典id" })
	id: string

	@Column({ type: "varchar", length: 64, unique: true, comment: "字典code" })
	@AspenSummary({ summary: "字典code" })
	code: string

	@Column({ type: "varchar", length: 256, comment: "字典摘要" })
	@AspenSummary({ summary: "字典摘要" })
	summary: string

	@Column({ type: "varchar", length: 32, default: "1", comment: "字典类型(1:自动生成,2:用户创建)" })
	@AspenSummary({ summary: "字典类型", rule: AspenRule() })
	genType: string

	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序", rule: AspenRule() })
	sort: number

	@OneToMany(() => SysDictItemEntity, (dict) => dict.dict, { cascade: ["insert", "remove"] })
	dictList: SysDictItemEntity[]
}

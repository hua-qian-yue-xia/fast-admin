import { Brackets, Column, Entity, OneToMany, PrimaryGeneratedColumn, Repository } from "typeorm"
import { plainToInstance } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BaseDb, BasePage } from "@aspen/aspen-fram"

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

/*
 * ---------------------------------------------------------------
 * ## 字典-搜索
 * ---------------------------------------------------------------
 */
export class SysDictQueryDto extends BasePage {
	@AspenSummary({ summary: "字典编码/名称", rule: AspenRule() })
	quick?: string

	createQueryBuilder(repo: Repository<SysDictEntity>) {
		const query = repo.createQueryBuilder("a")
		if (!_.isEmpty(this.quick)) {
			query.where(
				new Brackets((qb) => {
					qb.where("a.code LIKE :quick", { quick: `%${this.quick}%` })
					qb.orWhere("a.summary LIKE :quick", { quick: `%${this.quick}%` })
				}),
			)
		}
		query.orderBy("a.sort", "DESC").addOrderBy("a.code", "DESC")
		return query
	}
}

/*
 * ---------------------------------------------------------------
 * ## 字典-新增
 * ---------------------------------------------------------------
 */
export class SysDictSaveDto {
	@AspenSummary({ summary: "id", rule: AspenRule() })
	id: string

	@AspenSummary({ summary: "字典编码", rule: AspenRule().isNotEmpty() })
	code: string

	@AspenSummary({ summary: "字典名称", rule: AspenRule().isNotEmpty() })
	summary: string

	@AspenSummary({ summary: "排序", rule: AspenRule() })
	sort: number

	toEntity() {
		const obj = plainToInstance(SysDictEntity, this)
		if (_.isEmpty(obj.sort)) obj.sort = 0
		return obj
	}
}

import { Brackets, Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn, Repository } from "typeorm"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BaseDb, BasePage } from "@aspen/aspen-fram"

import { SysDictEntity } from "./sys-dict.entity"
import { plainToInstance } from "class-transformer"

/*
 * ---------------------------------------------------------------
 * ## 字典项表
 * ---------------------------------------------------------------
 */
@Entity({ comment: "字典项", name: "sys_dict_item" })
export class SysDictItemEntity extends BaseDb {
	@PrimaryGeneratedColumn("uuid", { comment: "字典项code" })
	@AspenSummary({ summary: "字典项code" })
	id: string

	@ManyToOne(() => SysDictEntity, (dict) => dict.dictList, { onDelete: "CASCADE" })
	@JoinTable({ name: "dict_id" })
	dict: SysDictEntity

	@Column({ type: "char", length: 32, comment: "字典code" })
	@AspenSummary({ summary: "字典项code" })
	code: string

	@Column({ type: "varchar", length: 256, comment: "字典摘要" })
	@AspenSummary({ summary: "字典项摘要" })
	summary: string

	@Column({ type: "char", length: 32, nullable: true, comment: "字典项颜色" })
	@AspenSummary({ summary: "字典项颜色" })
	hexColor: string

	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序", rule: AspenRule() })
	sort: number
}

/*
 * ---------------------------------------------------------------
 * ## 字典项-查询
 * ---------------------------------------------------------------
 */
export class SysDictItemQueryDto extends BasePage {
	@AspenSummary({ summary: "字典项编码", rule: AspenRule() })
	code?: string

	@AspenSummary({ summary: "字典id", rule: AspenRule() })
	dictId?: string

	@AspenSummary({ summary: "字典编码、字典值", rule: AspenRule() })
	quick?: string

	createQueryBuilder(repo: Repository<SysDictItemEntity>) {
		const queryBuilder = repo.createQueryBuilder("a")
		if (!_.isEmpty(this.code)) {
			queryBuilder.andWhere("a.code = :code", { code: this.code })
		}
		if (!_.isEmpty(this.dictId)) {
			queryBuilder.andWhere("a.dict_id = :dictId", { dictId: this.dictId })
		}
		if (!_.isEmpty(this.quick)) {
			queryBuilder.andWhere(
				new Brackets((qb) =>
					qb.where(`a.summary like :quick`, { quick: `%${this.quick}%` }).orWhere(`a.code like :quick`, { quick: `%${this.quick}%` }),
				),
			)
		}
		queryBuilder.addOrderBy("a.sort", "DESC").addOrderBy("a.id", "DESC")
		return queryBuilder
	}
}

/*
 * ---------------------------------------------------------------
 * ## 字典-新增
 * ---------------------------------------------------------------
 */
export class SysDictItemSaveDto {
	@AspenSummary({ summary: "id", rule: AspenRule() })
	id: string

	@AspenSummary({ summary: "字典编码", rule: AspenRule().isNotEmpty() })
	code: string

	@AspenSummary({ summary: "字典名称", rule: AspenRule().isNotEmpty() })
	summary: string

	@AspenSummary({ summary: "字典项颜色", rule: AspenRule() })
	hexColor: string

	@AspenSummary({ summary: "排序", rule: AspenRule() })
	sort: number

	toEntity() {
		const obj = plainToInstance(SysDictItemEntity, this)
		if (_.isEmpty(obj.sort)) obj.sort = 0
		return obj
	}
}

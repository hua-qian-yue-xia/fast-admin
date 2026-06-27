import { Brackets, Column, Entity, PrimaryGeneratedColumn, Repository } from "typeorm"
import { plainToInstance } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BasePage, BaseRecordDb } from "@aspen/aspen-fram"

/*
 * ---------------------------------------------------------------
 * ## 定时任务分类表
 * ---------------------------------------------------------------
 */
@Entity({ name: "quartz_task_category", comment: "定时任务分类" })
export class QuartzTaskCategoryEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "分类id" })
	@AspenSummary({ summary: "分类id" })
	categoryId: string

	@Column({ type: "varchar", length: 64, comment: "分类名称" })
	@AspenSummary({ summary: "分类名称" })
	categoryName: string

	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序" })
	sort: number

	@Column({ type: "varchar", length: 256, nullable: true, comment: "备注" })
	@AspenSummary({ summary: "备注" })
	remark?: string
}

/*
 * ---------------------------------------------------------------
 * ## 定时任务分类-新增
 * ---------------------------------------------------------------
 */
export class QuartzTaskCategorySaveDto {
	@AspenSummary({ summary: "分类id", rule: AspenRule() })
	categoryId?: string

	@AspenSummary({ summary: "分类名称", rule: AspenRule().isNotEmpty() })
	categoryName: string

	@AspenSummary({ summary: "排序", rule: AspenRule() })
	sort?: number

	@AspenSummary({ summary: "备注", rule: AspenRule() })
	remark?: string

	toEntity() {
		const obj = plainToInstance(QuartzTaskCategoryEntity, this)
		if (_.isEmpty(obj.categoryId)) obj.categoryId = undefined
		if (obj.sort === undefined || obj.sort === null) obj.sort = 0
		if (_.isEmpty(obj.remark)) obj.remark = undefined
		return obj
	}
}

/*
 * ---------------------------------------------------------------
 * ## 定时任务分类-查询
 * ---------------------------------------------------------------
 */
export class QuartzTaskCategoryQueryDto extends BasePage {
	@AspenSummary({ summary: "分类名称", rule: AspenRule() })
	quick?: string

	createQueryBuilder(repo: Repository<QuartzTaskCategoryEntity>) {
		const query = repo.createQueryBuilder("a")
		if (!_.isEmpty(this.quick)) {
			query.andWhere(
				new Brackets((qb) => {
					qb.where("a.category_name LIKE :quick", { quick: `%${this.quick}%` })
				}),
			)
		}
		query.orderBy("a.sort", "DESC").addOrderBy("a.category_id", "DESC")
		return query
	}
}

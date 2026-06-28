import { Brackets, Column, Entity, Index, OneToMany, PrimaryGeneratedColumn, Repository } from "typeorm"
import { plainToInstance } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { BaseRecordDb, AspenSummary, comEnums, AspenRule } from "@aspen/aspen-fram"

import { SysFileEntity } from "./sys-file.entity"

/*
 * ---------------------------------------------------------------
 * ## 文件分类管理
 * ---------------------------------------------------------------
 */
@Entity({ name: "sys_file_category", comment: "文件分类管理" })
export class SysFileCategoryEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "文件分类id" })
	@AspenSummary({ summary: "文件分类id" })
	categoryId: string

	@Column({ type: "varchar", length: 64, comment: "文件分类名称" })
	@AspenSummary({ summary: "文件分类名称" })
	categoryName: string

	@Column({ type: "int", comment: "排序", default: 0 })
	@AspenSummary({ summary: "排序" })
	sort: number

	@OneToMany(() => SysFileEntity, (file) => file.category)
	fileList: Array<SysFileEntity>
}

/*
 * ---------------------------------------------------------------
 * ## 文件分类-新增
 * ---------------------------------------------------------------
 */
export class SysFileCategorySaveDto {
	@AspenSummary({ summary: "文件分类id", rule: AspenRule() })
	categoryId?: string

	@AspenSummary({ summary: "文件分类名称", rule: AspenRule().isNotEmpty() })
	categoryName: string

	@AspenSummary({ summary: "排序", rule: AspenRule() })
	sort?: number

	toEntity() {
		const obj = plainToInstance(SysFileCategoryEntity, this)
		if (_.isEmpty(obj.categoryId)) obj.categoryId = undefined
		if (_.isEmpty(obj.sort)) obj.sort = 0
		return obj
	}
}

/*
 * ---------------------------------------------------------------
 * ## 文件分类-查询
 * ---------------------------------------------------------------
 */
export class SysFileCategoryQueryDto {
	@AspenSummary({ summary: "文件分类名称", rule: AspenRule() })
	quick?: string

	createQueryBuilder(repo: Repository<SysFileCategoryEntity>) {
		const query = repo.createQueryBuilder("a")
		if (!_.isEmpty(this.quick)) {
			query.andWhere("a.category_name like :quick", { quick: `%${this.quick}%` })
		}
		query.orderBy("a.sort", "DESC").addOrderBy("a.category_id", "DESC")
		return query
	}
}

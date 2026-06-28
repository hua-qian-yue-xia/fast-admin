import { Brackets, Column, Entity, Index, OneToMany, PrimaryGeneratedColumn, Repository } from "typeorm"
import { plainToInstance } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BasePage, BaseRecordDb, comEnums } from "@aspen/aspen-fram"

import { SysFileEntity } from "./sys-file.entity"

/*
 * ---------------------------------------------------------------
 * ## 文件配置管理
 * ---------------------------------------------------------------
 */
@Entity({ name: "sys_file_config", comment: "文件配置管理" })
export class SysFileConfigEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "文件配置id" })
	@AspenSummary({ summary: "文件配置id" })
	configId: string

	@Column({ type: "varchar", length: 64, comment: "文件配置名称" })
	@AspenSummary({ summary: "文件配置名称" })
	name: string

	@Index({ unique: true })
	@Column({ type: "varchar", length: 16, comment: "存储类型" })
	@AspenSummary({ summary: "存储类型" })
	uniqueCode: string

	@Index({ unique: true })
	@Column({ type: "varchar", length: 32, comment: "存储类型" })
	@AspenSummary({ summary: "存储类型" })
	type: string

	@Column({ type: "json", comment: "文件配置", nullable: true })
	@AspenSummary({ summary: "文件配置" })
	config?: Record<string, any>

	@Column({
		type: "enum",
		enum: comEnums.bool.meta.code,
		default: comEnums.active.named.NO.raw.code,
		comment: "是否启用",
	})
	@AspenSummary({ summary: "是否启用" })
	default: string

	@Column({ type: "varchar", length: 256, comment: "文件配置描述", nullable: true })
	@AspenSummary({ summary: "文件配置描述" })
	description: string

	@OneToMany(() => SysFileEntity, (file) => file.config)
	fileList: Array<SysFileEntity>
}

/*
 * ---------------------------------------------------------------
 * ## 文件配置管理-新增
 * ---------------------------------------------------------------
 */
export class SysFileConfigSaveDto {
	@AspenSummary({ summary: "文件配置id" })
	configId?: string

	@AspenSummary({ summary: "文件配置名称" })
	name: string

	@AspenSummary({ summary: "存储类型" })
	type: string

	@AspenSummary({ summary: "文件配置" })
	config: Record<string, any>

	@AspenSummary({ summary: "是否启用" })
	default?: string

	@AspenSummary({ summary: "文件配置描述" })
	description?: string

	toEntity() {
		const obj = plainToInstance(SysFileConfigEntity, this)
		if (_.isEmpty(obj.configId)) obj.configId = undefined
		if (_.isEmpty(obj.default)) obj.default = "YES"
		return obj
	}
}

/*
 * ---------------------------------------------------------------
 * ## 文件配置管理-查询
 * ---------------------------------------------------------------
 */
export class SysFileConfigQueryDto extends BasePage {
	@AspenSummary({ summary: "配置名", rule: AspenRule() })
	quick?: string

	createQueryBuilder(repo: Repository<SysFileConfigEntity>) {
		const query = repo.createQueryBuilder("a")
		if (!_.isEmpty(this.quick)) {
			query.where(
				new Brackets((qb) => {
					qb.where("a.name LIKE :name", { name: `%${this.quick}%` })
				}),
			)
		}
		query.orderBy("a.create_at", "DESC").addOrderBy("a.config_id", "DESC")
		return query
	}
}

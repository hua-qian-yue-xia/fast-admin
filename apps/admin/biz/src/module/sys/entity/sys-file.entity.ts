import { Brackets, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Repository } from "typeorm"
import { plainToInstance } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { BaseRecordDb, AspenSummary, AspenRule, BasePage } from "@aspen/aspen-fram"

import { SysFileConfigEntity } from "./sys-file-config.entity"
import { SysFileCategoryEntity } from "./sys-file-category.entity"

/*
 * ---------------------------------------------------------------
 * ## 文件内容存储
 * ---------------------------------------------------------------
 */
@Entity({ name: "sys_file", comment: "文件配置管理" })
export class SysFileEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "文件id" })
	@AspenSummary({ summary: "文件id" })
	fileId: string

	@Column({ type: "varchar", length: 64, nullable: true, comment: "父文件id" })
	@AspenSummary({ summary: "父文件id" })
	parentFileId?: string

	@ManyToOne(() => SysFileConfigEntity, (entity) => entity.fileList)
	@JoinColumn({ name: "config_id" })
	config: SysFileConfigEntity

	@ManyToOne(() => SysFileCategoryEntity, (entity) => entity.fileList)
	@JoinColumn({ name: "category_id" })
	category?: SysFileCategoryEntity

	@Column({ type: "varchar", length: 64, comment: "文件名" })
	@AspenSummary({ summary: "文件名" })
	fileName: string

	@Index()
	@Column({ type: "varchar", length: 256, comment: "文件路径" })
	@AspenSummary({ summary: "文件路径" })
	filePath: string

	@Index()
	@Column({ type: "varchar", length: 128, comment: "文件类型" })
	@AspenSummary({ summary: "文件类型" })
	fileType: string

	@Column({ type: "int", comment: "文件大小(k)" })
	@AspenSummary({ summary: "文件大小(k)" })
	fileSize: number
}

/*
 * ---------------------------------------------------------------
 * ## 文件内容存储-新增
 * ---------------------------------------------------------------
 */
export class FrameFileSaveDto {
	@AspenSummary({ summary: "文件id" })
	fileId?: string

	@AspenSummary({ summary: "父文件id" })
	parentFileId: string

	@AspenSummary({ summary: "文件名" })
	fileName: string

	@AspenSummary({ summary: "文件路径" })
	filePath: string

	@AspenSummary({ summary: "文件完整路径" })
	fileFullPath: string

	@AspenSummary({ summary: "文件类型" })
	fileType: string

	toEntity() {
		const obj = plainToInstance(SysFileEntity, this)
		if (_.isEmpty(obj.fileId)) obj.fileId = undefined
		return obj
	}
}

/*
 * ---------------------------------------------------------------
 * ## 文件内容存储-查询
 * ---------------------------------------------------------------
 */
export class SysFileQueryDto extends BasePage {
	@AspenSummary({ summary: "文件名/文件路径/文件完整路径", rule: AspenRule() })
	quick?: string

	@AspenSummary({ summary: "分类id", rule: AspenRule() })
	categoryId?: string

	@AspenSummary({ summary: "分类id是否为空", rule: AspenRule() })
	categoryIdIsNull?: boolean

	@AspenSummary({ summary: "文件类型", rule: AspenRule() })
	fileType?: string

	createQueryBuilder(repo: Repository<SysFileEntity>) {
		const query = repo.createQueryBuilder("a").leftJoin("a.config", "c").addSelect(["c.config", "c.configId"])
		if (!_.isEmpty(this.quick)) {
			query.where(
				new Brackets((qb) => {
					qb.andWhere("a.fileName LIKE :fileName", { fileName: `%${this.quick}%` })
					qb.andWhere("a.filePath LIKE :filePath", { filePath: `%${this.quick}%` })
				}),
			)
		}
		if (!_.isEmpty(this.categoryId)) {
			query.andWhere("a.category = :categoryId", { categoryId: this.categoryId })
		}
		if (!_.isEmpty(this.categoryIdIsNull) && this.categoryIdIsNull === true) {
			query.andWhere("a.category IS NULL")
		}
		if (!_.isEmpty(this.fileType)) {
			query.andWhere("a.fileType = :fileType", { fileType: this.fileType })
		}
		query.orderBy("a.createAt", "DESC").addOrderBy("a.fileType", "DESC").addOrderBy("a.fileId", "DESC")
		return query
	}
}

/*
 * ---------------------------------------------------------------
 * ## 文件内容存储-分片文件存储
 * ---------------------------------------------------------------
 */
export class SysFileSingleUploadDto {
	@AspenSummary({ summary: "原始文件名", rule: AspenRule() })
	filename?: string
}

/*
 * ---------------------------------------------------------------
 * ## 文件内容存储-分片文件存储
 * ---------------------------------------------------------------
 */
export class SysFileChunkUploadDto {
	@AspenSummary({ summary: "文件唯一标识(MD5)", rule: AspenRule() })
	identifier: string

	@AspenSummary({ summary: "当前分片序号", rule: AspenRule() })
	chunkNumber: number

	@AspenSummary({ summary: "总分片数", rule: AspenRule() })
	totalChunks: number

	@AspenSummary({ summary: "原始文件名", rule: AspenRule() })
	filename?: string
}

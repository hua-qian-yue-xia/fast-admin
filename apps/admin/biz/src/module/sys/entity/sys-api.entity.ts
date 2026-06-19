import { Column, Entity, Index, JoinColumn, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"

import { AspenRule, AspenSummary, BaseDb, comEnums } from "@aspen/aspen-fram"

/*
 * ---------------------------------------------------------------
 * ## 接口表
 * ---------------------------------------------------------------
 */
@Entity({ comment: "接口", name: "sys_api" })
export class SysApiEntity extends BaseDb {
	@PrimaryGeneratedColumn("uuid", { comment: "接口主键" })
	@AspenSummary({ summary: "接口主键" })
	id: string

	@Column({ type: "varchar", length: 64, nullable: true, comment: "应用名称" })
	@AspenSummary({ summary: "应用名称" })
	appName?: string

	@Column({ type: "varchar", length: 256, nullable: true, comment: "应用描述" })
	@AspenSummary({ summary: "应用描述" })
	appDescription?: string

	@Column({ type: "varchar", length: 32, nullable: true, comment: "应用版本" })
	@AspenSummary({ summary: "应用版本" })
	appVersion?: string

	@Column({ type: "varchar", length: 128, nullable: true, comment: "应用前缀" })
	@AspenSummary({ summary: "应用前缀" })
	appPrefix?: string

	@Column({ type: "varchar", length: 255, comment: "接口路径" })
	@AspenSummary({ summary: "接口路径" })
	path: string

	@Column({
		type: "enum",
		enum: comEnums.httpMethod.meta.code,
		default: comEnums.httpMethod.named.GET.raw.code,
		comment: "请求方法",
	})
	@AspenSummary({ summary: "请求方法", rule: AspenRule() })
	method: string

	@OneToMany(() => SysApiTagRelEntity, (tagRel) => tagRel.api, { cascade: true })
	tagList: Array<SysApiTagRelEntity>
}

@Entity({ comment: "接口标签关系", name: "sys_api_tag_rel" })
@Index("idx_sys_api_tag_rel_api_id", ["apiId"])
@Index("idx_sys_api_tag_rel_tag", ["tag"])
@Index("uk_sys_api_tag_rel_api_id_tag", ["apiId", "tag"], { unique: true })
export class SysApiTagRelEntity extends BaseDb {
	@PrimaryGeneratedColumn("uuid", { comment: "接口标签关系主键" })
	@AspenSummary({ summary: "接口标签关系主键" })
	id: string

	@Column({ type: "char", length: 36, comment: "接口主键" })
	@AspenSummary({ summary: "接口主键" })
	apiId: string

	@ManyToOne(() => SysApiEntity, (api) => api.tagList, { onDelete: "CASCADE" })
	@JoinColumn({ name: "api_id" })
	api: SysApiEntity

	@Column({ type: "varchar", length: 32, comment: "接口标签" })
	@AspenSummary({ summary: "接口标签", rule: AspenRule() })
	tag: string
}

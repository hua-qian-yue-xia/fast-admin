import { createHash } from "node:crypto"

import { Brackets, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Repository } from "typeorm"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BaseDb, BasePage, comEnums } from "@aspen/aspen-fram"

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

	@Column({ type: "varchar", length: 255, comment: "接口hash值" })
	@AspenSummary({ summary: "接口hash值" })
	hash: string

	@OneToMany(() => SysApiTagRelEntity, (tagRel) => tagRel.api, { cascade: true })
	tagList: Array<SysApiTagRelEntity>

	generateHash(): string {
		const payload = JSON.stringify({
			appName: this.appName?.trim() ?? "",
			path: this.path?.trim() ?? "",
			method: this.method?.trim().toUpperCase() ?? "",
			tags: (this.tagList ?? [])
				.map((tag) => tag.tag?.trim())
				.filter(Boolean)
				.sort(),
		})
		return createHash("sha256").update(payload).digest("hex")
	}
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

/*
 * ---------------------------------------------------------------
 * ## 接口表-查询
 * ---------------------------------------------------------------
 */
export class SysApiQueryDto extends BasePage {
	@AspenSummary({ summary: "接口路径/应用名", rule: AspenRule() })
	quick?: string

	@AspenSummary({ summary: "请求方法", rule: AspenRule() })
	method?: string

	@AspenSummary({ summary: "接口标签", rule: AspenRule() })
	tag?: string

	createQueryBuilder(repo: Repository<SysApiEntity>) {
		const query = repo.createQueryBuilder("a").leftJoinAndSelect("a.tagList", "tag")
		if (!_.isEmpty(this.quick)) {
			query.andWhere(
				new Brackets((qb) => {
					qb.where("a.path LIKE :quick", { quick: `%${this.quick}%` })
					qb.orWhere("a.app_name LIKE :quick", { quick: `%${this.quick}%` })
				}),
			)
		}
		if (!_.isEmpty(this.method)) {
			query.andWhere("a.method = :method", { method: this.method })
		}
		if (!_.isEmpty(this.tag)) {
			query.andWhere("tag.tag = :tag", { tag: this.tag })
		}
		query.orderBy("a.path", "ASC").addOrderBy("a.method", "ASC").addOrderBy("a.id", "DESC")
		return query
	}
}

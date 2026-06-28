import { Brackets, Column, Entity, PrimaryGeneratedColumn, Repository } from "typeorm"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BasePage, BaseRecordDb } from "@aspen/aspen-fram"

/*
 * ---------------------------------------------------------------
 * ## 日志表
 * ---------------------------------------------------------------
 */
@Entity({ comment: "日志", name: "sys_log" })
export class SysLogEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "日志id" })
	logCode: string

	@Column({ type: "varchar", length: 64, comment: "日志tag" })
	tag: string

	@Column({ type: "varchar", length: 64, comment: "日志作用描述" })
	summary: string

	@Column({ type: "varchar", length: 256, nullable: true, comment: "日志作用详细描述" })
	description: string

	@Column({ type: "varchar", length: 2048, nullable: true, comment: "params请求参数" })
	reqParams: string

	@Column({ type: "varchar", length: 2048, nullable: true, comment: "body请求参数" })
	reqBody: string

	@Column({ type: "varchar", length: 2048, nullable: true, comment: "body响应参数" })
	resBody: string

	@Column({ type: "varchar", length: 128, nullable: true, comment: "错误消息" })
	errorMsg: string

	@Column({ type: "varchar", length: 2048, nullable: true, comment: "错误堆栈" })
	errorSatck: string

	@Column({ type: "int", comment: "请求耗时(毫秒)" })
	cost: number

	@Column({ type: "int", comment: "响应状态码" })
	httpCode: number

	@Column({ type: "varchar", length: 32, comment: "ip" })
	ip: string

	@Column({ type: "varchar", length: 32, nullable: true, comment: "ip解析地址" })
	ipAddress: string

	@Column({ type: "varchar", length: 128, comment: "请求uri" })
	uri: string

	@Column({ type: "varchar", length: 16, comment: "请求方法" })
	uriMethod: string
}

/*
 * ---------------------------------------------------------------
 * ## 日志表-查询
 * ---------------------------------------------------------------
 */
export class SysLogQueryDto extends BasePage {
	@AspenSummary({ summary: "日志摘要/请求uri/ip", rule: AspenRule() })
	quick?: string

	@AspenSummary({ summary: "日志tag", rule: AspenRule() })
	tag?: string

	@AspenSummary({ summary: "请求方法", rule: AspenRule() })
	uriMethod?: string

	createQueryBuilder(repo: Repository<SysLogEntity>) {
		const query = repo.createQueryBuilder("a")
		if (!_.isEmpty(this.quick)) {
			query.andWhere(
				new Brackets((qb) => {
					qb.where("a.summary LIKE :quick", { quick: `%${this.quick}%` })
					qb.orWhere("a.uri LIKE :quick", { quick: `%${this.quick}%` })
					qb.orWhere("a.ip LIKE :quick", { quick: `%${this.quick}%` })
				}),
			)
		}
		if (!_.isEmpty(this.tag)) {
			query.andWhere("a.tag = :tag", { tag: this.tag })
		}
		if (!_.isEmpty(this.uriMethod)) {
			query.andWhere("a.uri_method = :uriMethod", { uriMethod: this.uriMethod })
		}
		query.orderBy("a.create_at", "DESC").addOrderBy("a.log_code", "DESC")
		return query
	}
}

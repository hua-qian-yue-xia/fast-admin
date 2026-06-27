import { Brackets, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Repository } from "typeorm"
import { plainToInstance } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BasePage, BaseRecordDb } from "@aspen/aspen-fram"

import { quartzEnums } from "../common"
import { QuartzTaskEntity } from "./quartz-task.entity"

/*
 * ---------------------------------------------------------------
 * ## 定时任务执行记录表
 * ---------------------------------------------------------------
 */
@Entity({ name: "quartz_task_log", comment: "定时任务执行记录" })
export class QuartzTaskLogEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "执行记录id" })
	@AspenSummary({ summary: "执行记录id" })
	logId: string

	@Index()
	@Column({ type: "varchar", length: 64, comment: "任务id" })
	@AspenSummary({ summary: "任务id" })
	taskId: string

	@ManyToOne(() => QuartzTaskEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "task_id" })
	task: QuartzTaskEntity

	@Index()
	@Column({ type: "varchar", length: 64, nullable: true, comment: "队列任务id" })
	@AspenSummary({ summary: "队列任务id" })
	jobId?: string

	@Column({
		type: "enum",
		enum: quartzEnums.triggerType.meta.code,
		comment: "触发类型(MANUAL/CRON/INTERVAL/DELAY/RETRY)",
	})
	@AspenSummary({ summary: "触发类型" })
	triggerType: string

	@Index()
	@Column({ type: "datetime", comment: "触发时间" })
	@AspenSummary({ summary: "触发时间" })
	triggerAt: Date

	@Column({ type: "datetime", nullable: true, comment: "开始执行时间" })
	@AspenSummary({ summary: "开始执行时间" })
	startAt?: Date

	@Column({ type: "datetime", nullable: true, comment: "执行结束时间" })
	@AspenSummary({ summary: "执行结束时间" })
	endAt?: Date

	@Column({ type: "int", nullable: true, comment: "执行耗时(毫秒)" })
	@AspenSummary({ summary: "执行耗时(毫秒)" })
	duration?: number

	@Index()
	@Column({
		type: "enum",
		enum: quartzEnums.taskStatus.meta.code,
		comment: "执行状态",
	})
	@AspenSummary({ summary: "执行状态" })
	status: string

	@Column({ type: "varchar", length: 64, nullable: true, comment: "执行节点" })
	@AspenSummary({ summary: "执行节点" })
	executeNode?: string

	@Column({ type: "json", nullable: true, comment: "请求参数" })
	@AspenSummary({ summary: "请求参数" })
	requestPayload?: Record<string, any>

	@Column({ type: "json", nullable: true, comment: "响应结果" })
	@AspenSummary({ summary: "响应结果" })
	responsePayload?: Record<string, any>

	@Column({ type: "varchar", length: 256, nullable: true, comment: "执行消息" })
	@AspenSummary({ summary: "执行消息" })
	message?: string

	@Column({ type: "text", nullable: true, comment: "异常堆栈" })
	@AspenSummary({ summary: "异常堆栈" })
	errorStack?: string

	@Column({ type: "int", default: 0, comment: "当前重试序号" })
	@AspenSummary({ summary: "当前重试序号" })
	retryIndex: number
}

/*
 * ---------------------------------------------------------------
 * ## 定时任务执行记录-查询
 * ---------------------------------------------------------------
 */
export class QuartzTaskLogQueryDto extends BasePage {
	@AspenSummary({ summary: "任务id", rule: AspenRule() })
	taskId?: string

	@AspenSummary({ summary: "执行状态", rule: AspenRule() })
	status?: string

	@AspenSummary({ summary: "触发类型", rule: AspenRule() })
	triggerType?: string

	@AspenSummary({ summary: "执行消息/异常堆栈", rule: AspenRule() })
	quick?: string

	@AspenSummary({ summary: "开始时间", rule: AspenRule() })
	startDate?: string

	@AspenSummary({ summary: "结束时间", rule: AspenRule() })
	endDate?: string

	createQueryBuilder(repo: Repository<QuartzTaskLogEntity>) {
		const query = repo.createQueryBuilder("a").leftJoinAndSelect("a.task", "t")
		if (!_.isEmpty(this.taskId)) {
			query.andWhere("a.task_id = :taskId", { taskId: this.taskId })
		}
		if (!_.isEmpty(this.status)) {
			query.andWhere("a.status = :status", { status: this.status })
		}
		if (!_.isEmpty(this.triggerType)) {
			query.andWhere("a.trigger_type = :triggerType", { triggerType: this.triggerType })
		}
		if (!_.isEmpty(this.quick)) {
			query.andWhere(
				new Brackets((qb) => {
					qb.where("a.message LIKE :quick", { quick: `%${this.quick}%` })
					qb.orWhere("a.error_stack LIKE :quick", { quick: `%${this.quick}%` })
				}),
			)
		}
		if (!_.isEmpty(this.startDate)) {
			query.andWhere("a.trigger_at >= :startDate", { startDate: this.startDate })
		}
		if (!_.isEmpty(this.endDate)) {
			query.andWhere("a.trigger_at <= :endDate", { endDate: this.endDate })
		}
		query.orderBy("a.trigger_at", "DESC").addOrderBy("a.log_id", "DESC")
		return query
	}
}

/*
 * ---------------------------------------------------------------
 * ## 定时任务执行记录-新增
 * ---------------------------------------------------------------
 */
export class QuartzTaskLogSaveDto {
	@AspenSummary({ summary: "任务id", rule: AspenRule().isNotEmpty() })
	taskId: string

	@AspenSummary({ summary: "队列任务id", rule: AspenRule() })
	jobId?: string

	@AspenSummary({ summary: "触发类型", rule: AspenRule().isNotEmpty() })
	triggerType: string

	@AspenSummary({ summary: "触发时间", rule: AspenRule().isNotEmpty() })
	triggerAt: Date

	@AspenSummary({ summary: "开始执行时间", rule: AspenRule() })
	startAt?: Date

	@AspenSummary({ summary: "执行结束时间", rule: AspenRule() })
	endAt?: Date

	@AspenSummary({ summary: "执行耗时(毫秒)", rule: AspenRule() })
	duration?: number

	@AspenSummary({ summary: "执行状态", rule: AspenRule().isNotEmpty() })
	status: string

	@AspenSummary({ summary: "执行节点", rule: AspenRule() })
	executeNode?: string

	@AspenSummary({ summary: "请求参数", rule: AspenRule() })
	requestPayload?: Record<string, any>

	@AspenSummary({ summary: "响应结果", rule: AspenRule() })
	responsePayload?: Record<string, any>

	@AspenSummary({ summary: "执行消息", rule: AspenRule() })
	message?: string

	@AspenSummary({ summary: "异常堆栈", rule: AspenRule() })
	errorStack?: string

	@AspenSummary({ summary: "当前重试序号", rule: AspenRule() })
	retryIndex?: number

	toEntity() {
		const obj = plainToInstance(QuartzTaskLogEntity, this)
		if (_.isEmpty(obj.jobId)) obj.jobId = undefined
		if (_.isEmpty(obj.executeNode)) obj.executeNode = undefined
		if (_.isEmpty(obj.message)) obj.message = undefined
		if (_.isEmpty(obj.errorStack)) obj.errorStack = undefined
		if (obj.retryIndex === undefined || obj.retryIndex === null) obj.retryIndex = 0
		return obj
	}
}

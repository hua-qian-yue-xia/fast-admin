import { Brackets, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Repository } from "typeorm"
import { plainToInstance } from "class-transformer"
import * as _ from "es-toolkit/compat"

import { AspenRule, AspenSummary, BasePage, BaseRecordDb } from "@aspen/aspen-fram"

import { quartzEnums } from "../common"
import { QuartzTaskCategoryEntity } from "./quartz-task-category.entity"

/*
 * ---------------------------------------------------------------
 * ## 定时任务表
 * ---------------------------------------------------------------
 */
@Entity({ name: "quartz_task", comment: "定时任务" })
export class QuartzTaskEntity extends BaseRecordDb {
	@PrimaryGeneratedColumn("uuid", { comment: "任务id" })
	@AspenSummary({ summary: "任务id" })
	taskId: string

	@Index()
	@Column({ type: "varchar", length: 64, nullable: true, comment: "分类id" })
	@AspenSummary({ summary: "分类id" })
	categoryId?: string

	@ManyToOne(() => QuartzTaskCategoryEntity, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn({ name: "category_id" })
	category?: QuartzTaskCategoryEntity

	@Column({ type: "varchar", length: 64, comment: "任务名称" })
	@AspenSummary({ summary: "任务名称" })
	taskName: string

	@Index({ unique: true })
	@Column({ type: "varchar", length: 64, comment: "任务编码" })
	@AspenSummary({ summary: "任务编码" })
	taskCode: string

	@Column({ type: "varchar", length: 128, comment: "执行器标识" })
	@AspenSummary({ summary: "执行器标识" })
	handlerName: string

	@Column({ type: "json", nullable: true, comment: "执行器参数" })
	@AspenSummary({ summary: "执行器参数" })
	handlerParams?: Record<string, any>

	@Column({
		type: "enum",
		enum: quartzEnums.scheduleType.meta.code,
		default: quartzEnums.scheduleType.named.CRON.raw.code,
		comment: "调度类型(CRON/INTERVAL/DELAY)",
	})
	@AspenSummary({ summary: "调度类型" })
	scheduleType: string

	@Index()
	@Column({ type: "varchar", length: 64, nullable: true, comment: "cron表达式" })
	@AspenSummary({ summary: "cron表达式" })
	cronExpression?: string

	@Column({ type: "int", nullable: true, comment: "固定间隔(毫秒)" })
	@AspenSummary({ summary: "固定间隔(毫秒)" })
	repeatEvery?: number

	@Column({ type: "int", nullable: true, comment: "延迟时间(毫秒)" })
	@AspenSummary({ summary: "延迟时间(毫秒)" })
	delayMs?: number

	@Column({ type: "int", default: 0, comment: "最大重试次数" })
	@AspenSummary({ summary: "最大重试次数" })
	retryCount: number

	@Column({ type: "int", default: 0, comment: "重试间隔(毫秒)" })
	@AspenSummary({ summary: "重试间隔(毫秒)" })
	retryInterval: number

	@Column({ type: "int", nullable: true, comment: "超时时间(毫秒)" })
	@AspenSummary({ summary: "超时时间(毫秒)" })
	timeoutMs?: number

	@Column({ type: "bit", default: false, comment: "是否允许并发执行" })
	@AspenSummary({ summary: "是否允许并发执行" })
	allowConcurrent: boolean

	@Column({ type: "bit", default: false, comment: "创建后是否立即执行一次" })
	@AspenSummary({ summary: "创建后是否立即执行一次" })
	runOnCreate: boolean

	@Column({ type: "bit", default: true, comment: "是否启用" })
	@AspenSummary({ summary: "是否启用" })
	enable: boolean

	@Column({ type: "int", default: 0, comment: "排序" })
	@AspenSummary({ summary: "排序" })
	sort: number

	@Index()
	@Column({ type: "datetime", nullable: true, comment: "下次执行时间" })
	@AspenSummary({ summary: "下次执行时间" })
	nextTriggerAt?: Date

	@Column({ type: "datetime", nullable: true, comment: "最近执行时间" })
	@AspenSummary({ summary: "最近执行时间" })
	lastTriggerAt?: Date

	@Column({ type: "datetime", nullable: true, comment: "最近成功时间" })
	@AspenSummary({ summary: "最近成功时间" })
	lastSuccessAt?: Date

	@Column({ type: "datetime", nullable: true, comment: "最近失败时间" })
	@AspenSummary({ summary: "最近失败时间" })
	lastFailAt?: Date

	@Column({
		type: "enum",
		enum: quartzEnums.taskStatus.meta.code,
		nullable: true,
		comment: "最近执行状态",
	})
	@AspenSummary({ summary: "最近执行状态" })
	lastStatus?: string

	@Column({ type: "varchar", length: 256, nullable: true, comment: "备注" })
	@AspenSummary({ summary: "备注" })
	remark?: string
}

/*
 * ---------------------------------------------------------------
 * ## 定时任务-查询
 * ---------------------------------------------------------------
 */
export class QuartzTaskQueryDto extends BasePage {
	@AspenSummary({ summary: "任务id", rule: AspenRule() })
	taskId?: string

	@AspenSummary({ summary: "分类id", rule: AspenRule() })
	categoryId?: string

	@AspenSummary({ summary: "任务名称/任务编码/执行器标识", rule: AspenRule() })
	quick?: string

	@AspenSummary({ summary: "调度类型", rule: AspenRule() })
	scheduleType?: string

	@AspenSummary({ summary: "最近执行状态", rule: AspenRule() })
	lastStatus?: string

	@AspenSummary({ summary: "是否启用", rule: AspenRule() })
	enable?: boolean

	createQueryBuilder(repo: Repository<QuartzTaskEntity>) {
		const query = repo.createQueryBuilder("a").leftJoinAndSelect("a.category", "c")
		if (!_.isEmpty(this.taskId)) {
			query.andWhere("a.task_id = :taskId", { taskId: this.taskId })
		}
		if (!_.isEmpty(this.categoryId)) {
			query.andWhere("a.category_id = :categoryId", { categoryId: this.categoryId })
		}
		if (!_.isEmpty(this.quick)) {
			query.andWhere(
				new Brackets((qb) => {
					qb.where("a.task_name LIKE :quick", { quick: `%${this.quick}%` })
					qb.orWhere("a.task_code LIKE :quick", { quick: `%${this.quick}%` })
					qb.orWhere("a.handler_name LIKE :quick", { quick: `%${this.quick}%` })
				}),
			)
		}
		if (!_.isEmpty(this.scheduleType)) {
			query.andWhere("a.schedule_type = :scheduleType", { scheduleType: this.scheduleType })
		}
		if (!_.isEmpty(this.lastStatus)) {
			query.andWhere("a.last_status = :lastStatus", { lastStatus: this.lastStatus })
		}
		if (this.enable !== undefined && this.enable !== null) {
			query.andWhere("a.enable = :enable", { enable: this.enable })
		}
		query.orderBy("a.sort", "DESC").addOrderBy("a.task_id", "DESC")
		return query
	}
}

/*
 * ---------------------------------------------------------------
 * ## 定时任务-新增
 * ---------------------------------------------------------------
 */
export class QuartzTaskSaveDto {
	@AspenSummary({ summary: "任务id", rule: AspenRule() })
	taskId?: string

	@AspenSummary({ summary: "分类id", rule: AspenRule() })
	categoryId?: string

	@AspenSummary({ summary: "任务名称", rule: AspenRule().isNotEmpty() })
	taskName: string

	@AspenSummary({ summary: "任务编码", rule: AspenRule().isNotEmpty() })
	taskCode: string

	@AspenSummary({ summary: "执行器标识", rule: AspenRule().isNotEmpty() })
	handlerName: string

	@AspenSummary({ summary: "执行器参数", rule: AspenRule() })
	handlerParams?: Record<string, any>

	@AspenSummary({ summary: "调度类型", rule: AspenRule().isNotEmpty() })
	scheduleType: string

	@AspenSummary({ summary: "cron表达式", rule: AspenRule() })
	cronExpression?: string

	@AspenSummary({ summary: "固定间隔(毫秒)", rule: AspenRule() })
	repeatEvery?: number

	@AspenSummary({ summary: "延迟时间(毫秒)", rule: AspenRule() })
	delayMs?: number

	@AspenSummary({ summary: "最大重试次数", rule: AspenRule() })
	retryCount?: number

	@AspenSummary({ summary: "重试间隔(毫秒)", rule: AspenRule() })
	retryInterval?: number

	@AspenSummary({ summary: "超时时间(毫秒)", rule: AspenRule() })
	timeoutMs?: number

	@AspenSummary({ summary: "是否允许并发执行", rule: AspenRule() })
	allowConcurrent?: boolean

	@AspenSummary({ summary: "创建后是否立即执行一次", rule: AspenRule() })
	runOnCreate?: boolean

	@AspenSummary({ summary: "是否启用", rule: AspenRule() })
	enable?: boolean

	@AspenSummary({ summary: "排序", rule: AspenRule() })
	sort?: number

	@AspenSummary({ summary: "备注", rule: AspenRule() })
	remark?: string

	toEntity() {
		const obj = plainToInstance(QuartzTaskEntity, this)
		if (_.isEmpty(obj.taskId)) obj.taskId = undefined
		if (_.isEmpty(obj.categoryId)) obj.categoryId = undefined
		if (_.isEmpty(obj.cronExpression)) obj.cronExpression = undefined
		if (_.isEmpty(obj.remark)) obj.remark = undefined
		if (obj.retryCount === undefined || obj.retryCount === null) obj.retryCount = 0
		if (obj.retryInterval === undefined || obj.retryInterval === null) obj.retryInterval = 0
		if (obj.allowConcurrent === undefined || obj.allowConcurrent === null) obj.allowConcurrent = false
		if (obj.runOnCreate === undefined || obj.runOnCreate === null) obj.runOnCreate = false
		if (obj.enable === undefined || obj.enable === null) obj.enable = true
		if (obj.sort === undefined || obj.sort === null) obj.sort = 0
		return obj
	}
}

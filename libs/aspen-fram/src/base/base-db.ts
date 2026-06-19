import { BaseEntity, BeforeInsert, BeforeRemove, BeforeSoftRemove, BeforeUpdate, Column, DeleteDateColumn, Index } from "typeorm"
import { Exclude, instanceToPlain, plainToClass } from "class-transformer"
import * as bcrypt from "bcrypt"

import { AspenSummary } from "../decorator/summary/summary-decorator"

export abstract class BaseDb extends BaseEntity {}

export class BaseRecordDb extends BaseDb {
	@Column({ type: "varchar", length: 64, comment: "新增人" })
	@AspenSummary({ summary: "新增人" })
	@Exclude()
	createBy: string

	@Index()
	@Column({ type: "datetime", comment: "新增时间" })
	@AspenSummary({ summary: "新增时间" })
	createAt: Date

	@Column({ type: "varchar", length: 64, nullable: true, comment: "修改人" })
	@AspenSummary({ summary: "修改人" })
	@Exclude()
	updateBy: string

	@Column({ type: "datetime", nullable: true, comment: "修改时间" })
	@AspenSummary({ summary: "修改时间" })
	@Exclude()
	updateAt: Date

	@Index()
	@Column({ type: "varchar", length: 64, nullable: true, comment: "删除人" })
	@AspenSummary({ summary: "删除人" })
	@Exclude()
	delBy: string

	@DeleteDateColumn({ type: "datetime", nullable: true, comment: "删除时间" })
	@AspenSummary({ summary: "删除时间" })
	@Exclude()
	delAt: Date

	@BeforeInsert()
	async BeforeInsert() {}

	@BeforeUpdate()
	async beforeUpdate() {}

	@BeforeSoftRemove()
	async beforeSoftRemove() {}

	@BeforeRemove()
	async beforeRemove() {}
}

export class BaseUserDb extends BaseRecordDb {
	// 用户id
	userId: string

	// 登录名
	username: string

	// 用户昵称
	userNickname: string

	// 用户密码
	password: string

	// 用户手机号
	mobile: string

	// 是否启用
	enable: boolean

	/**
	 * 将对象转换为BaseUser类
	 */
	static toClass(obj: Record<string, any>): BaseUserDb {
		return plainToClass(BaseUserDb, obj)
	}

	/**
	 * 是否是超级管理员
	 */
	isSuperAdmin(): boolean {
		return false
	}

	/**
	 * 是否启用
	 */
	isEnable(): boolean {
		return this.enable
	}

	/**
	 * 密码是否正确
	 */
	checkPassword(password: string): boolean {
		return bcrypt.compareSync(password, this.password)
	}

	/**
	 * 密码加密
	 */
	encryptPassword(password: string, rounds = 12): string {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(rounds))
	}

	toObj() {
		return instanceToPlain(this)
	}
}

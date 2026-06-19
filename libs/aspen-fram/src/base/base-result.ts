import { ApiProperty } from "@nestjs/swagger"

import { HttpCodeEnum } from "../constant"

/**
 * 响应结果
 */
export class R<T> {
	@ApiProperty({
		description: "状态码",
	})
	private code: HttpCodeEnum

	@ApiProperty({
		description: "状态描述",
	})
	private msg: string

	@ApiProperty({
		description: "数据",
	})
	private data: T

	constructor(code: HttpCodeEnum, msg: string, data: T) {
		this.code = code
		this.msg = msg
		this.data = data
	}

	/**
	 * 成功
	 */
	static success(): R<null>
	static success<T>(msg: string): R<T>
	static success<T>(data: T): R<T>
	static success<T>(data?: T, msg?: string): R<T> | R<null> {
		if (msg != undefined && typeof msg == "string" && data == undefined) {
			return new R<null>(HttpCodeEnum.SUCCESS, msg, null)
		}
		if (data != undefined && msg == undefined) {
			return new R<T>(HttpCodeEnum.SUCCESS, "操作成功", data)
		}
		return new R<T>(HttpCodeEnum.SUCCESS, msg, data)
	}

	/**
	 * 失败
	 */
	static fail<T>({ code = HttpCodeEnum.ERROR, msg = "操作失败", data = null }): R<T> | R<null> {
		return new R<T>(code, msg, data)
	}

	/**
	 * 警告
	 */
	static warn<T>(msg: string): R<T>
	static warn<T>(msg: string, data?: T): R<T> | R<null> {
		if (data == undefined) {
			return new R<T>(HttpCodeEnum.WARN, msg, null)
		}
		return new R<T>(HttpCodeEnum.ERROR, msg, data)
	}

	static isSuccess(result: R<any>): boolean {
		return result.code == HttpCodeEnum.SUCCESS
	}

	static isFail(result: R<any>): boolean {
		return !this.isSuccess(result)
	}
}

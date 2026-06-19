import { ApiProperty } from "@nestjs/swagger"
import { FastifyRequest } from "fastify"

export interface BasePageOptions {
	page: number
	pageSize: number
}

export class BasePage implements BasePageOptions {
	static DEFAULT_PAGE: number = 1
	static DEFAULT_PAGE_SIZE: number = 10

	static MAX_PAGE_SIZE: number = 100

	/**
	 * 当前页码
	 */
	@ApiProperty({
		description: "当前页码",
		default: BasePage.DEFAULT_PAGE,
	})
	page: number = BasePage.DEFAULT_PAGE

	/**
	 * 分页大小
	 */
	@ApiProperty({
		description: "分页大小",
		default: BasePage.DEFAULT_PAGE_SIZE,
	})
	pageSize: number = BasePage.DEFAULT_PAGE_SIZE

	getSimplePageObj(): BasePageOptions {
		return {
			page: this.page,
			pageSize: this.pageSize,
		}
	}
}

export class BasePageVo<T> extends BasePage {
	/**
	 * 总页数
	 */
	@ApiProperty({
		description: "总页数",
		default: 0,
	})
	totalPage: number = 0
	/**
	 * 总记录数
	 */
	@ApiProperty({
		description: "总记录数",
		default: 0,
	})
	totalRecord: number = 0
	/**
	 * 数据列表
	 */
	records: Array<T> = []
}

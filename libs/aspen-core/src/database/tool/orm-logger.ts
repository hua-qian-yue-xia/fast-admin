import type { Logger as WinstonLogger } from "winston"

import type { Logger, QueryRunner } from "typeorm"

import { SimpleTool } from "../tool/log-tool"

export class OrmLogger implements Logger {
	constructor(private readonly w: WinstonLogger) {}

	private toSqlValue(val: any): string {
		if (val === null || val === undefined) return "NULL"
		if (Array.isArray(val)) return `(${val.map((v) => this.toSqlValue(v)).join(", ")})`
		if (typeof val === "number" || typeof val === "bigint") return String(val)
		if (typeof val === "boolean") return val ? "TRUE" : "FALSE"
		if (val instanceof Date) {
			const d = val as Date
			const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
			const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
				d.getMinutes(),
			)}:${pad(d.getSeconds())}`
			return `'${ts}'`
		}
		if (Buffer.isBuffer(val)) return `X'${(val as Buffer).toString("hex")}'`
		const s = typeof val === "string" ? val : JSON.stringify(val)
		return `'${s.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`
	}

	private interpolateSql(query: string, parameters?: Array<any>): string {
		if (!parameters || parameters.length === 0) return query
		// PostgreSQL 风格:$1,$2,...
		if (/\$\d+/.test(query)) {
			return query.replace(/\$(\d+)/g, (_m, i) => {
				const idx = Number(i) - 1
				return this.toSqlValue(parameters[idx])
			})
		}
		// MySQL/SQLite风格:?
		let p = 0
		return query.replace(/\?/g, () => {
			if (!parameters || p >= parameters.length) return "?"
			return this.toSqlValue(parameters[p++])
		})
	}

	private lineFeedStr(
		title: string,
		color: keyof typeof SimpleTool.colors,
		sql: string,
		parameters?: Array<any>,
		ext?: { error?: string; time?: number },
	) {
		const simpleTool = new SimpleTool(title).addContent("SQL", sql)
		if (ext?.error) {
			simpleTool.addContent("错误信息", ext.error)
		}
		if (ext?.time) {
			simpleTool.addContent("执行时间", `${ext.time}ms`)
		}
		if (parameters) {
			simpleTool.addContent("参数", parameters.map((v) => this.toSqlValue(v)).join(","))
		}
		return simpleTool.message(color)
	}

	// 记录执行的 SQL 语句(开发调试用,生产可按需关闭或降低级别)
	logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
		const sql = this.interpolateSql(query, parameters)
		this.w.debug(this.lineFeedStr("SQL", "green", sql, parameters))
	}
	// 记录 SQL 错误(包含语句与参数),便于快速定位问题
	logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
		const sql = this.interpolateSql(query, parameters)
		this.w.error(this.lineFeedStr("ERROR SQL", "red", sql, parameters, { error: String(error) }))
	}
	// 记录慢查询(开发调试用,生产可按需关闭或降低级别)
	logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
		const sql = this.interpolateSql(query, parameters)
		this.w.warn(this.lineFeedStr("SLOW SQL", "yellow", sql, parameters, { time: time }))
	}
	// 记录数据库模式构建日志(开发调试用,生产可按需关闭或降低级别)
	logSchemaBuild(message: string, queryRunner?: QueryRunner) {
		this.w.info(this.lineFeedStr("SCHEMA BUILD LOGGER", "cyan", message))
	}
	// 记录数据库迁移日志(开发调试用,生产可按需关闭或降低级别)
	logMigration(message: string, queryRunner?: QueryRunner) {
		this.w.info(this.lineFeedStr("MIGRATION LOGGER", "cyan", message))
	}
	log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner) {
		if (level === "warn") {
			this.w.warn(message)
		} else {
			this.w.info(message)
		}
	}
}

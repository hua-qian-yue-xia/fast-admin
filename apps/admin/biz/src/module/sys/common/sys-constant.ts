import { KeyTool } from "@aspen/aspen-core"
import { AbstractEnumGroup, gen } from "@aspen/aspen-fram"
/**
 * 系统模块统一 key 常量入口.
 */
export const SYS_CONSTANT = {
	sys: {
		root: new KeyTool("sys"),
		dict: new KeyTool("sys", "dict"),
		api: new KeyTool("sys", "api"),
		log: new KeyTool("sys", "log"),
		file: new KeyTool("sys", "file"),
	},
} as const

/*
 * ---------------------------------------------------------------
 * ## 文件相关枚举
 * ---------------------------------------------------------------
 */
@gen.dictGroup({
	key: "sys_file",
	summary: "文件类型",
})
export class SysFileEnum extends AbstractEnumGroup {
	readonly catalogueType = this.create("catalogue_type", "文件配置类型", {
		MINIO: {
			code: "root",
			summary: "根目录",
		},
		FILE: {
			code: "cwd",
			summary: "当前目录",
		},
	})
	readonly configType = this.create("config_type", "文件配置类型", {
		MINIO: {
			code: "100",
			summary: "MinIO",
		},
		FILE: {
			code: "200",
			summary: "服务器存储",
		},
	})
}

export const sysFileEnum = new SysFileEnum()

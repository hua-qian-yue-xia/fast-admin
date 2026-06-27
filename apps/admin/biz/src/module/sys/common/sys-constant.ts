import { KeyTool } from "libs/aspen-core/src/tool"

/**
 * 系统模块统一 key 常量入口。
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

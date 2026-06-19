import { Enum } from "enum-plus"

interface IEnumGroup {
	list: Array<{
		code: string
		summary: string
		enum: ReturnType<typeof Enum>
	}>
}

export abstract class AbstractEnumGroup implements IEnumGroup {
	list: Array<{
		code: string
		summary: string
		enum: ReturnType<typeof Enum>
	}> = []

	/**
	 * 创建并注册枚举
	 * @param key 枚举的唯一标识
	 * @param defs 枚举定义
	 */
	protected create<const T extends Record<string, { code: string; summary: string }>>(key: string, summary: string, defs: T) {
		// 使用 enum-plus 创建枚举
		const enumObj = Enum(defs)
		// 触发监听并保存
		this.listen(key, summary, enumObj)
		return enumObj
	}

	/**
	 * 监听枚举创建事件
	 */
	private listen(key: string, summary: string, enumObj: any) {
		this.list.push({
			code: key,
			summary,
			enum: enumObj,
		})
	}
}

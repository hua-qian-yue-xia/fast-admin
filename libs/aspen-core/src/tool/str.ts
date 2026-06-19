export abstract class StrTool {
	// 日志字段过长时保留头尾信息,中间用省略号压缩,避免字符串过长
	static truncateMiddle(value: string | undefined, maxLength = 2000): string | undefined {
		if (!value || value.length <= maxLength) {
			return value
		}
		const omission = "..."
		const keepLength = maxLength - omission.length
		const headLength = Math.ceil(keepLength / 2)
		const tailLength = Math.floor(keepLength / 2)
		return `${value.slice(0, headLength)}${omission}${value.slice(value.length - tailLength)}`
	}
}

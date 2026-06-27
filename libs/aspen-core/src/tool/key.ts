/**
 * key 片段，仅允许基础可序列化值参与拼接。
 */
type KeySegment = string | number

/**
 * 清洗 key 片段，统一转成字符串并移除空值。
 */
const normalizeSegments = (segments: Array<KeySegment>): Array<string> => {
	return segments.map((segment) => String(segment).trim()).filter(Boolean)
}

/**
 * Redis key 构造工具。
 * 统一使用冒号分隔，避免各处手写字符串。
 * 例如：new KeyTool("sys", "dict").redis("item", 1) => "sys:dict:item:1"
 */
export class KeyTool {
	private readonly segments: Array<string>

	constructor(...segments: Array<KeySegment>) {
		this.segments = normalizeSegments(segments)
	}

	/**
	 * 基于当前命名空间继续向下拼接子节点。
	 * 例如：new KeyTool("sys").child("dict").redis() => "sys:dict"
	 */
	child(...segments: Array<KeySegment>): KeyTool {
		return new KeyTool(...this.segments, ...segments)
	}

	/**
	 * 获取当前完整 key 片段数组。
	 * 例如：new KeyTool("sys", "dict").parts("item", 1) => ["sys", "dict", "item", "1"]
	 */
	parts(...segments: Array<KeySegment>): Array<string> {
		return normalizeSegments([...this.segments, ...segments])
	}

	/**
	 * 生成精确 Redis key，例如：sys:dict:item:1
	 * 例如：new KeyTool("sys", "dict").redis("item", 1) => "sys:dict:item:1"
	 */
	redis(...segments: Array<KeySegment>): string {
		return this.parts(...segments).join(":")
	}

	/**
	 * 生成 Redis 通配 key，例如：sys:dict:item:*
	 * 例如：new KeyTool("sys", "dict").redisAll("item") => "sys:dict:item:*"
	 */
	redisAll(...segments: Array<KeySegment>): string {
		return `${this.redis(...segments)}:*`
	}

	/**
	 * 返回当前命名空间下常用的全部 Redis key。
	 * 第一个为精确 key，第二个为通配 key。
	 * 例如：new KeyTool("sys", "dict").all("item") => ["sys:dict:item", "sys:dict:item:*"]
	 */
	all(...segments: Array<KeySegment>): Array<string> {
		return [this.redis(...segments), this.redisAll(...segments)]
	}
}

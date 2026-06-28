import { randomInt, randomUUID } from "node:crypto"

/**
 * 随机字符串生成选项.
 */
export interface RandomStringOptions {
	/**
	 * 目标字符串长度.
	 * 必须为大于 0 的整数.
	 *
	 * @default 8
	 */
	length?: number

	/**
	 * 自定义字符集.
	 * 例如:`ABC123`,`abcdef`,`0123456789`
	 *
	 * 注意:
	 * - 会自动去重,避免字符重复导致概率分布失衡;
	 * - 去重后若为空,会抛出异常.
	 */
	charset?: string

	/**
	 * 生成结果前缀.
	 * 常用于文件名,业务编号,缓存 key 前缀等场景.
	 */
	prefix?: string

	/**
	 * 当前缀存在时,前缀与随机串之间使用的分隔符.
	 *
	 * @default ""
	 */
	separator?: string
}

/**
 * 随机工具类.
 *
 * 设计目标:
 * 1. 补齐 `es-toolkit` 不直接提供的"随机字符串 / token / 安全字符集"能力;
 * 2. 底层统一使用 Node.js 原生 `crypto`,避免 `Math.random()` 在服务端场景下随机性不足;
 * 3. 提供一组常用字符集预设,减少业务层重复定义魔法字符串.
 *
 * 适用场景:
 * - 文件临时名;
 * - 下载码,分享码,验证码;
 * - 业务前缀 + 随机后缀的 token;
 * - 不要求全局 UUID,但要求足够离散的短字符串标识.
 *
 * 不建议用它做什么:
 * - 密码学协议中的密钥材料;
 * - 需要强约束格式的雪花 ID,数据库主键;
 * - 必须全局唯一且可追踪来源的业务流水号.
 */
export abstract class RandomTool {
	/**
	 * 数字字符集.
	 *
	 * 示例:
	 * ```ts
	 * RandomTool.string({ length: 6, charset: RandomTool.NUMERIC })
	 * // => "483920"
	 * ```
	 */
	static readonly NUMERIC = "0123456789"

	/**
	 * 小写字母字符集.
	 */
	static readonly LOWERCASE = "abcdefghijklmnopqrstuvwxyz"

	/**
	 * 大写字母字符集.
	 */
	static readonly UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

	/**
	 * 大小写字母字符集.
	 */
	static readonly ALPHA = `${RandomTool.LOWERCASE}${RandomTool.UPPERCASE}`

	/**
	 * 字母 + 数字字符集.
	 */
	static readonly ALPHANUMERIC = `${RandomTool.ALPHA}${RandomTool.NUMERIC}`

	/**
	 * 适合对外展示的安全字符集.
	 *
	 * 特点:
	 * - 去掉了容易混淆的字符,如 `0 / O / I / l / 1`;
	 * - 更适合生成短链接码,口令码,人工录入码.
	 *
	 * 示例:
	 * ```ts
	 * RandomTool.string({ length: 8, charset: RandomTool.SAFE })
	 * // => "a8K2mP9X"
	 * ```
	 */
	static readonly SAFE = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"

	/**
	 * URL / 文件名友好的字符集.
	 *
	 * 适合:
	 * - 临时文件后缀;
	 * - 对外暴露的短 token;
	 * - URL path 片段.
	 */
	static readonly URL_SAFE = `${RandomTool.LOWERCASE}${RandomTool.UPPERCASE}${RandomTool.NUMERIC}-_`

	/**
	 * 生成 RFC 4122 v4 UUID.
	 *
	 * 示例:
	 * ```ts
	 * const id = RandomTool.uuid()
	 * // => "4e2d91e4-0d0a-4524-9083-36a1e71db95e"
	 * ```
	 */
	static uuid(): string {
		return randomUUID()
	}

	/**
	 * 生成指定范围内的随机整数,区间为闭区间 `[min, max]`.
	 *
	 * 示例:
	 * ```ts
	 * const code = RandomTool.int(100000, 999999)
	 * // => 6 位随机数字验证码
	 * ```
	 */
	static int(min: number, max: number): number {
		RandomTool.assertSafeInteger("min", min)
		RandomTool.assertSafeInteger("max", max)
		if (min > max) {
			throw new RangeError(`RandomTool.int() 要求 min <= max,当前收到 min=${min}, max=${max}`)
		}
		return randomInt(min, max + 1)
	}

	/**
	 * 从数组中随机取出一个元素.
	 *
	 * 与 `es-toolkit` 的 `sample` 不同,这里统一放在 `RandomTool` 中,
	 * 目的是让"随机相关能力"在项目内有一个集中出口.
	 *
	 * 示例:
	 * ```ts
	 * const env = RandomTool.pickOne(["dev", "test", "prod"])
	 * ```
	 */
	static pickOne<T>(items: readonly T[]): T | undefined {
		if (items.length === 0) {
			return undefined
		}
		return items[randomInt(items.length)]
	}

	/**
	 * 生成随机数字串.
	 *
	 * 示例:
	 * ```ts
	 * const smsCode = RandomTool.digits(6)
	 * // => "572184"
	 * ```
	 */
	static digits(length = 6): string {
		return RandomTool.string({
			length,
			charset: RandomTool.NUMERIC,
		})
	}

	/**
	 * 生成随机字母串.
	 *
	 * 示例:
	 * ```ts
	 * const lower = RandomTool.letters(8, "lower")
	 * const upper = RandomTool.letters(8, "upper")
	 * const mixed = RandomTool.letters(8, "mixed")
	 * ```
	 */
	static letters(length = 8, mode: "lower" | "upper" | "mixed" = "mixed"): string {
		const charsetMap = {
			lower: RandomTool.LOWERCASE,
			upper: RandomTool.UPPERCASE,
			mixed: RandomTool.ALPHA,
		} as const

		return RandomTool.string({
			length,
			charset: charsetMap[mode],
		})
	}

	/**
	 * 生成字母 + 数字的随机串.
	 *
	 * 这是业务里最常见的短 token 形式之一.
	 *
	 * 示例:
	 * ```ts
	 * const token = RandomTool.alphanumeric(12)
	 * // => "A8k2Zx9PmQ1d"
	 * ```
	 */
	static alphanumeric(length = 8): string {
		return RandomTool.string({
			length,
			charset: RandomTool.ALPHANUMERIC,
		})
	}

	/**
	 * 生成"更适合人眼识别"的随机串.
	 *
	 * 与 `alphanumeric()` 的区别:
	 * - 过滤掉了易混淆字符;
	 * - 更适合短分享码,人工输入码,下载提取码等场景.
	 *
	 * 示例:
	 * ```ts
	 * const code = RandomTool.safeString(8)
	 * // => "m7QpW9Xa"
	 * ```
	 */
	static safeString(length = 8): string {
		return RandomTool.string({
			length,
			charset: RandomTool.SAFE,
		})
	}

	/**
	 * 生成随机 token.
	 *
	 * 常用于:
	 * - 文件名:`file_ab12CD34`
	 * - 下载码:`dl_Km83Pq2X`
	 * - 临时追踪号:`trace-8dJ2kL9p`
	 *
	 * 示例:
	 * ```ts
	 * const fileKey = RandomTool.token("file")
	 * // => "filea8K2mP9X"
	 *
	 * const traceId = RandomTool.token("trace", {
	 *   separator: "-",
	 *   length: 10,
	 *   charset: RandomTool.SAFE,
	 * })
	 * // => "trace-Km83Pq2XzA"
	 * ```
	 */
	static token(prefix: string, options: Omit<RandomStringOptions, "prefix"> = {}): string {
		return RandomTool.string({
			...options,
			prefix,
		})
	}

	/**
	 * 生成随机字符串.
	 *
	 * 这是底层通用方法,其他 `digits / letters / safeString / token`
	 * 都基于它实现.
	 *
	 * 示例:
	 * ```ts
	 * const id1 = RandomTool.string()
	 * // => 默认 8 位字母数字串
	 *
	 * const id2 = RandomTool.string({
	 *   length: 12,
	 *   charset: RandomTool.URL_SAFE,
	 *   prefix: "file",
	 *   separator: "_",
	 * })
	 * // => "file_abC12-_9xYz"
	 * ```
	 */
	static string(options: RandomStringOptions = {}): string {
		const { length = 8, charset = RandomTool.ALPHANUMERIC, prefix = "", separator = "" } = options

		RandomTool.assertPositiveInteger("length", length)

		const normalizedCharset = RandomTool.normalizeCharset(charset)
		let value = ""
		for (let index = 0; index < length; index += 1) {
			value += normalizedCharset[randomInt(normalizedCharset.length)]
		}

		if (!prefix) {
			return value
		}

		return `${prefix}${separator}${value}`
	}

	/**
	 * 校验长度参数.
	 */
	private static assertPositiveInteger(field: string, value: number): void {
		if (!Number.isInteger(value) || value <= 0) {
			throw new RangeError(`RandomTool.${field} 必须为大于 0 的整数,当前收到:${value}`)
		}
	}

	/**
	 * 校验安全整数.
	 */
	private static assertSafeInteger(field: string, value: number): void {
		if (!Number.isSafeInteger(value)) {
			throw new RangeError(`RandomTool.${field} 必须为安全整数,当前收到:${value}`)
		}
	}

	/**
	 * 对字符集做标准化处理.
	 *
	 * 处理规则:
	 * - 去重,避免字符重复导致概率偏斜;
	 * - 若去重后为空,抛出异常;
	 * - 保留原始顺序,便于调试和阅读.
	 */
	private static normalizeCharset(charset: string): string {
		const normalizedCharset = [...new Set(charset.split(""))].join("")
		if (!normalizedCharset) {
			throw new RangeError("RandomTool.charset 不能为空")
		}
		return normalizedCharset
	}
}

import { SetMetadata } from "@nestjs/common"
import * as ms from "ms"

import { DecoratorKey } from "../../constant"

/******************** start type start ********************/

export type RateLimitOption = {
	/**
	 * 限流key
	 */
	key?: string
	/**
	 * 限流时间,单位秒
	 * @default 60
	 */
	time?: ms.StringValue
	/**
	 * 限流次数
	 * @default 1
	 */
	count?: number
	/**
	 * 限流类型
	 * @see HttpLimit
	 * @default IP
	 */
	limitType?: "GLOBAL" | "IP" | "USER"
}

/******************** end type end ********************/

const defaultRateLimitOption: RateLimitOption = {
	time: "1s",
	count: 100,
	limitType: "IP",
}

export const AspenRateLimit = (option?: RateLimitOption) => {
	return SetMetadata(DecoratorKey.RateLimit, {
		...defaultRateLimitOption,
		...option,
	})
}

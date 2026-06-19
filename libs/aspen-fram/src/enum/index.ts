import { AbstractEnumGroup } from "../base/base-enum"

import { GenGroupDict } from "../decorator/gen/dict/gen-dict-decorator"

@GenGroupDict({
	key: "com",
	summary: "通用",
})
export class ComEnums extends AbstractEnumGroup {
	readonly httpMethod = this.create("http_method", "HTTP方法", {
		GET: { code: "GET", summary: "GET" },
		POST: { code: "POST", summary: "POST" },
		PUT: { code: "PUT", summary: "PUT" },
		DELETE: { code: "DELETE", summary: "DELETE" },
	})
	readonly active = this.create("active", "激活/未激活", {
		YES: { code: "1", summary: "激活" },
		NO: { code: "0", summary: "未激活" },
	})
	readonly bool = this.create("bool", "是/否", {
		YES: { code: "1", summary: "是" },
		NO: { code: "0", summary: "否" },
	})
	readonly enable = this.create("enable", "启用/禁用", {
		YES: { code: "1", summary: "启用" },
		NO: { code: "0", summary: "禁用" },
	})
	readonly toggle = this.create("toggle", "开/关", {
		YES: { code: "1", summary: "开" },
		NO: { code: "0", summary: "关" },
	})
	readonly country = this.create("country", "国家(ISO 3166-1 alpha-2)", {
		CN: { code: "CN", summary: "中国" },
		US: { code: "US", summary: "美国" },
		JP: { code: "JP", summary: "日本" },
	})
	readonly currency = this.create("currency", "货币(ISO 4217)", {
		CNY: { code: "CNY", summary: "人民币" },
		USD: { code: "USD", summary: "美元" },
		JPY: { code: "JPY", summary: "日元" },
	})
	readonly language = this.create("language", "语言(ISO 639-1)", {
		EN: { code: "EN", summary: "英语" },
		ZH: { code: "ZH", summary: "中文" },
	})
	readonly userGender = this.create("user_gender", "用户性别(ISO 5218)", {
		UNKNOWN: { code: "0", summary: "未知" },
		MALE: { code: "1", summary: "男" },
		FEMALE: { code: "2", summary: "女" },
		NOT_APPLICABLE: { code: "9", summary: "未说明/不适用" },
	})
}

export const comEnums = new ComEnums()

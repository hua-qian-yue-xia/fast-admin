import { applyDecorators } from "@nestjs/common"
import { ApiProperty } from "@nestjs/swagger"

import { IS_NOT_EMPTY, IsNotEmpty, IS_EMAIL, IsEmail, MIN_LENGTH, MinLength, MAX_LENGTH, MaxLength, IsOptional } from "class-validator"

import { ApiGroup } from "../../constant"

class Rule {
	ruleList: Array<RuleItem> = []

	/******************** start string start ********************/
	isEmail() {
		this.ruleList.push({ key: IS_EMAIL, value: null })
		return this
	}
	min(min: number) {
		this.ruleList.push({ key: MIN_LENGTH, value: min })
		return this
	}
	max(max: number) {
		this.ruleList.push({ key: MAX_LENGTH, value: max })
		return this
	}
	/******************** start string start ********************/

	/******************** start common start ********************/
	isNotEmpty() {
		this.ruleList.push({ key: IS_NOT_EMPTY, value: null })
		return this
	}
	/******************** end common end ********************/
}

export const AspenRule = () => new Rule()

/**
 * 组装校验验器
 */
function setupValidatorDecorator(ruleList: Array<RuleItem>, options: SetupValidatorDecoratorOptions) {
	const { summary, description, groups } = options
	const message = description || summary
	const decorators: Array<PropertyDecorator> = []
	for (let i = 0; i < ruleList.length; i++) {
		const v = ruleList[i]
		switch (v.key) {
			/******************** start string start ********************/
			case IS_EMAIL:
				decorators.push(IsEmail(v.value, { message: message, groups: groups }))
				break
			case MIN_LENGTH:
				decorators.push(MinLength(v.value, { message: message, groups: groups }))
				break
			case MAX_LENGTH:
				decorators.push(MaxLength(v.value, { message: message, groups: groups }))
				break
			/******************** end string end ********************/

			/******************** start common start ********************/
			case IS_NOT_EMPTY:
				decorators.push(IsNotEmpty({ message: message, groups: groups }))
				break
			/******************** end common end ********************/
		}
	}
	return decorators
}

export type AspenSummaryOptions = {
	/**
	 * 校验规则
	 */
	rule?: Rule
	/**
	 * 字段描述
	 */
	summary: string
	/**
	 * 字段详细描述,如果有先用description而不是用summary
	 */
	description?: string
	/**
	 * 校验组
	 */
	groups?: Array<ApiGroup>
}

type SetupValidatorDecoratorOptions = Omit<AspenSummaryOptions, "rule">

type RuleItem = {
	key: string
	value: any
}

export function AspenSummary(options: AspenSummaryOptions): PropertyDecorator {
	const { summary, description, groups } = options
	// 校验注解
	const ruleDecorators = setupValidatorDecorator(options.rule?.ruleList ?? [], {
		summary: summary,
		description: description,
		groups: groups,
	})
	// 如果没有校验规则,则默认添加IsOptional注解
	if (!options.rule || !options.rule.ruleList.length) {
		ruleDecorators.push(IsOptional({ groups: groups }))
	}
	const isRequired = options.rule?.ruleList.some((item) => item.key === IS_NOT_EMPTY) ?? false
	return applyDecorators(ApiProperty({ description: description || summary, required: isRequired }), ...ruleDecorators)
}

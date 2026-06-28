import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

import { exception } from "@aspen/aspen-fram"

import { QuartzTaskCategoryEntity } from "../../entity"

/**
 * 定时任务分类共享能力。
 *
 * 这里封装的是“分类维度”的公共校验逻辑，
 * 便于 service 和其他模块复用，避免重复写：
 * - 分类是否存在；
 * - 分类名称是否重复。
 */
@Injectable()
export class QuartzTaskCategoryShare {
	constructor(
		@InjectRepository(QuartzTaskCategoryEntity)
		private readonly quartzTaskCategoryRepo: Repository<QuartzTaskCategoryEntity>,
	) {}

	/**
	 * 检查分类是否存在，不存在则直接抛出异常。
	 */
	async checkThrowExist(categoryId: string) {
		const category = await this.quartzTaskCategoryRepo.findOneBy({ categoryId })
		if (!category) {
			throw new exception.validator(`任务分类"${categoryId}"不存在`)
		}
		return category
	}

	/**
	 * 判断分类名称是否重复。
	 *
	 * 更新场景下会自动排除当前记录自身。
	 */
	async isCategoryNameDuplicate(entity: QuartzTaskCategoryEntity): Promise<boolean> {
		const query = this.quartzTaskCategoryRepo
			.createQueryBuilder("category")
			.where("category.category_name = :categoryName", { categoryName: entity.categoryName })

		if (entity.categoryId) {
			query.andWhere("category.category_id != :categoryId", { categoryId: entity.categoryId })
		}

		return (await query.getCount()) > 0
	}
}

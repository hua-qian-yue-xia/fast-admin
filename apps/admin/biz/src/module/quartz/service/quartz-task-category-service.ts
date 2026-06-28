import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { exception } from "@aspen/aspen-fram"

import { QuartzTaskCategoryEntity, QuartzTaskCategoryQueryDto, QuartzTaskCategorySaveDto, QuartzTaskEntity } from "../entity"
import { QuartzTaskCategoryShare } from "./share/quartz-task-category-share"

/**
 * 定时任务分类服务.
 *
 * 该服务负责分类维度的后台管理能力:
 * - 分页查询;
 * - 详情查询;
 * - 新增/修改;
 * - 删除前引用校验.
 */
@Injectable()
export class QuartzTaskCategoryService {
	constructor(
		@InjectRepository(QuartzTaskCategoryEntity)
		private readonly quartzTaskCategoryRepo: Repository<QuartzTaskCategoryEntity>,
		@InjectRepository(QuartzTaskEntity)
		private readonly quartzTaskRepo: Repository<QuartzTaskEntity>,
		private readonly quartzTaskCategoryShare: QuartzTaskCategoryShare,
	) {}

	/**
	 * 分类分页.
	 */
	async page(dto: QuartzTaskCategoryQueryDto) {
		return await dto.createQueryBuilder(this.quartzTaskCategoryRepo).pageMany(dto.getSimplePageObj())
	}

	/**
	 * 根据分类 id 查询详情.
	 */
	async getByCategoryId(categoryId: string) {
		return await this.quartzTaskCategoryRepo.findOneBy({ categoryId })
	}

	/**
	 * 查询全部分类.
	 *
	 * 主要给后台下拉框使用,因此返回完整列表即可.
	 */
	async all() {
		return await this.quartzTaskCategoryRepo.find({
			order: {
				sort: "DESC",
				categoryId: "DESC",
			},
		})
	}

	/**
	 * 新增分类.
	 */
	async save(dto: QuartzTaskCategorySaveDto) {
		const entity = dto.toEntity()
		if (await this.quartzTaskCategoryShare.isCategoryNameDuplicate(entity)) {
			throw new exception.validator(`任务分类名"${dto.categoryName}"重复`)
		}
		return await this.quartzTaskCategoryRepo.save(entity)
	}

	/**
	 * 修改分类.
	 */
	async edit(dto: QuartzTaskCategorySaveDto) {
		if (!dto.categoryId) {
			throw new exception.validator("修改分类时 categoryId 不能为空")
		}

		await this.quartzTaskCategoryShare.checkThrowExist(dto.categoryId)
		const entity = dto.toEntity()
		if (await this.quartzTaskCategoryShare.isCategoryNameDuplicate(entity)) {
			throw new exception.validator(`任务分类名"${dto.categoryName}"重复`)
		}
		await this.quartzTaskCategoryRepo.update({ categoryId: dto.categoryId }, entity)
	}

	/**
	 * 批量删除分类.
	 *
	 * 删除前会校验是否仍被任务引用,避免出现脏数据.
	 */
	async delByIds(categoryIds: Array<string>) {
		const categoryList = await this.quartzTaskCategoryRepo.find({
			where: { categoryId: In(categoryIds) },
		})
		if (!categoryList.length) {
			return 0
		}

		const usedCount = await this.quartzTaskRepo.count({
			where: {
				categoryId: In(categoryList.map((item) => item.categoryId)),
			},
		})
		if (usedCount > 0) {
			throw new exception.validator("存在已绑定任务的分类,不能直接删除")
		}

		const { affected } = await this.quartzTaskCategoryRepo.softDelete(categoryList.map((item) => item.categoryId))
		return affected ?? 0
	}
}

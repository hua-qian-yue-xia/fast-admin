import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { RedisTool } from "@aspen/aspen-core"
import { cache, exception } from "@aspen/aspen-fram"
import { SysFileCategoryEntity, SysFileCategoryQueryDto, SysFileCategorySaveDto } from "../entity"

@Injectable()
export class SysFileCategoryService {
	constructor(
		@InjectRepository(SysFileCategoryEntity)
		private readonly sysFileCategoryRepo: Repository<SysFileCategoryEntity>,
		private readonly redisTool: RedisTool,
	) {}

	// 分类名称是否重复
	async isCategoryNameDuplicate(entity: SysFileCategoryEntity): Promise<boolean> {
		const queryBuilder = this.sysFileCategoryRepo
			.createQueryBuilder("a")
			.where("a.category_name = :categoryName", { categoryName: entity.categoryName })
		if (entity.categoryId) {
			queryBuilder.andWhere("a.category_id != :categoryId", { categoryId: entity.categoryId })
		}
		const count = await queryBuilder.getCount()
		return count > 0
	}

	// 查询所有文件分类
	async all(dto: SysFileCategoryQueryDto) {
		return await dto.createQueryBuilder(this.sysFileCategoryRepo).getMany()
	}

	// 根据categoryId查询文件分类(有缓存)
	@cache.able({ key: "sys:file:category:id", value: ([categoryId]) => `${categoryId}`, expiresIn: "2h" })
	async getByCategoryId(categoryId: string) {
		return await this.sysFileCategoryRepo.findOne({
			where: {
				categoryId,
			},
		})
	}

	// 新增文件分类
	@cache.put({ key: "sys:file:category:id", value: (_, result) => `${result.categoryId}`, expiresIn: "2h" })
	async save(body: SysFileCategorySaveDto) {
		const obj = body.toEntity()
		if (await this.isCategoryNameDuplicate(obj)) {
			throw new exception.validator(`分类名称"${obj.categoryName}"重复`)
		}
		return await this.sysFileCategoryRepo.save(obj)
	}

	// 更新文件分类
	@cache.put({ key: "sys:file:category:id", value: ([body]) => `${body.categoryId}`, expiresIn: "2h" })
	async edit(body: SysFileCategorySaveDto) {
		const obj = body.toEntity()
		if (await this.isCategoryNameDuplicate(obj)) {
			throw new exception.validator(`分类名称"${obj.categoryName}"重复`)
		}
		return await this.sysFileCategoryRepo.update({ categoryId: obj.categoryId }, obj)
	}

	// 删除文件分类
	async delByIds(categoryIds: Array<string>) {
		// 查询存不存在
		const roleList = await this.sysFileCategoryRepo.find({ where: { categoryId: In(categoryIds) } })
		if (!roleList.length) return 0
		// 删除数据
		const { affected } = await this.sysFileCategoryRepo.softDelete(categoryIds)
		// 删除缓存
		this.redisTool.del(roleList.map((v) => `sys:file-category:id:${v.categoryId}`))
		return affected ?? 0
	}
}

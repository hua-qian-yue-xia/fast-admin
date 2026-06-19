import { SelectQueryBuilder, Repository, FindManyOptions, ObjectLiteral } from "typeorm"

import { BasePageVo, BasePageOptions } from "../../base/base-page"

/******************** start 扩展SelectQueryBuilder start ********************/
declare module "typeorm" {
	interface SelectQueryBuilder<Entity extends ObjectLiteral> {
		pageMany(this: SelectQueryBuilder<Entity>, pagePa: BasePageOptions): Promise<BasePageVo<Entity>>
		scopePageMany(this: SelectQueryBuilder<Entity>, pagePa: BasePageOptions): Promise<BasePageVo<Entity>>
	}
}
// 分页查询
SelectQueryBuilder.prototype.pageMany = async function (this: SelectQueryBuilder<ObjectLiteral>, pagePa: BasePageOptions) {
	const pageVo = new BasePageVo<ObjectLiteral>()
	const { page, pageSize } = pagePa
	const count = await this.getCount()
	if (count > 0) {
		pageVo.records = await this.skip((page - 1) * pageSize)
			.take(pageSize)
			.getMany()
	}
	pageVo.page = page
	pageVo.pageSize = pageSize
	pageVo.totalRecord = count
	pageVo.totalPage = Math.ceil(count / pageSize)
	return pageVo
}

// 权限分页查询
SelectQueryBuilder.prototype.scopePageMany = async function (this: SelectQueryBuilder<ObjectLiteral>, pagePa: BasePageOptions) {
	const pageVo = new BasePageVo<ObjectLiteral>()
	return pageVo
}

/******************** end 扩展SelectQueryBuilder end ********************/

/******************** start Repository start ********************/
declare module "typeorm/repository/Repository" {
	interface Repository<Entity extends ObjectLiteral> {
		page(this: Repository<Entity>, pagePa: BasePageOptions, options?: FindManyOptions<Entity>): Promise<BasePageVo<Entity>>
		scopePage(this: Repository<Entity>, pagePa: BasePageOptions, options?: FindManyOptions<Entity>): Promise<BasePageVo<Entity>>
	}
}
// 分页查询
Repository.prototype.page = async function <Entity extends ObjectLiteral>(
	this: Repository<Entity>,
	pagePa: BasePageOptions,
	options?: FindManyOptions<Entity>,
): Promise<BasePageVo<Entity>> {
	const pageVo = new BasePageVo<Entity>()
	// 获取当前分页参数
	const { page, pageSize } = pagePa
	const condition = { ...options, skip: (page - 1) * pageSize, take: pageSize }
	const count = await this.count(condition)
	if (count > 0) {
		pageVo.records = await this.find(condition)
	}
	pageVo.page = page
	pageVo.pageSize = pageSize
	pageVo.totalRecord = count
	pageVo.totalPage = Math.ceil(count / pageSize)
	return pageVo
}
/******************** start Repository end ********************/

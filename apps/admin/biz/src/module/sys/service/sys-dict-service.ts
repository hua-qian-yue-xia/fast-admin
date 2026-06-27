import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { RedisTool } from "@aspen/aspen-core"
import { cache, exception } from "@aspen/aspen-fram"

import { SysDictEntity, SysDictQueryDto, SysDictSaveDto } from "../entity"
import { plainToInstance } from "class-transformer"

@Injectable()
export class SysDictService {
	private readonly logger = new Logger(SysDictService.name)

	constructor(
		@InjectRepository(SysDictEntity) private readonly sysDictRepo: Repository<SysDictEntity>,
		private readonly redisTool: RedisTool,
	) {}

	async page(dto: SysDictQueryDto) {
		return await dto.createQueryBuilder(this.sysDictRepo).pageMany(dto.getSimplePageObj())
	}

	// 查询所有字典code
	async allDictCode() {
		const list = await this.sysDictRepo.find({
			select: {
				code: true,
			},
		})
		return list.map((v) => v.code)
	}

	// 根据dictId查询字典
	@cache.able({ key: "sys:dict:id", value: ([dictId]) => `${dictId}`, expiresIn: "2h" })
	async getByDictId(dictId: string) {
		const dictDetail = await this.sysDictRepo.findOne({
			where: {
				id: dictId,
			},
		})
		return dictDetail
	}

	// 新增字典
	@cache.put({ key: "sys:dict:id", value: (_, result) => `${result.id}`, expiresIn: "2h" })
	async save(body: SysDictSaveDto) {
		if (await this.isDictCodeDuplicate(body.code)) {
			throw new exception.validator(`字典code"${body.code}"重复`)
		}
		const obj = plainToInstance(SysDictEntity, body)
		obj.genType = "2"
		const saveObj = await this.sysDictRepo.save(obj)
		return saveObj
	}

	// 修改字典
	@cache.evict({ key: "sys:dict:id", value: ([dto]) => `${dto.id}` })
	async edit(body: SysDictSaveDto) {
		if (await this.isDictCodeDuplicate(body.code, body.id)) {
			throw new exception.validator(`字典code"${body.code}"重复`)
		}
		const obj = plainToInstance(SysDictEntity, body)
		obj.genType = "2"
		await this.sysDictRepo.update({ id: body.id }, obj)
	}

	// 删除字典
	async delByIds(dictIds: Array<string>) {
		// 查询存不存在
		const dictList = await this.sysDictRepo.find({ where: { id: In(dictIds) } })
		if (!dictList.length) return 0
		// 删除数据
		const { affected } = await this.sysDictRepo.softDelete(dictIds)
		// 删除缓存
		this.redisTool.del(dictList.map((v) => `sys:dict:id:${v.id}`))
		return affected ?? 0
	}

	// 字典code是否重复
	async isDictCodeDuplicate(dictCode: string, dictId?: string): Promise<boolean> {
		const queryBuilder = this.sysDictRepo.createQueryBuilder("dict").where("dict.code = :dictCode", { dictCode })
		if (dictId) {
			queryBuilder.andWhere("dict.id != :dictId", { dictId })
		}
		const count = await queryBuilder.getCount()
		return count > 0
	}
}

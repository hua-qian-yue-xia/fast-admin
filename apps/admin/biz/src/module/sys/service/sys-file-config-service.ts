import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import { RedisTool } from "@aspen/aspen-core"
import { cache, comEnums, exception } from "@aspen/aspen-fram"

import { SysFileConfigEntity, SysFileConfigQueryDto, SysFileConfigSaveDto } from "../entity"
import { SysFileConfigShare } from "./share/sys-file-config-share"

@Injectable()
export class SysFileConfigService {
	constructor(
		@InjectRepository(SysFileConfigEntity) private readonly sysFileConfigRep: Repository<SysFileConfigEntity>,
		private readonly redisTool: RedisTool,

		private readonly sysFileConfigShare: SysFileConfigShare,
	) {}

	// 文件配置分页
	async page(dto: SysFileConfigQueryDto) {
		return dto.createQueryBuilder(this.sysFileConfigRep).pageMany(dto.getSimplePageObj())
	}

	// 根据configId查询文件配置(有缓存)
	@cache.able({ key: "sys:file-config:id", value: ([configId]) => `${configId}`, expiresIn: "2h" })
	async getByConfigId(configId: string) {
		const dictDetail = await this.sysFileConfigRep.findOne({
			where: {
				configId,
			},
		})
		return dictDetail
	}

	// 根据uniqueCode查询文件配置,如果没有code就查询默认配置
	async getConfigByCodeOrDefault(uniqueCode?: string) {
		let config: SysFileConfigEntity | null = null
		if (uniqueCode) {
			config = await this.sysFileConfigRep.findOne({
				where: {
					uniqueCode,
				},
			})
		}
		if (!config) {
			config = await this.sysFileConfigRep.findOne({
				where: {
					default: comEnums.bool.named.YES.raw.code,
				},
			})
		}
		return config
	}

	// 新增文件配置
	@cache.put([{ key: "sys:file-config:id", value: (_, result) => `${result.configId}`, expiresIn: "2h" }])
	async save(body: SysFileConfigSaveDto) {
		const entity = body.toEntity()
		if (await this.sysFileConfigShare.isConfigNameDuplicate(entity)) {
			throw new exception.validator(`文件配置名称"${body.name}"重复`)
		}
		// 生成唯一code
		entity.uniqueCode = await this.sysFileConfigShare.generateUniqueCode()
		const saveObj = await this.sysFileConfigRep.save(entity)
		return saveObj
	}

	// 更新文件配置
	@cache.evict([{ key: "sys:file-config:id", value: ([body]) => `${body.configId}` }])
	async edit(body: SysFileConfigSaveDto) {
		const entity = body.toEntity()
		if (await this.sysFileConfigShare.isConfigNameDuplicate(entity)) {
			throw new exception.validator(`文件配置名称"${body.name}"重复`)
		}
		await this.sysFileConfigRep.update({ configId: body.configId }, entity)
	}

	// 删除文件配置
	async delByIds(configIds: Array<string>) {
		// 查询存不存在
		const roleList = await this.sysFileConfigRep.find({ where: { configId: In(configIds) } })
		if (!roleList.length) return 0
		// 删除数据
		const { affected } = await this.sysFileConfigRep.softDelete(configIds)
		// 删除缓存
		this.redisTool.del(roleList.map((v) => `sys:file-config:id:${v.configId}`))
		return affected ?? 0
	}
}

import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"

import { RedisTool } from "@aspen/aspen-core"
import { cache, exception } from "@aspen/aspen-fram"

import { In, Repository } from "typeorm"

import { UpmRoleEntity, UpmRoleQueryDto, UpmRoleSaveDto } from "../entity"
import { UpmRoleShare } from "./share"

@Injectable()
export class UpmRoleService {
	private readonly logger = new Logger(UpmRoleService.name)

	constructor(
		@InjectRepository(UpmRoleEntity) private readonly upmRoleRepo: Repository<UpmRoleEntity>,
		private readonly upmRoleShare: UpmRoleShare,
		private readonly redisTool: RedisTool,
	) {}

	// 分页结构
	async scopePage(query: UpmRoleQueryDto) {
		// 查询所有部门
		const deptListBuilder = query.createQueryBuilder(this.upmRoleRepo)
		const deptList = await deptListBuilder.pageMany(query.getSimplePageObj())
		return deptList
	}

	// 根据角色id查询角色
	@cache.able({ key: "sys:role:id", value: ([roleId]) => `${roleId}`, expiresIn: "2h" })
	async getByRoleId(roleId: string): Promise<UpmRoleEntity | null> {
		return this.upmRoleRepo.findOneBy({ roleId: roleId })
	}

	// 根据角色code查询角色
	@cache.able({ key: "sys:role:code", value: ([roleId]) => `${roleId}`, expiresIn: "2h" })
	getByRoleCode(roleCode: string) {
		return this.upmRoleRepo.findOneBy({ roleCode: roleCode })
	}

	// 新增
	@cache.put({ key: "sys:role:id", value: (_, result) => `${result.roleId}`, expiresIn: "1h" })
	async save(dto: UpmRoleSaveDto): Promise<UpmRoleEntity> {
		const entity = dto.toEntity()
		if (await this.upmRoleShare.isRoleNameDuplicate(entity)) {
			throw new exception.validator(`角色名"${dto.roleName}"重复`)
		}
		if (await this.upmRoleShare.isRoleCodeDuplicate(entity)) {
			throw new exception.validator(`角色code"${dto.roleCode}"重复`)
		}
		const saveObj = await this.upmRoleRepo.save(entity)
		return saveObj
	}

	// 修改
	@cache.evict({ key: "sys:role:id", value: ([dto]) => `${dto.roleId}` })
	async edit(dto: UpmRoleSaveDto): Promise<void> {
		const role = await this.getByRoleId(dto.roleId)
		if (!role) {
			throw new exception.validator(`角色id"${dto.roleId}"不存在`)
		}
		const entity = dto.toEntity()
		if (await this.upmRoleShare.isRoleNameDuplicate(entity)) {
			throw new exception.validator(`角色名"${dto.roleName}"重复`)
		}
		if (await this.upmRoleShare.isRoleCodeDuplicate(entity)) {
			throw new exception.validator(`角色code"${dto.roleCode}"重复`)
		}
		await this.upmRoleRepo.update({ roleId: dto.roleId }, entity)
	}

	// 删除
	async delByIds(roleIds: Array<string>): Promise<number> {
		// 查询存不存在
		const roleList = await this.upmRoleRepo.find({ where: { roleId: In(roleIds) } })
		if (!roleList.length) return 0
		const delRoleIds = roleList.map((v) => v.roleId)
		// 删除数据
		const { affected } = await this.upmRoleRepo.softDelete(delRoleIds)
		// 删除缓存
		this.redisTool.del(delRoleIds.map((v) => `sys:role:id:${v}`))
		return affected ?? 0
	}
}

import { Injectable } from "@nestjs/common"

import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"

import * as _ from "es-toolkit/compat"

import { RedisTool } from "@aspen/aspen-core"
import { exception } from "@aspen/aspen-fram"

import { UpmRoleEntity } from "../../entity/upm-role.entity"

@Injectable()
export class UpmRoleShare {
	constructor(
		@InjectRepository(UpmRoleEntity) private readonly upmRoleRepo: Repository<UpmRoleEntity>,
		private readonly redisTool: RedisTool,
	) {}

	// 角色名是否重复
	async isRoleNameDuplicate(entity: UpmRoleEntity): Promise<boolean> {
		const queryBuilder = this.upmRoleRepo.createQueryBuilder("role").where("role.role_name = :roleName", { roleName: entity.roleName })
		if (entity.roleId) {
			queryBuilder.andWhere("role.role_id != :roleId", { roleId: entity.roleId })
		}
		const count = await queryBuilder.getCount()
		return count > 0
	}

	// 角色code是否重复
	async isRoleCodeDuplicate(entity: UpmRoleEntity): Promise<boolean> {
		const queryBuilder = this.upmRoleRepo.createQueryBuilder("role").where("role.role_code = :roleCode", { roleCode: entity.roleCode })
		if (entity.roleId) {
			queryBuilder.andWhere("role.role_id != :roleId", { roleId: entity.roleId })
		}
		const count = await queryBuilder.getCount()
		return count > 0
	}

	// 判断传入的`roleIdList`是否存在,会抛出异常
	async checkThrowExist(str: Array<string> | string) {
		const checkRoleIdList = _.isArray(str) ? str : [str]
		// 查询所有的角色
		const roleList = await this.upmRoleRepo.find()
		if (_.isEmpty(roleList)) {
			return []
		}
		const roleIdList = roleList.map((v) => v.roleId)
		for (const checkRoleId of checkRoleIdList) {
			if (!roleIdList.includes(checkRoleId)) {
				// TODO 高风险
				throw new exception.runtime(`传入的角色idList中存在不存在的角色id:${checkRoleId}`)
			}
		}
		return roleList.filter((v) => checkRoleIdList.includes(v.roleId))
	}
}

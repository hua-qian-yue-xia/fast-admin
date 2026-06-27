import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import * as _ from "es-toolkit/compat"

import { tool } from "@aspen/aspen-core"
import { exception } from "@aspen/aspen-fram"

import { UpmDeptEntity, UpmDeptQueryDto, UpmDeptSaveDto } from "../entity"
import { UpmDeptShare } from "./share"

@Injectable()
export class UpmDeptService {
	private readonly logger = new Logger(UpmDeptService.name)

	constructor(
		@InjectRepository(UpmDeptEntity) private readonly upmDeptRepo: Repository<UpmDeptEntity>,
		private readonly upmDeptShare: UpmDeptShare,
	) {}

	// 权限分页查询
	async scopePage(body: UpmDeptQueryDto) {
		const queryBuilder = body.createQueryBuilder(this.upmDeptRepo)
		const page = await queryBuilder.pageMany(body.getSimplePageObj())
		if (page.totalRecord > 0) {
			const deptIds = page.records.map((item) => item.deptId)
			const deptCountTotalList = await this.upmDeptShare.getDeptCountTotal(deptIds)
			page.records.map((item) => {
				const deptCountTotal = deptCountTotalList.find((dept) => dept.dpetId === item.deptId)
				;(item as any).countTotal = deptCountTotal
			})
		}
		return page
	}

	// 树状结构
	async tree(query: UpmDeptQueryDto) {
		// 查询根部门
		const rootDept = await this.upmDeptShare.getOrCreateRootDept()
		if (!rootDept) throw new exception.runtime("根部门不存在")
		// 查询所有部门
		const deptListBuilder = this.upmDeptRepo.createQueryBuilder("sys_dept").orderBy("sys_dept.sort", "DESC")
		const deptList = await deptListBuilder.getMany()
		// 转换为树状结构
		let tree = tool.tree.toTree(deptList, {
			idKey: "deptId",
			parentIdKey: "deptParentId",
			childrenKey: "children",
			rootParentValue: rootDept.deptParentId,
			sort: (a, b) => {
				return b.sort - a.sort
			},
			excludeKeys: ["delAt", "delBy", "updateBy", "updateAt"],
		})
		if (!_.isEmpty(query.deptNameLike)) {
			tree = tool.tree.filter(
				tree,
				(node) => {
					return node.deptName.includes(query.deptNameLike)
				},
				"children",
			)
		}
		return tree
	}

	// 根据部门id查询部门
	async getByDeptId(deptId: string): Promise<UpmDeptEntity | null> {
		return this.upmDeptRepo.findOneBy({ deptId: deptId })
	}

	// 新增
	async save(dto: UpmDeptSaveDto): Promise<UpmDeptEntity> {
		// 判断父部门是否存在
		const saveObj = await this.upmDeptRepo.save(this.upmDeptRepo.create(dto.toEntity()))
		return saveObj
	}

	// 修改
	async update(dto: UpmDeptSaveDto): Promise<void> {
		const [deptDetail] = await this.upmDeptShare.checkExistThrow(dto.deptId)
		if (!deptDetail) {
			throw new exception.validator(`部门id"${dto.deptId}"不存在`)
		}
		const entity = dto.toEntity()
		await this.upmDeptRepo.update({ deptId: dto.deptId }, entity)
	}

	// 删除部门
	async delete(deptIds: Array<string>) {
		this.upmDeptShare.checkExistThrow(deptIds)
		const deptCountTotalList = await this.upmDeptShare.getDeptCountTotal(deptIds)
		for (const dept of deptCountTotalList) {
			if (dept.dpetCount > 0) {
				throw new exception.validator(`部门"${dept.deptName}"下存在子部门,不能删除`)
			}
			if (dept.personCount > 0) {
				throw new exception.validator(`部门"${dept.deptName}"下存在用户,不能删除`)
			}
		}
		await this.upmDeptRepo.softDelete(deptIds)
	}
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { FastEntity } from '../../../core/base/entity/fast.entity'

@Entity()
export class SysUserRoleEntity {
  @Column({ comment: '角色id' })
  roleId: number

  @Column({ comment: '部门id' })
  deptId: number
}

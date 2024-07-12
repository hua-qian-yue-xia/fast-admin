import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { FastEntity } from '../../../core/base/entity/fast.entity'

@Entity()
export class SysRoleEntity extends FastEntity {
  @PrimaryGeneratedColumn({ comment: '角色id' })
  roleId: number

  @Column({ comment: '角色key' })
  roleKey: string

  @Column({ comment: '角色名' })
  roleName: string

  @Column({ comment: '角色权限' })
  dataScope: string

  @Column({ comment: '状态' })
  status: string

  @Column({ comment: '排序' })
  order: number
}
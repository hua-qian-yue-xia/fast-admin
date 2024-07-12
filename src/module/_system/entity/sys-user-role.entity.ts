import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { FastEntity } from '../../../core/base/entity/fast.entity'

@Entity()
export class SysUserRoleEntity {
  @Column({ comment: '用户id' })
  userId: number

  @Column({ comment: '角色id' })
  roleId: number
}

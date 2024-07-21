import {Entity, Index, PrimaryColumn} from 'typeorm'

@Entity('sys_user_role', {name: '角色权限关联表'})
export class SysUserRoleEntity {
  @Index()
  @PrimaryColumn({comment: '用户id'})
  userId: number

  @Index()
  @PrimaryColumn({comment: '角色id'})
  roleId: number
}

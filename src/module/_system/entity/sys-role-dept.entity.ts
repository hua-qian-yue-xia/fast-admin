import {Entity, Index, PrimaryColumn} from 'typeorm'
@Entity('sys_user_dept', {name: '用户部门关联表'})
export class SysUserDeptEntity {
  @Index()
  @PrimaryColumn({comment: '角色id'})
  roleId: number

  @Index()
  @PrimaryColumn({comment: '部门id'})
  deptId: number
}

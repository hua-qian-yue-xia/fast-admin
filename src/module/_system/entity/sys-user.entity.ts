import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm'
import {FastEntity} from '../../../framework/base/entity/fast.entity'

@Entity('sys_user', {name: '后台用户表'})
export class SysUserEntity extends FastEntity {
  @PrimaryGeneratedColumn({comment: '用户id'})
  sysUserId: number

  @Column({comment: '用户名/登录名'})
  username: string

  @Column({comment: '用户名/真实姓名'})
  nickname?: string

  @Column({comment: '密码'})
  password: string

  @Column({comment: '性别'})
  sex: string

  @Column({comment: '手机号码'})
  mobile: string

  @Column({comment: '头像'})
  avatar?: string
}

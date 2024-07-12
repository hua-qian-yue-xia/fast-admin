import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { FastEntity } from '../../../core/base/entity/fast.entity'

@Entity()
export class SysMenuEntity extends FastEntity {
  @PrimaryGeneratedColumn({ comment: 'id' })
  id: number

  @Column({ comment: '父级id' })
  parentId: number

  @Column({ comment: '名字' })
  name: string

  @Column({ comment: '类型' })
  type: string

  @Column({ comment: '图标' })
  icon: string

  @Column({ comment: '路由地址' })
  router: string

  @Column({ comment: '页面组建地址' })
  componentPath?: string

  @Column({ comment: '是否未外连接' })
  isFrame: boolean

  @Column({ comment: '是否缓存页面' })
  isCache: boolean

  @Column({ comment: '是否显示页面' })
  isVisible: boolean

  @Column({ comment: '权限key' })
  perms?: string

  @Column({ comment: '排序' })
  order: number
}

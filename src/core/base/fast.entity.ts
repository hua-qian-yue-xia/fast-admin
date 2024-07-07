import { BaseEntity, Column, Entity } from 'typeorm'

@Entity()
export class FastEntity extends BaseEntity {
  @Column({ comment: '创建人' })
  createBy: string

  @Column({ comment: '操作人' })
  updateBy: string

  @Column({ comment: '创建时间' })
  createTime: Date

  @Column({ comment: '操作时间' })
  updateTime: Date

  @Column({ comment: '是否删除' })
  delFlag: boolean
}

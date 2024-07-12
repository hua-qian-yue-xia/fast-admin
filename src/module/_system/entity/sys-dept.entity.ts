import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { FastEntity } from '../../../core/base/entity/fast.entity'

@Entity()
export class SysDeptEntity extends FastEntity {
  @PrimaryGeneratedColumn({ comment: '部门id' })
  deptId: number

  @Column({ comment: '父部门id' })
  parentId?: number

  @Column({ comment: '祖级列表' })
  ancestors: string

  @Column({ comment: '部门名' })
  deptName: string

  @Column({ comment: '排序' })
  order: number
}

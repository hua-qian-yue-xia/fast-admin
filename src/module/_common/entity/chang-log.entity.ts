import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
class ChangLogEntity {
  @PrimaryGeneratedColumn({ comment: '操作日志id' })
  logId: number

  @Column({ comment: '操作日志title' })
  logTitle: string

  @Column({ comment: '日志类型' })
  logType: string

  @Column({ comment: '用户id' })
  userId: number

  @Column({ comment: '系统类型' })
  userTerminalType: number

  @Column({ comment: '请求url' })
  reqUrl: string

  @Column({ comment: '请求方法' })
  reqMethod: string

  @Column({ comment: '请求ip' })
  reqIp: string

  @Column({ comment: '请求位置' })
  reqLocation: string

  @Column({ comment: '请求json' })
  reqJson: string

  @Column({ comment: '返回json' })
  resJson: string

  @Column({ comment: '错误json' })
  errorJson: string

  @Column({ comment: '创建时间' })
  status: string

  @Column({ comment: '创建时间' })
  createTime: Date

  @Column({ comment: '创建时间' })
  costTime: number
}

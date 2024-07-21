import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm'

@Entity('com_change_log', {name: '操作日志表'})
export class ComChangLogEntity {
  @PrimaryGeneratedColumn({name: 'log_id', comment: '操作日志id'})
  logId: number

  @Column({name: 'log_title', comment: '操作日志title'})
  logTitle: string

  @Column({name: 'log_type', comment: '日志类型'})
  logType: string

  @Column({name: 'user_id', nullable: true, comment: '用户id'})
  userId?: number

  @Column({name: 'user_platform', nullable: true, comment: '系统类型'})
  userPlatform?: string

  @Column({name: 'req_url', comment: '请求url'})
  reqUrl: string

  @Column({name: 'req_method', comment: '请求方法'})
  reqMethod: string

  @Column({name: 'req_ip', comment: '请求ip'})
  reqIp: string

  @Column({name: 'req_location', comment: '请求位置'})
  reqLocation: string

  @Column({name: 'req_json', comment: '请求json'})
  reqJson: string

  @Column({name: 'res_json', nullable: true, comment: '返回json'})
  resJson?: string

  @Column({name: 'error_json', nullable: true, comment: '错误json'})
  errorJson?: string

  @Column({name: 'status', comment: '请求状态'})
  status: string

  @Column({name: 'create_time', comment: '创建时间'})
  createTime: Date

  @Column({name: 'cost_time', comment: '操作用时'})
  costTime: number
}

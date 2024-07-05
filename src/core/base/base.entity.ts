export abstract class BaseEntity extends Object {
  createBy: string
  updateBy: string
  createTime: Date
  updateTime: Date
  delFlag: boolean
}

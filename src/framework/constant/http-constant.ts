export enum HttpStatusConstant {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum HttpLimitEnum {
  /**
   * 默认策略全局限流
   */
  DEFAULT = 'DEFAULT',
  /**
   * 根据请求者IP进行限流
   */
  IP = 'IP',
}

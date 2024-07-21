export enum SysPlatform {
  ADMIN = 'ADMIN',
  WECHAT = 'WECHAT',
}

export enum SysLogType {
  /**
   * 其它
   */
  OTHER = 'OTHER',
  /**
   * 新增
   */
  INSERT = 'INSERT',
  /**
   * 修改
   */
  UPDATE = 'UPDATE',
  /**
   * 删除
   */
  DELETE = 'DELETE',
  /**
   * 授权
   */
  GRANT = 'GRANT',
  /**
   * 导出
   */
  EXPORT = 'EXPORT',
  /**
   * 导入
   */
  IMPORT = 'IMPORT',
  /**
   * 强退
   */
  FORCE = 'FORCE',
  /**
   * 生成代码
   */
  GENCODE = 'GENCODE',
  /**
   * 清空数据
   */
  CLEAN = 'CLEAN',
}

export abstract class SysRedisConstant {
  static RATE_LIMIT_KEY = 'rate_limit:'
}

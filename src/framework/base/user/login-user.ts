export class LoginUser {
  /**
   * 用户ID
   */
  userId: string
  /**
   * 用户唯一标识
   */
  token: string
  /**
   * 登录时间
   */
  loginTime: number
  /**
   * 过期时间
   */
  expireTime: number
  /**
   * 登录ip
   */
  loginIp: string
  /**
   * 登录地址
   */
  loginLoginLocation: string
  /**
   * 平台
   */
  platform: string
}

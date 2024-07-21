import { LoginUser } from './login-user'

export class SysLoginUser extends LoginUser {
  /**
   * 部门Id
   */
  deptId: string

  /**
   * 权限列表
   */
  permissions: string
  isAdmin() {
    return false
  }
}

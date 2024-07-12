import { Module } from '@nestjs/common'
import { SysDeptService } from './service/sys-dept.service'
import { SysMenuService } from './service/sys-menu.service'
import { SysRoleService } from './service/sys-role.service'
import { SysUserService } from './service/sys-user.service'

@Module({
  providers: [SysDeptService, SysMenuService, SysRoleService, SysUserService],
})
export class SystemModule {}

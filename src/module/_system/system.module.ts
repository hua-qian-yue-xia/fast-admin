import {Module} from '@nestjs/common'
import {SysDeptService} from './service/sys-dept.service'
import {SysMenuService} from './service/sys-menu.service'
import {SysRoleService} from './service/sys-role.service'
import {SysUserService} from './service/sys-user.service'
import {ComChangLogService} from '../_common/service/com-chang-log.service'
import {ComChangLogEntity} from '../_common/entity/com-chang-log.entity'
import {TypeOrmModule} from '@nestjs/typeorm'
import {SysDeptEntity} from './entity/sys-dept.entity'
import {SysMenuEntity} from './entity/sys-menu.entity'
import {SysRoleEntity} from './entity/sys-role.entity'
import {SysUserDeptEntity} from './entity/sys-role-dept.entity'
import {SysUserEntity} from './entity/sys-user.entity'
import {SysUserRoleEntity} from './entity/sys-user-role.entity'

export const systemService = [SysDeptService, SysMenuService, SysRoleService, SysUserService]
export const commonService = [ComChangLogService]

export const systemEntity = [ComChangLogEntity]
export const commonEntity = [
  SysDeptEntity,
  SysMenuEntity,
  SysRoleEntity,
  SysUserDeptEntity,
  SysUserEntity,
  SysUserRoleEntity,
]

@Module({
  imports: [TypeOrmModule.forFeature([...systemEntity, ...commonEntity])],
  providers: [...systemService, ...commonService],
  exports: [...systemService, ...commonService],
})
export class SystemModule {}

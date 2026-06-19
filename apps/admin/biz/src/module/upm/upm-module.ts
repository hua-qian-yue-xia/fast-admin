import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

// entity
import { UpmDeptEntity } from "./entity/upm-dept.entity"
import { UpmMenuEntity } from "./entity/upm-menu.entity"
import { UpmRoleEntity } from "./entity/upm-role.entity"
import { UpmUserEntity } from "./entity/upm-user.entity"

// controller
import { UpmDeptController } from "./controller/upm-dept-controller"
import { UpmMenuController } from "./controller/upm-menu-controller"
import { UpmRoleController } from "./controller/upm-role-controller"
import { UpmUserController } from "./controller/upm-user-controller"

// service
import { UpmDeptService } from "./service/upm-dept-service"
import { UpmMenuService } from "./service/upm-menu-service"
import { UpmRoleService } from "./service/upm-role-service"
import { UpmUserService } from "./service/upm-user-service"
const service = [UpmDeptService, UpmMenuService, UpmRoleService, UpmUserService]

// share
import { UpmDeptShare } from "./service/share/upm-dept-share"
import { UpmMenuShare } from "./service/share/upm-menu-share"
import { UpmRoleShare } from "./service/share/upm-role-share"
import { UpmUserShare } from "./service/share/upm-user-share"
const share = [UpmDeptShare, UpmMenuShare, UpmRoleShare, UpmUserShare]

@Module({
	imports: [TypeOrmModule.forFeature([UpmDeptEntity, UpmMenuEntity, UpmRoleEntity, UpmUserEntity])],
	providers: [...service, ...share],
	controllers: [UpmDeptController, UpmMenuController, UpmRoleController, UpmUserController],
})
export class UpmModule {}

import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

// entity
import { UpmDeptEntity } from "./entity"
import { UpmMenuEntity } from "./entity"
import { UpmRoleEntity } from "./entity"
import { UpmUserEntity } from "./entity"

// controller
import { UpmDeptController } from "./controller"
import { UpmMenuController } from "./controller"
import { UpmRoleController } from "./controller"
import { UpmUserController } from "./controller"

// service
import { UpmDeptService } from "./service"
import { UpmMenuService } from "./service"
import { UpmRoleService } from "./service"
import { UpmUserService } from "./service"
const service = [UpmDeptService, UpmMenuService, UpmRoleService, UpmUserService]

// share
import { UpmDeptShare } from "./service"
import { UpmMenuShare } from "./service"
import { UpmRoleShare } from "./service"
import { UpmUserShare } from "./service"
const share = [UpmDeptShare, UpmMenuShare, UpmRoleShare, UpmUserShare]

@Module({
	imports: [TypeOrmModule.forFeature([UpmDeptEntity, UpmMenuEntity, UpmRoleEntity, UpmUserEntity])],
	providers: [...service, ...share],
	controllers: [UpmDeptController, UpmMenuController, UpmRoleController, UpmUserController],
})
export class UpmModule {}

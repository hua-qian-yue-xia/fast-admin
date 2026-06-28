import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { UpmDeptController, UpmMenuController, UpmRoleController, UpmUserController } from "./controller"
import { UpmDeptEntity, UpmMenuEntity, UpmRoleEntity, UpmUserEntity } from "./entity"
import {
	UpmDeptService,
	UpmDeptShare,
	UpmMenuService,
	UpmMenuShare,
	UpmRoleService,
	UpmRoleShare,
	UpmUserService,
	UpmUserShare,
} from "./service"

const entities = [UpmDeptEntity, UpmMenuEntity, UpmRoleEntity, UpmUserEntity]

const controllers = [UpmDeptController, UpmMenuController, UpmRoleController, UpmUserController]

const services = [UpmDeptService, UpmMenuService, UpmRoleService, UpmUserService]

const shares = [UpmDeptShare, UpmMenuShare, UpmRoleShare, UpmUserShare]

@Module({
	imports: [TypeOrmModule.forFeature(entities)],
	providers: [...services, ...shares],
	controllers,
})
export class UpmModule {}

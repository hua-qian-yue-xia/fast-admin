import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

// entity
import { SysApiEntity, SysApiTagRelEntity } from "./entity"
import { SysDictEntity } from "./entity"
import { SysDictItemEntity } from "./entity"
import { SysLogEntity } from "./entity"

// controller
import { SysApiController } from "./controller"
import { SysDictController } from "./controller"
import { SysDictItemController } from "./controller"
import { SysFileConfigController } from "./controller"
import { SysFileController } from "./controller"
import { SysLogController } from "./controller"

// service
import { SysApiService } from "./service"
import { SysDictService } from "./service"
import { SysDictItemService } from "./service"
import { SysFileConfigService } from "./service"
import { SysFileService } from "./service"
import { SysLogService } from "./service"
const services = [SysApiService, SysDictService, SysDictItemService, SysFileConfigService, SysFileService, SysLogService]

// event
import { SysApiEvent } from "./common"
import { SysDictEvent } from "./common"
import { SysLogEvent } from "./common"
const events = [SysApiEvent, SysDictEvent, SysLogEvent]

@Module({
	imports: [TypeOrmModule.forFeature([SysApiEntity, SysApiTagRelEntity, SysDictItemEntity, SysDictEntity, SysLogEntity])],
	providers: [...services, ...events],
	controllers: [SysApiController, SysDictController, SysDictItemController, SysFileConfigController, SysFileController, SysLogController],
})
export class SysModule {}

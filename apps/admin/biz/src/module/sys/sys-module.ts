import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

// entity
import { SysApiEntity, SysApiTagRelEntity } from "./entity/sys-api.entity"
import { SysDictEntity } from "./entity/sys-dict.entity"
import { SysDictItemEntity } from "./entity/sys-dict-item.entity"
import { SysLogEntity } from "./entity/sys-log.entity"

// controller
import { SysApiController } from "./controller/sys-api-controller"
import { SysDictController } from "./controller/sys-dict-controller"
import { SysDictItemController } from "./controller/sys-dict-item-controller"
import { SysFileConfigController } from "./controller/sys-file-config-controller"
import { SysFileController } from "./controller/sys-file-controller"
import { SysLogController } from "./controller/sys-log-controller"

// service

// event
import { SysApiEvent } from "./common/event/sys-api-event"
import { SysDictEvent } from "./common/event/sys-dict-event"
import { SysLogEvent } from "./common/event/sys-log-event"
const events = [SysApiEvent, SysDictEvent, SysLogEvent]

@Module({
	imports: [TypeOrmModule.forFeature([SysApiEntity, SysApiTagRelEntity, SysDictItemEntity, SysDictEntity, SysLogEntity])],
	providers: [...events],
	controllers: [SysApiController, SysDictController, SysDictItemController, SysFileConfigController, SysFileController, SysLogController],
})
export class SysModule {}

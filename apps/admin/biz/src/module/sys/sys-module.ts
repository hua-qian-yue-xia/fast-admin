import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"

import { SysApiEvent, SysDictEvent, SysLogEvent } from "./common"
import {
	SysApiController,
	SysDictController,
	SysDictItemController,
	SysFileCategoryController,
	SysFileConfigController,
	SysFileController,
	SysLogController,
} from "./controller"
import {
	SysApiEntity,
	SysApiTagRelEntity,
	SysDictEntity,
	SysDictItemEntity,
	SysFileCategoryEntity,
	SysFileConfigEntity,
	SysFileEntity,
	SysLogEntity,
} from "./entity"
import {
	FileService,
	SysApiService,
	SysDictItemService,
	SysDictService,
	SysFileCategoryService,
	SysFileConfigService,
	SysFileService,
	SysLogService,
} from "./service"
import { SysFileConfigShare } from "./service/share"

const entities = [
	SysApiEntity,
	SysApiTagRelEntity,
	SysDictEntity,
	SysDictItemEntity,
	SysFileCategoryEntity,
	SysFileConfigEntity,
	SysFileEntity,
	SysLogEntity,
]

const controllers = [
	SysApiController,
	SysDictController,
	SysDictItemController,
	SysFileCategoryController,
	SysFileConfigController,
	SysFileController,
	SysLogController,
]

const services = [
	SysApiService,
	SysDictService,
	SysDictItemService,
	SysFileCategoryService,
	SysFileConfigService,
	FileService,
	SysFileService,
	SysLogService,
]

const shares = [SysFileConfigShare]

const events = [SysApiEvent, SysDictEvent, SysLogEvent]

@Module({
	imports: [TypeOrmModule.forFeature(entities)],
	providers: [...services, ...events, ...shares],
	controllers,
})
export class SysModule {}

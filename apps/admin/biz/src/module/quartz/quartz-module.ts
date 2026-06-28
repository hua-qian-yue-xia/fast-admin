import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"

import { QuartzTaskCategoryController, QuartzTaskController, QuartzTaskLogController } from "./controller"
import { QuartzTaskCategoryEntity, QuartzTaskEntity, QuartzTaskLogEntity } from "./entity"
import { QuartzBullService, QuartzTaskCategoryService, QuartzTaskLogService, QuartzTaskService } from "./service"
import { QuartzHandlerShare, QuartzTaskCategoryShare, QuartzTaskShare } from "./service/share"

const entities = [QuartzTaskCategoryEntity, QuartzTaskEntity, QuartzTaskLogEntity]

const controllers = [QuartzTaskCategoryController, QuartzTaskController, QuartzTaskLogController]

const services = [QuartzTaskCategoryService, QuartzTaskService, QuartzTaskLogService, QuartzBullService]

const shares = [QuartzHandlerShare, QuartzTaskCategoryShare, QuartzTaskShare]

@Module({
	imports: [ConfigModule, TypeOrmModule.forFeature(entities)],
	providers: [...services, ...shares],
	controllers,
	exports: [...shares],
})
export class QuartzModule {}

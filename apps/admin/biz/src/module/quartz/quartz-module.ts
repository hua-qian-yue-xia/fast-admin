import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"

// entity
import { QuartzTaskCategoryEntity, QuartzTaskEntity, QuartzTaskLogEntity } from "./entity"
const entity = [QuartzTaskCategoryEntity, QuartzTaskEntity, QuartzTaskLogEntity]

// controller
import { QuartzTaskCategoryController } from "./controller"
import { QuartzTaskController } from "./controller"
import { QuartzTaskLogController } from "./controller"

// service
import { QuartzTaskCategoryService } from "./service"
import { QuartzTaskService } from "./service"
import { QuartzTaskLogService } from "./service"
import { QuartzBullService } from "./service"
const services = [QuartzTaskCategoryService, QuartzTaskService, QuartzTaskLogService, QuartzBullService]

// share
import { QuartzHandlerShare } from "./share"
import { QuartzTaskCategoryShare } from "./share"
import { QuartzTaskShare } from "./share"
const share = [QuartzHandlerShare, QuartzTaskCategoryShare, QuartzTaskShare]

@Module({
	imports: [ConfigModule, TypeOrmModule.forFeature(entity)],
	providers: [...services, ...share],
	controllers: [QuartzTaskCategoryController, QuartzTaskController, QuartzTaskLogController],
	exports: [...share],
})
export class QuartzModule {}

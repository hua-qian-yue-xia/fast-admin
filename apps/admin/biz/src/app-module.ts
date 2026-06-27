import { Module } from "@nestjs/common"

import { GenDictModule, TagModule, LogModule } from "@aspen/aspen-fram"

import { QuartzModule } from "./module/quartz/quartz-module"
import { UpmModule } from "./module/upm/upm-module"
import { SysModule } from "./module/sys/sys-module"

@Module({
	imports: [GenDictModule.forRoot(), TagModule.forRoot(), LogModule.forRoot(), UpmModule, SysModule, QuartzModule],
	providers: [],
	controllers: [],
})
export class AdminModule {}

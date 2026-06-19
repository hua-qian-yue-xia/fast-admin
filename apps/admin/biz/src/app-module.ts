import { Module } from "@nestjs/common"

import { GenDictModule } from "@aspen/aspen-fram"

import { UpmModule } from "./module/upm/upm-module"
import { SysModule } from "./module/sys/sys-module"

@Module({
	imports: [GenDictModule.forRoot(), UpmModule, SysModule],
	providers: [],
	controllers: [],
})
export class AdminModule {}

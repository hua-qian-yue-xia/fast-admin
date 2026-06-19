import { APP_INTERCEPTOR } from "@nestjs/core"
import { Global, Module } from "@nestjs/common"

import { AspenLogInterceptor } from "./log-decorator"

@Module({})
export class LogModule {
	static forRoot() {
		return {
			module: LogModule,
			global: true,
			providers: [
				AspenLogInterceptor,
				{
					provide: APP_INTERCEPTOR,
					useClass: AspenLogInterceptor,
				},
			],
			exports: [AspenLogInterceptor],
		}
	}
}

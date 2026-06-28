import { DynamicModule, ExecutionContext, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { FastifyRequest } from "fastify"
import { ClsModule } from "nestjs-cls"

// 支持通过 `a.b.c` 这种点路径从请求对象中提取值.
const getByPath = (target: Record<string, any>, path: string): any => {
	return path.split(".").reduce((current, key) => {
		if (current == null) {
			return undefined
		}
		return current[key]
	}, target)
}

// 按阶段配置的 key 批量写入 CLS,便于在业务层统一读取当前请求上下文.
const saveStageKeys = (cls: any, source: Record<string, any>, keys: Array<string>) => {
	for (const key of keys) {
		cls.set(key, getByPath(source, key))
	}
}

@Module({})
export class GlobalClsModule {
	static forRoot(): DynamicModule {
		return {
			global: true,
			module: GlobalClsModule,
			imports: [
				ConfigModule,
				ClsModule.forRootAsync({
					global: true,
					imports: [ConfigModule],
					inject: [ConfigService],
					useFactory: (configService: ConfigService<AspenConf.Application, true>) => {
						// 三个阶段各自维护独立 key 列表,避免把所有上下文都塞到同一个初始化点.
						const storageConfig = configService.getOrThrow("syncStorage", { infer: true })
						const storage = storageConfig.storage ?? {
							middlewareKeys: [],
							guardKeys: [],
							interceptorKeys: [],
						}

						return {
							middleware: {
								mount: true,
								setup(cls, req: FastifyRequest) {
									// middleware 适合存放 header,ip,url 这类请求一进入就存在的数据.
									saveStageKeys(cls, req as Record<string, any>, storage.middlewareKeys)
								},
							},
							guard: {
								mount: true,
								setup(cls, context: ExecutionContext) {
									// guard 适合补充鉴权后才具备的 user 等上下文.
									const req = context.switchToHttp().getRequest<FastifyRequest>()
									saveStageKeys(cls, req as Record<string, any>, storage.guardKeys)
								},
							},
							interceptor: {
								mount: true,
								setup(cls, context: ExecutionContext) {
									// interceptor 适合补充控制器执行前后的路由参数或业务上下文.
									const req = context.switchToHttp().getRequest<FastifyRequest>()
									saveStageKeys(cls, req as Record<string, any>, storage.interceptorKeys)
								},
							},
						}
					},
				}),
			],
		}
	}
}

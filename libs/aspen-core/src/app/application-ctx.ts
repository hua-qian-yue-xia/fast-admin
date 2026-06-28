import { Abstract, INestApplicationContext, Type } from "@nestjs/common"
import { ClsService } from "nestjs-cls"

export type BeanToken<T = any> = Type<T> | Abstract<T> | string | symbol

/**
 * 应用上下文工具,提供类似 Spring 的 Bean 获取能力.
 * 建议仅在框架集成,启动装配等少量场景使用,业务代码优先使用构造器注入.
 */
export class AppCtx {
	private static app: INestApplicationContext | null = null

	static init(app: INestApplicationContext): void {
		this.app = app
	}

	static getApp(): INestApplicationContext {
		if (!this.app) {
			throw new Error("AppCtx尚未初始化,请先完成Application.run()")
		}
		return this.app
	}

	/**
	 * 直接从当前应用容器中获取已注册的 Provider.
	 * 适合普通单例Provider,行为更接近Spring的getBean()
	 */
	static getBean<T>(token: BeanToken<T>): T {
		return this.getApp().get<T>(token, { strict: false })
	}

	static getOptionalBean<T>(token: BeanToken<T>): T | null {
		try {
			return this.getApp().get<T>(token, { strict: false })
		} catch {
			return null
		}
	}

	/**
	 * 按 Nest 的 resolve 语义解析 Provider.
	 * 与 getBean() 的区别是:它会走异步解析流程,更适合 request/transient 作用域 Provider.
	 */
	static async resolveBean<T>(token: BeanToken<T>): Promise<T> {
		return this.getApp().resolve<T>(token, undefined, { strict: false })
	}

	/**
	 * 从当前 CLS 上下文中读取值.
	 * 适合获取 requestId,当前用户,租户等请求级上下文数据.
	 */
	static getClsValue<T = any>(key: string): T | undefined {
		return this.getBean(ClsService).get<T>(key)
	}
}

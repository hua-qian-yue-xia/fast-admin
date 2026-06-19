import { INestApplication } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

export const registerSwaggerDoc = (app: INestApplication, localIp: string) => {
	const config = app.get<ConfigService<AspenConf.Application, true>>(ConfigService)

	const appConfig = config.get("app", { infer: true })
	const docConfig = config.get("doc", { infer: true })

	if (!docConfig.enable) {
		return
	}

	const options = new DocumentBuilder()
		.addBasicAuth()
		.setTitle(appConfig?.name ?? "")
		.setDescription(appConfig?.description ?? "")
		.setVersion(appConfig?.version ?? "")
		.build()
	const document = SwaggerModule.createDocument(app, options, {
		extraModels: [],
	})
	SwaggerModule.setup(docConfig?.pathPrefix ?? "", app, document)
	console.table({
		"swagger 文档 地址": `${localIp}:${appConfig?.port}${docConfig?.pathPrefix ?? ""}`,
		"swagger json 地址": `${localIp}:${appConfig?.port}${docConfig?.pathPrefix ?? ""}-json`,
	})
}

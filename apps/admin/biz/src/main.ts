import * as path from "path"

import { Application } from "@aspen/aspen-core"

import { AdminModule } from "./app-module"

async function bootstrap() {
	const configPath = path.resolve(__dirname, "./config")
	await Application.run(AdminModule, configPath)
}

bootstrap()

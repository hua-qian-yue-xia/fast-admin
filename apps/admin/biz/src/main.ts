import * as path from "path"

import { Application } from "@aspen/aspen-core"

import { AdminModule } from "./app-module"

async function bootstrap() {
	await Application.run(AdminModule, path.resolve(__dirname, "./config"))
}

bootstrap()

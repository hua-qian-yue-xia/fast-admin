import * as path from "node:path"
import * as fs from "node:fs"

import * as yaml from "js-yaml"
import * as compat from "es-toolkit/compat"
import { ConfigFactory } from "@nestjs/config"

import { DEFAULT_CONF } from "./default-config"

export abstract class ConfTool {
	static readActiveYamlFile = (cwdPath: string): ConfigFactory => {
		// 判断`cwdPath`文件是否存在
		if (!fs.existsSync(cwdPath)) {
			throw new Error(`配置文件目录${cwdPath}不存在`)
		}
		let defaultConf = this.readYamlFile(cwdPath, "")
		defaultConf = compat.merge(DEFAULT_CONF, defaultConf)
		const envModeConfig = this.readYamlFile(cwdPath, this.readEnvMode())
		const configObj = compat.merge(defaultConf, envModeConfig)
		return configObj as any
	}

	static readYamlFile = (cwdPath: string, type: AspenConf.Active) => {
		const filename = type ? `-${type}` : type
		const filePath: string = path.join(cwdPath, `application${filename}.yaml`)
		// 判断`filePath`文件是否存在
		if (!fs.existsSync(filePath)) {
			return {}
		}
		return yaml.load(fs.readFileSync(filePath, "utf-8")) as Record<string, any>
	}

	static readEnvMode = (): AspenConf.Active => {
		return process.env.NODE_ENV as AspenConf.Active
	}
}

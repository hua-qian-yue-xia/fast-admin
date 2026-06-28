import * as fs from "fs-extra"

import { Injectable, Scope } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { plainToInstance } from "class-transformer"

import * as path from "path"

import { exception } from "@aspen/aspen-fram"

import { AbstractFileClient } from "./base/base-file-service"
import { FileS3Config, FileLocalConfig } from "./base/file-config"
import MinioFileService from "./impl/min-io-file-service"
import LocalFileService from "./impl/local-file-service"

import { SysFileConfigService } from "../sys-file-config-service"

import { sysFileEnum } from "../../common/sys-constant"

@Injectable({ scope: Scope.DEFAULT })
export class FileService {
	private readonly fileServiceMap = new Map<string, AbstractFileClient>()

	constructor(
		private readonly sysFileConfigService: SysFileConfigService,
		private readonly configService: ConfigService,
	) {}

	getChunkFullPath() {
		const localFileConfig = this.configService.get<AspenConf.LocalFileConf>("localFile")
		if (!localFileConfig.basePath || !localFileConfig.chunkPath) {
			throw new exception.validator("本地文件配置错误,请检查basePath和chunkPath是否配置")
		}
		const chunkFullPath = path.join(process.cwd(), localFileConfig.basePath, localFileConfig.chunkPath)
		// 检查分块目录是否存在,不存在就创建
		fs.ensureDirSync(chunkFullPath)
		return chunkFullPath
	}

	async getFileService(code?: string): Promise<AbstractFileClient | null> {
		// 如果有code先查询code对应的配置,没有就查询默认配置
		const config = await this.sysFileConfigService.getConfigByCodeOrDefault(code)
		if (!config) {
			throw new exception.validator(`文件配置"${code ?? ""}"不存在`)
		}
		const fileConfig = config.config
		// 检查缓存
		if (this.fileServiceMap.has(config.uniqueCode)) {
			const fileService = this.fileServiceMap.get(config.uniqueCode)!
			switch (config.type) {
				case sysFileEnum.configType.named.MINIO.raw.code:
					fileService.refreshConfig(plainToInstance(FileS3Config, config.config))
					break
				case sysFileEnum.configType.named.FILE.raw.code:
					fileService.refreshConfig(plainToInstance(FileLocalConfig, config.config))
					break
			}
			return fileService
		}

		let fileService: AbstractFileClient = null
		const chunkFullPath = this.getChunkFullPath()
		// 根据配置创建文件客户端
		switch (config.type) {
			case sysFileEnum.configType.named.MINIO.raw.code:
				fileService = new MinioFileService(config.uniqueCode, chunkFullPath, plainToInstance(FileS3Config, config.config))
				break
			case sysFileEnum.configType.named.FILE.raw.code:
				fileService = new LocalFileService(config.uniqueCode, chunkFullPath, plainToInstance(FileLocalConfig, config.config))
				break
			default:
				throw new exception.validator(`文件配置"${code ?? ""}"不存在`)
		}
		if (fileService) {
			this.fileServiceMap.set(config.uniqueCode, fileService)
		}
		return fileService
	}

	/**
	 * 移除文件服务缓存
	 * @param code
	 */
	removeFileService(code: string) {
		this.fileServiceMap.delete(code)
	}
}

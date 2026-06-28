import { Injectable } from "@nestjs/common"
import { In, Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { MemoryStorageFile } from "@blazity/nest-file-fastify"
import * as _ from "es-toolkit/compat"

import { exception } from "@aspen/aspen-fram"

import { SysFileChunkUploadDto, SysFileEntity, SysFileQueryDto, SysFileSingleUploadDto } from "../entity"
import { SysFileConfigService } from "./sys-file-config-service"

import { FileService } from "./file"

@Injectable()
export class SysFileService {
	constructor(
		@InjectRepository(SysFileEntity) private readonly sysFileRepo: Repository<SysFileEntity>,

		private readonly fileConfigService: SysFileConfigService,
		private readonly fileService: FileService,
	) {}

	// 单文件上传
	async uploadSimple(file: MemoryStorageFile, dto: SysFileSingleUploadDto) {
		const fileService = await this.fileService.getFileService()
		const fileUploadVo = await fileService.uploadSingle(file.buffer, dto.filename, file.mimetype)
		if (!fileUploadVo) throw new exception.runtime("文件上传失败")

		let config = null
		if (fileUploadVo.configCode) {
			config = await this.fileConfigService.getConfigByCodeOrDefault(fileUploadVo.configCode)
		}
		// 更新文件元数据
		const sysFile = this.sysFileRepo.create({
			parentFileId: null,
			config: config,
			category: null,
			fileName: fileUploadVo.fileName,
			filePath: fileUploadVo.filePath,
			fileType: fileUploadVo.fileType,
			fileSize: fileUploadVo.fileSize,
		})
		await this.sysFileRepo.save(sysFile)
		return sysFile
	}

	// 分片文件上传
	async uploadChunk(file: MemoryStorageFile, dto: SysFileChunkUploadDto) {
		const fileService = await this.fileService.getFileService()
		return fileService.uploadChunk({
			identifier: dto.identifier,
			chunkNumber: dto.chunkNumber,
			totalChunks: dto.totalChunks,
			filename: dto.filename,
			fileType: file.mimetype,
			file: file.buffer,
		})
	}

	// 文件分页
	async page(dto: SysFileQueryDto) {
		const queryBuilder = dto.createQueryBuilder(this.sysFileRepo)
		const page = await queryBuilder.pageMany(dto.getSimplePageObj())
		await this.disposePageRecords(page.records)
		return page
	}

	// 删除文件
	async delByIds(fileIds: Array<string>) {
		// 查询存不存在
		const roleList = await this.sysFileRepo.find({ where: { fileId: In(fileIds) } })
		if (!roleList.length) return 0
		// 删除数据
		const { affected } = await this.sysFileRepo.softDelete(fileIds)
		return affected ?? 0
	}

	async disposePageRecords(records: Array<SysFileEntity>) {
		if (_.isEmpty(records)) return
		for (const item of records) {
			if (!item?.config?.config?.domain) continue
			;(item.config as any).domain = item.config.config.domain
			;(item as any).config.config = null
		}
	}
}

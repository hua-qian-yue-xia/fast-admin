import { Body, Param, ParseArrayPipe, UseInterceptors } from "@nestjs/common"
import { UploadedFile, FileInterceptor, MemoryStorageFile } from "@blazity/nest-file-fastify"

import { exception, R, router } from "@aspen/aspen-fram"

import { SysFileService } from "../service"
import { SysFileChunkUploadDto, SysFileEntity, SysFileQueryDto, SysFileSingleUploadDto } from "../entity"
import { SysFileVo } from "./vo/sys-file-vo"

@router.controller({ summary: "文件管理", prefix: "/sys/file" })
export class SysFileController {
	constructor(private readonly sysFileService: SysFileService) {}

	@router.post({
		summary: "单文件上传",
		router: "/upload/simple",
		resType: {
			type: SysFileEntity,
		},
	})
	@UseInterceptors(FileInterceptor("file"))
	async uploadSimple(@UploadedFile() file: MemoryStorageFile, @Body() dto: SysFileSingleUploadDto) {
		if (!file) throw new exception.validator("请上传文件")
		const list = await this.sysFileService.uploadSimple(file, dto)
		return R.success(list)
	}

	@router.post({
		summary: "分片文件上传",
		router: "/upload/chunk",
		resType: {
			type: SysFileEntity,
		},
	})
	@UseInterceptors(FileInterceptor("file"))
	async uploadChunk(@UploadedFile() file: MemoryStorageFile, @Body() dto: SysFileChunkUploadDto) {
		if (!file) throw new exception.validator("请上传文件")
		const list = await this.sysFileService.uploadChunk(file, dto)
		return R.success(list)
	}

	@router.post({
		summary: "文件分页",
		router: "/page",
		resType: {
			wrapper: "page",
			type: SysFileVo,
		},
	})
	async page(@Body() dto: SysFileQueryDto) {
		const page = await this.sysFileService.page(dto)
		return R.success(page)
	}

	@router.delete({
		summary: "删除文件",
		router: "/:fileIds",
	})
	async delete(
		@Param("fileIds", new ParseArrayPipe({ items: String, separator: "," }))
		fileIds: Array<string>,
	) {
		const delCount = await this.sysFileService.delByIds(fileIds)
		return R.success(delCount)
	}
}

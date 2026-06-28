import { AspenSummary } from "@aspen/aspen-fram"

/*
 * ---------------------------------------------------------------
 * ## 文件内容存储-新增
 * ---------------------------------------------------------------
 */
export class SysFileVo {
	@AspenSummary({ summary: "文件id" })
	fileId: string

	@AspenSummary({ summary: "父文件id" })
	parentFileId?: string

	configId: string

	@AspenSummary({ summary: "分类id" })
	categoryId?: string

	@AspenSummary({ summary: "文件名" })
	fileName: string

	@AspenSummary({ summary: "文件路径" })
	filePath: string

	@AspenSummary({ summary: "完整路径" })
	fullPath: string

	@AspenSummary({ summary: "文件类型" })
	fileType: string

	@AspenSummary({ summary: "文件大小(k)" })
	fileSize: number

	setFullPath(fullPath: string) {
		this.fullPath = `${this.filePath}/${this.fileName}`
	}
}

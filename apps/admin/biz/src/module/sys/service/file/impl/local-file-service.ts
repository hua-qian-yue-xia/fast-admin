import * as fs from "fs-extra"
import * as path from "path"
import * as _ from "es-toolkit/compat"

import { exception } from "@aspen/aspen-fram"

import { AbstractFileClient, FileUploadVo } from "../base/base-file-service"
import { FileLocalConfig } from "../base/file-config"

/**
 * 本地文件服务
 */
export default class LocalFileService extends AbstractFileClient<FileLocalConfig> {
	// 上传目录
	private uploadDir: string

	constructor(id: string, chunkDir: string, config: FileLocalConfig) {
		super(id, chunkDir, config)
	}

	doInit(): void {
		const dir = this.resolveUploadDir()
		this.ensureWritableDir(dir)
		this.uploadDir = dir
	}

	/**
	 * 解析本地上传目录.
	 *
	 * - `cwd`:基于当前工作目录拼接相对路径;
	 * - `root`:要求 `uploadDir` 必须显式提供一个绝对可写目录,避免直接写入 `/`.
	 */
	private resolveUploadDir(): string {
		if (_.isEmpty(this.config.uploadDir)) {
			throw new exception.validator("本地文件上传目录不能为空")
		}

		if (this.config.dirType === "root") {
			if (!path.isAbsolute(this.config.uploadDir)) {
				throw new exception.validator("当dirType为root时,uploadDir必须为绝对路径")
			}
			const dir = path.normalize(this.config.uploadDir)
			if (dir === path.parse(dir).root) {
				throw new exception.validator("禁止直接使用系统根目录作为上传目录,请配置具体可写子目录")
			}
			return dir
		}

		return path.join(process.cwd(), this.config.uploadDir)
	}

	/**
	 * 确保目标目录存在且当前进程具备写权限.
	 */
	private ensureWritableDir(dir: string): void {
		fs.ensureDirSync(dir)
		try {
			fs.accessSync(dir, fs.constants.W_OK)
		} catch {
			throw new exception.validator(`上传目录不可写,请检查目录权限: ${dir}`)
		}
	}

	/**
	 * 标准化文件相对路径,统一移除前导斜杠和 Windows 分隔符.
	 */
	private normalizeRelativeFilePath(filePath: string): string {
		const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "")
		if (_.isEmpty(normalized)) {
			throw new exception.validator("文件路径不能为空")
		}
		return normalized
	}

	/**
	 * 构造最终入库的相对存储路径.
	 *
	 * 这里会附带日期前缀,并将该值作为 `filePath` 返回给上层,
	 * 这样后续 delete/getContent 可以直接复用,避免再次猜测日期目录.
	 */
	private buildStoredRelativePath(filePath: string): string {
		return path.posix.join(this.getTimeStrPath().replace(/^\/+/, ""), this.normalizeRelativeFilePath(filePath))
	}

	/**
	 * 基于存储相对路径解析本地绝对路径.
	 */
	private resolveAbsoluteFilePath(filePath: string): string {
		const normalized = this.normalizeRelativeFilePath(filePath)
		return path.join(this.uploadDir, ...normalized.split("/"))
	}

	/**
	 * 单文件上传文件(会有文件大小的限制比如大于10MB就不允许上传,请使用分片上传)
	 * @param file 文件流或Buffer
	 * @param path 存储路径,文件夹包括文件名`/logo/test_logo.png`
	 * @param type 文件类型
	 */
	override async uploadSingle(file: Buffer, filePath: string, fileType: string): Promise<FileUploadVo> {
		if (!this.uploadDir) this.doInit()
		const ext = path.extname(filePath)
		// 直接使用原始文件名,不再随机生成
		const fileNameNoExt = path.basename(filePath, ext)
		const storedRelativePath = this.buildStoredRelativePath(filePath)
		const absolutePath = this.resolveAbsoluteFilePath(storedRelativePath)
		// 确保目录存在
		await fs.ensureDir(path.dirname(absolutePath))
		// @ts-ignore
		fs.writeFileSync(absolutePath, file)
		const stats = fs.statSync(absolutePath)
		return {
			configCode: this.getId(),
			fileName: fileNameNoExt,
			filePath: storedRelativePath,
			fileType: fileType || ext.replace(".", ""),
			fileSize: stats.size,
			fullPath: absolutePath,
		}
	}

	/**
	 * 删除文件
	 * @param filePath 文件路径
	 */
	async delete(filePath: string): Promise<void> {
		if (!this.uploadDir) this.doInit()
		await fs.remove(this.resolveAbsoluteFilePath(filePath))
	}

	/**
	 * 获取文件内容
	 * @param filePath 文件路径
	 */
	async getContent(filePath: string): Promise<Buffer> {
		if (!this.uploadDir) this.doInit()
		return await fs.readFile(this.resolveAbsoluteFilePath(filePath))
	}
}

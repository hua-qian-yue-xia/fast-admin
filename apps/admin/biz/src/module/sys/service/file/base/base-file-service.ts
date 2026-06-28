import { Logger } from "@nestjs/common"
import * as _ from "es-toolkit/compat"
import * as dayjs from "dayjs"

import * as fs from "fs-extra"
import * as path from "path"

import { exception } from "@aspen/aspen-fram"

export interface UploadChunkDto {
	/**
	 * 文件唯一标识(MD5)
	 */
	identifier: string
	/**
	 * 当前分片序号
	 */
	chunkNumber: number
	/**
	 * 总分片数
	 */
	totalChunks: number
	/**
	 * 原始文件名
	 */
	filename: string
	/**
	 * 文件类型
	 */
	fileType: string
	/**
	 * 分片数据
	 */
	file: Buffer
}

export interface FileUploadVo {
	/**
	 * 配置id
	 */
	configCode?: string
	/**
	 * 文件名
	 */
	fileName: string
	/**
	 * 文件路径
	 */
	filePath: string
	/**
	 * 文件类型
	 */
	fileType: string
	/**
	 * 文件大小
	 */
	fileSize: number
	/**
	 * 完整路径(如果有配置域名会包含域名)
	 */
	fullPath: string
}

export interface IFileClientService {
	/**
	 * 获得客户端编号
	 */
	getId(): string

	/**
	 * 单文件上传文件(会有文件大小的限制比如大于10MB就不允许上传,请使用分片上传)
	 * @param file 文件流或Buffer
	 * @param filePath 存储路径,文件夹包括文件名`/logo/test_logo.png`
	 * @param fileType 文件类型
	 */
	uploadSingle(file: Buffer, filePath: string, fileType: string): Promise<FileUploadVo>

	/**
	 * 上传单个分片
	 */
	uploadChunk(dto: UploadChunkDto): Promise<void>

	/**
	 * 检查分片状态(用于秒传和断点续传)
	 * @param identifier 文件唯一标识(MD5)
	 * @returns 已上传的分片序号列表
	 */
	checkChunks(identifier: string): Promise<Array<number>>

	/**
	 * 合并分片
	 * @param identifier 文件唯一标识(MD5)
	 * @param filePath 存储路径,文件夹包括文件名`/logo/test_logo.png`
	 * @param fileType 文件类型
	 */
	mergeChunks(identifier: string, filePath: string, fileType: string): Promise<FileUploadVo>

	/**
	 * 删除文件
	 * @param filePath 文件路径
	 */
	delete(filePath: string): Promise<void>

	/**
	 * 获取文件内容
	 * @param filePath 文件路径
	 */
	getContent(filePath: string): Promise<Buffer>
}

export interface IFileConfig {
	/**
	 * 获取文件标签
	 */
	getTag(): string
}

export abstract class AbstractFileClient<C extends IFileConfig = any> implements IFileClientService {
	protected logger = new Logger(this.constructor.name)

	/**
	 * 配置编号
	 */
	private id: string
	/**
	 * 分片目录
	 */
	private chunkDir: string
	/**
	 * 文件配置
	 */
	protected config: C

	constructor(id: string, chunkDir: string, config: C) {
		this.id = id
		this.chunkDir = chunkDir
		this.config = config
	}

	/**
	 * 初始化
	 */
	private init() {
		this.doInit()
		// 确保分片目录存在
		fs.ensureDirSync(this.chunkDir)
		this.log(`初始化文件客户端(${this.config.getTag()});配置:${JSON.stringify(this.config)};id:${this.id};`)
	}

	/**
	 * 自定义初始化
	 */
	protected doInit(): void {}

	/**
	 * 日志输出
	 */
	protected log(msg: string) {
		this.logger.log(`文件客户端(${this.config.getTag()});id:${this.id};${msg}`)
	}

	/**
	 * 获取时间字符串路径
	 * @example 2023/01/01
	 */
	protected getTimeStrPath() {
		return `/${dayjs().format("YYYY/MM/DD")}`
	}

	/**
	 * 刷新config
	 */
	public refreshConfig(config: C) {
		if (_.isEqual(this.config, config)) return
		this.config = config
		// 初始化
		this.init()
		this.log(`刷新文件客户端;配置:${JSON.stringify(this.config)};id:${this.id};`)
	}

	public getId(): string {
		return this.id
	}

	abstract uploadSingle(file: Buffer, filePath: string, fileType: string): Promise<FileUploadVo>

	/**
	 * 上传单个分片
	 */
	async uploadChunk(dto: UploadChunkDto): Promise<void> {
		if (!this.chunkDir) this.doInit()
		// 分片目录
		const parentPath = path.join(this.chunkDir, `${dto.identifier}`)
		// 如果已经存在直接删除
		if (dto.chunkNumber === 1 && (await fs.pathExists(parentPath))) {
			fs.removeSync(parentPath)
		}
		fs.ensureDirSync(parentPath)
		// 写入文件
		const chunkPath = path.join(parentPath, `${dto.chunkNumber}${path.extname(dto.filename)}`)
		const writeStream = fs.createWriteStream(chunkPath)
		writeStream.write(dto.file)
		writeStream.end()
		await new Promise<void>((resolve, reject) => {
			writeStream.on("finish", () => resolve())
			writeStream.on("error", reject)
		})
		// 判断是否上传完所有分片
		if (dto.chunkNumber === dto.totalChunks) {
			const chunks = await fs.readdir(parentPath)
			if (chunks.length === dto.totalChunks) {
				await this.mergeChunks(dto.identifier, dto.filename, dto.fileType)
			}
		}
	}

	/**
	 * 检查分片状态(用于秒传和断点续传)
	 * @param identifier 文件唯一标识(MD5)
	 * @returns 已上传的分片序号列表
	 */
	async checkChunks(identifier: string): Promise<Array<number>> {
		if (!(await fs.pathExists(this.chunkDir))) return []
		const files = await fs.readdir(path.join(this.chunkDir, identifier))
		// 分片顺序
		return files.map((f) => parseInt(f)).filter((n) => !isNaN(n))
	}

	/**
	 * 合并分片
	 * @param identifier 文件唯一标识(MD5)
	 * @param filePath 存储路径,文件夹包括文件名`/logo/test_logo.png`
	 * @param fileType 文件类型
	 */
	async mergeChunks(identifier: string, filePath: string, fileType: string): Promise<FileUploadVo> {
		if (!this.chunkDir) this.doInit()
		const chunksDir = path.join(this.chunkDir, identifier)
		// 如果分片目录不存在直接抛错,避免返回值与方法签名不一致
		if (!(await fs.pathExists(chunksDir))) {
			throw new exception.validator(`分片目录不存在:${identifier}`)
		}
		const chunks = await fs.readdir(chunksDir)
		// 按序号排序
		chunks.sort((a, b) => parseInt(a) - parseInt(b))
		// 创建合并后的临时文件
		const mergedFilePath = path.join(chunksDir, filePath)
		const writeStream = fs.createWriteStream(mergedFilePath)
		for (const chunk of chunks) {
			const chunkPath = path.join(chunksDir, chunk)
			const data = await fs.readFile(chunkPath)
			writeStream.write(data)
		}
		writeStream.end()
		await new Promise<void>((resolve, reject) => {
			writeStream.on("finish", () => resolve())
			writeStream.on("error", reject)
		})
		// 调用最终的文件服务上传
		const fileBuffer = await fs.readFile(mergedFilePath)
		const result = await this.uploadSingle(fileBuffer, filePath, fileType)
		// 清理临时文件和分片目录
		await fs.remove(mergedFilePath)
		await fs.remove(chunksDir)
		return result
	}

	abstract delete(filePath: string): Promise<void>

	abstract getContent(filePath: string): Promise<Buffer>
}

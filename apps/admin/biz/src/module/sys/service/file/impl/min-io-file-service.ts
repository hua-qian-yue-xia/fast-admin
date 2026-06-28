import { createHash, createHmac } from "node:crypto"
import * as path from "path"

import { exception } from "@aspen/aspen-fram"

import { AbstractFileClient, FileUploadVo } from "../base/base-file-service"
import { FileS3Config } from "../base/file-config"

type SignedRequestOptions = {
	method: "PUT" | "GET" | "DELETE"
	objectKey: string
	body?: Buffer
	contentType?: string
}

/**
 * MinIO / S3 兼容文件服务.
 *
 * 当前实现基于 S3 Signature V4 直接签名请求,
 * 不依赖额外 SDK,便于在当前工程内以最小依赖实现对象存储能力.
 */
export default class MinioFileService extends AbstractFileClient<FileS3Config> {
	private endpoint: URL

	private readonly region = "us-east-1"

	override doInit(): void {
		if (!this.config.endpoint || !this.config.bucket || !this.config.accessKey || !this.config.accessSecret) {
			throw new exception.validator("MinIO配置不完整,请检查endpoint,bucket,accessKey,accessSecret")
		}

		const endpoint =
			this.config.endpoint.startsWith("http://") || this.config.endpoint.startsWith("https://")
				? this.config.endpoint
				: `http://${this.config.endpoint}`
		this.endpoint = new URL(endpoint)
	}

	override async uploadSingle(file: Buffer, filePath: string, fileType: string): Promise<FileUploadVo> {
		if (!this.endpoint) {
			this.doInit()
		}

		const objectKey = this.buildObjectKey(filePath)
		await this.requestObject({
			method: "PUT",
			objectKey,
			body: file,
			contentType: fileType || "application/octet-stream",
		})

		const ext = path.extname(filePath)
		return {
			configCode: this.getId(),
			fileName: path.basename(filePath, ext),
			filePath: objectKey,
			fileType: fileType || ext.replace(".", ""),
			fileSize: file.length,
			fullPath: this.resolvePublicUrl(objectKey),
		}
	}

	override async delete(filePath: string): Promise<void> {
		if (!this.endpoint) {
			this.doInit()
		}

		await this.requestObject({
			method: "DELETE",
			objectKey: this.normalizeObjectKey(filePath),
		})
	}

	override async getContent(filePath: string): Promise<Buffer> {
		if (!this.endpoint) {
			this.doInit()
		}

		const response = await this.requestObject({
			method: "GET",
			objectKey: this.normalizeObjectKey(filePath),
		})
		const arrayBuffer = await response.arrayBuffer()
		return Buffer.from(arrayBuffer)
	}

	/**
	 * 发送带 S3 V4 签名的对象请求.
	 */
	private async requestObject(options: SignedRequestOptions): Promise<Response> {
		const requestTime = new Date()
		const amzDate = this.formatAmzDate(requestTime)
		const dateStamp = amzDate.slice(0, 8)
		const payloadHash = this.sha256Hex(options.body ?? Buffer.alloc(0))
		const canonicalUri = this.buildCanonicalUri(options.objectKey)
		const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`
		const signedHeaders = "host;x-amz-content-sha256;x-amz-date"
		const canonicalRequest = [
			options.method,
			canonicalUri,
			"",
			`host:${this.endpoint.host}`,
			`x-amz-content-sha256:${payloadHash}`,
			`x-amz-date:${amzDate}`,
			"",
			signedHeaders,
			payloadHash,
		].join("\n")
		const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, this.sha256Hex(canonicalRequest)].join("\n")
		const signature = this.signString(stringToSign, dateStamp)
		const authorization = [
			`AWS4-HMAC-SHA256 Credential=${this.config.accessKey}/${credentialScope}`,
			`SignedHeaders=${signedHeaders}`,
			`Signature=${signature}`,
		].join(", ")

		const response = await fetch(new URL(canonicalUri, this.endpoint), {
			method: options.method,
			headers: {
				authorization,
				"x-amz-content-sha256": payloadHash,
				"x-amz-date": amzDate,
				...(options.contentType ? { "content-type": options.contentType } : {}),
			},
			body: options.body ? new Uint8Array(options.body) : undefined,
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new exception.core(`MinIO请求失败[${options.method} ${options.objectKey}]: ${response.status} ${errorText}`)
		}

		return response
	}

	/**
	 * 构造对象 key.
	 *
	 * 最终落库路径统一携带日期前缀,避免所有文件直接堆叠在 bucket 根目录.
	 */
	private buildObjectKey(filePath: string): string {
		return path.posix.join(this.getTimeStrPath().replace(/^\/+/, ""), this.normalizeObjectKey(filePath))
	}

	/**
	 * 标准化对象 key,统一移除前导斜杠,避免 `path.join` 将后续片段重置为绝对路径.
	 */
	private normalizeObjectKey(filePath: string): string {
		return filePath.replace(/^\/+/, "")
	}

	/**
	 * 构造 S3 兼容请求的规范 URI,采用 path-style 访问 bucket.
	 */
	private buildCanonicalUri(objectKey: string): string {
		const basePath = this.endpoint.pathname.replace(/\/$/, "")
		const keyPath = this.normalizeObjectKey(objectKey)
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/")
		return `${basePath}/${encodeURIComponent(this.config.bucket)}/${keyPath}`.replace(/\/{2,}/g, "/")
	}

	/**
	 * 解析对外访问地址.
	 *
	 * - 优先使用配置中的 `domain`;
	 * - 未配置 `domain` 时回落到 MinIO endpoint.
	 */
	private resolvePublicUrl(objectKey: string): string {
		const encodedObjectKey = this.normalizeObjectKey(objectKey)
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/")
		const basePath = this.endpoint.pathname.replace(/\/$/, "")
		if (this.config.domain) {
			return `${this.normalizePublicDomain(this.config.domain)}/${encodedObjectKey}`
		}
		return `${this.endpoint.origin}${basePath}/${encodeURIComponent(this.config.bucket)}/${encodedObjectKey}`
	}

	/**
	 * 标准化公网访问域名.
	 *
	 * 若用户未显式提供协议,默认补齐 `https://`,避免生成不可直接访问的裸域名链接.
	 */
	private normalizePublicDomain(domain: string): string {
		const trimmed = domain.trim()
		if (!trimmed) {
			return trimmed
		}
		const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
		return withProtocol.replace(/\/+$/, "")
	}

	/**
	 * 计算字符串或二进制内容的 SHA-256 十六进制摘要.
	 */
	private sha256Hex(value: string | Buffer): string {
		return createHash("sha256").update(value).digest("hex")
	}

	/**
	 * 生成 S3 Signature V4 签名串.
	 */
	private signString(stringToSign: string, dateStamp: string): string {
		const kDate = createHmac("sha256", `AWS4${this.config.accessSecret}`).update(dateStamp).digest()
		const kRegion = createHmac("sha256", kDate).update(this.region).digest()
		const kService = createHmac("sha256", kRegion).update("s3").digest()
		const kSigning = createHmac("sha256", kService).update("aws4_request").digest()
		return createHmac("sha256", kSigning).update(stringToSign).digest("hex")
	}

	/**
	 * 将时间格式化为 AWS 兼容的 `YYYYMMDDTHHmmssZ`.
	 */
	private formatAmzDate(date: Date): string {
		return date.toISOString().replace(/[:-]|\.\d{3}/g, "")
	}
}

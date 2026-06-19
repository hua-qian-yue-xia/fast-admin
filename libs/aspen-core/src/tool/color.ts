export type AnsiColor = "red" | "yellow" | "green" | "cyan" | "blue" | "magenta" | "gray"
export type AnsiColorName = AnsiColor | "reset"

export class ColorTool {
	private static readonly RESET = "\x1b[0m"

	private static readonly ANSI_CODES: Record<AnsiColor, string> = {
		// red 红色 #FF0000
		red: "\x1b[31m",
		// yellow 黄色 #FFFF00
		yellow: "\x1b[33m",
		// green 绿色 #00FF00
		green: "\x1b[32m",
		// cyan 青色 #00FFFF
		cyan: "\x1b[36m",
		// blue 蓝色 #0000FF
		blue: "\x1b[34m",
		// magenta 洋红色 #FF00FF
		magenta: "\x1b[35m",
		// gray 灰色 #808080
		gray: "\x1b[90m",
	}

	static code(color: AnsiColorName): string {
		if (color === "reset") {
			return this.RESET
		}
		return this.ANSI_CODES[color]
	}

	static wrap(text: string, color: AnsiColor): string {
		return `${this.code(color)}${text}${this.code("reset")}`
	}
}

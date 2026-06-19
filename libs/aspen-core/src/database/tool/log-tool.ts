import { ColorTool, type AnsiColorName } from "../../tool/color"

export class SimpleTool {
	static colors = {
		reset: ColorTool.code("reset"),
		red: ColorTool.code("red"),
		yellow: ColorTool.code("yellow"),
		green: ColorTool.code("green"),
		cyan: ColorTool.code("cyan"),
		blue: ColorTool.code("blue"),
		magenta: ColorTool.code("magenta"),
		gray: ColorTool.code("gray"),
	}

	private title: string

	private contentList: Array<{ title: string; content: string }> = []

	constructor(title: string) {
		this.title = title
	}

	addContent(title: string, content: string) {
		this.contentList.push({ title, content })
		return this
	}

	message(color: AnsiColorName = "reset") {
		let out = `\n===================start ${this.title} LOGGER start===================\n`
		if (this.contentList.length > 0) {
			out += this.contentList.map((item) => `${item.title}: ${item.content}`).join("\n")
		}
		out += `\n=====================end ${this.title} LOGGER end=====================\n`
		if (color === "reset") {
			return out
		}
		return ColorTool.wrap(out, color)
	}
}

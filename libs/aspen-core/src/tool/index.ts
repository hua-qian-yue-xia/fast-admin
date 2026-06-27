import { ColorTool } from "./color"
import { KeyTool } from "./key"
import { OsTool } from "./os-tool"
import { StrTool } from "./str"
import { TreeTool } from "./tree-tool"

export { ColorTool, KeyTool, OsTool, StrTool, TreeTool }

export const tool = {
	color: ColorTool,
	key: KeyTool,
	os: OsTool,
	str: StrTool,
	tree: TreeTool,
}

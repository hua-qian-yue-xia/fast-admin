import { ColorTool } from "./color"
import { KeyTool } from "./key"
import { OsTool } from "./os-tool"
import { RandomTool } from "./random"
import { StrTool } from "./str"
import { TreeTool } from "./tree-tool"

export { ColorTool, KeyTool, OsTool, RandomTool, StrTool, TreeTool }

export const tool = {
	color: ColorTool,
	key: KeyTool,
	os: OsTool,
	random: RandomTool,
	str: StrTool,
	tree: TreeTool,
}

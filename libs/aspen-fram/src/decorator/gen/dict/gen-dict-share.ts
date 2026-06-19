import { Type } from "@nestjs/common"

import { GenDictOptions } from "./gen-dict-decorator"

export class GenDictRegistry {
	private static instance: GenDictRegistry

	private registry: Map<Type, GenDictOptions> = new Map()

	private constructor() {}

	static getInstance(): GenDictRegistry {
		if (!GenDictRegistry.instance) {
			GenDictRegistry.instance = new GenDictRegistry()
		}
		return GenDictRegistry.instance
	}

	set(target: Type, options: GenDictOptions): void {
		this.registry.set(target, options)
	}

	get(target: Type): GenDictOptions | null {
		return this.registry.get(target) ?? null
	}

	getKeys(): Array<Type> {
		return [...this.registry.keys()]
	}

	has(target: Type): boolean {
		return this.registry.has(target)
	}

	clear(): void {
		this.registry.clear()
	}
}

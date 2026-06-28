/**
 * 树状结构工具
 */

export type TreeNode<T, K extends string = "children", X = unknown> = T & {
	[P in K]: Array<TreeNode<T, K, X>>
} & { extra?: X }

export type BuildTreeOptions<T, K extends string = "children", X = unknown> = {
	idKey?: keyof T & string
	parentIdKey?: keyof T & string
	childrenKey?: K
	// 根父ID的值,默认 null/undefined/0 之一视为根
	rootParentValue?: unknown
	sort?: (a: T, b: T) => number
	// 为每个节点附加额外信息,赋值到 node.extra
	extra?: (item: T) => X
	// 构建节点时剔除的字段(不要剔除 idKey/parentIdKey)
	excludeKeys?: Array<keyof T & string>
}

export abstract class TreeTool {
	// 扁平数组转树:O(n)
	static toTree<T extends Record<string, any>, K extends string = "children", X = unknown>(
		items: readonly T[],
		opts: BuildTreeOptions<T, K, X> = {},
	): Array<TreeNode<T, K, X>> {
		const idKey = opts.idKey ?? "id"
		const parentIdKey = opts.parentIdKey ?? "parentId"
		const childrenKey = opts.childrenKey ?? ("children" as K)

		// 初始化每个节点的 children,并支持剔除字段
		const nodes = items.map((item) => {
			const base: any = { ...item }
			if (opts.excludeKeys?.length) {
				for (const k of opts.excludeKeys) delete base[k as string]
			}
			return {
				...base,
				[childrenKey]: [],
				extra: opts.extra ? opts.extra(item) : undefined,
			}
		}) as Array<T & Record<string, any>>

		// 建立索引(使用原始 items 的 id,避免 excludeKeys 影响 id)
		const byId = new Map<any, T & Record<string, any>>()
		items.forEach((item, idx) => {
			const id = (item as any)[idKey]
			byId.set(id, nodes[idx])
		})

		const roots: Array<TreeNode<T, K, X>> = []
		items.forEach((item, idx) => {
			const n = nodes[idx]
			const pid = (item as any)[parentIdKey]
			const isRoot = opts.rootParentValue !== undefined ? pid === opts.rootParentValue : pid === null || pid === undefined || pid === 0

			if (isRoot) {
				roots.push(n as TreeNode<T, K, X>)
			} else {
				const parent = byId.get(pid)
				if (parent) {
					parent[childrenKey].push(n)
				} else {
					// 如果父节点不存在,视为根,避免数据丢失
					roots.push(n as TreeNode<T, K, X>)
				}
			}
		})

		// 可选排序
		const sortRec = (arr: Array<TreeNode<T, K, X>>) => {
			if (opts.sort) arr.sort((a, b) => opts.sort!(a, b))
			for (const node of arr) sortRec((node as any)[childrenKey] as Array<TreeNode<T, K, X>>)
		}
		if (opts.sort) sortRec(roots)

		return roots
	}

	// 树转扁平数组(前序遍历)
	static flatten<T extends Record<string, any>, K extends string = "children", X = unknown>(
		tree: Array<TreeNode<T, K, X>>,
		childrenKey: K = "children" as K,
	): T[] {
		const out: T[] = []
		const stack: Array<TreeNode<T, K, X>> = [...tree]
		while (stack.length) {
			const cur = stack.pop()!
			const { [childrenKey]: children, ...rest } = cur as any
			out.push(rest as T)
			for (let i = (children as Array<TreeNode<T, K, X>>).length - 1; i >= 0; i--) {
				stack.push((children as Array<TreeNode<T, K, X>>)[i])
			}
		}
		return out
	}

	// 查找第一个匹配的节点
	static find<T extends Record<string, any>, K extends string = "children", X = unknown>(
		tree: Array<TreeNode<T, K, X>>,
		predicate: (n: TreeNode<T, K, X>) => boolean,
		childrenKey: K = "children" as K,
	): TreeNode<T, K, X> | null {
		const stack: Array<TreeNode<T, K, X>> = [...tree]
		while (stack.length) {
			const cur = stack.pop()!
			if (predicate(cur)) return cur
			const children = (cur as any)[childrenKey] as Array<TreeNode<T, K, X>>
			for (let i = children.length - 1; i >= 0; i--) stack.push(children[i])
		}
		return null
	}

	// 查找从根到目标节点的路径
	static findPath<T extends Record<string, any>, K extends string = "children", X = unknown>(
		tree: ReadonlyArray<TreeNode<T, K, X>>,
		predicate: (n: TreeNode<T, K, X>) => boolean,
		childrenKey: K = "children" as K,
	): Array<TreeNode<T, K, X>> | null {
		const path: Array<TreeNode<T, K, X>> = []
		const dfs = (nodes: ReadonlyArray<TreeNode<T, K, X>>): boolean => {
			for (const n of nodes) {
				path.push(n)
				if (predicate(n)) return true
				const children = (n as any)[childrenKey] as Array<TreeNode<T, K, X>>
				if (children?.length && dfs(children)) return true
				path.pop()
			}
			return false
		}
		return dfs(tree) ? path : null
	}

	// 过滤树(保留满足条件的节点及其必要祖先)
	static filter<T extends Record<string, any>, K extends string = "children", X = unknown>(
		tree: Array<TreeNode<T, K, X>>,
		predicate: (n: TreeNode<T, K, X>) => boolean,
		childrenKey: K = "children" as K,
	): Array<TreeNode<T, K, X>> {
		const rec = (nodes: Array<TreeNode<T, K, X>>): Array<TreeNode<T, K, X>> => {
			const res: Array<TreeNode<T, K, X>> = []
			for (const n of nodes) {
				const filteredChildren = rec(((n as any)[childrenKey] ?? []) as Array<TreeNode<T, K, X>>)
				const keep = predicate(n) || filteredChildren.length > 0
				if (keep) {
					res.push({ ...(n as any), [childrenKey]: filteredChildren })
				}
			}
			return res
		}
		return rec(tree)
	}

	// 映射树(结构保持,节点转换)
	static map<T extends Record<string, any>, R extends Record<string, any>, K extends string = "children", X = unknown>(
		tree: Array<TreeNode<T, K, X>>,
		mapFn: (n: TreeNode<T, K, X>) => R,
		childrenKey: K = "children" as K,
	): Array<R & { [P in K]: any[] }> {
		const rec = (nodes: Array<TreeNode<T, K, X>>): Array<R & { [P in K]: any[] }> => {
			return nodes.map((n) => {
				const children = rec(((n as any)[childrenKey] ?? []) as Array<TreeNode<T, K, X>>)
				return { ...mapFn(n), [childrenKey]: children }
			})
		}
		return rec(tree)
	}
}

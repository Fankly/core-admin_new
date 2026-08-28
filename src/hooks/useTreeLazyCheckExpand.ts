import { ElTree } from 'element-plus'
import { ref, Ref } from 'vue'

export interface TreeNodeData {
  [key: string]: any
}

export interface TreePropsConfig {
  id: string
  children: string
  isLeaf: string
  label?: string
}

export interface TreeNode {
  data: TreeNodeData
  level: number
  expand: () => void
  isLeaf: boolean
  loaded: boolean
  loading: boolean
  childNodes: TreeNode[]
}

class RequestPool {
  private queue: (() => void)[] = []
  private activeCount = 0

  constructor(private maxConcurrent: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.activeCount++
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.activeCount--
          this.processQueue()
        }
      }

      if (this.activeCount < this.maxConcurrent) {
        execute()
      } else {
        this.queue.push(execute)
      }
    })
  }

  private processQueue() {
    if (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const next = this.queue.shift()
      next?.()
    }
  }

  get pendingCount() {
    return this.queue.length
  }
}

function waitNodeLoaded(
  treeRef: Ref<InstanceType<typeof ElTree> | undefined>,
  nodeId: string,
  timeout = 5000
): Promise<TreeNode | null> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    let rafId: number
    const checkNode = () => {
      if (Date.now() - startTime > timeout) {
        resolve(null)
        return
      }

      const node = treeRef.value?.getNode(nodeId) as TreeNode | undefined
      if (!node) {
        rafId = requestAnimationFrame(checkNode)
        return
      }

      if (node.loaded || node.isLeaf) {
        resolve(node)
      } else if (node.loading) {
        rafId = requestAnimationFrame(checkNode)
      } else {
        resolve(node)
      }
    }
    checkNode()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  })
}

export function useTreeLazyCheckExpand(
  treeRef: Ref<InstanceType<typeof ElTree> | undefined>,
  options: {
    maxDepth?: number
    maxConcurrent?: number
    props: TreePropsConfig
    onError?: (error: Error, nodeId: string) => void
  }
) {
  const {
    maxDepth = 10,
    maxConcurrent = 4,
    props,
    onError = (error, nodeId) => console.error(`加载节点${nodeId}失败`, error)
  } = options

  const { id, isLeaf } = props
  const globalLoading = ref(false)
  const pool = new RequestPool(maxConcurrent)
  const checkedKeys = new Set<string>()

  async function expandNodes(nodes: TreeNodeData[]): Promise<TreeNode[]> {
    const expandPromises = nodes.map((node) =>
      pool.run(async () => {
        try {
          const treeNode = treeRef.value?.getNode(node[id]) as TreeNode | undefined
          if (!treeNode || treeNode.isLeaf) return null

          if (!treeNode.loaded && !treeNode.loading) {
            treeNode.expand()
            const loadedNode = await waitNodeLoaded(treeRef, node[id])
            return loadedNode
          } else if (treeNode.loading) {
            const loadedNode = await waitNodeLoaded(treeRef, node[id])
            return loadedNode
          }
          return treeNode
        } catch (error) {
          onError(error as Error, node[id])
          return null
        }
      })
    )

    const results = await Promise.all(expandPromises)
    return results.filter((node): node is TreeNode => node !== null)
  }

  async function recursiveExpandCheck(
    nodes: TreeNodeData[],
    depth = 1,
    visited = new Set<string>()
  ): Promise<void> {
    if (depth > maxDepth || nodes.length === 0) return

    const nodesToProcess = nodes.filter((node) => {
      if (visited.has(node[id]) || node[isLeaf]) return false
      return true
    })
    if (nodesToProcess.length === 0) return

    const expandedNodes = await expandNodes(nodesToProcess)

    const nextLevelNodes: TreeNodeData[] = []

    expandedNodes.forEach((treeNode) => {
      if (treeNode && treeNode.childNodes?.length > 0) {
        checkedKeys.add(treeNode.data[id])

        treeNode.childNodes.forEach((childNode) => {
          checkedKeys.add(childNode.data[id])
          nextLevelNodes.push(childNode.data)
        })
      }
    })

    if (checkedKeys.size > 0) {
      treeRef.value?.setCheckedKeys(Array.from(checkedKeys), false)
    }

    await recursiveExpandCheck(nextLevelNodes, depth + 1, visited)
  }

  async function handleCheckChange(data: TreeNodeData, checked: boolean, indeterminate: boolean) {
    if (!checked || indeterminate || !treeRef.value) return
    globalLoading.value = true
    checkedKeys.clear()
    checkedKeys.add(data[id])
    try {
      await recursiveExpandCheck([data])
    } catch (error) {
      console.error('展开节点失败:', error)
    } finally {
      globalLoading.value = false
    }
  }

  function rersetChecked() {
    checkedKeys.clear()
    treeRef.value?.setCheckedKeys([], false)
  }

  function getCheckedKeys(): string[] {
    return Array.from(checkedKeys)
  }

  return {
    globalLoading,
    handleCheckChange,
    rersetChecked,
    getCheckedKeys,
    pendingRequest: () => pool.pendingCount
  }
}

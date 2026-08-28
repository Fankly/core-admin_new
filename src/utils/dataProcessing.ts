interface TreeNode {
  leaf?: boolean;
  children: TreeNode[];
  [key: string]: any;
}

/**
 * 选择父节点获取子节点 dfs算法
 * @node 所选节点
 * @requiredValue 所需返回的值
 * @leaf 末节节点标识
 */
export const getLeafNodes = <T extends TreeNode, K extends keyof T, L extends keyof T>(
  node: T | null,
  key: K | "" = "" as K | "",
  leaf: L = "leaf" as L
): any[] => {
  const leafNodes: T[K][] = [];
  const stack: T[] = [];
  if (!node) return leafNodes;
  stack.push(node);
  while (stack.length) {
    const current = stack.pop()!;
    if (current[leaf] || current.children.length === 0) {
      // 没有子节点,是叶子节点
      key === "" ? leafNodes.push(current as unknown as T[K]) : leafNodes.push(current[key]);
    } else {
      //   有叶子节点,全部加入栈,继续遍历
      for (let i = 0; i < current.children.length; i++) {
        stack.push(current.children[i] as T);
      }
    }
  }
  return leafNodes;
};

// 一键展开 广度优先搜索算法
export const expandNode = async (
  allExpandedRows: Set<string | number>,
  data: any,
  gridRef: any,
  BATCH_SIZE: number,
  leafKey: string
): Promise<void> => {
  try {
    // 使用广度优先搜索
    const queue = [...data] as any[];
    const processedIds = new Set();
    while (queue.length > 0) {
      const currentBatch = queue.splice(0, BATCH_SIZE);
      const expandPromises = [];
      for (const row of currentBatch) {
        if (processedIds.has(row.id)) continue;
        processedIds.add(row.id);
        if (row[leafKey]) {
          const expandPromise = (async () => {
            try {
              const isExpanded = gridRef.value.isTreeExpandByRow(row);
              if (!isExpanded) {
                await gridRef.value.toggleTreeExpand(row, true);
                allExpandedRows.add(row.id);
              }
            } catch (error) {
              console.error("Error expanding row:", error);
            }
          })();
          expandPromises.push(expandPromise);
        }
      }
      await Promise.all(expandPromises);
      await new Promise((resolve) => setTimeout(resolve, 200));
      for (const row of currentBatch) {
        if (row.children && row.children.length) {
          queue.push(...row.children);
        }
      }
      if (processedIds.size > 1000) {
        console.warn("已达到最大处理节点限制");
        break;
      }
    }
  } catch (error) {
    console.error("展开节点时出错", error);
  }
};

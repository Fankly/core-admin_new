<script lang="ts">
export default {
  name: '/goalValue/customGoalValue/components/TreeTable'
}
</script>

<script setup lang="ts">
import { ref, defineProps, onMounted, watch, defineEmits, reactive, defineExpose, nextTick } from 'vue'
import { getConfigList } from '@/api/goalValue/customGoalValue'
import { InitParams } from '@/views/goalValue/customGoalValue/config.vue'
import { VxeTablePropTypes } from 'vxe-table'
import { ElMessage } from 'element-plus'

interface Props {
  initParams: InitParams
  autoLoadOnMount?: boolean
}

export interface RowVo {
  children?: RowVo[]
  hasChild?: boolean
  id: string
  leaf: '0' | '1'
  name: string
  parentId: string | null
  nd?: string
  sfqy?: string
  sfzgs?: string
  sort: number | string
}

const emits = defineEmits(['treeTableChange', 'mainTableData'])

const props = defineProps<Props>()

const treeRef = ref()
const loading = ref(false)
const treeData = ref<RowVo[]>([])
const ROOT_PARENT_ID = '0'
let currentTreeRequestToken = 0
let currentTableRequestToken = 0

const normalizeTreeRows = (data: RowVo[] = []): RowVo[] => {
  return data.map((item) => ({
    ...item,
    hasChild: !item.children?.length && String(item.leaf) === '0',
    children: item.children ? normalizeTreeRows(item.children) : item.children
  }))
}

const treeConfig = reactive<VxeTablePropTypes.TreeConfig>({
  rowField: 'id',
  parentField: 'parentId',
  lazy: true,
  hasChildField: 'hasChild',
  loadMethod({ row }: any) {
    const requestToken = currentTreeRequestToken
    return new Promise<RowVo[]>((resolve) => {
      if (!props.initParams.nd || !row?.id) {
        resolve([])
        return
      }
      getConfigList(props.initParams.nd, row.id)
        .then((res) => {
          if (requestToken !== currentTreeRequestToken) {
            resolve([])
            return
          }
          if (res.success && res.data) {
            resolve(normalizeTreeRows(res.data))
            return
          }
          ElMessage.error(res.msg)
          resolve([])
        })
        .catch(() => {
          ElMessage.error('获取树节点失败，请稍后重试')
          resolve([])
        })
    })
  }
})
const expandConfig = reactive<VxeTablePropTypes.ExpandConfig>({})
const rowConfig = reactive<VxeTablePropTypes.RowConfig>({
  height: 32,
  isCurrent: true,
  keyField: 'id'
})

const treeNodeClickHandle = async () => {
  const $treeTable = treeRef.value
  if ($treeTable) {
    let curData: RowVo = $treeTable.getCurrentRecord()
    if (!curData?.id) return
    // 获取右边表格数据
    await getTableData(curData.id)
    emits('treeTableChange', curData)
  }
}

const getTableData = async (parentId: string) => {
  if (!props.initParams.nd || !parentId) {
    emits('mainTableData', [])
    return
  }
  const requestToken = ++currentTableRequestToken
  let res = await getConfigList(props.initParams.nd, parentId)
  if (requestToken !== currentTableRequestToken) return
  if (res.success && res.data) {
    emits('mainTableData', res.data)
  } else {
    ElMessage.error(res.msg)
  }
}

/** 刷新前根据当前行向上收集祖先 id 路径（不含根），用于懒加载恢复 */
const collectAncestorPathIds = (row?: RowVo | null): string[] => {
  const $table = treeRef.value
  if (!row?.id || String(row.id) === ROOT_PARENT_ID) return []

  const pathIds: string[] = []
  let current: any = row
  const visited = new Set<string>()

  while (current?.id != null && String(current.id) !== ROOT_PARENT_ID) {
    const id = String(current.id)
    if (visited.has(id)) break
    visited.add(id)
    pathIds.unshift(id)

    const parentId = current.parentId
    if (parentId == null || parentId === '' || String(parentId) === ROOT_PARENT_ID) break

    const parentKey = String(parentId)
    current = $table?.getRowById?.(parentKey) || null
    if (!current) {
      // 父节点未挂在表上时，至少把 parentId 推进路径，后续按层展开
      pathIds.unshift(parentKey)
      break
    }
  }
  return pathIds
}

/**
 * 刷新树后按祖先路径逐层展开并恢复选中。
 * pathIds: 从一级节点到目标节点的 id 列表（不含根节点 '0'）
 */
const restoreCurrentNode = async (selectId?: string | null, pathIds: string[] = []) => {
  const $table = treeRef.value
  if (!$table || treeData.value.length === 0) return null

  await nextTick()
  await expandData()

  const targetId = selectId != null && selectId !== '' ? String(selectId) : ROOT_PARENT_ID
  if (targetId === ROOT_PARENT_ID) {
    $table.setCurrentRow(treeData.value[0])
    emits('treeTableChange', treeData.value[0])
    return treeData.value[0]
  }

  // 逐层展开路径上的节点（含目标的父级），触发懒加载把深层节点挂回树上
  const expandIds = pathIds.length ? pathIds : [targetId]
  for (let i = 0; i < expandIds.length; i++) {
    const id = expandIds[i]
    const isTarget = String(id) === targetId
    // 目标节点本身不必展开，只选中
    if (isTarget && i === expandIds.length - 1) break
    const node = $table.getRowById?.(id)
    if (node) {
      await $table.setTreeExpand(node, true)
      await nextTick()
    }
  }

  const targetRow = $table.getRowById?.(targetId)
  if (targetRow) {
    $table.setCurrentRow(targetRow)
    emits('treeTableChange', targetRow)
    return targetRow
  }

  // 找不到则回退根节点
  $table.setCurrentRow(treeData.value[0])
  emits('treeTableChange', treeData.value[0])
  return treeData.value[0]
}

const getTreeTable = async (options?: { selectId?: string | null; pathIds?: string[] }) => {
  // 清空数据前先记下要恢复的选中路径
  const selectId = options?.selectId != null && options.selectId !== '' ? String(options.selectId) : null
  const pathIds = options?.pathIds?.length
    ? options.pathIds.map(String)
    : selectId
      ? collectAncestorPathIds(treeRef.value?.getCurrentRecord?.() || treeRef.value?.getRowById?.(selectId))
      : []

  const requestToken = ++currentTreeRequestToken
  loading.value = true
  treeData.value = []
  if (!props.initParams.nd) {
    if (requestToken === currentTreeRequestToken) {
      loading.value = false
    }
    return null
  }
  try {
    let res = await getConfigList(props.initParams.nd, ROOT_PARENT_ID)
    if (requestToken !== currentTreeRequestToken) return null
    if (res.success && res.data) {
      treeData.value = [
        {
          children: normalizeTreeRows(res.data),
          hasChild: false,
          id: ROOT_PARENT_ID,
          leaf: '0',
          name: props.initParams.nd + '年度',
          sfqy: '1',
          parentId: null,
          sort: '1'
        }
      ]
      await nextTick()
      // 有指定节点则恢复选中，否则默认选中根节点
      const selected = await restoreCurrentNode(selectId, pathIds)
      return selected
    }
    treeData.value = []
    ElMessage.error(res.msg)
    return null
  } finally {
    if (requestToken === currentTreeRequestToken) {
      loading.value = false
    }
  }
}

const expandData = async () => {
  if (!treeRef.value || treeData.value.length === 0) return
  await nextTick()
  const rootNode = treeData.value[0]
  if (!rootNode) return
  await treeRef.value.setTreeExpand(rootNode, true)
}

const expandRowData = async (row: any) => {
  if (!treeRef.value || !row) return
  await nextTick()
  await treeRef.value.setTreeExpand(row, true)
}

const clearTreeData = () => {
  currentTreeRequestToken += 1
  currentTableRequestToken += 1
  treeData.value = []
  loading.value = false
}

const initData = async () => {
  if (!props.autoLoadOnMount) return
  await getTreeTable()
  await getTableData(ROOT_PARENT_ID)
}

const rowStyle = () => {
  return {
    cursor: 'pointer'
  }
}

watch(
  () => props.initParams.nd,
  () => {
    getTreeTable()
  }
)

defineExpose({
  clearTreeData,
  getTreeTable,
  getTableData,
  expandData,
  restoreCurrentNode,
  collectAncestorPathIds,
  treeRef,
  treeData,
  expandRowData
})

onMounted(initData)
</script>

<template>
  <div class="tree-box">
    <vxe-table
      :loading="loading"
      :row-style="rowStyle"
      :expand-config="expandConfig"
      :tree-config="treeConfig"
      border="outer"
      :show-overflow="true"
      ref="treeRef"
      @current-change="treeNodeClickHandle"
      :row-config="rowConfig"
      :show-header="false"
      :column-config="{ resizable: true }"
      :data="treeData"
      height="100%"
    >
      <vxe-column field="name" title="配置名称" tree-node></vxe-column>
    </vxe-table>
  </div>
</template>

<style scoped lang="less">
.tree-box {
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
}
</style>

<template>
  <div class="stage-tree">
    <vxe-table
      ref="treeRef"
      height="100%"
      border="outer"
      show-overflow
      :show-header="false"
      :loading="loading"
      :data="treeData"
      :tree-config="{}"
      :row-config="{ keyField: 'id', height: 32, isCurrent: true, isHover: true }"
      :row-style="{ cursor: 'pointer' }"
      @current-change="handleCurrentChange"
    >
      <vxe-column field="name" title="阶段" tree-node>
        <template #default="{ row }">
          <span class="stage-tree-node">
            <span class="stage-tree-name">{{ row.name }}</span>
            <span class="stage-tree-count">{{ row.count }}</span>
          </span>
        </template>
      </vxe-column>
    </vxe-table>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { VxeTableDefines, VxeTableInstance } from 'vxe-table'
import { findConfigNode } from '../data/config'
import type { ConfigTreeNode } from '../data/config'

const props = defineProps<{
  tree: ConfigTreeNode
  selectedId: string
  loading: boolean
}>()
const emit = defineEmits<{ (event: 'select', id: string): void }>()

const treeRef = ref<VxeTableInstance<ConfigTreeNode>>()
const treeData = computed(() => [props.tree])

const handleCurrentChange = ({ row }: VxeTableDefines.CurrentRowChangeEventParams<ConfigTreeNode>) => {
  if (row?.id) emit('select', row.id)
}

const syncCurrent = () => {
  const node = findConfigNode(props.tree, props.selectedId)
  if (node) treeRef.value?.setCurrentRow(node)
}

// 每次重新生成树都全部展开并恢复选中节点；setCurrentRow 不会触发 current-change。
const syncTree = async () => {
  await nextTick()
  await treeRef.value?.setAllTreeExpand(true)
  syncCurrent()
}

watch(() => props.tree, syncTree)
watch(() => props.selectedId, syncCurrent)
onMounted(syncTree)
</script>

<style scoped lang="less">
.stage-tree {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
.stage-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.stage-tree-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stage-tree-count {
  flex-shrink: 0;
  color: #909399;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>

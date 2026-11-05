<template>
  <div class="template-type-tree">
    <div class="template-type-tree__search">
      <el-input v-model="keyword" placeholder="请输入项目类型名称" @input="handleFilter" />
    </div>
    <div class="template-type-tree__content">
      <el-tree
        ref="treeRef"
        :expand-on-click-node="false"
        :highlight-current="true"
        node-key="middleId"
        :data="data"
        :props="TEMPLATE_TREE_PROPS"
        :filter-node-method="filterNode"
        @node-click="handleNodeClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { TEMPLATE_TREE_PROPS } from '../constants'
import type { TreeNodeItem } from '../types'
import { ElTree } from 'element-plus'
import { ref } from 'vue'

defineProps<{
  data: TreeNodeItem[]
}>()

const emit = defineEmits<{
  (event: 'node-click', value: TreeNodeItem): void
}>()

const treeRef = ref<InstanceType<typeof ElTree>>()
const keyword = ref('')

const handleFilter = (value: string) => {
  treeRef.value?.filter(value)
}

const filterNode = (value: string, data: TreeNodeItem) => {
  if (!value) return true
  return data.name.indexOf(value) !== -1
}

const handleNodeClick = (data: TreeNodeItem) => {
  emit('node-click', data)
}
</script>

<style scoped lang="less">
.template-type-tree {
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color, #fff);
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  &__search {
    padding-bottom: 12px;
  }

  &__content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: auto;
  }
}
</style>

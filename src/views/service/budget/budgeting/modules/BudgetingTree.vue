<template>
  <div class="tree">
    <el-tree :current-node-key="currentKey" lazy :load="loadTreeData" :expand-on-click-node="false" highlight-current ref="treeRef" :props="yearTreeProp" node-key="id" @node-click="handleNodeClick"></el-tree>
  </div>
</template>

<script setup lang="ts" name="BudgetingTree">
import { useBudgetingTree } from '@/views/service/budget/budgeting/hooks/useBudgetingTree'

const { currentKey, treeRef, yearTreeProp, handleNodeClick, loadTreeData } = useBudgetingTree()
</script>

<style scoped></style>

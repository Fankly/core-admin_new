<template>
  <div v-loading="loading">
    <div class="searchBox">
      <el-input placeholder="输入关搜索内容" v-model="filterText" :suffix-icon="EpSearch"> </el-input>
    </div>
    <div class="sonTtreeBox">
      <el-tree ref="tree" class="filter-tree" show-checkbox node-key="id" :data="treeData" :props="defaultProps" :filter-node-method="filterNode" :check-strictly="true" @check="treeCheck">
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <img style="margin-right: 5px" v-if="data.leaf === '0'" src="@/assets/comprehensive/tree1.png" alt="" />
            <img style="margin-right: 5px" v-else src="@/assets/comprehensive/tree2.png" alt="" />
            <span>{{ node.label }}</span>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script setup>
import { Search as EpSearch } from '@element-plus/icons-vue'
import { reactive, toRef, watch, useTemplateRef } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
defineOptions({
  name: '/budget-process/process-33'
})
const emit = defineEmits()
const treeRef = useTemplateRef('tree')
const setupState = reactive({
  loading: true,
  data: [],
  treeData: [],
  treeId: '',
  projectName: '',
  filterText: '',
  defaultProps: {
    children: 'child',
    label: 'name'
  }
})
const loading = toRef(setupState, 'loading')
const data = toRef(setupState, 'data')
const treeData = toRef(setupState, 'treeData')
const treeId = toRef(setupState, 'treeId')
const projectName = toRef(setupState, 'projectName')
const filterText = toRef(setupState, 'filterText')
const defaultProps = toRef(setupState, 'defaultProps')
function getTreeData(val, data) {
  const params = {
    parentId: val
  }
  baseService.post('/xmsxwh/getProTypeTreeAll', params).then((res) => {
    if (res.success) {
      setupState.treeData = res.data
      setupState.loading = false
    } else {
      ElMessage({
        type: 'error',
        message: '项目类别树数据获取失败'
      })
      setupState.loading = false
    }
  })
}
function treeCheck(node, list) {
  if (list.checkedKeys.length == 2) {
    treeRef.value.setCheckedKeys([node.id])
    setupState.treeId = node.id
    emit('getName', node.name)
  }
  setupState.treeId = node.id
  emit('getName', node.name)
}
function filterNode(value, data) {
  if (!value) return true
  return data.name.indexOf(value) !== -1
}
watch(
  () => setupState.filterText,
  function (val) {
    treeRef.value.filter(val)
  }
)
;(() => {
  getTreeData('0')
})()
defineExpose({
  loading,
  data,
  treeData,
  treeId,
  projectName,
  filterText,
  defaultProps,
  getTreeData,
  treeCheck,
  filterNode
})
</script>

<style lang="less" scoped>
.sonTtreeBox {
  width: 100%;
  height: 500px;
}
</style>

<template>
  <el-select v-model="value" placeholder="请选择" clearable filterable @change="changeParams">
    <el-option v-for="item in projects" :key="item.code" :label="item.name" :value="item.code"> </el-option>
  </el-select>
</template>

<script setup>
import { reactive, toRef, toRefs } from 'vue'
import { ElMessage } from 'element-plus'
import process from '@/views/budget-process/js/process-data'
import baseService from '@/service/baseService'
const setupState = reactive({
  projects: [],
  //选中数据 页面直接调用即可
  value: ''
})
const projects = toRef(setupState, 'projects')
const value = toRef(setupState, 'value')
const componentData = reactive({})
componentData.list = undefined
const list = toRef(componentData, 'list')
function loadData() {
  baseService.get(`/commonCode/getData?code=GWXMFL`).then((res) => {
    if (res.success == true) {
      setupState.projects = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function changeParams() {
  componentData.list = []
  componentData.list.push(setupState.value)
}
function clear() {
  setupState.value = ''
  componentData.list = []
}
;(() => {
  loadData()
})()
defineExpose({
  projects,
  value,
  loadData,
  changeParams,
  clear,
  ...toRefs(componentData)
})
</script>
<style lang="less" scoped></style>

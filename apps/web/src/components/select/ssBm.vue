<template>
  <el-select v-model="value" placeholder="请选择" clearable filterable @change="changeParams">
    <el-option v-for="item in projects" :key="item.code" :label="item.name" :value="item.code"> </el-option>
  </el-select>
</template>

<script setup>
import { reactive, toRef } from 'vue'
import { ElMessage } from 'element-plus'
import process from '@/views/budget-process/js/process-data'
import baseService from '@/service/baseService'
const setupState = reactive({
  projects: [],
  //选中数据 页面直接调用即可
  value: '',
  list: []
})
const projects = toRef(setupState, 'projects')
const value = toRef(setupState, 'value')
const list = toRef(setupState, 'list')
function loadData() {
  baseService.get(`/commonCode/getData?code=GKBM`).then((res) => {
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
  setupState.list = []
  setupState.list.push(setupState.value)
}
function clear() {
  setupState.value = ''
  setupState.list = []
}
;(() => {
  loadData()
})()
defineExpose({
  projects,
  value,
  list,
  loadData,
  changeParams,
  clear
})
</script>
<style lang="less" scoped></style>

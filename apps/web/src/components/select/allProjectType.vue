<template>
  <el-cascader ref="myCascader" :props="{ multiple: true }" :options="projects" :show-all-levels="false" collapse-tags clearable @change="handle"></el-cascader>
</template>

<script setup>
import { reactive, toRef, useTemplateRef } from 'vue'
import { ElMessage } from 'element-plus'
import process from '@/views/budget-process/js/process-data'
import baseService from '@/service/baseService'
const myCascaderRef = useTemplateRef('myCascader')
const setupState = reactive({
  projects: [],
  //选中数据 页面直接调用即可
  selectList: [],
  //不勾选默认转所有id
  allId: []
})
const projects = toRef(setupState, 'projects')
const selectList = toRef(setupState, 'selectList')
const allId = toRef(setupState, 'allId')
function clear() {
  myCascaderRef.value.$refs.panel.checkedValue = []
  myCascaderRef.value.$refs.panel.activePath = []
  myCascaderRef.value.$refs.panel.clearCheckedNodes()
  handle()
}
//处理数据
function handle(value) {
  setupState.selectList = []
  if (value) {
    value.forEach((item) => {
      let obj = ''
      item.forEach((row) => {
        obj = obj + row + ','
      })
      setupState.selectList.push(obj.slice(0, obj.length - 1))
    })
  } else {
    setupState.selectList = []
  }
}
//获取项目类型数据
function getProjectType() {
  baseService.get('/process/code/getType').then((res) => {
    if (res.success == true) {
      setupState.projects = process.optionHandleType(res.data)
      setupState.projects.forEach((item) => {
        setupState.allId.push(item.id)
        if (item.children) {
          item.children.forEach((e) => {
            setupState.allId.push(e.id)
            if (e.children) {
              e.children.forEach((row) => {
                setupState.allId.push(row.id)
                if (row.children) {
                  row.children.forEach((val) => {
                    setupState.allId.push(val.id)
                  })
                }
              })
            }
          })
        }
      })
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
;(() => {
  getProjectType()
})()
defineExpose({
  projects,
  selectList,
  allId,
  clear,
  handle,
  getProjectType
})
</script>
<style lang="less" scoped></style>

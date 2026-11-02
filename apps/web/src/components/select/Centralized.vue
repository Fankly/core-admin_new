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
  let array = []
  if (value) {
    value.forEach((item) => {
      array.push(item[item.length - 1])
    })
    setupState.selectList = array
  } else {
    setupState.selectList = []
  }
}
function getProjectType(specialorgid) {
  baseService.get(`/process/code/getGkbm?specialorgid=${specialorgid}`).then((res) => {
    if (res.success == true) {
      setupState.projects = process.gkbm(res.data)
      setupState.projects.forEach((item) => {
        setupState.allId.push(item.code)
        if (item.children) {
          item.children.forEach((e) => {
            setupState.allId.push(e.code)
            if (e.children) {
              e.children.forEach((row) => {
                setupState.allId.push(row.code)
                if (row.children) {
                  row.children.forEach((val) => {
                    setupState.allId.push(val.code)
                    if (val.children) {
                      val.children.forEach((last) => {
                        setupState.allId.push(last.code)
                      })
                    }
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

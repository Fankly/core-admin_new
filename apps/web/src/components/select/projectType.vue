<template>
  <el-cascader
    ref="myCascader"
    :props="{ multiple: true }"
    :options="projects"
    :show-all-levels="false"
    collapse-tags
    clearable
    @change="handle"
  ></el-cascader>
</template>

<script setup>
import { reactive, toRef, nextTick, useTemplateRef } from 'vue'
import { ElMessage } from 'element-plus'
import process from '@/views/budget-process/js/process-data'
import baseService from '@/service/baseService'
const myCascaderRef = useTemplateRef('myCascader')
const setupState = reactive({
  projects: [],
  //选中数据 页面直接调用即可
  selectList: [],
  //不勾选默认转所有id
  allId: [],
  projectTypePromise: null
})
const projects = toRef(setupState, 'projects')
const selectList = toRef(setupState, 'selectList')
const allId = toRef(setupState, 'allId')
const projectTypePromise = toRef(setupState, 'projectTypePromise')
function clear() {
  myCascaderRef.value.$refs.panel.checkedValue = []
  myCascaderRef.value.$refs.panel.activePath = []
  myCascaderRef.value.$refs.panel.clearCheckedNodes()
  handle()
}
//处理数据
function handle(value) {
  let array = []
  //处理项目类型
  if (value) {
    value.forEach((item) => {
      array.push(item[item.length - 1])
    })
    setupState.selectList = array
  } else {
    setupState.selectList = []
  }
}
function setCheckedById(id) {
  if (!id) {
    return Promise.resolve(false)
  }
  const waitProjectType = setupState.projects.length ? Promise.resolve() : setupState.projectTypePromise || getProjectType()
  return waitProjectType.then(() => {
    return new Promise((resolve) => {
      nextTick(() => {
        const panel = myCascaderRef.value?.$refs?.panel
        if (!panel || !setupState.projects.length) {
          resolve(false)
          return
        }
        const matchNode = panel.getFlattedNodes(false).find((node) => {
          return String(node.data?.id) === String(id) || String(node.data?.value) === String(id)
        })
        if (!matchNode) {
          resolve(false)
          return
        }
        panel.clearCheckedNodes()
        matchNode.doCheck(true)
        panel.calculateCheckedValue()
        handle(panel.checkedValue)
        resolve(true)
      })
    })
  })
}
//获取项目类型数据
function getProjectType() {
  return baseService.get('/process/code/getType').then((res) => {
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
  setupState.projectTypePromise = getProjectType()
})()
defineExpose({
  projects,
  selectList,
  allId,
  projectTypePromise,
  clear,
  handle,
  setCheckedById,
  getProjectType
})
</script>
<style lang="less" scoped></style>

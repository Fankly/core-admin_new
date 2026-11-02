<template>
  <el-cascader
    ref="myCascader"
    :checkStrictly="true"
    :props="{ multiple: true }"
    :options="projects"
    :show-all-levels="false"
    collapse-tags
    @change="handle"
    clearable
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
function setCheckedByCode(code) {
  if (!code) {
    return Promise.resolve(false)
  }
  return new Promise((resolve) => {
    nextTick(() => {
      const panel = myCascaderRef.value?.$refs?.panel
      if (!panel || !setupState.projects.length) {
        resolve(false)
        return
      }
      const matchNode = panel.getFlattedNodes(false).find((node) => {
        const nodeCode = node.data?.code
        return String(nodeCode) === String(code)
      })
      if (!matchNode) {
        resolve(false)
        return
      }
      panel.clearCheckedNodes()
      matchNode.doCheck(true)
      panel.calculateCheckedValue()
      handle()
      resolve(true)
    })
  })
}
//处理数据
function handle() {
  let array = []
  const getCheck = myCascaderRef.value.getCheckedNodes()
  if (getCheck.length > 0) {
    getCheck.forEach((item) => {
      if (array.indexOf(item.data.code) == -1) {
        array.push(item.data.code)
      }
      if (item.parent) {
        if (array.indexOf(item.parent.data.code) == -1) {
          array.push(item.parent.data.code)
        }
      }
    })
    setupState.selectList = array
  } else {
    setupState.selectList = []
  }
}
//获取所属单位数据
function getAffiliatedUnit(specialorgid) {
  return baseService.get(`/process/code/getDept?specialorgid=${specialorgid}`).then((res) => {
    if (res.success == true) {
      setupState.projects = process.optionHandleDept(res.data)
      setupState.allId = []
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
  setCheckedByCode,
  handle,
  getAffiliatedUnit
})
</script>
<style lang="less" scoped></style>

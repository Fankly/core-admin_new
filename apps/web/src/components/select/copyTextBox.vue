<template>
  <el-input v-model="text" :title="text" readonly="true">
    <template #append>
      <el-button @click="addData" :icon="EpCirclePlus" />
    </template>
  </el-input>
  <el-dialog v-model="dialogVisible" width="30%" :show-close="false" :close-on-click-modal="false">
    <el-input type="textarea" v-model="ids" rows="10"></el-input>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="determine">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { CirclePlus as EpCirclePlus } from '@element-plus/icons-vue'
import { reactive, toRef } from 'vue'
const setupState = reactive({
  text: '',
  array: [],
  newArr: [],
  ids: '',
  dialogVisible: false
})
const text = toRef(setupState, 'text')
const array = toRef(setupState, 'array')
const newArr = toRef(setupState, 'newArr')
const ids = toRef(setupState, 'ids')
const dialogVisible = toRef(setupState, 'dialogVisible')
function addData() {
  setupState.dialogVisible = true
}
function cancel() {
  setupState.dialogVisible = false
}
function determine() {
  if (setupState.ids) {
    let str = setupState.ids.replace(/\n/g, ',')
    setupState.text = str
    setupState.array = str.split(',')
    if (setupState.array.length !== 0) setupState.newArr = setupState.array.map((item) => item.padStart(10, '0'))
    setupState.dialogVisible = false
  } else {
    clear()
    setupState.dialogVisible = false
  }
}
function setValue(data) {
  setupState.ids = data
  determine()
}
function clear() {
  setupState.text = ''
  setupState.array = []
  setupState.ids = ''
  setupState.newArr = []
}
defineExpose({
  text,
  array,
  newArr,
  ids,
  dialogVisible,
  addData,
  cancel,
  determine,
  setValue,
  clear
})
</script>
<style lang="less" scoped></style>

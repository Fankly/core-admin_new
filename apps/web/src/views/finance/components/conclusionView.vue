<template>
  <div class="conclusionView" :style="`${showScroll ? 'overflow: auto;height: 100%' : ''}`">
    <slot name="before" />
    <projectViewItem :dataValue="dataValue" :keyValues="keyValues">
      <template v-slot:supportDoc="{ scope }">
        <div class="text--item" :key="index" v-for="(item, index) in scope.row">
          <el-link @click="download(item.name)" type="primary">{{ item.name }}</el-link>
        </div>
      </template>
      <template v-slot:projectImpact="{ scope }">
        <div class="text--item" :key="index" v-for="(item, index) in scope.row">
          <label>成效{{ index + 1 }}：</label>
          <span>{{ item }}</span>
        </div>
      </template>
    </projectViewItem>
  </div>
</template>

<script setup>
import { isImage } from './conclusionView.module'
import projectViewItem from './projectViewItem.vue'
import { CwProjectClosure } from '@/api/mainController'
import { reactive, toRef, toRefs, computed, onMounted, getCurrentInstance } from 'vue'
defineOptions({
  name: 'conclusionView'
})
const componentProps = defineProps({
  projectId: {
    type: String
  },
  showScroll: {
    type: Boolean
  }
})
const componentInstance = getCurrentInstance().proxy
const componentData = reactive({
  dataValue: undefined
})
const dataValue = toRef(componentData, 'dataValue')
function download(filename) {
  const obj = {
    id: componentData.dataValue.id,
    filename,
    fieldName: 'supportDoc',
    asImage: isImage(filename)
  }
  CwProjectClosure.download(componentInstance, obj, 'get')
}
function getInfo() {
  CwProjectClosure.view(componentInstance, {
    projectId: componentProps.projectId
  }).then((res) => {
    const { projectImpact, supportDoc, ...otherValues } = res.data
    componentData.dataValue = {
      projectImpact: JSON.parse(projectImpact),
      supportDoc: JSON.parse(supportDoc).reduce(
        (arr, item) => [
          ...arr,
          {
            name: item
          }
        ],
        []
      ),
      ...otherValues
    }
  })
}
const keyValues = computed(() => {
  return [
    {
      name: '单体项目名称',
      value: 'projectName'
    },
    {
      name: '证明材料',
      value: 'supportDoc',
      slot: true
    },
    {
      name: '项目成效（提升指标）',
      value: 'projectImpact',
      slot: true
    }
  ]
})
onMounted(() => {
  getInfo()
})
defineExpose({
  download,
  getInfo,
  ...toRefs(componentData),
  keyValues
})
</script>
<style lang="less" scoped></style>

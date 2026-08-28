<template>
  <div>
    <vxe-modal
      ref="modalRef"
      fullscreen
      resize
      show-zoom
      v-model="isShowModal"
      destroy-on-close
      :title="modalTitle"
      width="1200px"
      @close="handleClose"
    >
      <ProjectHeader :items="headerData" />
      <ProgressTimeline :stages="stageData" />
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'xmProcess'
}
</script>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import ProjectHeader from './ProjectHeader.vue'
import ProgressTimeline from './ProgressTimeline.vue'
import { xmqgcInfoPage } from '@/api/lyg/index'
import { ElMessage } from 'element-plus'
import { createProjectHeader, createStages, amountProps, percentProp } from './data/progress-data'
import type { ProjectHeaderItem, Stage } from './data/progress-data'
import { formatNumValue } from '@/utils/utils'
const isShowModal = ref(false)
const modalTitle = ref('项目进度')
const xmData = ref<any>()
const headerData = ref<ProjectHeaderItem[]>(createProjectHeader())
const stageData = ref<Stage[]>(createStages())

/** 按 prop 从源数据取值并格式化 */
const formatVal = (prop: any, raw: any): string => {
  if (raw === undefined || raw === null || raw === '') return '-'
  if (prop === percentProp) {
    return formatNumValue(Number(raw * 100).toString(), 2)
  }
  if (amountProps.includes(prop)) {
    return formatNumValue(raw.toString(), 2)
  }
  return String(raw)
}

/** 将行数据按 prop 填充到 header 与 stages */
const fillData = (data: any) => {
  headerData.value.forEach((it) => {
    it.value = formatVal(it.prop, data?.[it.prop])
  })
  stageData.value.forEach((stage) => {
    stage.fields.forEach((f) => {
      f.value = formatVal(f.prop, data?.[f.prop])
    })
  })
}
/** 关闭弹窗 */
const handleClose = () => {
  isShowModal.value = false
}
/** 打开弹窗 */
const acceptParams = async (params: any) => {
  isShowModal.value = true
  await nextTick()
  // getXmInfo(params.id)
  xmData.value = params
  fillData(params)
}
// const getXmInfo = async (id: any) => {
//   const res: any = await xmqgcInfoPage({ id })
//   if (!res.success) return ElMessage.error(res.msg)
//   xmData.value = res.data.re
// }
defineExpose({ acceptParams })
</script>

<template>
  <div class="targetValueDb">
    <component v-if="currentComponent" :is="currentComponent" :params="allParams" @close="closeHandle" @notify="notifyHandle" />
    <el-empty v-else :description="emptyText" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'targetValueDb'
}
</script>

<script setup lang="ts">
import { notify } from '@/api/workflow'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import MbzView from './components/MbzView.vue'
import SjtcMbzView from './components/SjtcMbzView.vue'
import type { TargetValueWorkflowParams } from './components/types'

const createEmptyParams = (): TargetValueWorkflowParams => ({
  message: '',
  dwId: '',
  versionId: '',
  code: '',
  workItemId: '',
  isZgs: '',
  versionNo: '',
  versionName: '',
  nd: ''
})

const allParams = ref<TargetValueWorkflowParams>(createEmptyParams())

const componentMap = {
  MBZ: MbzView,
  SJTCMBZ: SjtcMbzView
}

const currentComponent = computed(() => componentMap[allParams.value.code as keyof typeof componentMap])

const emptyText = computed(() => {
  if (!allParams.value.code) return '缺少目标值类型参数!'
  return `暂不支持的目标值类型：${allParams.value.code}`
})

const setFullscreenStyle = () => {
  const style = 'height: 100vh; background-color: white;'
  document.querySelector('body')?.setAttribute('style', style)
  document.querySelector('html')?.setAttribute('style', style)
  document.querySelector('#app')?.setAttribute('style', style)
  document.querySelector('.rr-fullscreen')?.setAttribute('style', style)
}

const safeDecode = (value: string) => {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const appendSearchParams = (params: Map<string, string>, search: string) => {
  const query = search.startsWith('?') ? search.slice(1) : search
  if (!query) return
  new URLSearchParams(query).forEach((value, key) => params.set(key, value))
}

const appendJsonParams = (params: Map<string, string>) => {
  const rawAllParams = params.get('allParams')
  if (!rawAllParams) return
  try {
    const parsed = JSON.parse(safeDecode(rawAllParams))
    Object.keys(parsed || {}).forEach((key) => {
      params.set(key, String(parsed[key] ?? ''))
    })
  } catch {
    // allParams may not be a JSON payload; normal query params still work.
  }
}

const getAllParams = () => {
  const params = new Map<string, string>()
  appendSearchParams(params, window.location.search)

  const hashQueryIndex = window.location.hash.indexOf('?')
  if (hashQueryIndex > -1) {
    appendSearchParams(params, window.location.hash.slice(hashQueryIndex + 1))
  }

  appendJsonParams(params)

  const nextParams = createEmptyParams()
  params.forEach((value, key) => {
    nextParams[key] = safeDecode(value)
  })
  nextParams.code = nextParams.code.toUpperCase()
  return nextParams
}

const closeHandle = () => {
  try {
    const parentWindow = window.parent as any
    parentWindow.Appframe.closePopWindow(window)
  } catch {
    window.parent.postMessage('close', '*')
  }
}

const notifyHandle = async () => {
  if (!allParams.value.workItemId) {
    ElMessage.warning('缺少工作流参数!')
    return
  }
  const res = await notify(allParams.value.workItemId)
  if (res.success) {
    closeHandle()
  } else {
    ElMessage.error(res.msg)
  }
}

onMounted(() => {
  setFullscreenStyle()
  allParams.value = getAllParams()
})
</script>

<style scoped lang="less">
.targetValueDb {
  width: 100%;
  height: 100vh;
  min-height: 0;
  background-color: white;
  box-sizing: border-box;

  :deep(.el-empty) {
    height: 100%;
  }
}
</style>

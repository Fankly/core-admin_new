<template>
  <div v-loading="loading" class="frame" element-loading-text="加载中...">
    <iframe ref="frameRef" :src="frameSrc" class="frame-iframe" title="业务系统" @load="hideLoading" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSysObjByBusicode } from '@/api/common'

defineOptions({ name: 'IframePage' })

interface FrameInfo {
  frameSrc?: string
  fullPath?: string
}

interface SysObject {
  url?: string
  deployUrl?: string
  funcId?: string
  funcBusicode?: string
  appframeSystemId?: string
  AppframeSystemCode?: string
}

const props = defineProps<{ frameInfo?: FrameInfo }>()
const route = useRoute()
const loading = ref(route.meta.frameLoading !== false)
const frameSrc = ref('')
const frameRef = ref<HTMLIFrameElement | null>(null)

const buildFrameSrc = (framePath: string, source: SysObject): string => {
  if (framePath.includes('http')) return framePath
  if (!framePath) return source.url ?? ''
  const query = new URLSearchParams({
    funcId: source.funcId ?? '',
    funcBusicode: source.funcBusicode ?? '',
    AppframeSystemId: source.appframeSystemId ?? '',
    AppframeSystemCode: source.AppframeSystemCode ?? ''
  })
  return `${source.deployUrl ?? ''}${framePath}?${query.toString()}`
}

async function loadFrame() {
  const menuCode = typeof route.meta.outsideMenu === 'string' ? route.meta.outsideMenu : ''
  if (!menuCode) return
  loading.value = true
  try {
    const res = await getSysObjByBusicode(menuCode)
    if (!res.success) return
    const source = res.data as SysObject
    const framePath = typeof route.meta.frameSrc === 'string' ? route.meta.frameSrc : ''
    frameSrc.value = buildFrameSrc(framePath, source)
  } catch (error) {
    console.error('获取 frameSrc 失败:', error)
  }
}

function hideLoading() {
  loading.value = false
}

onMounted(loadFrame)

// 同一个 iframe 组件可能被多个标签页复用，fullPath 变化时重新解析地址。
watch(
  () => route.fullPath,
  (path) => {
    if (props.frameInfo?.fullPath === path) void loadFrame()
  }
)
</script>

<style lang="less" scoped>
.frame {
  width: 100%;
  height: 100%;

  .frame-iframe {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 0;
  }
}
</style>

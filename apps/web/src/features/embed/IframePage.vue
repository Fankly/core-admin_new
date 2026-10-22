<template>
  <div v-loading="loading" class="frame" element-loading-text="加载中...">
    <EmptyState v-if="error" title="页面暂时无法打开" :description="error"
      ><template #actions><button class="ds-button" type="button" @click="loadFrame">重新加载</button></template></EmptyState
    >
    <iframe
      v-else-if="frameSrc"
      :src="frameSrc"
      class="frame-iframe"
      :title="typeof route.meta.title === 'string' ? route.meta.title : '业务系统'"
      @load="hideLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onScopeDispose, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSysObjByBusicode } from '@/api/common'
import { EmptyState } from '@/design-system'
import { buildFrameUrl, type EmbeddedSystem } from './frame-url'

defineOptions({ name: 'IframePage' })

interface FrameInfo {
  frameSrc?: string
  fullPath?: string
}

const props = defineProps<{ frameInfo?: FrameInfo }>()
const route = useRoute()
const loading = ref(route.meta.frameLoading !== false)
const frameSrc = ref('')
const error = ref('')
let requestId = 0
onScopeDispose(() => {
  requestId += 1
})

async function loadFrame() {
  const currentRequest = ++requestId
  error.value = ''
  const menuCode = typeof route.meta.outsideMenu === 'string' ? route.meta.outsideMenu : ''
  const directSource =
    props.frameInfo?.frameSrc ||
    (typeof route.meta.frameSrc === 'string' ? route.meta.frameSrc : '') ||
    (route.meta.isIframe && typeof route.meta.url === 'string' ? route.meta.url : '')
  if (!menuCode) {
    frameSrc.value = directSource
    loading.value = Boolean(directSource)
    if (!directSource) error.value = '尚未配置页面地址，请联系系统管理员。'
    return
  }
  loading.value = true
  try {
    const res = await getSysObjByBusicode(menuCode)
    if (currentRequest !== requestId) return
    if (!res.success) throw new Error('无法读取业务系统配置')
    const source = res.data as EmbeddedSystem
    frameSrc.value = buildFrameUrl(directSource, source)
    if (!frameSrc.value) throw new Error('尚未配置页面地址')
  } catch {
    if (currentRequest !== requestId) return
    error.value = '无法读取业务系统地址，请稍后重试。'
    loading.value = false
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

<script lang="ts">
export default {
  name: 'Iframe'
}
</script>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, unref, watch, onMounted, nextTick } from 'vue'
import { getSysObjByBusicode } from '@/api/common'

const props = defineProps<{
  frameInfo?: {
    frameSrc?: string
    fullPath?: string
  }
}>()

const loading = ref(true)
const currentRoute = useRoute()
const frameSrc = ref<any>('')
const frameRef = ref<HTMLElement | null>(null)

async function getFrameSrc() {
  try {
    const menuCode = unref(currentRoute.meta as any).outsideMenu
    const res = await getSysObjByBusicode(menuCode)
    if (res.success) {
      const apiUrl = res.data.url
      const routeFrameSrc = unref(currentRoute.meta as any)?.frameSrc as string
      if (routeFrameSrc && routeFrameSrc.includes('http')) {
        frameSrc.value = routeFrameSrc
      } else if (routeFrameSrc) {
        const deployUrl = res.data.deployUrl
        const address = routeFrameSrc
        const funcId = res.data.funcId
        const funcBusicode = res.data.funcBusicode
        const appframeSystemId = res.data.appframeSystemId
        const appframeSystemCode = res.data.AppframeSystemCode
        frameSrc.value = `${deployUrl}${address}?funcId=${funcId}&funcBusicode=${funcBusicode}&AppframeSystemId=${appframeSystemId}&AppframeSystemCode=${appframeSystemCode}`
      } else {
        frameSrc.value = apiUrl
      }
    }
  } catch (error) {
    console.error('获取frameSrc失败:', error)
  }
}

getFrameSrc()

unref(currentRoute.meta as any)?.frameLoading === false && hideLoading()

function hideLoading() {
  loading.value = false
}

function init() {
  nextTick(() => {
    const iframe = unref(frameRef)
    if (!iframe) return
    const _frame = iframe as any
    if (_frame.attachEvent) {
      _frame.attachEvent('onload', () => {
        hideLoading()
      })
    } else {
      iframe.onload = () => {
        hideLoading()
      }
    }
  })
}

watch(
  () => currentRoute.fullPath,
  (path) => {
    if (currentRoute.name === 'Redirect' && path.includes(props.frameInfo?.fullPath as string)) {
      frameSrc.value = path // redirect时，置换成任意值，待重定向后 重新赋值
      loading.value = true
    }
    // 重新赋值
    if (props.frameInfo?.fullPath === path) {
      getFrameSrc()
    }
  }
)

onMounted(() => {
  init()
})
</script>

<template>
  <div v-loading="loading" class="frame" element-loading-text="加载中...">
    <iframe ref="frameRef" :src="frameSrc" class="frame-iframe" />
  </div>
</template>

<style lang="less" scoped>
.frame {
  height: calc(100vh - 110px);
  inset: 0;

  .frame-iframe {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 0;
  }
}

.main-content {
  margin: 2px 0 0 !important;
}
</style>

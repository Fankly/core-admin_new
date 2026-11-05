<template>
  <vxe-modal
    ref="modalRef"
    class-name="fxbg-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    title="分析报告"
    width="min(720px, 92vw)"
    position="center"
    :loading="loading"
    @close="handleClose"
  >
    <div class="fxbg-content">
      <div v-if="reportText" class="fxbg-text">{{ reportText }}</div>
      <el-empty v-else-if="!loading" class="fxbg-empty" description="暂无分析报告" :image-size="88" />
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'FxbgModal'
}
</script>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getFxbg as defaultGetFxbg } from '@/api/statistics/yszxfx'

const isShowModal = ref(false)
const loading = ref(false)
const reportText = ref('')
const modalRef = ref()

/**
 * 正文是异步返回的，弹窗高度会随内容变化；vxe-modal 只在打开时计算一次居中位置，
 * 长报告把弹窗撑高后就会跑到视口下方。这里在内容落地后按当前高度重新居中。
 */
const recenterModal = async () => {
  await nextTick()
  const modal: any = modalRef.value
  const box = modal?.getBox?.()
  // 最大化（zoom）时由 vxe 自己铺满，用户手动拖拽/缩放后也不应被拉回
  if (!box || modal?.reactData?.zoomLocat) return
  const visibleHeight = document.documentElement.clientHeight || window.innerHeight
  const visibleWidth = document.documentElement.clientWidth || window.innerWidth
  const top = Math.max(0, Math.round((visibleHeight - box.offsetHeight) / 2))
  const left = Math.max(0, Math.round((visibleWidth - box.offsetWidth) / 2))
  modal.setPosition?.(top, left)
}

const open = async (params: any, getFxbg?: (params: any) => Promise<any>) => {
  isShowModal.value = true
  reportText.value = ''
  loading.value = true
  try {
    const fetchFn = getFxbg ?? defaultGetFxbg
    const res = await fetchFn(params)
    if (res.success) {
      reportText.value = res.data || ''
    } else {
      ElMessage.error(res.msg || '查看分析报告失败')
    }
  } catch (e) {
    console.error('查看分析报告失败', e)
    ElMessage.error('查看分析报告失败')
  } finally {
    loading.value = false
    recenterModal()
  }
}

const handleClose = () => {
  isShowModal.value = false
  reportText.value = ''
}

defineExpose({ open })
</script>

<style lang="less">
/* vxe-modal 会 teleport 到 body，scoped 样式打不到内部结构，故用全局块并以 .fxbg-modal 命名空间收敛。
   选择器带上 .vxe-modal--wrapper.type--modal 以提高优先级，覆盖 vxe 默认的 body/content 滚动规则 */
.fxbg-modal.vxe-modal--wrapper.type--modal {
  .vxe-modal--box {
    display: flex;
    flex-direction: column;
    max-height: 80vh;
  }

  /* 最大化时铺满可用区域，不再受 max-height 限制 */
  &.is--maximize .vxe-modal--box {
    max-height: none;
  }

  .vxe-modal--body {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    padding: 0;
    overflow: hidden;

    .vxe-modal--content {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
      padding: 0;
      overflow: hidden;
      /* vxe 默认 pre-line，会与报告正文的 pre-wrap 叠加，这里还原 */
      white-space: normal;
    }
  }
}
</style>

<style scoped lang="less">
.fxbg-content {
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  padding: 20px 24px 24px;
  overflow-y: auto;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d4d7de;
    border-radius: 3px;

    &:hover {
      background-color: #b9bec8;
    }
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

.fxbg-text {
  box-sizing: border-box;
  flex: none;
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding: 18px 20px;
  font-size: 14px;
  line-height: 1.9;
  color: #303133;
  letter-spacing: 0.2px;
  text-align: justify;
  text-justify: inter-ideograph;
  word-break: normal;
  overflow-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  user-select: text;
  background-color: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.fxbg-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 8px 0;
}
</style>

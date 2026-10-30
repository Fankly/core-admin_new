<template>
  <vxe-modal
    :model-value="visible"
    class-name="image-compare-modal"
    :destroy-on-close="true"
    transfer
    show-footer
    show-close
    resize
    position="center"
    width="1120"
    height="80%"
    title="图片对比"
    @close="$emit('close')"
  >
    <div class="image-compare">
      <section v-for="pane in panes" :key="pane.key" class="image-compare__pane">
        <header class="image-compare__hd">
          <span class="image-compare__tag" :class="`image-compare__tag--${pane.key}`">{{ pane.label }}</span>
          <span class="image-compare__xmmc" :title="pane.xmmc || ''"
            ><span class="image-compare__xmmc-label">项目名称：</span>{{ pane.xmmc || (xmmcLoading ? '项目名称加载中…' : '暂无项目名称') }}</span
          >
        </header>
        <div class="image-compare__body">
          <img
            v-if="pane.url && status[pane.key] !== 'error'"
            :src="pane.url"
            :alt="pane.name"
            class="image-compare__img"
            draggable="false"
            @dragstart.prevent
            @load="setStatus(pane.key, 'loaded')"
            @error="setStatus(pane.key, 'error')"
          />
          <div v-if="!pane.url" class="image-compare__mask">暂无图片</div>
          <div v-else-if="status[pane.key] === 'loading'" class="image-compare__mask">加载中…</div>
          <div v-else-if="status[pane.key] === 'error'" class="image-compare__mask image-compare__mask--error">图片加载失败</div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="modal-footer">
        <span class="modal-footer__side"></span>
        <div v-if="items.length > 1" class="image-compare__pager">
          <el-button size="small" plain :disabled="!canPrev" aria-label="上一组图片" @click="goPrev">
            <i class="el-icon-arrow-left"></i> 上一组
          </el-button>
          <span class="image-compare__count" aria-live="polite">{{ currentIndex + 1 }} / {{ items.length }}</span>
          <el-button size="small" plain :disabled="!canNext" aria-label="下一组图片" @click="goNext">
            下一组 <i class="el-icon-arrow-right"></i>
          </el-button>
        </div>
        <!-- 单组时保留中间占位，否则 grid 只有两列，底部关闭按钮会被挤到中间 -->
        <div v-else class="image-compare__pager" aria-hidden="true"></div>
        <div class="modal-footer__side modal-footer__side--right">
          <el-button size="small" plain @click="$emit('close')">关 闭</el-button>
        </div>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { PropType } from 'vue'
import app from '@/constants/app'
import { getXmInfo } from '@/api/ai/smartTaskAudit'
import type { AuditImageComparePayload } from './auditDetailHelpers'

type ImagePaneKey = 'image' | 'target'
type ImageLoadStatus = 'loading' | 'loaded' | 'error'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  payload: {
    type: Object as PropType<AuditImageComparePayload | null>,
    default: null
  }
})

defineEmits(['close'])

/**
 * 图片预览地址：`<api>/ai/image/download?id=<uuid>`。
 * app.api 开发环境是 `/api`（vite 代理到 budget-process），生产是 `./`（与页面同上下文）；
 * 先去掉尾部斜杠再补 `/ai/...`，避免拼出 `/apiai/...` 这类缺分隔符的地址。
 */
const apiBase = String(app.api || '').replace(/\/+$/, '')
const imageUrlOf = (uuid: string) => `${apiBase}/ai/image/download?id=${encodeURIComponent(uuid)}`

const status = reactive<Record<ImagePaneKey, ImageLoadStatus>>({
  image: 'loading',
  target: 'loading'
})

/** 两张图所属项目名称（由 getXmInfo 返回） */
const xmmcData = reactive<{ srcXmmc: string; targetXmmc: string }>({ srcXmmc: '', targetXmmc: '' })
const xmmcLoading = ref(false)

/** 当前富文本里所有图片组 + 正在看的那一组 */
const items = computed(() => props.payload?.items || [])
const currentIndex = ref(0)
const current = computed(() => items.value[currentIndex.value] || null)
const canPrev = computed(() => currentIndex.value > 0)
const canNext = computed(() => currentIndex.value < items.value.length - 1)

const panes = computed(() => [
  {
    key: 'image' as ImagePaneKey,
    label: '源图',
    name: current.value?.imageName || '',
    url: current.value?.imageUuid ? imageUrlOf(current.value.imageUuid) : '',
    xmmc: xmmcData.srcXmmc
  },
  {
    key: 'target' as ImagePaneKey,
    label: '目标图',
    name: current.value?.targetName || '',
    url: current.value?.targetUuid ? imageUrlOf(current.value.targetUuid) : '',
    xmmc: xmmcData.targetXmmc
  }
])

const setStatus = (key: ImagePaneKey, value: ImageLoadStatus) => {
  status[key] = value
}

let xmmcSeq = 0

/** 切组/打开时拿两张图的项目名称；seq 防止快速翻组时旧响应覆盖新响应 */
const loadXmmc = async (srcImageId: string, targetImageId: string) => {
  const seq = ++xmmcSeq
  xmmcData.srcXmmc = ''
  xmmcData.targetXmmc = ''
  if (!srcImageId || !targetImageId) {
    xmmcLoading.value = false
    return
  }
  xmmcLoading.value = true
  try {
    const res = await getXmInfo(srcImageId, targetImageId)
    if (seq !== xmmcSeq) return
    const data = (res as any)?.data
    if (res.success && data) {
      xmmcData.srcXmmc = String(data.srcXmmc ?? '')
      xmmcData.targetXmmc = String(data.targetXmmc ?? '')
    }
  } catch {
    // 获取项目名称失败不影响图片展示
  } finally {
    if (seq === xmmcSeq) xmmcLoading.value = false
  }
}

/** 重置两张图的加载态并拉当前组的项目名称 */
const resetForCurrent = () => {
  status.image = 'loading'
  status.target = 'loading'
  loadXmmc(current.value?.imageUuid || '', current.value?.targetUuid || '')
}

const clampIndex = (value?: number) => {
  const max = Math.max(items.value.length - 1, 0)
  return Math.min(Math.max(Number(value) || 0, 0), max)
}

const goPrev = () => {
  if (!canPrev.value) return
  currentIndex.value -= 1
  resetForCurrent()
}

const goNext = () => {
  if (!canNext.value) return
  currentIndex.value += 1
  resetForCurrent()
}

// 每次打开（或换了点击的图片组）都定位到该组并重置加载态
watch(
  () => [props.visible, props.payload] as const,
  () => {
    if (!props.visible) return
    currentIndex.value = clampIndex(props.payload?.index)
    resetForCurrent()
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
@import '../css/tokens.less';

.image-compare {
  display: flex;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.image-compare__pane {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: @surface;
  border: 1px solid @border-main;
  border-radius: 10px;
}

.image-compare__hd {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: @primary-bg-light;
  border-bottom: 1px solid @border-main;
}

.image-compare__tag {
  flex: none;
  height: 20px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  color: @text-secondary;
  background: #f8fafc;
  border: 1px solid @border-main;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
}

.image-compare__tag--target {
  color: @text-secondary;
  background: #f8fafc;
  border-color: @border-main;
}

.image-compare__xmmc {
  min-width: 0;
  overflow: hidden;
  color: #00706b;
  font-size: 12.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-compare__xmmc-label {
  flex: none;
  margin-right: 2px;
}

.image-compare__name {
  min-width: 0;
  overflow: hidden;
  color: @text-main;
  font-size: 12.5px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-compare__body {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #f8fafc;
}

.image-compare__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

.image-compare__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: @text-muted;
  font-size: 12.5px;
  background: rgba(248, 250, 252, 0.72);
}

.image-compare__mask--error {
  color: #b91c1c;
}

.modal-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}

.modal-footer__side {
  display: flex;
}

.modal-footer__side--right {
  justify-content: flex-end;
}

.image-compare__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.image-compare__count {
  min-width: 42px;
  color: @text-muted;
  font-size: 12px;
  text-align: center;
}

/* vxe-modal 默认关闭图标只有约 16px，放大点击热区，避免拖拽后点不中 */
:global(.image-compare-modal .vxe-modal--header-right) {
  display: flex;
  align-items: center;
}

:global(.image-compare-modal .vxe-modal--close-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-right: -4px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

:global(.image-compare-modal .vxe-modal--close-btn:hover) {
  background: rgba(15, 23, 42, 0.08);
}
</style>

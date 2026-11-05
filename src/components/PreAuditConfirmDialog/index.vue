<template>
  <vxe-modal
    v-model="visible"
    :title="props.title"
    :width="props.width"
    :show-close="false"
    :mask-closable="false"
    :esc-closable="false"
    :draggable="false"
    :dblclick-zoom="false"
    :destroy-on-close="true"
    :lock-scroll="true"
    :transfer="true"
    position="center"
    show-footer
    class-name="pre-audit-confirm-dialog"
    @hide="handleHidden"
  >
    <div class="pre-audit-confirm" role="alert" aria-live="polite">
      <div class="pre-audit-confirm__body">
        <p v-if="messages.length > 1" class="pre-audit-confirm__summary">
          本次共返回 <strong>{{ messages.length }}</strong> 条预审提示，请逐项确认后选择是否继续提交。
        </p>
        <ol class="pre-audit-confirm__list" :class="{ 'pre-audit-confirm__list--single': messages.length === 1 }">
          <li v-for="(line, index) in messages" :key="line" class="pre-audit-confirm__item">
            <span v-if="messages.length > 1" class="pre-audit-confirm__index" aria-hidden="true">{{ index + 1 }}</span>
            <el-tooltip
              :content="line"
              :disabled="!overflowingIndexes.has(index)"
              :open-delay="250"
              :tabindex="overflowingIndexes.has(index) ? 0 : -1"
              placement="top"
              popper-class="pre-audit-confirm-tooltip"
            >
              <span
                :ref="(element) => setMessageRef(element, index)"
                class="pre-audit-confirm__text"
                :class="{ 'is-overflowing': overflowingIndexes.has(index) }"
                >{{ line }}</span
              >
            </el-tooltip>
          </li>
        </ol>
      </div>
    </div>

    <template #footer>
      <div class="pre-audit-confirm__footer">
        <el-button size="mini" type="primary" @click="handleConfirm">{{ props.confirmButtonText }}</el-button>
        <el-button size="mini" plain @click="handleCancel">{{ props.cancelButtonText }}</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'PreAuditConfirmDialog'
}
</script>

<script setup lang="ts">
import { ElButton, ElTooltip } from 'element-plus'
import { VxeModal } from 'vxe-table'
import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

interface Props {
  /** 是否显示，支持 v-model */
  modelValue?: boolean
  /** 后端返回的提示文案，多条用换行分隔，兼容历史 | 分隔 */
  msg?: string
  title?: string
  confirmButtonText?: string
  cancelButtonText?: string
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  msg: '',
  title: '预审提示',
  confirmButtonText: '确认提交',
  cancelButtonText: '取消提交',
  width: '720px'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'closed', confirmed: boolean): void
}>()

const visible = ref(props.modelValue)
/** 记录本次关闭是确认还是取消，供 closed 事件回传 */
const confirmed = ref(false)

/** 按换行拆成多条文本，兼容历史 | 分隔，避免使用 dangerouslyUseHTMLString */
const messages = computed(() => {
  const parsed = Array.from(
    new Set(
      props.msg
        .split(/\r?\n|\|/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
  return parsed.length > 0 ? parsed : ['未返回具体预审提示，请确认是否继续提交。']
})

const messageRefs = ref<HTMLElement[]>([])
const overflowingIndexes = ref<Set<number>>(new Set())

const setMessageRef = (element: Element | ComponentPublicInstance | null, index: number) => {
  if (element instanceof HTMLElement) {
    messageRefs.value[index] = element
  }
}

const updateOverflowingIndexes = () => {
  const nextIndexes = new Set<number>()
  messageRefs.value.forEach((element, index) => {
    if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
      nextIndexes.add(index)
    }
  })

  const currentIndexes = overflowingIndexes.value
  const changed = nextIndexes.size !== currentIndexes.size || Array.from(nextIndexes).some((index) => !currentIndexes.has(index))
  if (changed) {
    overflowingIndexes.value = nextIndexes
  }
}

const scheduleOverflowCheck = () => nextTick(updateOverflowingIndexes)

onBeforeUpdate(() => {
  messageRefs.value = []
})

onMounted(() => {
  scheduleOverflowCheck()
  window.addEventListener('resize', scheduleOverflowCheck)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleOverflowCheck)
})

watch(messages, scheduleOverflowCheck)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      confirmed.value = false
    }
    visible.value = val
  }
)

watch(visible, (val) => {
  if (val !== props.modelValue) {
    emit('update:modelValue', val)
  }
})

const handleConfirm = () => {
  confirmed.value = true
  visible.value = false
  emit('confirm')
}

const handleCancel = () => {
  confirmed.value = false
  visible.value = false
  emit('cancel')
}

const handleHidden = () => {
  emit('closed', confirmed.value)
}
</script>

<style lang="scss" scoped>
.pre-audit-confirm {
  padding: 2px 0;

  &__body {
    max-height: min(50vh, 360px);
    overflow-y: auto;
    min-width: 0;
    padding-right: 4px;
    scrollbar-color: #b8ddd9 transparent;
    scrollbar-width: thin;
  }

  &__summary {
    margin: 0 0 10px;
    padding-bottom: 10px;
    color: #64748b;
    font-size: 13px;
    line-height: 20px;
    border-bottom: 1px solid #e2e8f0;

    strong {
      color: #00706b;
      font-size: 14px;
      font-weight: 700;
    }
  }

  &__list {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__item {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    padding: 12px 0;

    &:first-child {
      padding-top: 2px;
    }

    & + & {
      border-top: 1px solid #eef2f6;
    }
  }

  &__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: #00706b;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    background: #e6f4f3;
    border-radius: 6px;
  }

  &__text {
    display: -webkit-box;
    min-width: 0;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    font-size: 14px;
    line-height: 24px;
    color: #475569;
    overflow-wrap: anywhere;
    word-break: break-word;

    &.is-overflowing {
      cursor: help;
    }
  }

  &__list--single &__item {
    display: block;
    padding: 4px 0 2px;
    border-top: 0;
  }

  &__body::-webkit-scrollbar {
    width: 6px;
  }

  &__body::-webkit-scrollbar-thumb {
    background: #b8ddd9;
    border-radius: 3px;

    &:hover {
      background: #8fc6c0;
    }
  }

  &__footer {
    display: flex;
    justify-content: center;
    gap: 10px;

    :deep(.el-button) {
      min-width: 88px;
      min-height: 36px;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 500;
    }

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }

    :deep(.el-button--primary) {
      color: #ffffff;
      background-color: #00706b;
      border-color: #00706b;
    }

    :deep(.el-button--primary:hover),
    :deep(.el-button--primary:focus),
    :deep(.el-button--primary:active) {
      color: #ffffff;
      background-color: #2a9a92;
      border-color: #2a9a92;
    }

    :deep(.el-button.is-plain:not(.el-button--primary):hover),
    :deep(.el-button.is-plain:not(.el-button--primary):focus) {
      color: #00706b;
      background-color: #f2f9f8;
      border-color: #b8ddd9;
    }
  }
}

:global(.pre-audit-confirm-dialog .vxe-modal--box) {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
}

:global(.pre-audit-confirm-dialog .vxe-modal--header) {
  min-height: 48px;
  padding: 10px 16px;
  color: #1e293b;
  background: #fcffff;
  border-bottom-color: #eef2f6;
}

:global(.pre-audit-confirm-dialog .vxe-modal--header-title) {
  padding: 4px 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
}

:global(.pre-audit-confirm-dialog .vxe-modal--body),
:global(.pre-audit-confirm-dialog .vxe-modal--content) {
  background: #f5fbfb;
}

:global(.pre-audit-confirm-dialog .vxe-modal--content) {
  padding: 18px 20px;
}

:global(.pre-audit-confirm-dialog .vxe-modal--footer) {
  padding: 12px 16px 16px;
  background: #ffffff;
  border-top: 1px solid #eef2f6;
}

:global(.pre-audit-confirm-tooltip) {
  max-width: min(640px, calc(100vw - 32px));
  font-size: 14px;
  line-height: 22px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (max-width: 500px) {
  :global(.pre-audit-confirm-dialog .vxe-modal--box) {
    width: calc(100vw - 24px) !important;
    max-width: calc(100vw - 24px) !important;
  }
}
</style>

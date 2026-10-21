<template>
  <button class="ds-support-link" type="button" title="用户手册" @click="openHelpModal">
    <BookOpen :size="15" :stroke-width="1.8" aria-hidden="true" />
    <span>用户手册</span>
  </button>
  <button class="ds-support-link" type="button" title="联系客服" @click="openModal">
    <Headphones :size="15" :stroke-width="1.8" aria-hidden="true" />
    <span>联系客服</span>
  </button>

  <vxe-modal
    v-model="visible"
    title="联系客服"
    width="440"
    height="auto"
    show-footer
    destroy-on-close
    position="center"
    :transfer="true"
    :mask-closable="true"
    class-name="ds-support-modal"
  >
    <div class="ds-support-modal__body">
      <div class="ds-support-card">
        <span class="ds-support-card__icon"><Phone :size="18" :stroke-width="1.8" aria-hidden="true" /></span>
        <div>
          <div class="ds-support-card__label">客服电话</div>
          <div class="ds-support-card__value">{{ formattedPhone }}</div>
        </div>
      </div>
      <div class="ds-support-card">
        <span class="ds-support-card__icon"><Mail :size="18" :stroke-width="1.8" aria-hidden="true" /></span>
        <div>
          <div class="ds-support-card__label">客服邮箱</div>
          <div class="ds-support-card__value">{{ email || '暂未配置' }}</div>
        </div>
      </div>
      <p class="ds-support-modal__hint">如遇业务数据问题，请附上页面地址与操作时间，便于快速定位。</p>
    </div>

    <template #footer>
      <div class="ds-support-modal__footer">
        <button class="ds-button" type="button" @click="closeModal">关闭</button>
      </div>
    </template>
  </vxe-modal>

  <HelpModal ref="helpModalRef" title="用户手册" :show-help-info="false" :menu-url="helpMenuUrl" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { BookOpen, Headphones, Mail, Phone } from '@lucide/vue'
import type HelpModal from '@/components/HelpModal/index.vue'

interface Props {
  phone: string
  email: string
}

interface HelpModalInstance {
  activeTab: string
  showModal: boolean
}

const props = withDefaults(defineProps<Props>(), {
  phone: '',
  email: ''
})

const visible = ref(false)
const helpModalRef = ref<HelpModalInstance | null>(null)
const helpMenuUrl = '/mainPage'

const formattedPhone = computed(() => props.phone.split('n').join('\n') || '暂未配置')

const openModal = () => {
  visible.value = true
}

const closeModal = () => {
  visible.value = false
}

const openHelpModal = () => {
  if (!helpModalRef.value) return
  helpModalRef.value.activeTab = 'help'
  helpModalRef.value.showModal = true
}
</script>

<style lang="less" scoped>
.ds-support-link {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 34px;
  padding: 0 8px;
  color: var(--ds-header-muted);
  font-size: var(--ds-text-sm);
  font-weight: 500;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-xs);
  transition:
    color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease;

  &:hover {
    color: var(--ds-jade-700);
    background: var(--ds-jade-50);
  }
}

.ui-topHeader-dark .ds-support-link,
.ui-topHeader-primary .ds-support-link {
  color: var(--ds-header-muted);
}

.ui-topHeader-dark .ds-support-link:hover,
.ui-topHeader-primary .ds-support-link:hover {
  color: var(--ds-header-text);
  background: rgb(255 255 255 / 9%);
}

:global(.ds-support-modal) {
  overflow: hidden;
  border: 1px solid var(--ds-line);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-popover);

  .vxe-modal--header {
    color: var(--ds-ink);
    background: var(--ds-surface);
    border-bottom: 1px solid var(--ds-line);
  }

  .vxe-modal--header-title {
    color: var(--ds-ink) !important;
    font-size: var(--ds-text-base) !important;
    font-weight: 600 !important;
  }

  .vxe-modal--body {
    color: var(--ds-ink);
    background: var(--ds-surface);
  }

  .vxe-modal--footer {
    background: var(--ds-surface-subtle);
    border-top: 1px solid var(--ds-line);
  }
}

.ds-support-modal__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
}

.ds-support-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  background: var(--ds-surface-subtle);
  border: 1px solid var(--ds-line);
  border-radius: var(--ds-radius-md);
}

.ds-support-card__icon {
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  place-items: center;
  color: var(--ds-jade-700);
  background: var(--ds-jade-50);
  border: 1px solid var(--ds-jade-100);
  border-radius: 50%;
}

.ds-support-card__label {
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-xs);
}

.ds-support-card__value {
  margin-top: 3px;
  color: var(--ds-ink);
  font-size: var(--ds-text-base);
  font-weight: 600;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}

.ds-support-modal__hint {
  padding: 2px 4px 0;
  color: var(--ds-ink-tertiary);
  font-size: var(--ds-text-xs);
  line-height: 1.6;
}

.ds-support-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 4px 18px 14px;
}
</style>

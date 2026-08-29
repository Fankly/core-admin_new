<template>
  <div class="customer-service-trigger tw:flex tw:items-center tw:gap-[10px] tw:select-none" @click="openHelpModal" title="用户手册">
    <Info :size="16" class="customer-service-trigger__icon" />
    <span class="customer-service-trigger__text tw:text-sm tw:font-medium">用户手册</span>
  </div>
  <div class="customer-service-trigger tw:flex tw:items-center tw:gap-[10px] tw:select-none" @click="openModal" title="联系客服">
    <Phone :size="16" class="customer-service-trigger__icon" />
    <span class="customer-service-trigger__text tw:text-sm tw:font-medium">联系客服</span>
  </div>

  <vxe-modal
    v-model="visible"
    title="联系客服"
    width="450"
    height="auto"
    show-footer
    show-zoom
    resize
    destroy-on-close
    position="center"
    :transfer="true"
    :mask-closable="true"
    class-name="customer-service-modal"
  >
    <div class="customer-service-body tw:p-[10px]">
      <div class="tw:space-y-[10px]">
        <!-- 客服电话 -->
        <div class="service-card service-card--phone tw:flex tw:items-center tw:p-[10px] tw:rounded-lg tw:border">
          <div class="service-icon service-icon--phone tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-full tw:mr-[10px]">
            <Phone :size="20" class="service-icon__glyph service-icon__glyph--phone" />
          </div>
          <div class="tw:flex-1">
            <div class="service-label tw:text-xs tw:mb-[10px]">客服电话</div>
            <div class="service-value tw:text-base tw:font-semibold tw:select-text">{{ formattedMessage }}</div>
          </div>
        </div>

        <!-- 客服邮箱 -->
        <div class="service-card service-card--email tw:flex tw:items-center tw:p-[10px] tw:rounded-lg tw:border">
          <div class="service-icon service-icon--email tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-full tw:mr-[10px]">
            <Mail :size="20" class="service-icon__glyph service-icon__glyph--email" />
          </div>
          <div class="tw:flex-1">
            <div class="service-label tw:text-xs tw:mb-[10px]">客服邮箱</div>
            <div class="service-value tw:text-base tw:font-semibold tw:select-text">{{ email || '-' }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="tw:flex tw:justify-center tw:p-[10px]">
        <el-button type="primary" class="tw:px-[10px] tw:py-[10px]" @click="closeModal">关闭</el-button>
      </div>
    </template>
  </vxe-modal>
  <HelpModal title="用户手册" ref="helpModalRef" :show-help-info="false" :menu-url="helpMenuUrl" />
</template>

<script setup lang="ts" name="CustomerService">
import { computed, ref } from 'vue'
import { Info, Phone, Mail } from 'lucide-vue-next'
import HelpModal from '@/components/HelpModal/index.vue'

interface Props {
  phone: string
  email: string
}

const props = withDefaults(defineProps<Props>(), {
  phone: '',
  email: ''
})

const visible = ref(false)
const helpModalRef = ref<InstanceType<typeof HelpModal>>()
const helpMenuUrl = ref('/mainPage')

const openModal = () => {
  visible.value = true
}
const closeModal = () => {
  visible.value = false
}

const formattedMessage = computed(() => {
  const str = props.phone.split('n')
  return str.join('\n')
})

const openHelpModal = () => {
  if (!helpModalRef.value) return
  helpModalRef.value.activeTab = 'help'
  helpModalRef.value.showModal = true
}
</script>

<style>
.customer-service-modal {
  --vxe-font-color: #303133;
  --vxe-font-lighten-color: #909399;
  --vxe-modal-header-background-color: #f5f7fa;
  --vxe-modal-body-background-color: #ffffff;
  --vxe-modal-border-color: #ebeef5;
}

.customer-service-modal .vxe-modal--header {
  background-color: #f5f7fa !important;
  border-bottom: 1px solid #ebeef5 !important;
  color: #303133 !important;
}

.customer-service-modal .vxe-modal--header-title {
  color: #303133 !important;
  font-weight: 600 !important;
}

.customer-service-modal .vxe-modal--close-btn {
  color: #909399 !important;
}

.customer-service-modal .vxe-modal--zoom-btn {
  color: #909399 !important;
}

.customer-service-modal .vxe-modal--close-btn:hover {
  color: #606266 !important;
}

.customer-service-modal .vxe-modal--zoom-btn:hover {
  color: #606266 !important;
}

.customer-service-modal .vxe-modal--footer {
  border-top: 1px solid #ebeef5 !important;
  background-color: #f5f7fa !important;
}

.customer-service-modal .vxe-modal--body {
  color: #303133 !important;
}

.customer-service-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-service-trigger__icon {
  color: var(--color-primary);
}

.service-card {
  background-color: #f5f7fa !important;
  border: 1px solid #ebeef5 !important;
}

.service-icon {
  background-color: var(--color-primary-light) !important;
  color: var(--color-primary) !important;
}

.service-label {
  color: #909399 !important;
}

.service-value {
  color: #303133 !important;
  white-space: pre-wrap !important;
  line-height: 1.6 !important;
}
</style>

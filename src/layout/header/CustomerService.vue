<template>
  <!-- <div class="customer-service-trigger tw-flex tw-items-center tw-gap-[10px] tw-select-none" @click="openNoticeModal" title="检修通知">
    <Wrench :size="16" class="customer-service-trigger__icon" />
    <span class="customer-service-trigger__text tw-text-sm tw-font-medium">检修通知</span>
  </div> -->
  <button class="customer-service-trigger" type="button" title="用户手册" @click="openHelpModal">
    <BookOpen :size="15" :stroke-width="1.8" aria-hidden="true" />
    <span>用户手册</span>
  </button>
  <button class="customer-service-trigger" type="button" title="联系客服" @click="openModal">
    <Headphones :size="15" :stroke-width="1.8" aria-hidden="true" />
    <span>联系客服</span>
  </button>

  <vxe-modal
    v-model="visible"
    width="480"
    height="auto"
    show-footer
    destroy-on-close
    position="center"
    :transfer="true"
    :mask-closable="true"
    :show-zoom="false"
    class-name="customer-service-modal"
  >
    <template #title>
      <div class="csm-head">
        <span class="csm-head-icon"><Headphones :size="19" :stroke-width="1.9" aria-hidden="true" /></span>
        <span class="csm-head-text">
          <span class="csm-title">联系客服</span>
          <span class="csm-sub">如需协助，可通过以下方式联系我们</span>
        </span>
      </div>
    </template>
    <div class="csm-body">
      <div class="csm-row">
        <span class="csm-row-icon csm-row-icon--phone"><Phone :size="17" :stroke-width="1.9" aria-hidden="true" /></span>
        <span class="csm-row-text">
          <span class="csm-row-label">客服电话</span>
          <span class="csm-row-value csm-row-value--phone">{{ formattedMessage }}</span>
        </span>
        <button class="csm-copy" type="button" :disabled="!props.phone" @click="copyText(props.phone)">复制</button>
      </div>
      <div class="csm-row">
        <span class="csm-row-icon csm-row-icon--email"><Mail :size="17" :stroke-width="1.9" aria-hidden="true" /></span>
        <span class="csm-row-text">
          <span class="csm-row-label">客服邮箱</span>
          <span class="csm-row-value" :title="props.email || '-'">{{ props.email || '-' }}</span>
        </span>
        <button class="csm-copy" type="button" :disabled="!props.email" @click="copyText(props.email)">复制</button>
      </div>
    </div>

    <template #footer>
      <div class="csm-foot">
        <span class="csm-foot-text">如遇紧急问题，请优先电话联系</span>
        <button class="csm-close" type="button" @click="closeModal">关闭</button>
      </div>
    </template>
  </vxe-modal>
  <HelpModal title="用户手册" ref="helpModalRef" :show-help-info="false" :menu-url="helpMenuUrl" glass />
  <NoticeModal :is-open="noticeOpen" :notices="maintenanceNotices" @close="closeNoticeModal" />
</template>

<script setup lang="ts" name="CustomerService">
import { computed, ref, onMounted } from 'vue'
import { BookOpen, Headphones, Phone, Mail, Wrench } from 'lucide-vue-next'
import HelpModal from '@/components/HelpModal/index.vue'
import NoticeModal from '@/components/NoticeModal/index.vue'
import { versionNoticeCheckUnread } from '@/api/sys/versionNotice'
import { ElMessage } from 'element-plus'

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
const noticeOpen = ref(false)

const openModal = () => {
  visible.value = true
}
const closeModal = () => {
  visible.value = false
}
// 复制联系方式：优先 Clipboard API，非安全上下文回退到临时 textarea
const copyText = async (value: string) => {
  const text = (value || '').trim()
  if (!text) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动选择后复制')
  }
}

onMounted(() => {
  setTimeout(() => {
    openNoticeModal()
  }, 2000)
})

const openNoticeModal = async () => {
  const res: any = await versionNoticeCheckUnread()
  if (res.success) {
    const data = res.data
    if (data) {
      maintenanceNotices.value = [data]
      noticeOpen.value = true
    }
  } else {
    ElMessage.error(res.msg)
  }
}
const closeNoticeModal = () => {
  noticeOpen.value = false
}

const maintenanceNotices = ref<any[]>([])

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
/* ---------- 联系客服弹窗：与首页/页眉「更多」弹窗同一套玻璃风 ----------
   vxe-modal transfer 到 body，故用全局块，并统一以 .customer-service-modal 作命名空间 */
.customer-service-modal {
  max-width: 94vw;
}

.customer-service-modal .vxe-modal--box {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e3efec;
  border-radius: 12px;
  box-shadow: 0 30px 70px -32px rgba(11, 94, 89, 0.45);
}

.customer-service-modal .vxe-modal--header {
  display: flex;
  align-items: center;
  padding: 14px 16px 13px 20px;
  background: linear-gradient(180deg, #ffffff, #f7fcfb);
  border-bottom: 1px solid #eef2f4;
}

.customer-service-modal .vxe-modal--header-title {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
}

.customer-service-modal .vxe-modal--close-btn {
  color: #94a3b8;
}

.customer-service-modal .vxe-modal--close-btn:hover {
  color: #0f9d8f;
}

.customer-service-modal .vxe-modal--body {
  padding: 6px 10px 8px;
  background: #fff;
}

.customer-service-modal .vxe-modal--footer {
  padding: 10px 20px 14px;
  background: #fbfdfd;
  border-top: 1px solid #eef2f4;
}

/* 头部：图标徽章 + 标题 + 说明副标 */
.csm-head {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.csm-head-icon {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  color: #0f9d8f;
  background: #ddf8f2;
  border-radius: 9px;
}

.csm-head-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.csm-title {
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.3px;
  line-height: 1.25;
}

.csm-sub {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.3;
}

/* 内容行：与「更多」弹窗列表行同一套白底圆角 + hover 描边 */
.csm-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.csm-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 9px;
  transition: background 0.16s, border-color 0.16s;
}

.csm-row:hover {
  background: #f6fbfa;
  border-color: #d8efe9;
}

.csm-row-icon {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
}

.csm-row-icon--phone {
  color: #0f9d8f;
  background: #ddf8f2;
}

.csm-row-icon--email {
  color: #3b82f6;
  background: #e8f1fe;
}

.csm-row-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.csm-row-label {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.3;
}

.csm-row-value {
  overflow: hidden;
  color: #334155;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: text;
}

/* 电话可能有多行（原有按 n 拆分的展示方式），保留换行 */
.csm-row-value--phone {
  font-variant-numeric: tabular-nums;
  white-space: pre-wrap;
}

.csm-copy {
  flex: 0 0 auto;
  padding: 0;
  color: #0f9d8f;
  font: inherit;
  font-size: 12.5px;
  font-weight: 500;
  background: none;
  border: 0;
  cursor: pointer;
  transition: color 0.16s;
}

.csm-copy:hover {
  color: #0b857a;
}

.csm-copy:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

/* 底部：左侧提示、右侧关闭 */
.csm-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.csm-foot-text {
  color: #94a3b8;
  font-size: 12px;
}

.csm-close {
  padding: 6px 16px;
  color: #fff;
  font: inherit;
  font-size: 12.5px;
  font-weight: 500;
  background: #0f9d8f;
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.16s, box-shadow 0.16s;
}

.csm-close:hover {
  background: #0b857a;
  box-shadow: 0 6px 16px -8px rgba(15, 157, 143, 0.8);
}

.csm-close:focus-visible {
  outline: 2px solid #0f9d8f;
  outline-offset: 2px;
}

/* 顶栏文字链：颜色跟随顶栏主题变量（见 header.less） */
.customer-service-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 8px;
  color: var(--masthead-muted, #5d6d66);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.14s ease, background-color 0.14s ease;
}

.customer-service-trigger:hover {
  color: var(--masthead-text-active, #0b5a51);
  background: var(--masthead-hover, #eef7f4);
}
</style>

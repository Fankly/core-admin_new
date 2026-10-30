<!-- 提示词配置弹窗 -->
<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-rule-modal prompt-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :show-footer="false"
    width="1300"
    height="90%"
    @close="handleClose"
    :loading="loading"
  >
    <div class="prompt-modal__body">
      <!-- 上：标题区 -->
      <div class="prompt-modal__header">
        <div class="prompt-modal__header-left">
          <span class="prompt-modal__header-icon-wrap">
            <Sparkles class="prompt-modal__header-icon" />
          </span>
          <div class="prompt-modal__header-title-group">
            <div class="prompt-modal__header-title-row">
              <span class="prompt-modal__header-title">{{ modalTitle }}</span>
              <span v-if="searchParams.auditPointCode" class="prompt-modal__header-code">{{ searchParams.auditPointCode }}</span>
            </div>
            <span class="prompt-modal__header-sub" :title="searchParams.auditPointName"> 当前要点：{{ searchParams.auditPointName || '—' }} </span>
          </div>
        </div>
        <div class="prompt-modal__header-right">
          <el-switch v-model="previewMode" class="prompt-modal__switch" active-text="提示词预览" inactive-text="配置编辑" inline-prompt />
        </div>
        <X class="prompt-modal__close" @click="handleClose" />
      </div>

      <!-- 中：编辑模式 - 5 个输入卡片 -->
      <div v-if="!previewMode" class="prompt-modal__content">
        <div v-for="(item, idx) in promptFields" :key="item.index" class="prompt-modal__card">
          <div class="prompt-modal__card-header">
            <span class="prompt-modal__card-index">{{ item.index }}</span>
            <span class="prompt-modal__card-title">{{ item.title }}</span>
            <span class="prompt-modal__card-en">{{ item.en }}</span>
          </div>
          <div class="prompt-modal__card-body">
            <el-input
              v-model="promptValues[idx].content"
              type="textarea"
              resize="none"
              :rows="item.rows || 4"
              :maxlength="item.maxlength || 2000"
              show-word-limit
              :placeholder="`请输入${item.title}`"
            />
          </div>
        </div>
      </div>

      <!-- 中：预览模式 - 单个大输入框 -->
      <div v-else class="prompt-modal__content">
        <div class="prompt-modal__card">
          <div class="prompt-modal__card-header">
            <span class="prompt-modal__card-title">提示词</span>
            <span class="prompt-modal__card-en">Prompt</span>
          </div>
          <div class="prompt-modal__card-body">
            <el-input
              v-model="promptContent"
              type="textarea"
              resize="none"
              :rows="28"
              :maxlength="15000"
              show-word-limit
              placeholder="请输入提示词"
            />
          </div>
        </div>
      </div>

      <!-- 下：底部按钮 -->
      <div class="prompt-modal__footer">
        <el-button size="small" plain @click="handleClose">取 消</el-button>
        <el-button size="small" type="primary" :loading="loading" @click="handleSave">保存配置</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'promptModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Sparkles, X } from '@lucide/vue'
import { VXETable } from 'vxe-table'
import { savePrompt, getPrompt } from '@/api/suzhou/aiAuditRulePoint'

interface ModalParams {
  type?: string
  modalTitle: string
  searchParams: Record<string, any>
  ruleIdList?: (string | number)[]
}

interface PromptItem {
  title: string
  content: string
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const previewMode = ref(false)
const searchParams = ref<Record<string, any>>({})
const ruleIdList = ref<(string | number)[]>([])
const modalTitle = ref('')
const promptContent = ref('')

/** 5 段固定结构，编辑模式双向绑定 */
const promptValues = ref<PromptItem[]>([
  { title: 'AI角色', content: '' },
  { title: '核心审核提示词', content: '' },
  { title: '输入数据配置', content: '' },
  { title: '输出要求', content: '' },
  { title: '限制条件', content: '' }
])

const promptFields = [
  { index: '1', title: 'AI角色', en: 'Role', rows: 3 },
  { index: '2', title: '核心审核提示词', en: 'Audit Prompt', rows: 10, maxlength: 5000 },
  { index: '3', title: '输入数据配置', en: 'Input Data', rows: 10 },
  { index: '4', title: '输出要求', en: 'Output Requirement', rows: 10 },
  { index: '5', title: '限制条件', en: 'Constraints', rows: 10 }
]

const handleClose = () => {
  isShowModal.value = false
}

const handleSave = () => {
  // 校验：编辑模式 5 段全必填，预览模式 promptContent 必填
  if (previewMode.value) {
    if (!promptContent.value.trim()) {
      ElMessage.warning('请输入提示词内容')
      return
    }
  } else {
    const empty = promptValues.value.find((item) => !item.content.trim())
    if (empty) {
      ElMessage.warning(`请输入${empty.title}`)
      return
    }
  }

  VXETable.modal
    .confirm('是否保存，请确定！', '提示', { status: 'warning' })
    .then(async (type) => {
      if (type !== 'confirm') {
        ElMessage.info('已取消')
        return
      }
      loading.value = true
      try {
        // 编辑模式只传 prompts，预览模式只传 promptContent，另一字段传空
        const payload = previewMode.value
          ? { ruleIdList: ruleIdList.value, prompts: [], promptContent: promptContent.value }
          : {
              ruleIdList: ruleIdList.value,
              prompts: promptValues.value.map((item) => ({ title: item.title, content: item.content || '' })),
              promptContent: ''
            }
        const res = await savePrompt(payload)
        if (res.success) {
          ElMessage.success('保存成功！')
          emit('searchHandle', { param: 'success' })
          handleClose()
        } else {
          ElMessage.error(res.msg)
        }
      } catch (e) {
        ElMessage.error((e as Error).message)
      } finally {
        loading.value = false
      }
    })
    .catch(() => {})
}

const acceptParams = async (params: ModalParams) => {
  const data = params.searchParams || {}
  modalTitle.value = params.modalTitle || ''
  searchParams.value = { ...data }
  ruleIdList.value = params.ruleIdList || []
  previewMode.value = false
  // 先重置为空，打开弹窗
  promptValues.value = promptFields.map((field) => ({ title: field.title, content: '' }))
  promptContent.value = ''
  isShowModal.value = true

  // 通过 ruleId 拉取提示词数据回显
  if (data.ruleId) {
    loading.value = true
    try {
      const res = await getPrompt(data.ruleId)
      const resData = res.data || {}
      if (res.success) {
        promptContent.value = resData.promptContent || ''
        const prompts: PromptItem[] = Array.isArray(resData.prompts) ? resData.prompts : []
        promptValues.value = promptFields.map((field) => {
          const matched = prompts.find((p) => p.title === field.title)
          return { title: field.title, content: matched?.content || '' }
        })
        // 回显模式：promptContent 有值优先预览模式，无值才编辑模式
        previewMode.value = !!promptContent.value
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  }
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@primary: #00706b;
@primary-hover: #2a9a92;
@primary-soft: #f2f9f8;
@primary-hover-soft: #e6f4f3;
@primary-border: #b8ddd9;
@text-main: #1e293b;
@text-body: #475569;
@text-muted: #64748b;
@surface: #ffffff;
@border: #e2e8f0;
@border-light: #f1f5f9;
@page-bg: #f5fbfb;

.prompt-modal {
  .vxe-modal--box {
    border-radius: 12px !important;
    box-shadow: 0 8px 28px rgba(0, 112, 107, 0.12) !important;
  }

  .vxe-modal--header {
    display: none !important;
  }

  .vxe-modal--body,
  .vxe-modal--content {
    min-height: 0;
    overflow: hidden !important;
    background: @page-bg !important;
  }

  .vxe-modal--content {
    padding: 0 !important;
  }
}

.prompt-modal__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.prompt-modal__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding: 14px 16px;
  background: #fcffff;
  border-bottom: 1px solid @border-light;
}

.prompt-modal__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  margin-right: auto;
}

.prompt-modal__header-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: @primary-hover-soft;
  border: 1px solid @primary-border;
  border-radius: 8px;
}

.prompt-modal__header-icon {
  width: 22px;
  height: 22px;
  color: @primary;
}

.prompt-modal__header-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.prompt-modal__header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt-modal__header-title {
  color: @text-main;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.prompt-modal__header-code {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  color: @primary;
  font-size: 12px;
  background: @primary-soft;
  border: 1px solid @primary-border;
  border-radius: 10px;
}

.prompt-modal__header-sub {
  color: @text-muted;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prompt-modal__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-right: 10px;
  padding: 4px 10px;
  background: @primary-soft;
  border: 1px solid @primary-border;
  border-radius: 8px;
}

.prompt-modal__switch {
  --el-switch-on-color: @primary;
  --el-switch-off-color: #cbd5e1;
}

.prompt-modal__close {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: @text-muted;
  cursor: pointer;
  transition: color 0.12s ease;

  &:hover {
    color: @primary;
  }
}

.prompt-modal__content {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt-modal__card {
  flex-shrink: 0;
  background: @surface;
  border: 1px solid @border;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.12s ease;

  &:hover {
    border-color: @primary-border;
  }
}

.prompt-modal__card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fcffff;
  border-bottom: 1px solid @border-light;
}

.prompt-modal__card-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  background: @primary;
  border-radius: 50%;
}

.prompt-modal__card-title {
  color: @text-main;
  font-size: 13px;
  font-weight: 600;
}

.prompt-modal__card-en {
  color: @text-muted;
  font-size: 12px;
}

.prompt-modal__card-body {
  padding: 10px 14px;

  .el-textarea__inner {
    color: @text-body;
    font-size: 13px;
    line-height: 1.6;
    border-color: @border;
    border-radius: 6px;

    &:hover {
      border-color: @primary-border;
    }

    &:focus {
      border-color: @primary;
    }
  }

  .el-input__count {
    color: @text-muted;
    background: transparent;
  }
}

.prompt-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
  padding: 12px 16px;
  background: #fcffff;
  border-top: 1px solid @border-light;

  .el-button {
    height: 32px;
    min-height: 32px;
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
  }

  .el-button + .el-button {
    margin-left: 0;
  }

  .el-button--primary {
    color: #ffffff !important;
    background: @primary !important;
    border-color: @primary !important;
    background-image: none !important;

    &:hover,
    &:focus {
      color: #ffffff !important;
      background: @primary-hover !important;
      border-color: @primary-hover !important;
    }
  }
}
</style>

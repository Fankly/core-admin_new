<template>
  <vxe-modal
    :model-value="modal.visible"
    :destroy-on-close="true"
    :loading="modal.loading"
    fullscreen
    show-footer
    show-zoom
    resize
    position="center"
    width="80%"
    height="720"
    title="编辑任务"
    @close="$emit('close')"
  >
    <div class="tw-p-4 md:tw-p-6 tw-space-y-4 tw-w-full tw-h-full tw-flex tw-flex-col tw-text-gray-800">
      <!-- 基本信息区：布局对齐查看详情 -->
      <div class="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-x-12 tw-gap-y-2 tw-shrink-0">
        <!-- 左侧 -->
        <div class="tw-space-y-2">
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-py-1">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">项目名称</span>
            <span class="tw-text-[13px] tw-text-gray-800 sm:tw-w-2/3">{{ formatEmpty(detailData.xmmc) }}</span>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-py-1">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">附件名称</span>
            <span class="tw-text-[13px] tw-text-gray-800 sm:tw-w-2/3">{{ formatEmpty(detailData.attachName) }}</span>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-py-1">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">转码状态</span>
            <div class="sm:tw-w-2/3">
              <el-select v-model="formModel.transcodeStatus" clearable placeholder="请选择转码状态" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </div>
        </div>
        <!-- 右侧 -->
        <div class="tw-space-y-2">
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-py-1">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">项目编码</span>
            <span class="tw-text-[13px] tw-text-gray-800 sm:tw-w-2/3">{{ formatEmpty(detailData.xmbm) }}</span>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-py-1">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">附件类型</span>
            <span class="tw-text-[13px] tw-text-gray-800 sm:tw-w-2/3">{{ getAttachTypeName(detailData) }}</span>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-py-1">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">提取状态</span>
            <div class="sm:tw-w-2/3">
              <el-select v-model="formModel.extractStatus" clearable placeholder="请选择提取状态" style="width: 100%">
                <el-option v-for="item in statusOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑区：原生文本，不做任何解析渲染 -->
      <div class="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-8 tw-flex-1 tw-min-h-0">
        <div class="tw-flex tw-flex-col tw-min-h-0">
          <div class="tw-flex tw-items-center tw-justify-between tw-mb-3 tw-pb-2 tw-border-b tw-border-gray-200 tw-shrink-0">
            <h3 class="tw-text-[14px] tw-font-bold tw-text-gray-800 tw-leading-none">markdown文本</h3>
            <span class="tw-text-[12px] tw-text-gray-500 tw-leading-none">{{ formModel.content.length }} 字符</span>
          </div>
          <textarea
            v-model="formModel.content"
            class="raw-editor"
            spellcheck="false"
            aria-label="markdown文本"
            placeholder="请输入文本内容"
          ></textarea>
        </div>
        <div class="tw-flex tw-flex-col tw-min-h-0 tw-gap-4">
          <div class="tw-flex tw-flex-col tw-min-h-0 tw-flex-1">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3 tw-pb-2 tw-border-b tw-border-gray-200 tw-shrink-0">
              <h3 class="tw-text-[14px] tw-font-bold tw-text-gray-800 tw-leading-none">提取 Schema</h3>
              <span class="tw-text-[12px] tw-leading-none" :class="schemaError ? 'tw-text-[#d92d20]' : 'tw-text-gray-500'">
                {{ schemaError || `${formModel.extractSchema.length} 字符` }}
              </span>
            </div>
            <textarea
              v-model="formModel.extractSchema"
              class="raw-editor"
              spellcheck="false"
              aria-label="提取Schema"
              placeholder="请输入提取Schema"
            ></textarea>
          </div>
          <div class="tw-flex tw-flex-col tw-min-h-0 tw-flex-1">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3 tw-pb-2 tw-border-b tw-border-gray-200 tw-shrink-0">
              <h3 class="tw-text-[14px] tw-font-bold tw-text-gray-800 tw-leading-none">提取信息（JSON）</h3>
              <span class="tw-text-[12px] tw-leading-none" :class="jsonError ? 'tw-text-[#d92d20]' : 'tw-text-gray-500'">
                {{ jsonError || `${formModel.extractJson.length} 字符` }}
              </span>
            </div>
            <textarea
              v-model="formModel.extractJson"
              class="raw-editor"
              spellcheck="false"
              aria-label="提取信息JSON"
              placeholder="请输入提取结果JSON"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-button :disabled="modal.loading" type="primary" size="mini" plain @click="$emit('save')">保 存</el-button>
        <el-button :disabled="modal.loading" type="primary" size="mini" @click="$emit('update')">更 新</el-button>
        <el-button :disabled="modal.loading" size="mini" plain @click="$emit('close')">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import { statusOptions } from '../constants'
import { formatEmpty, getAttachTypeName } from '../utils'
import type { AttachTaskRow, EditForm, ModalState } from '../types'

const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  editForm: {
    type: Object as PropType<EditForm>,
    required: true
  },
  detailData: {
    type: Object as PropType<AttachTaskRow>,
    required: true
  }
})

defineEmits(['save', 'update', 'close'])

const formModel = computed(() => props.editForm)

const getJsonHint = (text: string) => {
  const value = text.trim()
  if (!value) return ''
  try {
    JSON.parse(value)
    return ''
  } catch (e: any) {
    return `JSON 格式有误：${e?.message || '无法解析'}`
  }
}

// 仅作提示，不阻止保存，也不改写用户输入的原文。
const jsonError = computed(() => getJsonHint(props.editForm.extractJson))
const schemaError = computed(() => getJsonHint(props.editForm.extractSchema))
</script>

<style scoped lang="less">
.raw-editor {
  box-sizing: border-box;
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 12px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fbfcfd;
  color: #344054;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  overflow-x: hidden;
  overflow-y: auto;
  resize: none;
  outline: none;

  &:focus {
    border-color: #00706b;
  }

  &::placeholder {
    color: #98a2b3;
  }
}

.modal-footer {
  text-align: center;
}
</style>

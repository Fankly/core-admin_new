<template>
  <vxe-modal
    :model-value="modal.visible"
    :loading="modal.loading || modal.saving"
    :destroy-on-close="true"
    show-footer
    show-close
    resize
    position="center"
    width="80%"
    height="80%"
    :title="modal.title"
    @close="$emit('close')"
  >
    <div class="attach-type-edit">
      <div class="attach-type-edit__meta">
        <span class="attach-type-edit__tag">{{ modal.fjName || config.label }}</span>
        <span class="attach-type-edit__name" :title="modal.attachName">{{ modal.attachName || '—' }}</span>
      </div>

      <div class="attach-type-edit__body">
        <el-form label-position="top" size="small" class="attach-type-edit__form">
          <div class="attach-type-edit__grid">
            <el-form-item v-for="field in config.fields" :key="field.key" :label="field.label" class="attach-type-edit__item">
              <!-- 金额用原生 number 输入：EP 1.0.2-beta 的 el-input-number 会给内部 input 写死 aria-disabled=true -->
              <el-input
                v-if="field.kind === 'number'"
                v-model="form[field.key]"
                type="number"
                step="0.01"
                class="attach-type-edit__number"
                :disabled="isFieldDisabled(field)"
                placeholder="请输入金额"
              />
              <el-input
                v-else-if="field.kind === 'textarea'"
                v-model="form[field.key]"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 6 }"
                :disabled="isFieldDisabled(field)"
                placeholder="请输入"
              />
              <el-input v-else v-model="form[field.key]" clearable :disabled="isFieldDisabled(field)" placeholder="请输入" />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="attach-type-edit__footer">
        <el-button type="primary" size="small" :loading="modal.saving" @click="$emit('save', { ...form })">保 存</el-button>
        <el-button size="small" :disabled="modal.saving" @click="$emit('close')">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { PropType } from 'vue'
import { ATTACH_TYPE_EDIT_CONFIG } from '../constants'
import type { AttachTypeField } from '../constants'
import type { AttachTypeEditModalState } from '../types'

const props = defineProps({
  modal: {
    type: Object as PropType<AttachTypeEditModalState>,
    required: true
  },
  /** 详情接口原样返回的 data；弹窗内部据此生成表单，保存时把表单整体抛给宿主 */
  detail: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  }
})

defineEmits(['save', 'close'])

const config = computed(() => ATTACH_TYPE_EDIT_CONFIG[props.modal.type] || ATTACH_TYPE_EDIT_CONFIG.jys)
const locked = computed(() => props.modal.loading || props.modal.saving)

/** 加载/保存期间字段全部禁用（无单独置灰字段） */
const isFieldDisabled = (field: AttachTypeField) => locked.value

/** 金额字段保持后端返回的原始文本（如 "360.80"），保存时再由宿主转成数字 */
const form = reactive<Record<string, any>>({})

const rebuildForm = () => {
  Object.keys(form).forEach((key) => delete form[key])
  form.id = String(props.detail.id ?? '')
  form.proId = String(props.detail.proId ?? '')
  form.attachId = String(props.detail.attachId ?? '')
  form.projectId = String(props.detail.projectId ?? props.detail.proId ?? '')
  config.value.fields.forEach((field) => {
    form[field.key] = String(props.detail[field.key] ?? '')
  })
}

// 每次打开（或切到另一类文档）都按新的详情重建，避免沿用上一份数据
watch(
  () => [props.modal.visible, props.modal.type, props.detail] as const,
  () => {
    if (props.modal.visible) rebuildForm()
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
.attach-type-edit {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.attach-type-edit__meta {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.attach-type-edit__tag {
  flex: none;
  height: 20px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  color: #00706b;
  background: #f2f9f8;
  border: 1px solid #b8ddd9;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
}

.attach-type-edit__name {
  min-width: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 12.5px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attach-type-edit__body {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.attach-type-edit__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.attach-type-edit__item {
  margin-bottom: 12px;
}

.attach-type-edit__number {
  width: 100%;
}

.attach-type-edit__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

:deep(.el-form-item__label) {
  padding-bottom: 4px;
  color: #475569;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 18px;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  border-radius: 6px;
}

@media (max-width: 960px) {
  .attach-type-edit__grid {
    grid-template-columns: 1fr;
  }
}
</style>

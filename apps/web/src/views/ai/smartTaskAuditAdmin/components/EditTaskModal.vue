<template>
  <vxe-modal
    :model-value="modal.visible"
    :destroy-on-close="true"
    :loading="modal.loading"
    show-footer
    show-zoom
    resize
    transfer
    position="center"
    width="900"
    min-width="600"
    height="600"
    title="修改任务"
    @close="$emit('close')"
  >
    <el-form ref="formRef" :model="formModel" label-width="100px" label-suffix="：" label-position="right">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任务名称" prop="taskName">
            <el-input v-model.trim="formModel.taskName" placeholder="请输入任务名称" clearable :maxlength="200" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规则名称" prop="ruleName">
            <el-input v-model.trim="formModel.ruleName" disabled :maxlength="200" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formModel.startTime"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              clearable
              placeholder="请选择开始时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="finishTime">
            <el-date-picker
              v-model="formModel.finishTime"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              clearable
              placeholder="请选择结束时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否历史" prop="isHis">
            <el-select v-model="formModel.isHis" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in yesNoOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="formModel.priority" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in priorityOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任务状态" prop="status">
            <el-select v-model="formModel.status" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in statusOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="审核意见" prop="reviewOpinion">
            <el-select v-model="formModel.reviewOpinion" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in reviewOpinionOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="审核结果" prop="result">
            <el-select v-model="formModel.result" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in reviewResultOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="人工复核意见" prop="manualReviewOpinion">
            <el-select v-model="formModel.manualReviewOpinion" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in manualReviewOpinionOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="人工复核状态" prop="manualReviewStatus">
            <el-select v-model="formModel.manualReviewStatus" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in manualReviewStatusOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="审核结论" prop="reviewConclude">
            <el-input v-model.trim="formModel.reviewConclude" type="textarea" :rows="4" placeholder="请输入审核结论" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="审核过程" prop="reviewProcess">
            <el-input v-model.trim="formModel.reviewProcess" type="textarea" :rows="4" placeholder="请输入审核过程" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="审核消息" prop="message">
            <el-input v-model.trim="formModel.message" type="textarea" :rows="4" placeholder="请输入审核消息" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="modal-footer">
        <el-button :disabled="modal.loading" type="primary" size="small" plain @click="$emit('save')">保 存</el-button>
        <el-button :disabled="modal.loading" size="small" plain @click="$emit('close')">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import type { ModalState, OptionItem } from '../types'
import type { AiAuditTaskEntity } from '@/api/ai/smartTaskAudit'

const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  form: {
    type: Object as PropType<AiAuditTaskEntity>,
    required: true
  },
  yesNoOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  priorityOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  statusOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  reviewOpinionOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  reviewResultOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  manualReviewOpinionOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  manualReviewStatusOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  }
})

defineEmits(['save', 'close'])

const formRef = ref()
const formModel = computed(() => props.form)

defineExpose({
  /** 表单校验，由父组件在保存前调用 */
  validate: async () => {
    return await formRef.value?.validate?.()
  },
  clearValidate: () => formRef.value?.clearValidate?.()
})
</script>

<style scoped lang="less">
.modal-footer {
  text-align: center;
}
</style>

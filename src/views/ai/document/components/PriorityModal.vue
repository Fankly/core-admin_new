<template>
  <vxe-modal
    :model-value="modal.visible"
    :destroy-on-close="true"
    :loading="modal.loading"
    show-footer
    show-zoom
    resize
    position="center"
    width="420"
    height="168"
    title="修改优先级"
    @close="$emit('close')"
  >
    <el-form ref="formRef" :model="formModel" label-width="90px" label-suffix="：">
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="formModel.priority" placeholder="请选择" style="width: 100%">
          <el-option v-for="item in priorityOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="modal-footer">
        <el-button :disabled="modal.loading" type="primary" size="mini" plain @click="$emit('save')">保 存</el-button>
        <el-button :disabled="modal.loading" size="mini" plain @click="$emit('close')">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import { priorityOptions } from '../constants'
import type { ModalState, PriorityForm } from '../types'

const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  priorityForm: {
    type: Object as PropType<PriorityForm>,
    required: true
  }
})

defineEmits(['save', 'close'])

const formRef = ref()
const formModel = ref(props.priorityForm)

defineExpose({
  clearValidate: () => formRef.value?.clearValidate?.()
})
</script>

<style scoped lang="less">
.modal-footer {
  text-align: center;
}
</style>

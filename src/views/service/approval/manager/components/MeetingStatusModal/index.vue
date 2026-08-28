<template>
  <vxe-modal
    ref="dialogFormRef"
    v-model="visible"
    :destroy-on-close="true"
    title="会议状态更新"
    resize
    show-zoom
    :width="420"
    :height="190"
    :close-on-press-escape="false"
    @close="closeHandle"
  >
    <div class="meeting-status-modal">
      <el-form ref="formRef" :model="formData" :rules="rules" label-suffix="：">
        <el-form-item label="会议状态" prop="status">
          <el-select v-model="formData.status" clearable style="width: 100%">
            <el-option v-for="item in props.statusOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="meeting-status-modal__footer">
        <el-button size="mini" type="primary" plain :loading="loading" @click="handleSubmit">更 新</el-button>
        <el-button size="mini" plain :disabled="loading" @click="closeHandle">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="MeetingStatusModal">
import { reactive, ref, nextTick } from 'vue'
import { ElForm } from 'element-plus'

interface StatusOption {
  code: string
  name: string
}

const props = defineProps<{
  statusOptions: StatusOption[]
}>()

const emit = defineEmits<{
  (event: 'update', status: string): void
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<InstanceType<typeof ElForm>>()
const formData = reactive({
  status: ''
})

const rules = {
  status: [{ required: true, message: '请选择会议状态', trigger: 'change' }]
}

const acceptParams = async (params?: { status?: string }) => {
  formData.status = params?.status || ''
  visible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

const closeHandle = () => {
  if (loading.value) return
  visible.value = false
  formData.status = ''
  formRef.value?.clearValidate()
}

const setLoading = (value: boolean) => {
  loading.value = value
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('update', formData.status)
}

defineExpose({
  acceptParams,
  closeHandle,
  setLoading
})
</script>

<style scoped lang="less">
.meeting-status-modal {
  padding: 18px 24px 0;

  &__footer {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 24px;
  }
}
</style>

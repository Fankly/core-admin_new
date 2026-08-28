<template>
  <vxe-modal
    destroy-on-close
    :loading="loading"
    position="center"
    title="目标值一致性配置"
    @close="handleCancel"
    v-model="isShowModal"
    width="400"
    height="168"
    show-zoom
    show-footer
    resize
  >
    <template #default>
      <el-form :rules="formRules" ref="formRef" :model="formData">
        <el-form-item label="是否目标值一致性" prop="mbzYzx">
          <el-select style="width: 100%" v-model="formData.mbzYzx">
            <el-option :key="item.code" v-for="item in sfData" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div class="operation">
        <el-button type="primary" sizi="mini" @click="handleSave">保 存</el-button>
        <el-button type="primary" sizi="mini" @click="handleCancel">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>
<script lang="ts">
export default {
  name: 'MbzYzxConfigModal'
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'
import { mbzYzxConfig } from '@/api/sys/proCategory'
import { getPublicData } from '@/api/common'

interface AcceptParams {
  ids: string[]
  dwId: string
}

const emit = defineEmits(['saveDataAfter'])

const formRef = ref()
const isShowModal = ref(false)
const sfData = ref<
  {
    code: string
    name: string
  }[]
>([])
const loading = ref(false)
const parameter = ref<AcceptParams>({
  ids: [],
  dwId: ''
})
const formData = ref({
  mbzYzx: ''
})

const formRules = reactive({
  mbzYzx: [
    {
      required: true,
      trigger: 'change',
      message: '请选择是否目标值一致性'
    }
  ]
})

const getPublicCode = async () => {
  const res = await getPublicData('GY_SF')
  if (res.success) {
    sfData.value = res.data
  }
}

const acceptParams = (params: AcceptParams) => {
  getPublicCode()
  isShowModal.value = true
  parameter.value = { ...parameter.value, ...params }
}

const handleSave = async () => {
  await formRef.value.validate()
  try {
    const type = await VXETable.modal.confirm('是否确认保存?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否',
      showClose: false
    })
    if (type === 'confirm') {
      loading.value = true
      const res = await mbzYzxConfig({
        ...parameter.value,
        ...formData.value
      })
      if (res.success) {
        handleCancel()
        ElMessage.success('保存成功!')
        emit('saveDataAfter')
      } else {
        throw new Error(res.msg)
      }
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}
const handleCancel = () => {
  formRef.value.resetFields()
  isShowModal.value = false
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.select {
  width: 100%;
}

.operation {
  text-align: center;
}
:deep(.el-date-editor) {
  width: 100%;
}
</style>

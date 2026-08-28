<template>
  <vxe-modal
    :loading="loading"
    :destroy-on-close="true"
    @close="handleCloseModal"
    show-zoom
    show-footer
    width="40%"
    v-model="isShowModal"
    title="续建结转期间调整"
  >
    <el-form
      ref="formRef"
      :rules="formRules"
      label-position="right"
      label-width="120px"
      :model="formData"
      label-suffix="："
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item prop="name" label="项目类型">
            <el-input style="width: 100%" :disabled="true" v-model="formData.name"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="nd" label="年度">
            <el-input style="width: 100%" :disabled="true" v-model="formData.nd"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="dateRange" label="续建结转期间">
            <el-date-picker
              @change="changeDateData"
              style="width: 100%"
              v-model="formData.dateRange"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              type="daterange"
              range-separator="至"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="operation" style="text-align: center">
        <el-button plain size="mini" type="primary" @click="handleSaveData">保 存</el-button>
        <el-button plain size="mini" @click="handleCloseModal">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="ContinueCarryoverModal">
// 父组件传过来的参数
import { reactive, ref } from 'vue'
import { RowVo } from '../ContinueCarryover.vue'
import { editData } from '@/api/config/continueCarryover'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'

interface ParameterProps extends RowVo {
  name: string
  nd: string
  id: string
}

const emit = defineEmits(['refresh'])
const loading = ref(false)
const formRef = ref()
const parameter = ref<ParameterProps>({
  name: '',
  nd: '',
  id: '',
  startDate: '',
  endDate: '',
  protypeName: '',
  protypeId: ''
})

const formRules = reactive({
  dateRange: [{ required: true, message: '请选择续建结转期间', trigger: 'change' }]
})

const formData = ref({
  nd: '',
  name: '',
  startDate: '',
  endDate: '',
  dateRange: []
})

const isShowModal = ref(false)

// 接收父组件参数
const acceptParams = (params: RowVo) => {
  parameter.value = { ...parameter.value, ...params }
  formData.value.nd = params.nd
  formData.value.name = params.protypeName
  if (params.endDate && params.startDate) {
    formData.value.dateRange = [params.startDate, params.endDate]
  }
  isShowModal.value = true
}

const changeDateData = (val) => {
  if (val && val.length > 0) {
    formData.value.startDate = val[0]
    formData.value.endDate = val[1]
  } else {
    formData.value.startDate = ''
    formData.value.endDate = ''
  }
}

const handleSaveData = async () => {
  loading.value = true
  try {
    await formRef.value.validate()
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      loading.value = true
      const res = await editData({
        ...parameter.value,
        ...formData.value
      } as any)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('修改成功!')
      emit('refresh')
      handleCloseModal()
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const handleCloseModal = () => {
  formData.value = {
    nd: '',
    name: '',
    startDate: '',
    endDate: '',
    dateRange: []
  }
  parameter.value = {
    name: '',
    nd: '',
    id: '',
    startDate: '',
    endDate: '',
    protypeName: '',
    protypeId: ''
  }
  isShowModal.value = false
}

defineExpose({
  acceptParams
})
</script>

<style scoped></style>

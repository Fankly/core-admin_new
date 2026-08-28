<template>
  <vxe-modal :loading="loading" :destroy-on-close="true" @close="handleCloseModal" show-zoom show-footer width="40%" v-model="isShowModal" title="项目预算变更调整">
    <el-form ref="formRef" :rules="formRules" label-position="right" label-width="160px" :model="formData" label-suffix="：">
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
          <el-form-item prop="ystzfd" label="预算调整幅度范围">
            <el-input-number style="width: 100%" v-model="formData.ystzfd" :controls="false"></el-input-number>
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

<script setup lang="ts" name="BudgetChangesModal">
// 父组件传过来的参数
import { reactive, ref } from 'vue'
import { editData } from '@/api/config/continueCarryover'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
interface RowVO {
  protypeName: string
  protypeId: string
  nd: string
  dataType: string
}

interface ParameterProps extends RowVO {
  name: string
  nd: string
  id: string
  ystzfd: string
}

const emit = defineEmits(['refresh'])
const loading = ref(false)
const formRef = ref()
const parameter = ref<ParameterProps>({
  name: '',
  nd: '',
  id: '',
  ystzfd: '',
  dataType: '',
  protypeName: '',
  protypeId: ''
})

const formRules = reactive({
  ystzfd: [
    { required: true, message: '请输入预算调整幅度范围', trigger: 'blur' },
    {
      pattern: /^(?:0|[1-9]\d{0,3})(?:\.\d{1,2})?$/,
      message: '只能小数不超过4位的数字,不超过两位小数',
      trigger: 'blur'
    }
  ]
})

const formData = ref({
  nd: '',
  name: '',
  ystzfd: ''
})

const isShowModal = ref(false)

// 接收父组件参数
const acceptParams = (params: RowVO) => {
  parameter.value = { ...parameter.value, ...params }
  formData.value.nd = params.nd
  formData.value.name = params.protypeName
  // 回显
  isShowModal.value = true
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
    ystzfd: ''
  }
  parameter.value = {
    name: '',
    nd: '',
    id: '',
    dataType: '',
    ystzfd: '',
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

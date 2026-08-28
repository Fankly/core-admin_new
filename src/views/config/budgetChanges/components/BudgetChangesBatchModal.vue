<template>
  <vxe-modal :loading="loading" :destroy-on-close="true" @close="handleCloseModal" show-zoom show-footer width="40%" v-model="isShowModal" title="项目预算变更调整">
    <el-form ref="formRef" :rules="formRules" label-position="right" label-width="160px" :model="formData" label-suffix="：">
      <el-row :gutter="24">
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

<script setup lang="ts" name="BudgetChangesBatchModal">
// 父组件传过来的参数
import { reactive, ref } from 'vue'
import { batchUpdateData } from '@/api/config/continueCarryover'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'

interface RowVO {
  ystzfd: string
  protypeName: string
  nd: string
  protypeId: string
  id: string
  dataType: string
}

const emit = defineEmits(['refresh'])
const loading = ref(false)
const formRef = ref()
const parameter = ref<RowVO[]>([])

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
  ystzfd: ''
})

const isShowModal = ref(false)

// 接收父组件参数
const acceptParams = (params: RowVO[]) => {
  parameter.value = params
  isShowModal.value = true
}

const handleSaveData = async () => {
  try {
    await formRef.value.validate()
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      loading.value = true
      parameter.value.forEach((item) => {
        item.ystzfd = formData.value.ystzfd
      })
      const res = await batchUpdateData(parameter.value as any)
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
    ystzfd: ''
  }
  parameter.value = []
  isShowModal.value = false
}

defineExpose({
  acceptParams
})
</script>

<style scoped></style>

<template>
  <vxe-modal
    show-zoom
    resize
    @close="closeHandle"
    position="center"
    v-model="modalVisible"
    width="420"
    height="170"
    title="确认出库"
    destroy-on-close
    :mask-closable="false"
    :loading="loading"
    :show-footer="true"
    transfer
  >
    <el-form ref="formRef" :rules="formRules" label-position="right" label-width="120px" label-suffix="：" :model="ckFormData">
      <el-row :gutter="24">
        <el-col>
          <el-form-item prop="shxx" label="上会信息">
            <el-select filterable v-model="ckFormData.shxx" style="width: 100%" placeholder="请选择上会信息">
              <el-option v-for="item in shxxList" :key="item" :value="item" :label="item"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button plain type="primary" size="mini" @click="submitHandle">确认出库</el-button>
        <el-button plain type="primary" size="mini" @click="closeHandle">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getPublicCodeList } from '@/api/common'
import { sqckConfirm, getShxx } from '@/api/service/Storage/confirmOutbound'
import { ElForm, ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'

interface Parameter {
  selectData: Record<string, string>[] | null
  searchCode: string
}
const emit = defineEmits(['submitAfter'])
const formRef = ref<InstanceType<typeof ElForm>>()
const curYear = new Date().getFullYear().toString()

// 父组件传过来的参数
const parameter = ref<Parameter>({
  selectData: null,
  searchCode: ''
})
const ndList = ref<
  {
    code: string
    name: string
  }[]
>([])
const shxxList = ref<string[]>([])
const loading = ref(false)
const modalVisible = ref(false)
const ckFormData = ref({
  shxx: ''
})

const formRules = ref({
  shxx: [{ required: true, message: '请选择上会信息', trigger: 'change' }]
})

const submitHandle = async () => {
  await formRef.value?.validate()
  const type = await VXETable.modal.confirm('是否确认出库?', '提示', {
    confirmButtonText: '是',
    cancelButtonText: '否'
  })
  if (type !== 'confirm') return
  loading.value = true
  try {
    const xmIds = parameter.value.selectData?.map((item) => item.id)
    const res = await sqckConfirm({
      ...ckFormData.value,
      xmIds: xmIds,
      searchCode: parameter.value.searchCode
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('出库成功!')
    emit('submitAfter')
    closeHandle()
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const initPublicParams = async () => {
  try {
    const res = await getPublicCodeList({
      codes: ['ZLYS_XMJHSSND']
    })
    if (!res.success) throw new Error(res.msg)
    ndList.value = res.data['ZLYS_XMJHSSND']
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const initShxxList = async () => {
  try {
    const res = await getShxx({})
    if (!res.success) throw new Error(res.msg)
    shxxList.value = res.data || []
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const closeHandle = () => {
  clearParameter()
  modalVisible.value = false
}

const clearParameter = () => {
  ckFormData.value.shxx = ''
  parameter.value.searchCode = ''
  parameter.value.selectData = null
}

// 接收父组件参数
const acceptParams = (params: Parameter) => {
  initPublicParams()
  initShxxList()
  parameter.value = { ...parameter.value, ...params }
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>

<style lang="less" scoped></style>

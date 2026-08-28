<template>
  <vxe-modal
    @close="closeHandle"
    position="center"
    v-model="modalVisible"
    width="400"
    height="200"
    title="维护项目优先级"
    destroy-on-close
    :mask-closable="false"
    :loading="loading"
    transfer
  >
    <el-form ref="formRef" :rules="formRules" label-position="right" label-width="120px" label-suffix="：" :model="formData">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item prop="xmyxj" label="项目优先级">
            <el-select v-model="formData.xmyxj" style="width: 100%" placeholder="请选择项目优先级">
              <el-option v-for="item in yxjList" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div style="text-align: center">
      <el-button plain type="primary" size="mini" @click="submitHandle">确 认</el-button>
      <el-button plain type="primary" size="mini" @click="closeHandle">关 闭</el-button>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElForm, ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getPublicCodeList } from '@/api/common'
import { whXmyxj } from '@/api/service/Storage/Outbound'

interface Parameter {
  selectData: Record<string, any>[] | null
}

const emit = defineEmits(['submitAfter'])
const formRef = ref<InstanceType<typeof ElForm>>()

const parameter = ref<Parameter>({
  selectData: null
})
const yxjList = ref<
  {
    code: string
    name: string
  }[]
>([])
const loading = ref(false)
const modalVisible = ref(false)
const formData = ref<{ xmyxj: string }>({
  xmyxj: ''
})

const formRules = ref({
  xmyxj: [{ required: true, message: '请选择项目优先级', trigger: 'change' }]
})

const initPublicParams = async () => {
  try {
    const res = await getPublicCodeList({
      codes: ['XMYXJ_COM']
    })
    if (!res.success) throw new Error(res.msg)
    yxjList.value = res.data['XMYXJ_COM']
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const submitHandle = async () => {
  try {
    await formRef.value?.validate()
    const type = await VXETable.modal.confirm('确认是否维护项目优先级?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return
    loading.value = true
    const ids = (parameter.value.selectData || []).map((item) => item.id)
    const res = await whXmyxj({
      ids,
      xmyxj: formData.value.xmyxj
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('维护项目优先级成功!')
    emit('submitAfter')
    closeHandle()
  } catch (e: any) {
    if (e && e.message) {
      ElMessage.error(e.message)
    }
  } finally {
    loading.value = false
  }
}

const clearParameter = () => {
  formData.value.xmyxj = ''
  parameter.value.selectData = null
}

const closeHandle = () => {
  clearParameter()
  modalVisible.value = false
}

// 接收父组件参数
const acceptParams = (params: Parameter) => {
  initPublicParams()
  parameter.value = { ...parameter.value, ...params }
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>

<style lang="less" scoped></style>

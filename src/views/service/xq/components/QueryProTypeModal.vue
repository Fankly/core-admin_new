<template>
  <VxeModal @close="closeHandle" :loading="loading" :destroy-on-close="true" v-model="modalVisible" title="项目类型确认">
    <el-form ref="formRef" :model="formData" :rules="formRule">
      <el-form-item prop="proType" label="项目类型">
        <el-select style="width: 100%" v-model="formData.proType">
          <el-option v-for="item in proTypeList" :key="item.code" :value="item.code" :label="item.name"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="operation" style="text-align: center">
      <el-button size="mini" type="primary" plain @click="detailHandle">确 认</el-button>
      <el-button size="mini" type="primary" plain @click="closeHandle">取 消</el-button>
    </div>
  </VxeModal>
</template>

<scrip lang="ts">
export default {
  name: 'QueryProTypeModal'
}
</scrip>
<script setup lang="ts">
import { getTbcxmlxListByxmId, confimXmlx } from '@/api/service/requirement'
import { ElMessage } from 'element-plus'
import { ref, reactive, defineExpose } from 'vue'
import VXETable from 'vxe-table'
const modalVisible = ref(false)

const formData = reactive({
  proType: ''
})

const proTypeList = ref<
  {
    code: string
    name: string
  }[]
>([])

const closeHandle = () => {
  modalVisible.value = false
  formRef.value.resetFields()
}

const formRule = reactive({
  proType: {
    required: true,
    message: '请选择项目类型',
    trigger: 'change'
  }
})

const loading = ref(false)
const formRef = ref()

const paramsProp = ref<any>({})

const searchProTypeParams = async (id: string) => {
  try {
    loading.value = true
    const res = await getTbcxmlxListByxmId(id)
    if (res.success) {
      proTypeList.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const detailHandle = async () => {
  try {
    const result = await formRef.value.validate()
    if (result) {
      const type = await VXETable.modal.confirm('是否确认项目类型？', '温馨提示', {
        status: 'warning'
      })
      if (type === 'confirm') {
        loading.value = true
        const res = await confimXmlx({
          protypeId: formData.proType,
          xmId: paramsProp.value['row']['id']
        })
        if (res.success) {
          ElMessage.success('项目类型确认成功!')
          closeHandle()
          paramsProp.value.getTableData()
          paramsProp.value.getFirstTableData()
        } else {
          ElMessage.error(res.msg)
        }
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const acceptParams = async (params: any) => {
  paramsProp.value = {
    ...params
  }
  modalVisible.value = true
  await searchProTypeParams(params.row['id'])
}

defineExpose({
  acceptParams
})
</script>

<style scoped></style>

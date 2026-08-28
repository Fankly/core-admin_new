<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, defineExpose, reactive } from 'vue'

import { createDeptEditData, getBmByEjdw } from '@/api/service/requirement'
import { VXETable } from 'vxe-table'

interface ParamData {
  selectDatas: any[]
  search: () => void
}

const paramData = ref<Record<string, any>>({
  selectDatas: []
})

const isShowModal = ref(false)
const loading = ref(false)
const formRef = ref()
const formData = ref({
  createDeptId: ''
})

const bmList = ref([])

const formRuls = reactive({
  createDeptId: {
    required: true,
    message: '请选择创建部门',
    trigger: 'change'
  }
})

const queryHandle = async () => {
  loading.value = true
  try {
    if (!paramData.value.selectDatas || paramData.value.selectDatas.length === 0) {
      ElMessage.error('当前数据存在问题,请重新选择!')
      return
    }
    const type = await VXETable.modal.confirm('确认是否进行修改?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      const ids = paramData.value.selectDatas.map((item: any) => item.id)
      const res = await createDeptEditData({
        ids: ids,
        createDeptId: formData.value.createDeptId
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('修改成功!')
      paramData.value?.search()
      closeHandle()
    }
  } catch (e: any) {
    console.error(e.toString())
  } finally {
    loading.value = false
  }
}

const getCreateDeptDataList = async () => {
  loading.value = true
  const selectedData = paramData.value.selectDatas
  try {
    if (!selectedData || selectedData.length === 0) {
      ElMessage.error('当前数据存在问题,请重新选择!')
      return
    }
    const ejdw = paramData.value.selectDatas[0].ejdw
    const res = await getBmByEjdw(ejdw)
    if (!res.success) throw new Error(res.msg)
    bmList.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const closeHandle = () => {
  // 重置表单数据,清空选择框数据
  bmList.value.length = 0
  formRef.value?.resetFields()
  isShowModal.value = false
}

const acceptParams = (params: ParamData) => {
  paramData.value = {
    ...params
  }
  getCreateDeptDataList()
  isShowModal.value = true
}

defineExpose({
  acceptParams
})
</script>

<template>
  <vxe-modal @close="closeHandle" :loading="loading" resize title="创建部门修改" v-model="isShowModal" width="385" height="150" position="center">
    <el-form label-width="80px" label-position="right" ref="formRef" :model="formData" :rules="formRuls">
      <el-form-item label="创建部门" prop="createDeptId">
        <el-select style="width: 100%" v-model="formData.createDeptId">
          <el-option v-for="item in bmList" :key="item.code" :label="item.name" :value="item.code"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div style="text-align: center">
      <el-button type="primary" plain size="mini" @click="queryHandle">确认</el-button>
      <el-button type="primary" plain size="mini" @click="closeHandle">取消</el-button>
    </div>
  </vxe-modal>
</template>

<style scoped lang="less"></style>

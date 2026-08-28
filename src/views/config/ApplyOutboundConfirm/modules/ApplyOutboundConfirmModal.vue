<template>
  <vxe-modal
    :loading="loading"
    :destroy-on-close="true"
    @close="handleCloseModal"
    show-zoom
    show-footer
    width="600px"
    height="400px"
    v-model="isShowModal"
    title="申请出库确认调整"
  >
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="{
        children: 'children',
        leaf: 'leaf',
        label: 'name',
        id: 'id'
      }"
      node-key="id"
      :expand-on-click-node="false"
      show-checkbox
    ></el-tree>
    <template #footer>
      <div class="operation" style="text-align: center">
        <el-button plain size="mini" type="primary" @click="handleSaveData">保 存</el-button>
        <el-button plain size="mini" @click="handleCloseModal">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="ApplyOutboundConfirmModal">
// 父组件传过来的参数
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getProtypeTreeYearAll } from '@/api/common'
import { getSqckProtypeConfirmChoosedData, saveSqckProtypeConfirmData } from '@/api/config/sqckProtypeConfirmConfig'

interface RowVO {
  protypeName: string
  protypeId: string
  nd: string
}

interface FormData {
  nd: string
  protypeId: string
}

interface ParameterProps extends RowVO {
  name: string
  nd: string
  id: string
}

const emit = defineEmits(['refresh'])
const loading = ref(false)
const treeRef = ref()
const parameter = ref<ParameterProps>({
  name: '',
  nd: '',
  id: '',
  protypeName: '',
  protypeId: ''
})

const treeData = ref([])

const formData = ref({
  nd: '',
  name: ''
})

const isShowModal = ref(false)

// 接收父组件参数
const acceptParams = async (params: RowVO) => {
  loading.value = true
  try {
    parameter.value = { ...parameter.value, ...params }
    formData.value.name = params.protypeName
    formData.value.nd = params.nd
    // 回显
    isShowModal.value = true
    const isRes = await getTreeData(params.nd)
    if (isRes) {
      await getFormData({
        nd: params.nd,
        protypeId: params.protypeId
      })
    }
  } finally {
    loading.value = false
  }
}

const getFormData = async (params: FormData) => {
  try {
    const res = await getSqckProtypeConfirmChoosedData(params)
    if (!res.success) throw new Error(res.msg)
    if (treeRef.value) treeRef.value.setCheckedKeys(res.data)
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

const getTreeData = async (nd: string) => {
  try {
    const res = await getProtypeTreeYearAll(nd)
    if (!res.success) throw new Error(res.msg)
    treeData.value = res.data
    return true
  } catch (e) {
    ElMessage.error((e as Error).message)
    return false
  }
}

const handleSaveData = async () => {
  loading.value = true
  try {
    const ids = treeRef.value.getCheckedKeys()
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      loading.value = true
      const res = await saveSqckProtypeConfirmData({
        ...formData.value,
        protypeIds: [parameter.value.protypeId],
        linkedPortypeIds: ids
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
    name: ''
  }
  parameter.value = {
    name: '',
    nd: '',
    id: '',
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

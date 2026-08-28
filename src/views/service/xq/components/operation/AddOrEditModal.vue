<template>
  <vxe-modal
    :loading="loading"
    class-name="addOrEditClass"
    :destroy-on-close="true"
    @close="handleCloseModal"
    :title="modalProps.title"
    width="30%"
    height="260"
    position="center"
    v-model="isShowModal"
  >
    <el-tabs type="card" v-model="tabName">
      <el-tab-pane name="1" label="通过资产编码新增">
        <el-form :rules="zcbmFormRules" ref="zcbmFormRef" :model="zcbmFormData" label-width="120px">
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item prop="zcbm" label="ERP资产编号：">
                <el-input v-model="zcbmFormData.zcbm"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item prop="gsdm" label="公司代码：">
                <el-select style="width: 100%" v-model="zcbmFormData.gsdm">
                  <el-option label="1001" value="1001"></el-option>
                  <el-option label="1002" value="1002"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div style="text-align: center">
                <el-button type="primary" @click="handleDetailModal">确 认</el-button>
                <el-button plain @click="handleCloseModal">关 闭</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </vxe-modal>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue'

import { ModalProps } from './interface/index'
import { ElMessage } from 'element-plus'
import { getZcByZcbm } from '@/api/service/requirement'
import VXETable from 'vxe-table'

export default defineComponent({
  name: 'AddOrEditModal',
  setup(_props, { expose, emit }) {
    const isShowModal = ref(false)
    const tabName = ref('1')
    const zcbmFormRef = ref()

    const modalProps = ref<ModalProps>({
      opType: 'ADD',
      title: '设备资产信息-新增'
    })

    const zcbmFormRules = reactive({
      zcbm: [
        {
          required: true,
          message: '请输入ERP资产编号',
          trigger: 'blur'
        }
      ],
      gsdm: [
        {
          required: true,
          message: '请输入公司代码',
          trigger: 'change'
        }
      ]
    })

    const zcbmFormData = reactive({
      gsdm: '',
      zcbm: ''
    })

    const loading = ref(false)

    const handleDetailModal = async () => {
      try {
        const type = await VXETable.modal.confirm('是否确认新增？', '温馨提示', {
          status: 'warning'
        })
        if (type === 'confirm') {
          loading.value = true
          const res = await getZcByZcbm(zcbmFormData.gsdm, zcbmFormData.zcbm)
          if (res.success) {
            emit('sendData', res)
          } else {
            throw new Error(res.msg)
          }
        }
      } catch (error: any) {
        ElMessage.error(error.message)
      } finally {
        loading.value = false
      }
    }

    const handleCloseModal = () => {
      zcbmFormRef.value.resetFields()
      isShowModal.value = false
    }

    const acceptParams = (params: ModalProps) => {
      modalProps.value = { ...params }
      isShowModal.value = true
    }
    expose({
      acceptParams,
      handleCloseModal,
      handleDetailModal,
      isShowModal
    })
    return {
      loading,
      zcbmFormData,
      zcbmFormRef,
      modalProps,
      acceptParams,
      handleCloseModal,
      handleDetailModal,
      zcbmFormRules,
      isShowModal,
      tabName
    }
  }
})
</script>

<style scoped lang="less">
:deep(.el-tabs__content) {
  overflow: hidden !important;
  margin: auto !important;
}
</style>

<template>
  <vxe-modal
    :mask="true"
    :lock-scroll="true"
    :lock-view="true"
    show-zoom
    resize
    position="center"
    title="项目关闭打开"
    v-model="isShowModal"
    width="40%"
    height="400"
    class-name="modal-main"
    @close="handleCloseModal"
  >
    <div class="modal-container">
      <div class="modal-operation">
        <el-button size="mini" type="primary" :disabled="gridOptions.loading" plain @click="() => handleSubmit(parameter, selectedData)"
          >提 交</el-button
        >
        <el-button :disabled="gridOptions.loading" size="mini" type="primary" plain @click="() => handleUploadFile(parameter)">上传附件</el-button>
        <el-button :disabled="gridOptions.loading" size="mini" type="primary" plain @click="handleCloseModal">关 闭</el-button>
      </div>
      <div class="modal-table">
        <vxe-grid ref="gridRef" v-bind="gridOptions">
          <template #attachName_default="{ row }">
            <el-button type="text" v-if="row.attachName" @click="() => handleDownloadFile(row.uuid, row.attachName)">{{ row.attachName }}</el-button>
            <span v-else>{{ row.attachName }}</span>
          </template>
        </vxe-grid>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts" setup name="OperationModal">
import { ref } from 'vue'
import { RowVO } from '@/views/service/project/projectActivation/interface'
import { useCommon } from './hooks/useCommon'
import { VxeGridInstance } from 'vxe-table'

export interface AcceptParams {
  ids: string
  zztbs: string
}

export interface UserInfo {
  dwId: string
  specialorgcode: string
  bmId: string
  id: string
}

const isShowModal = ref(false)
const gridRef = ref<VxeGridInstance<any>>()
const parameter = ref<AcceptParams>({
  ids: '',
  zztbs: ''
})

const selectedData = ref<RowVO[]>([])

const handleCloseModal = () => {
  parameter.value = {
    ids: '',
    zztbs: ''
  }
  isShowModal.value = false
  gridOptions.data = []
}

const { gridOptions, searchModalData, handleSubmit, setUserInfo, setPageData, handleUploadFile, handleDownloadFile } = useCommon(
  gridRef,
  handleCloseModal
)
const acceptParams = (params: AcceptParams, userInfo: UserInfo, selected: RowVO[], handleSearchPageData: () => {}) => {
  parameter.value = { ...parameter.value, ...params }
  selectedData.value = selected
  setUserInfo(userInfo)
  setPageData(handleSearchPageData)
  searchModalData(parameter.value)
  isShowModal.value = true
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.modal-main {
  .modal-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    .modal-operation {
      margin-bottom: 10px;
      min-width: 0;
      min-height: 0;
    }
    .modal-table {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
}

:deep(.vxe-table--render-default .vxe-body--row.row--current) {
  .el-button--text {
    color: white;
  }
}
</style>

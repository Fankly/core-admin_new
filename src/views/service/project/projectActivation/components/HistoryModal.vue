<template>
  <vxe-modal
    :mask="true"
    :lock-scroll="true"
    :lock-view="true"
    show-zoom
    resize
    position="center"
    title="处理记录"
    v-model="isShowModal"
    width="70%"
    height="720"
    class-name="modal-main"
    @close="handleCloseModal"
  >
    <div class="modal-container">
      <div class="modal-operation">
        <el-button
          :disabled="gridOptions.loading"
          size="mini"
          type="primary"
          plain
          @click="handleCloseModal"
          >关 闭</el-button
        >
      </div>
      <div class="modal-table">
        <vxe-grid ref="gridRef" v-bind="gridOptions">
          <template #pushmessage_item="{ data }">
            <el-input v-model="data.pushmessage" type="text"></el-input>
          </template>
          <template #responsemessage_item="{ data }">
            <el-input v-model="data.responsemessage" type="text"></el-input>
          </template>
          <template #operate_item>
            <el-button type="primary" size="mini" plain @click="handleSearchPageData"
              >查 询</el-button
            >
            <el-button size="mini" plain @click="handleResetFormData">重 置</el-button>
          </template>
        </vxe-grid>
      </div>
      <div class="pager">
        <el-pagination
          :current-page="page.page"
          background
          align="center"
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page.limit"
          :total="parseInt(page.total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle"
          @current-change="pageChangeHandle"
        ></el-pagination>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts" setup name="HistoryModal">
import { ref } from 'vue'
import { RowVO } from '@/views/service/project/projectActivation/interface'
import { VxeGridInstance } from 'vxe-table'
import { useHistoryCommon } from './hooks/useHistoryCommon'

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

const {
  setUserInfo,
  gridOptions,
  pageChangeHandle,
  limitChangeHandle,
  handleSearchPageData,
  handleResetFormData,
  setSelectedData,
  page
} = useHistoryCommon()

const handleCloseModal = () => {
  isShowModal.value = false
}

const acceptParams = (userInfo: UserInfo, selected: RowVO[]) => {
  setUserInfo(userInfo)
  setSelectedData(selected)
  handleSearchPageData()
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

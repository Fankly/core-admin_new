6
<template>
  <vxe-modal
    :mask="true"
    :lock-scroll="true"
    :lock-view="true"
    show-zoom
    resize
    position="center"
    title="项目预算变更历史记录"
    v-model="isShowModal"
    width="70%"
    height="820"
  >
    <div class="content">
      <div class="operation">
        <el-button
          :disabled="loading || hasSelectedProjects"
          type="primary"
          size="mini"
          plain
          @click="handleViewData"
          >查 看</el-button
        >
        <el-button :disabled="loading" type="primary" size="mini" plain @click="handleClose"
          >关 闭</el-button
        >
      </div>
      <div class="table">
        <vxe-table
          keep-source
          height="auto"
          max-height="100%"
          :loading="loading"
          :checkbox-config="{
            trigger: 'row',
            highlight: true
          }"
          resizable
          :loading-config="{ icon: 'el-icon-loading', text: '正在加载...' }"
          :row-config="{ height: 32 }"
          border
          stripe
          show-overflow
          :edit-config="{ trigger: 'click', mode: 'cell', showStatus: true }"
          :data="tableData"
          @cell-click="cellClickHandle"
          @checkbox-change="checkChangeHandle"
          @checkbox-all="checkChangeAllHandle"
          ref="tableRef"
        >
          <vxe-column align="center" :minWidth="55" type="checkbox"></vxe-column>
          <vxe-column
            headerAlign="center"
            align="center"
            :minWidth="220"
            field="bgsj"
            title="变更时间"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="center"
            :minWidth="150"
            field="bgeditor"
            title="变更人"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="150"
            field="bgAmount"
            title="变更总预算(不含税)（万元）"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="right"
            :formatter="formatterHandle"
            :minWidth="150"
            field="bgDnys"
            title="变更当年预算(不含税)（万元）"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="center"
            :formatter="formatterHandle"
            :minWidth="150"
            field="ysbgType"
            title="变更源头"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            :formatter="formatterHandle"
            :minWidth="150"
            field="bgyy"
            title="变更原因"
          ></vxe-column>
          <vxe-column
            headerAlign="center"
            align="center"
            :minWidth="220"
            field="attachName"
            title="变更说明附件"
          >
            <template #default="{ row }">
              <el-button @click="() => handleDownloadAttach(row)" type="text">{{
                row['attachName']
              }}</el-button>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>
  </vxe-modal>
  <wbsEditModal ref="wbsEditModalRef" />
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { AcceptParams, BudgetChangeCreateRowVo } from '@/views/service/budget/changes/interface'
import { formatValue } from '@/utils/utils'
import { downloadAttach } from '@/api/service/requirement'
import { ElMessage } from 'element-plus'
import { searchHistoryData } from '@/api/service/budget'
import { RowVo } from '@/views/service/budget/changes/components/budgetChangeHistory/interface'
import WbsEditModal from '@/views/service/budget/changes/components/wbsEditModal/index.vue'

const handleError = (error: Error, message = '操作失败'): void => {
  console.error(`${message}`, error)
  ElMessage({
    message: `${message}:${error.message}`,
    type: 'error',
    duration: 5000
  })
}

export default defineComponent({
  name: 'budgetChangeHistory',
  components: { WbsEditModal },
  setup(props, { expose }) {
    const isShowModal = ref(false)
    const tableData = ref<RowVo[]>([])
    const checkedData = ref<RowVo[]>([])
    const tableRef = ref()
    const wbsEditModalRef = ref()
    const loading = ref(false)
    const parameter = ref<AcceptParams>({
      searchPage: null,
      selectedRowData: [],
      sfgmb: '',
      limitNum: 50,
      publicParams: {
        bmId: '',
        nd: '',
        xmlxId: '-1',
        dwId: '',
        userId: '',
        specialorgcode: '',
        fqzz: '',
        spRoleId: ''
      }
    })
    const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

    const acceptParams = (params: AcceptParams) => {
      parameter.value = { ...parameter.value, ...params }
      const id = params.selectedRowData.map((item) => item.xmid).join(',')
      searchHistoryDataPage(id)
      isShowModal.value = true
    }

    const checkChangeHandle = ({ records }: any) => {
      checkedData.value = records
    }
    const checkChangeAllHandle = ({ records }: any) => {
      checkedData.value = records
    }

    const cellClickHandle = async ({ row, column }: any) => {
      if (column.type === 'checkbox') return
      checkedData.value = []
      await tableRef.value.clearCheckboxRow()
      await tableRef.value.setCheckboxRow(row, true)
      checkedData.value.push(row)
    }
    const formatterHandle = ({ cellValue }: any) => {
      if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
      return formatValue(cellValue, 6)
    }

    const handleDownloadAttach = async (row: BudgetChangeCreateRowVo) => {
      const uuid = row.uuid as string
      loading.value = true
      try {
        let res = await downloadAttach(uuid)
        const blob: any = res
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        // 获取文件名
        if (res.headers) {
          let filename = row.attachName
          dom.download = `${decodeURI(decodeURI(filename))}`
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
        }
      } catch (e) {
        handleError(e as Error, '下载附件失败')
      } finally {
        loading.value = false
      }
    }

    const handleViewData = () => {
      if (checkedData.value.length !== 1) {
        ElMessage.warning('请选择一条要查看的项目!')
        return
      }
      if (checkedData.value[0].wbsflag == '0') {
        ElMessage.warning('非标准WBS项目没有WBS明细！')
        return
      }
      wbsEditModalRef.value.acceptParams({
        checkedData: checkedData.value
      })
    }

    const searchHistoryDataPage = async (id: string) => {
      try {
        loading.value = true
        const res = await searchHistoryData(id)
        if (res.success) {
          tableData.value = res.data as RowVo[]
        } else {
          throw new Error(res.msg)
        }
      } catch (e) {
        handleError(e as Error, '历史记录查询失败')
      } finally {
        loading.value = false
      }
    }
    const handleClose = () => {
      tableData.value = []
      checkedData.value = []
      isShowModal.value = false
    }

    expose({
      acceptParams
    })
    return {
      handleClose,
      wbsEditModalRef,
      hasSelectedProjects,
      handleViewData,
      searchHistoryDataPage,
      handleDownloadAttach,
      isShowModal,
      checkChangeAllHandle,
      checkChangeHandle,
      cellClickHandle,
      formatterHandle,
      checkedData,
      tableRef,
      tableData,
      loading,
      parameter
    }
  }
})
</script>

<style scoped lang="less">
@import './index';
</style>

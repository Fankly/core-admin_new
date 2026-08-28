<!-- 评审意见汇总表-->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModal"
      :destroy-on-close="true"
      resize
      show-zoom
      fullscreen
      :title="'项目评审意见汇总明细'"
      :width="1200"
      :close-on-press-escape="true"
      @close="closeHandle"
    >
      <div class="modal_content">
        <div class="toolbar-section">
          <div class="search-group">
            <el-input v-model="rightSearchKeyword" placeholder="请输入项目名称查询..." class="copy-text-input w-64" clearable size="small">
              <template #prepend>
                <div class="input-prepend">项目名称</div>
              </template>
            </el-input>
            <ReMultipleText
              v-model="rightProjectCode"
              placeholder="请输入项目编码,多个用逗号分隔"
              show-prepend
              prepend-label="项目编码"
              class="w-64"
            />
            <el-checkbox v-model="showAllReview" @change="searchHandle">显示评审记录</el-checkbox>
          </div>
          <div class="btn">
            <el-button size="mini" type="primary" plain v-debounce="[searchHandle, `click`, 300]">查 询</el-button>
            <el-button size="mini" type="primary" plain v-debounce="[refreshHandle, `click`, 300]">重 置</el-button>
            <el-button size="mini" type="primary" plain v-debounce="[exportHandle, `click`, 300]">导 出</el-button>
          </div>
        </div>
        <div class="right-column-table">
          <vxe-grid ref="xmTableRef" v-bind="gridProps" />
        </div>
        <el-pagination
          :page-size="xmListPage.pageSize"
          :current-page="xmListPage.currentPage"
          :page-sizes="[20, 50, 100, 500]"
          size="default"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="xmListPage.total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'reviewTable'
}
</script>

<script setup lang="ts">
import { reactive, ref, defineProps, defineExpose, defineEmits } from 'vue'
import { getDynamicColumn, getTableData, exportData } from '@/api/service/IhhsMeeting/xmOpinionSummary'
import { ElMessage } from 'element-plus'
import { formatValue } from '@/utils/utils'
import { apiExportHandle, vxeExportHandle } from '@/utils/export'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { formatReviewTableText } from './reviewTableText'

const dialogFormRef = ref()
const meetingId = ref<string>('')
const isShowModal = ref(false)
const reviewAuthParams = ref({
  dwId: '',
  bmId: '',
  roleId: ''
})
const closeHandle = () => {
  isShowModal.value = false
  showAllReview.value = false
}

const xmTableRef = ref()
const rightSearchKeyword = ref('')
const rightProjectCode = ref('')
const showAllReview = ref(false)
const xmListPage = reactive({
  currentPage: 1,
  pageSize: 100,
  total: 0
})

const getReviewAuthParams = () => {
  return {
    dwId: reviewAuthParams.value.dwId || '',
    bmId: reviewAuthParams.value.bmId || '',
    roleId: reviewAuthParams.value.roleId || ''
  }
}

// 项目列表
const gridProps = reactive<any>({
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32,
    keyField: 'id'
  },
  border: true,
  columnConfig: {
    resizable: true
  },
  columns: [],
  data: []
})

// 重置数据
const refreshHandle = () => {
  rightSearchKeyword.value = ''
  rightProjectCode.value = ''
  showAllReview.value = false
  xmListPage.pageSize = 100
  xmListPage.currentPage = 1
  xmListPage.total = 0
  if (meetingId.value == '') return
  getDataByMeetingId()
}

//查询数据
const searchHandle = () => {
  xmListPage.pageSize = 100
  xmListPage.currentPage = 1
  xmListPage.total = 0
  if (meetingId.value == '') return
  getDataByMeetingId()
}

// 处理项目分页
const handleSizeChange = (val: number) => {
  xmListPage.pageSize = val
  xmListPage.currentPage = 1
  getDataByMeetingId()
}
//处理项目翻页
const handlePageChange = (val: number) => {
  xmListPage.currentPage = val
  getDataByMeetingId()
}

// 根据会议ID获取表头
const getMeetingForXm = async (chooseMeetingId: string, authParams?: { dwId: string; bmId: string; roleId: string }) => {
  meetingId.value = chooseMeetingId
  reviewAuthParams.value = {
    dwId: authParams?.dwId || '',
    bmId: authParams?.bmId || '',
    roleId: authParams?.roleId || ''
  }
  const res: any = await getDynamicColumn({
    ...getReviewAuthParams(),
    meetingId: meetingId.value
  })
  if (res.success) {
    if (res.data.length == 0) return ElMessage.warning('暂无数据')
    gridProps.columns = handleColumns(res.data)
    if (meetingId.value != '') {
      isShowModal.value = true
      await getDataByMeetingId()
    }
  } else {
    ElMessage.error(res.msg)
  }
}

//数据中金额保留小数点后六位
const formatterData = ({ cellValue, column }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
}

const formatterText = ({ cellValue }: any) => formatReviewTableText(cellValue)

const amountFields = ['xmgstz_sbys', 'xmgstz_sdje', 'xmgstz_hshj']

// 表格对齐方式
const handleColumns = (data: any) => {
  data.forEach((item: any) => {
    const hasChildren = item.children.length !== 0
    const isAmountColumn = amountFields.includes(item.field)
    item.headerAlign = item.title == '单位：万元' ? 'right' : 'center'
    item.align = isAmountColumn ? 'right' : 'center'
    if (!hasChildren) {
      item.formatter = isAmountColumn ? formatterData : formatterText
      item.className = isAmountColumn ? item.className : [item.className, 'xm-review-table-pre-line'].filter(Boolean).join('')
    }
    if (hasChildren) {
      handleColumns(item.children)
    }
  })
  return data
}

//根据会议ID获取数据
const getDataByMeetingId = async () => {
  const params = {
    ...getReviewAuthParams(),
    limit: xmListPage.pageSize,
    page: xmListPage.currentPage,
    meetingId: meetingId.value,
    xmmc: rightSearchKeyword.value,
    xmbmList: rightProjectCode.value ? rightProjectCode.value.split(',') : [],
    sfzsqbyj: showAllReview.value ? '1' : '0'
  }
  gridProps.loading = true
  try {
    const data: any = await getTableData({ ...params })
    if (data.success) {
      if (data.data.length == 0) return ElMessage.warning('暂无数据')
      gridProps.data = data.data.records
      xmListPage.total = Number(data.data.total ?? '0')
    } else {
      ElMessage.error(data.msg)
    }
  } finally {
    gridProps.loading = false
  }
}
// 导出
const exportHandle = () => {
  const params = {
    ...getReviewAuthParams(),
    meetingId: meetingId.value,
    xmmc: rightSearchKeyword.value,
    xmbmList: rightProjectCode.value ? rightProjectCode.value.split(',') : [],
    sfzsqbyj: showAllReview.value ? '1' : '0'
  }
  const fileName = '项目会审意见汇总表'
  apiExportHandle(params, fileName, exportData)
}

defineExpose({
  getMeetingForXm
})
</script>

<style scoped lang="less">
.modal_content {
  width: 100%;
  height: 100%;
  padding: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  .toolbar-section {
    padding: 10px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-shrink: 0;
    height: 52px;
    box-sizing: border-box;
    .search-group {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      max-width: 620px;
      padding: 0 10px;
      :deep(.el-checkbox) {
        height: 32px;
        line-height: 32px;
      }
    }
    .btn {
      display: flex;
      gap: 8px;
    }
  }
  .right-column-table {
    flex: 1;
    min-width: 0;
    min-height: 0;
    :deep(.vxe-body--column.xm-review-table-pre-line > .vxe-cell > .vxe-cell--wrapper) {
      white-space: pre-line !important;
      word-break: break-word;
    }
  }
}
</style>

<style lang="less">
.xm-review-table-tooltip {
  white-space: pre-line;
  word-wrap: break-word;
}
</style>

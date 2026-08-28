<!--评审项目 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      :title="`项目明细`"
      resize
      fullscreen
      show-zoom
      show-footer
      :width="1200"
      :height="800"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <div style="margin-bottom: 10px">
        <el-button size="mini" type="primary" plain @click="rejectHandle">退 回</el-button>
        <el-button size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
      </div>
      <div style="height: 85%">
        <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvent" />
      </div>
      <div class="main-pagination">
        <el-pagination
          :current-page="pagination.page"
          background
          :page-sizes="[50, 100, 200, 500]"
          :page-size="pagination.limit"
          :total="parseInt(pagination.total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleChangeSizeChange"
          @current-change="handleChangeCurrentChange"
        />
      </div>
      <template #footer>
        <div style="text-align: center">
          <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
        </div>
      </template>
    </vxe-modal>
  </div>
  <review-modal ref="returnModal" :title="'退回意见'" :label="'退回意见'" @show-modal="returnMag"></review-modal>
</template>
<script lang="ts">
export default {
  name: 'projectTable'
}
</script>
<script setup lang="ts">
import { ref, reactive, h, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getDynamicColumn, getTableData, exportData, leaderReviewThForCityLhhs } from '@/api/ai/reviewWorkBench'
import { apiExportHandle } from '@/utils/export'
import reviewModal from '@/components/yssxTable/reviewModal.vue'

const isShowModel = ref<boolean>(false)
const meetingId = ref<string>('')
const gridRef = ref()
const returnModal = ref()
const useInfo = ref<any>()
const selectedList = ref<any[]>([])
const pagination = reactive({
  page: 1,
  limit: 100,
  total: 0 as number | string
})
const closeHandle = () => {
  isShowModel.value = false
}

const initParamLists = async (param: any) => {
  meetingId.value = param?.meetingId
  useInfo.value = { ...param }
  isShowModel.value = true
  const res: any = await getDynamicColumn({ meetingId: meetingId.value })
  if (!res.success) return ElMessage.error(res.msg)
  gridOptions.columns = [{ type: 'checkbox', width: 50 }, ...res.data]
  await getPageList()
}

const getPageList = async () => {
  gridOptions.data.length = 0

  const data: any = await getTableData({ meetingId: meetingId.value, page: pagination.page, limit: pagination.limit })
  if (!data.success) return ElMessage.error(data.msg)
  gridOptions.data = data.data.records
  pagination.total = data.data.total
}

const exportHandle = () => {
  const params = { meetingId: meetingId.value }
  const fileName = '项目明细'
  apiExportHandle(params, fileName, exportData)
}
const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await gridRef.value.clearCheckboxRow()
  gridRef.value.setCheckboxRow(row, true)
}
const gridEvent = {
  cellClick: cellClickHandle
}

const handleChangeSizeChange = async (val: number) => {
  if (val <= 0) return
  pagination.limit = val
  pagination.page = 1
  getPageList()
}

const handleChangeCurrentChange = async (val: number) => {
  if (val <= 0) return
  pagination.page = val
  getPageList()
}

const rejectHandle = () => {
  const $table = gridRef.value
  const records = $table.getCheckboxRecords() || []
  selectedList.value = records.map(({ xm_id, xmmc, xmbm, origin_xm_id }: any) => ({
    xmId: xm_id,
    xmmc,
    xmbm,
    originXmId: origin_xm_id
  }))
  if (selectedList.value.length == 0) return ElMessage.warning('请选择数据！')
  returnModal.value.isShowModel = true
}

// 退回意见
const returnMag = async (val: any) => {
  const params = {
    ...val,
    ...useInfo.value,
    xmInfoList: selectedList.value
  }
  let res: any = await leaderReviewThForCityLhhs(params)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('退回成功！')
  returnModal.value?.closeHandle()
}

const gridOptions = reactive<any>({
  stripe: true,
  border: true,
  loading: false,
  checkboxConfig: { trigger: 'row', highlight: true },
  headerAlign: 'center',
  align: 'center',
  height: '100%',
  rowConfig: {
    height: 32
  },
  columnConfig: {
    resizable: true
  },
  size: 'mini',
  data: [],
  columns: []
})
// 子组件暴露方法到父组件
defineExpose({
  initParamLists
})
</script>
<style setup lang="less">
.modal_select {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 15px auto 0 auto;
  min-height: 48px;
  .el-radio-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    row-gap: 8px;
  }
}
.empty-option {
  color: var(--color-primary, #00857c);
  line-height: 48px;
}
</style>

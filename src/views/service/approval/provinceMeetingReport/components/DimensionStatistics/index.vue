<!-- 按维度统计会议 -->
<template>
  <vxe-modal
    @close="closeHandle"
    :loading="loading"
    :destroy-on-close="true"
    v-model="modalVisible"
    width="1130px"
    height="600px"
    resize
    position="center"
    show-zoom
    :title="`统计分析`"
  >
    <div class="modal_content">
      <div class="modal_button">
        <el-button size="mini" type="primary" plain @click="exportHandle"> 导 出 </el-button>
      </div>
      <div class="search">
        <el-form label-position="right" :label-width="110" :model="searchForm">
          <Grid :gap="[12, 0]" :cols="4">
            <GridItem>
              <el-form-item>
                <template #label>
                  <el-space :size="4">
                    <span>{{ `统计维度` }}</span>
                  </el-space>
                  <span>&nbsp;：</span>
                </template>
                <div class="form">
                  <el-select clearable collapse-tags style="width: 100%" @change="onTjfsChange" v-model="searchForm.tjfs">
                    <el-option v-for="item in tjfsDataList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                  </el-select>
                </div>
              </el-form-item>
            </GridItem>
          </Grid>
        </el-form>
      </div>
      <div class="table">
        <vxe-grid ref="gridRef" @cell-click="handleCellClick" height="100%" v-bind="gridOptions" />
      </div>
    </div>
  </vxe-modal>
  <xmTable ref="xmTableRef" />
</template>
<script setup lang="tsx" name="DimensionStatistics">
import { nextTick, ref, reactive } from 'vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import { getPublicCodeList } from '@/api/common'
import { formatNumValue } from '@/utils/utils'
import { tjfxGetData } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { ElMessage } from 'element-plus'
import xmTable from '@/views/service/approval/provinceMeetingReport/components/xmTable/index.vue'
import { vxeExportSixHandle, exportXlsx } from '@/utils/export'

const modalVisible = ref<boolean>(false)
const loading = ref<boolean>(false)
const tjfsDataList = ref<any>([])
const gridRef = ref()
const meetingIdsRef = ref<string[]>([])
const xmParams = ref<any>({})
const xmTableRef = ref<InstanceType<typeof xmTable>>()
const searchForm = reactive<any>({
  tjfs: '1'
})
const tjfsTitleMap: Record<string, string> = {
  '1': '预算事项',
  '2': '项目类型',
  '3': '一级单位',
  '4': '二级单位'
}
const closeHandle = () => {
  searchForm.tjfs = '1'
  modalVisible.value = false
}
const initParams = async () => {
  const publicCodeRes = await getPublicCodeList({
    codes: ['LHHS_TGL_TJWD']
  })
  if (publicCodeRes.success) {
    tjfsDataList.value = publicCodeRes.data['LHHS_TGL_TJWD']
  }
}

const getTableData = async () => {
  const parmas = {
    tjfs: searchForm.tjfs,
    ...xmParams.value
  }
  const res: any = await tjfxGetData({ ...parmas })
  if (!res.success) ElMessage.error(res.msg)
  gridOptions.data = res.data
}
const onTjfsChange = () => {
  updateFirstColumnTitle()
  gridRef.value.loadColumn(gridOptions.columns)
  getTableData()
}
const open = async (parmas: any) => {
  meetingIdsRef.value = parmas.meetingIds
  xmParams.value = { ...parmas }
  await initParams()
  modalVisible.value = true
  await nextTick()
  updateFirstColumnTitle()
  if (gridRef.value) await getTableData()
}
const formatAmount = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatNumValue(cellValue.toString(), 6)
}

const formatPercnetage = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatNumValue(cellValue.toString(), 2)
}

const handleCellClick = ({ row, column }: any) => {
  if (!['sbje', 'nhje', 'sdje'].includes(column.field)) return
  const parmas = {
    ...xmParams.value,
    tjfs: searchForm.tjfs,
    id: row.id
  }
  xmTableRef.value?.open({ ...parmas })
}

const exportHandle = () => {
  const $table = gridRef.value
  const tableName = tjfsTitleMap[searchForm.tjfs]
  if ($table) {
    vxeExportSixHandle($table, `${tableName}-统计分析`, gridOptions.data)
  }
}

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  columnConfig: {
    resizable: true
  },
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  rowStyle: ({ row }: any) => {
    if (row['hasChild']) {
      return {
        fontWeight: 'bold'
      }
    }
  },
  rowConfig: {
    height: 32
  },
  columns: [
    { field: 'name', title: '预算事项', width: 180 },
    { field: 'sbje', title: '初始申报金额(万元)', width: 180, formatter: formatAmount, headerAlign: 'center', align: 'right' },
    { field: 'nhje', title: '首次纳会金额(万元)', width: 180, formatter: formatAmount, headerAlign: 'center', align: 'right' },
    { field: 'sdje', title: '审定金额(万元)', width: 180, formatter: formatAmount, headerAlign: 'center', align: 'right' },
    { field: 'hjje', title: '会审核减(万元)', width: 180, formatter: formatAmount, headerAlign: 'center', align: 'right' },
    { field: 'hjl', title: '核减率(%)', width: 120, formatter: formatPercnetage },
    { field: 'pm', title: '排名', width: 80 }
  ],
  data: [],
  cellStyle: ({ column }: any) => {
    if (['sbje', 'nhje', 'sdje'].includes(column.field)) {
      return {
        cursor: 'pointer',
        color: 'var(--color-primary)',
        textDecoration: 'underline'
      }
    }
  }
})
const updateFirstColumnTitle = () => {
  gridOptions.columns[0].title = tjfsTitleMap[searchForm.tjfs] ?? '单位名称'
}
defineExpose({
  open
})
</script>
<style>
.modal_content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>

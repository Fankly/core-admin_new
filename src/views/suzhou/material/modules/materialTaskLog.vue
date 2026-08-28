<template>
  <vxe-modal
    v-model="isShowModal"
    :loading="loading"
    destroy-on-close
    resize
    show-zoom
    position="center"
    title="修改日志"
    width="80%"
    height="720px"
    @close="handleClose"
  >
    <div class="material-task-log">
      <el-form class="search-form" label-suffix=" : " label-width="80px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="物料编码" class="search-item">
              <el-input v-model="materialCode" />
            </el-form-item>
          </el-col>
          <el-col :span="6" />
          <el-col :span="6" />
          <el-col :span="6">
            <div style="text-align: right">
              <el-button type="primary" plain @click="handleSearch">查 询</el-button>
              <el-button plain @click="handleReset">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
      <div class="table">
        <vxe-grid ref="gridRef" v-bind="gridOptions"></vxe-grid>
      </div>
      <div class="main-pagination">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[20, 50, 100, 200]"
          :page-size="page.limit"
          :total="parseInt(page.total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="materialTaskLog">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import { getLog } from '@/api/suzhou/material'

interface MaterialTaskLogRow {
  mjahr?: string
  pspid?: string
  post1?: string
  matnr?: string
  maktx?: string
  xgrMc?: string
  xgrDwMc?: string
  upTime?: string
  xgzd?: string
  upBefore?: string
  upAfter?: string
  [key: string]: any
}

const isShowModal = ref(false)
const loading = ref(false)
const gridRef = ref()

const page = reactive({
  page: 1,
  limit: 20,
  total: 0 as number | string
})
const materialCode = ref<string>('')

const gridOptions = reactive<VxeGridProps<MaterialTaskLogRow>>({
  border: true,
  stripe: true,
  height: '100%',
  showOverflow: true,
  showHeaderOverflow: true,
  headerAlign: 'center',
  align: 'center',
  rowConfig: {
    height: 32
  },
  columnConfig: {
    resizable: true
  },
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'materialCode', title: '物料编码', width: 150 },
    { field: 'xgrMc', title: '修改人名称', width: 140 },
    // { field: 'xgrDwMc', title: '修改人单位名称', minWidth: 150 },
    { field: 'upTime', title: '更新时间', width: 150 },
    { field: 'xgzd', title: '修改字段', width: 160 },
    { field: 'upBefore', title: '更新前', minWidth: 180 },
    { field: 'upAfter', title: '更新后', minWidth: 180 },
    { field: 'operation', title: '操作类型', width: 80 }
  ],
  data: []
})

const handleSearch = () => {
  getTableData()
}

const handleReset = () => {
  materialCode.value = ''
  getTableData()
}

const getTableData = async () => {
  loading.value = true
  try {
    const res = await getLog({
      materialCode: materialCode.value,
      page: page.page,
      limit: page.limit
    })
    if (!res.success) throw new Error(res.msg || '查询修改日志失败')
    gridOptions.data = res.data?.records || []
    page.total = res.data?.total || 0
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleCurrentChange = async (val: number) => {
  if (val <= 0) return
  page.page = val
  await getTableData()
}

const handleSizeChange = async (val: number) => {
  if (val <= 0) return
  page.limit = val
  page.page = 1
  await getTableData()
}

const resetData = () => {
  gridOptions.data = []
  page.page = 1
  page.limit = 20
  page.total = 0
  materialCode.value = ''
}

const handleClose = () => {
  materialCode.value = ''
  isShowModal.value = false
  resetData()
}

const open = async () => {
  page.page = 1
  page.total = 0
  gridOptions.data = []
  isShowModal.value = true
  await getTableData()
}

defineExpose({
  open
})
</script>

<style scoped lang="less">
.material-task-log {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .main-pagination {
    padding-top: 10px;
  }
}
</style>

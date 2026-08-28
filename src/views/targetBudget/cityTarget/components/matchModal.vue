<!-- 版本对比 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModal"
      :destroy-on-close="true"
      resize
      show-zoom
      :title="`版本比对`"
      :width="850"
      :height="850"
      :close-on-press-escape="true"
      @close="closeHandle"
    >
      <div class="modal_content" ref="fromTableRef">
        <div class="toolButtoon">
          <div class="left">
            <el-button size="mini" type="primary" plain v-debounce="[exportHandle1, `click`, 300]">页面导出</el-button>
          </div>
          <div class="right">
            <div class="info">
              <span class="highlight">
                年度:<span>{{ formData?.nd }}</span>
              </span>
              <span class="highlight">
                单位:<span>{{ `万元` }}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="table">
          <vxe-grid ref="tableMatchRef" v-bind="tableInfo" />
        </div>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'matchModal'
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { getDynamicColumnForVerCmp, getTableDataForVerCmp } from '@/api/targetBudget/cityTarget'
import { ElMessage } from 'element-plus'
import { TableCellStyle } from '@/utils/tableCellStyle'
import { exportVxeGrid } from '@/utils/excelExportTs'

const tableCellStyle = new TableCellStyle({
  structure: 'tree',
  colorFieldSuffix: '_colorCode',
  mode: 'text'
})

//接收父组件传参
const props = defineProps({
  formData: {
    type: Object,
    require: true
  }
})
const tableMatchRef = ref()
const toolbarRef = ref()
const ruleFormRef = ref()
const dialogFormRef = ref()
const userInfo = ref()
const count = ref(0)
const isShowModal = ref(false)
const closeHandle = () => {
  // rmarkData.viewMethod = '1'
  isShowModal.value = false
}

const cellStyle = ({ row, column }: any) => {
  const field = column.field
  const parentField = field.split('_')[0]
  if (column.field.includes('adjustedMbz1') || column.field.includes('adjustedMbz2')) {
    return {
      color: row[`${parentField}_colorCode`] == '2' ? 'rgba(252, 185, 0, 1)' : row[`${parentField}_colorCode`] == '3' ? 'rgba(255, 76, 82, 1)' : ''
    }
  }
}

const rowStyle = ({ row }: any) => {
  if (row.leaf) {
    return {
      fontWeight: 'bold'
    }
  }
}

const tableInfo = reactive<any>({
  toolbarConfig: {
    // custom: true
  },
  loading: false,
  headerAlign: 'center',
  align: 'right',
  showOverflow: true,
  height: '92%',
  rowConfig: {
    height: 32,
    keyField: 'id'
  },
  border: true,
  cellStyle: cellStyle,
  rowStyle: rowStyle,
  treeConfig: {
    lazy: true,
    transform: true,
    rowField: 'id',
    parentField: 'parentId',
    childrenField: 'children',
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      count.value++
      tableInfo.loading = true
      let params = {
        nd: props.formData?.nd,
        dwId: props.formData?.dwId,
        parentId: row.id,
        cj: row.cj,
        versionIdList: props.formData?.versionIdList
      }
      return new Promise((resolve: any) => {
        let Api = getTableDataForVerCmp
        Api(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(res.data)
          } else {
            count.value = 0
            ElMessage.error(res.msg)
            resolve([])
          }
          if (!count.value) tableInfo.loading = false
        })
      })
    }
  },
  columnConfig: {
    resizable: true
  },
  columns: [],
  data: []
})

// 自定义导出
const exportHandle1 = () => {
  try {
    exportVxeGrid(tableMatchRef.value as any, {
      isTree: true,
      treeNodeField: 'name',
      fileName: '版本比对',
      colorMapper: tableCellStyle
    })
  } finally {
    tableInfo.loading = false
  }
}

// 初始化表格数据
const newData = async () => {
  await getDataList()
  // await threeLevel()
}

// 获取数据
const getDataList = async () => {
  const api: any = getTableDataForVerCmp
  tableInfo.loading = true
  tableInfo.data.length = 0
  let params = {
    nd: props.formData?.nd,
    dwId: props.formData?.dwId,
    versionIdList: props.formData?.versionIdList
  }
  let res = await api(params)
  if (res.success) {
    tableInfo.data = res.data
    tableInfo.loading = false
  } else {
    tableInfo.loading = false
    ElMessage.error(res.msg)
  }
}
//获取表头
const getHeaderData = async (params: any) => {
  let res = await getDynamicColumnForVerCmp(params)
  if (res.success) {
    tableInfo.columns = res.data.map((item: any) => {
      if (item.field === 'name') {
        item.width = 280
        item.treeNode = true
        item.align = 'left'
        item.headerAlign = 'center'
      } else {
        item.width = undefined
      }
      return {
        ...item
      }
    })
    tableInfo.loading = false
    newData()
    return true
  } else {
    ElMessage.error(res.msg)
    return false
  }
}

defineExpose({
  isShowModal,
  getHeaderData,
  closeHandle,
  userInfo
})
</script>

<style scoped lang="less">
.modal_content {
  width: 100%;
  height: 100%;
  padding: 10px;
  position: relative;
  .toolButtoon {
    height: 30px;
    align-items: center;
    display: flex;
    margin-bottom: 10px;

    .left {
      display: flex;
      justify-content: space-between;
      max-width: 600px;
    }

    .right {
      flex: 1;
      text-align: right;
      font-weight: bold;
      color: #212529;

      span {
        display: inline-block;
        font-size: 14px;
        color: #555;
        padding: 5px;
        background-color: #e9ecef;
        border-radius: 5px;
        min-height: 0;
        min-width: 0;
        margin-right: 5px;
      }
    }
  }
  .table {
    margin: -0 auto;
    height: 100%;
  }
}
</style>

<!-- 业扩数据统计 -->
<template>
  <div class="container" v-if="pageInfo.isShowPage" v-loading="pageInfo.loading">
    <!-- 业扩配套资源配置总览 -->
    <div class="operation" style="margin-bottom: 10px">
      <div class="left">
        <el-button style="margin-right: 10px" size="mini" type="primary" plain @click="exportHandle('overView')">业扩配套资源配置总览导出</el-button>
        <el-button size="mini" type="primary" plain @click="exportHandle('allcation')">业扩配套资源配置导出</el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <vxe-table
      ref="tableRef"
      @cell-click="handleTypeCellClick"
      :column-config="{ resizable: true }"
      show-overflow
      keep-source
      headerAlign="center"
      :row-config="{ keyField: 'id', height: 32 }"
      border
      :row-style="rowStyle"
      :cell-style="cellStyle"
      :header-cell-style="headerCellStyle"
      @header-cell-click="handleHeaderCell"
      :data="tableInfo.tableData"
      height="30%"
    >
      <template v-for="(item, index) in tableInfo.columns" :key="'item' + index">
        <vxe-colgroup :title="item.title" header-align="center">
          <template v-for="(item1, index1) in item.children" :key="'item' + index1">
            <vxe-column
              header-align="center"
              show-overflow="tooltip"
              v-if="item1.children.length == 0"
              width="280"
              border
              tree-node
              :title="item1.title"
              :field="item1.field"
              align="center"
            />
            <vxe-colgroup v-else :title="item1.title" :field="item1.field" header-align="center">
              <template v-for="(grop, gIndex) in item1.children" :key="'grop' + gIndex">
                <vxe-column :formatter="formatterData" header-align="center" border :title="grop.title" :field="grop.field" align="right" />
              </template>
            </vxe-colgroup>
          </template>
        </vxe-colgroup>
      </template>
    </vxe-table>
    <!-- 业扩配套资源配置 -->
    <vxe-table
      style="margin-top: 10px"
      ref="typeRef"
      :column-config="{ resizable: true }"
      show-overflow
      keep-source
      headerAlign="center"
      :row-config="{ keyField: 'id', height: 32 }"
      border
      :row-style="rowStyle"
      :cell-style="cellStyle"
      @cell-click="handleCellClick"
      :data="typeInfo.tableData"
      height="60%"
    >
      <template v-for="(item, index) in typeInfo.columns" :key="'item' + index">
        <vxe-colgroup :title="item.title" header-align="center">
          <template v-for="(item1, index1) in item.children" :key="'item' + index1">
            <vxe-column
              header-align="center"
              show-overflow="tooltip"
              width="280"
              v-if="item1.children.length == 0"
              border
              tree-node
              :title="item1.title"
              :field="item1.field"
              align="center"
            />
            <vxe-colgroup v-else :title="item1.title" :field="item1.field" header-align="center">
              <template v-for="(grop, gIndex) in item1.children" :key="'grop' + gIndex">
                <vxe-column :formatter="formatterData" header-align="center" border :title="grop.title" :field="grop.field" align="right" />
              </template>
            </vxe-colgroup>
          </template>
        </vxe-colgroup>
      </template>
    </vxe-table>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <projectData ref="projectPageRef" />
  <HelpModal ref="helpModalRef" />
</template>
<script lang="ts">
export default {
  name: '/metrics/ykData'
}
</script>
<script setup lang="ts">
import { getDynamicColumnByDw, getDynamicColumnByType, getStatDataByDw, getStatDataByType } from '@/api/metrics/index'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import { formatValue } from '@/utils/utils'
import projectData from '@/views/metrics/components/projectData.vue'
import { ElMessage, ElNotification } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const userDialogRef = ref() // 用户角色
const helpModalRef = ref() // 用户角色
const userInfo = ref<any>() //用户信息
const tableRef = ref()
const typeRef = ref()
const projectPageRef = ref()
const nd = ref<any>('')
const busiType = ref<any>('YKSJTJ')

const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
}>({
  loading: true,
  isShowPage: false
})
const tableInfo = reactive<{
  tableData: any[]
  columns: any[]
}>({
  tableData: [],
  columns: []
})
const typeInfo = reactive<{
  tableData: any[]
  columns: any[]
}>({
  tableData: [],
  columns: []
})

// 方法
onMounted(async () => {
  pageInfo.loading = true
  userDialogRef.value.getUser()
})

// 金额取四位小数
const formatterData = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
}
// 行样式
const rowStyle = ({ row }: any) => {
  if (row.isBold) {
    return {
      fontWeight: 'bold',
      height: '10px'
    }
  }
}
const cellStyle = ({ row, column }: any) => {
  if (['预算数', '完成数'].includes(column.title)) {
    return {
      cursor: 'pointer'
    }
  }
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const headerCellStyle = ({ row, column }: any) => {
  if (column.title.includes('年')) {
    return {
      cursor: 'pointer'
    }
  }
}
//获取表头-按类型
const getHeaderData = async (params: any) => {
  let res = await getDynamicColumnByType(params)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: any) => item.visible)
    pageInfo.isShowPage = true
    getTableData(params)
  } else {
    ElMessage.error(res.msg)
  }
}
// 获取数据-按类型
const getTableData = async (params: any) => {
  let res = await getStatDataByType(params)
  if (res.success) {
    tableInfo.tableData = res.data
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
  }
}

//获取表头-按单位
const getHeaderTypeData = async (params: any) => {
  let res = await getDynamicColumnByDw(params)
  if (res.success) {
    typeInfo.columns = res.data.filter((item: any) => item.visible)
    getTableTypeData(params)
  } else {
    ElMessage.error(res.msg)
  }
}
// 获取数据-按单位
const getTableTypeData = async (params: any) => {
  let res = await getStatDataByDw(params)
  if (res.success) {
    typeInfo.tableData = res.data
  } else {
    ElMessage.error(res.msg)
  }
}
// 选择角色
const getRoleHandle = async () => {
  try {
    nd.value = new Date().getFullYear().toString()
    const isQuery = userDialogRef.value.isQuery
    const userMsg = { ...userDialogRef.value.userMsg }
    userInfo.value = userMsg.specialOrgId
    if (isQuery) {
      getHeaderData({ busiType: busiType.value })
      getHeaderTypeData({ busiType: busiType.value, nd: nd.value })
      pageInfo.isShowPage = true
    }
  } catch (e) {
    console.error(e)
  }
}
// 表格头点击事件
const handleHeaderCell = (row: any) => {
  const val: any = row.column.title
  if (val.includes('年')) {
    nd.value = row.column.field
    getHeaderTypeData({ busiType: busiType.value, nd: nd.value })
  }
}

// 单元格点击事件-按类型
const handleTypeCellClick = ({ row, column }: any) => {
  if (['预算数', '完成数'].includes(column.title) && row.name != '合计') {
    const nd: any = column.property.split('&')[0].split('=')[1]
    projectPageRef.value.isShowModel = true
    projectPageRef.value.formParams = {
      nd: nd,
      busiType: busiType.value,
      configName: row.name
    }
  }
}

// 单元格点击事件-按单位
const handleCellClick = ({ row, column }: any) => {
  if (['预算数', '完成数'].includes(column.title) && row.name != '合计') {
    const configId: any = column.property.split('&')[0].split('=')[1]
    projectPageRef.value.isShowModel = true
    projectPageRef.value.formParams = {
      nd: nd.value,
      busiType: busiType.value,
      configId: configId,
      dwId: row.id
    }
  }
}
// 自定义导出
const exportHandle = (val: any) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  const $table = val == 'overView' ? tableRef.value : typeRef.value
  $table.exportData({
    type: 'xlsx',
    filename: val == 'overView' ? '业扩配套资源配置总览' : `业扩配套资源配置${nd.value}`,
    sheetName: 'sheet1',
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      worksheet.eachRow((row: any, rowNumber: any) => {
        const boldIndex = val == 'overView' ? 7 : 16
        // 非末级当前行加粗
        if (rowNumber == boldIndex) {
          row.eachCell((cell: any) => {
            cell.font = {
              ...cell.font,
              bold: true
            }
          })
        }
      })
    }
  })
}
</script>
<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;

  .operation {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>

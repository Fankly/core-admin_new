<!-- 增加检查包预算 -->
<template>
  <div v-show="pageInfo.isShowPage" class="content">
    <div class="toolButtoon" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-button v-permission="'PAGEEXPORT'" :disabled="disabled" size="mini" type="primary" plain @click="pageExportHandle">按页面导出</el-button>
        <el-button v-permission="'EXPAND'" :disabled="disabled" size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
        <el-button v-permission="'EXPORT'" :disabled="disabled" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
        <el-button v-permission="'LOG'" :disabled="disabled" size="mini" type="primary" plain @click="editLogHandle">修改日志</el-button>
        <el-button v-permission="'VERSION'" :disabled="disabled" size="mini" type="primary" plain @click="versionManageHandle">版本管理</el-button>
      </div>
      <div class="right">
        <div class="year">
          <span>检查包预算：</span>
          <el-switch :disabled="disabled" @change="handleCheckPack" v-model="isCheck" :active-value="true" :inactive-value="false" />
        </div>
        <div class="year">
          <span>年度：</span>
          <el-select :disabled="disabled" @change="selectNdHandle" style="width: 110px" v-model="formData.nd" placeholder="请选择年份">
            <el-option :key="item.yearCode" v-for="item in pageInfo.ndDataList" :label="item.yearName" :value="item.yearCode"></el-option>
          </el-select>
        </div>
        <div class="help">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="table">
      <vxe-grid ref="tableRef" v-bind="gridOptions" v-on="gridEvent" />
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <Log :specialorgid="userInfo.specialorgid" :nd="formData.nd" ref="logRef" title="目标总控制维护日志" />
  <ImportExcel ref="importRef" />
  <HelpModal ref="helpModalRef" />
  <ctPage :flag="true" ref="ctPageRef" :formData="ctParams" />
</template>

<script setup lang="ts" name="/xmInfo/systemManagement/index">
import userDialog from '@/components/select/userDialog.vue'
import Log from '@/views/xmInfo/components/Log.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import ctPage from '@/views/xmInfo/components/ctPage.vue'
import { TableCellStyle } from '@/utils/tableCellStyle'
import { computed, onMounted, reactive, ref } from 'vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { ElMessage } from 'element-plus'
import { getYearData } from '@/api/common'
import router from '@/router'
import { encrypt } from '@/utils/crypto'
import { getPublicData } from '@/api/common' //公共代码
import { User } from '@/views/goalValue/interface'
import { IObject } from '@/types/interface'
import { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { exportData, getData, getDynamicColumn } from '@/api/xmInfo/cityTargetValue'
import { formatNumValue } from '@/utils/utils'
import { number } from 'echarts'

const tableRef = ref()
const ctPageRef = ref()
const helpModalRef = ref()
const userDialogRef = ref()
const logRef = ref()
const importRef = ref()
const tabList = ref<any[]>([])
const isZgs = ref<any>('0')
const disabled = computed(() => gridOptions.loading)
const isCheck = ref<boolean>(false)

const tableCellStyle = new TableCellStyle({
  structure: 'tree',
  colorFieldSuffix: '_colorCode',
  mode: 'text'
})

const pageInfo = reactive<{
  isShowPage: boolean
  pageFlag: boolean
  ndDataList: {
    yearName: string
    yearCode: string
  }[]
}>({
  isShowPage: false,
  pageFlag: false,
  ndDataList: []
})

const cellStyle = ({ row, column }: any) => {
  if (isCheck.value) {
    if (!(!column?.field.includes('mbz') && !column?.field.includes('propackJe'))) {
      return {
        ...tableCellStyle.getCellStyle(row, column?.field),
        cursor: 'pointer',
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    }
    return {
      cursor: 'auto',
      ...tableCellStyle.getCellStyle(row, column?.field),
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
  return {
    cursor: 'auto',
    backgroundColor: 'rgba(232, 234, 236,0.5)'
  }
}

const gridOptions = reactive<VxeGridProps<IObject>>({
  border: true,
  keepSource: true,
  columnConfig: {
    resizable: true
  },
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  cellStyle,
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      count.value++
      gridOptions.loading = true
      let params = {
        nd: formData.nd,
        parentId: row.id,
        dwId: userInfo.value.org_id,
        cj: row.cj,
        checkPropackYs: isCheck.value
      }
      return new Promise((resolve: any) => {
        getData(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(res.data)
          } else {
            count.value = 0
            ElMessage.error(res.msg)
            resolve([])
          }
          if (!count.value) gridOptions.loading = false
        })
      })
    }
  },
  exportConfig: {
    type: 'xlsx',
    filename: '市目标总控值-按页面导出',
    sheetName: '市目标总控值-按页面导出',
    useStyle: true,
    sheetMethod: function ({ worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, gridOptions.data || [])

      const totalRows = worksheet.rowCount
      const dataCount = newArr.length

      const headerRows = dataCount > 0 ? totalRows - dataCount : 1

      // 获取所有可见列的field
      const getAllFields = (cols: any[]): string[] => {
        let fields: string[] = []
        cols.forEach((col) => {
          if (col.children && col.children.length > 0) {
            fields = fields.concat(getAllFields(col.children))
          } else if (col.field) {
            fields.push(col.field)
          }
        })
        return fields
      }
      const visibleFields = getAllFields(gridOptions.columns || [])

      // 处理name的缩进
      nameCol.eachCell({ includeEmpty: false }, (cell: any, rowNumber: number) => {
        if (rowNumber > headerRows) {
          const dataIndex = rowNumber - headerRows - 1
          if (newArr[dataIndex]) {
            if (newArr[dataIndex].cj > 1) {
              cell.value = '    '.repeat(newArr[dataIndex].cj - 1) + newArr[dataIndex].name
            }
          }
        }
      })

      // 设置所有单元格的颜色
      worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
        if (rowNumber > headerRows) {
          const dataIndex = rowNumber - headerRows - 1
          const rowData = newArr[dataIndex]
          if (rowData) {
            row.eachCell({ includeEmpty: false }, (cell: any, colNumber: number) => {
              const fieldIndex = colNumber - 1
              if (fieldIndex < visibleFields.length) {
                const field = visibleFields[fieldIndex]
                const cellStyle = tableCellStyle.getCellStyle(rowData, field)
                if (cellStyle) {
                  if (cellStyle.color) {
                    cell.font = {
                      ...cell.font,
                      color: { argb: 'FF' + cellStyle.color?.replace('#', '') },
                      blod: cellStyle.fontWeight && cellStyle.fontWeight >= 600
                    }
                  }
                  if (cellStyle.backgroundColor) {
                    cell.fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: 'FF' + cellStyle.color?.replace('#', '') }
                    }
                  }
                }
              }
            })
          }
        }
      })
      gridOptions.loading = false
    }
  }
})

const formData = reactive({
  nd: ''
})
const ctParams = ref<any>({})

const userInfo = ref<User>({
  code: '',
  id: '',
  info: '',
  name: '',
  org_id: '',
  org_name: '',
  role_id: '',
  rolename: '',
  spRoleCode: '',
  specialorgid: '',
  specialorgname: '',
  systemId: '',
  systemName: ''
})

const count = ref(0)

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const getExportData = (newArr: any[], data: any[]) => {
  const $table = tableRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push(item)
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children)
    }
  })
  return newArr
}

const selectNdHandle = (val: string) => {
  getDataList()
}

// 页面导出
const pageExportHandle = async () => {
  const $table = tableRef.value
  if (!$table) return
  gridOptions.loading = true
  $table.exportData(gridOptions.exportConfig)
}

// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    expandAllTree(gridOptions.data || [], $table)
  }
}

const expandAllTree = async (data: any[], $table: any) => {
  data.forEach(async (row) => {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        expandAllTree(row.children, $table)
      }
    }
  })
}

// 导出
const exportHandle = () => {
  gridOptions.loading = true
  exportData(isCheck.value, userInfo.value.org_id, formData.nd).then((res: any) => {
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    gridOptions.loading = false
  })
}

// 日志
const editLogHandle = () => {
  logRef.value.showModal = true
}

// 开启/关闭包预算
const handleCheckPack = async (val: any) => {
  await getHeaderData(userInfo.value.org_id)
  await getDataList()
  if (tableRef.value) tableRef.value.setAllTreeExpand(true)
}

// 版本管理
const versionManageHandle = () => {
  const str = encrypt(
    JSON.stringify({
      userInfo: { ...userInfo.value },
      nd: formData.nd
    })
  )
  router.push({
    name: '/goalValue/targetBatchSplit/index',
    query: {
      versionParams: str
    }
  })
}

const getRoleHandle = async () => {
  gridOptions.loading = false
  userInfo.value = { ...userDialogRef.value.userMsg }
  // 请求数据
  let res = await getHeaderData(userInfo.value.org_id)
  if (!res) return
  await getDataList()
  const isQuery = userDialogRef.value.isQuery
  if (isQuery && pageInfo.pageFlag) {
    pageInfo.isShowPage = true
  }
}

// 表格点击
const handleCell = ({ row, column }: any) => {
  if (!isCheck.value) return
  if (!column?.field.includes('mbz') && !column?.field.includes('propackJe')) return
  ctParams.value = {
    nd: formData.nd,
    dwId: column?.field.split('_')[0],
    orgId: userInfo.value.org_id,
    checkPropackYs: isCheck.value,
    parentId: row.id
  }
  ctPageRef.value.isShowModal = true
  ctPageRef.value.getHeaderData(column?.field.split('_')[0] || '')
}

const filterVisisble = (list = []): any[] => {
  return list
    .filter((col: IObject) => col.visible)
    .map((item: IObject) => {
      item.align = 'center'
      item.headerAlign = 'center'
      if (item.needFormat) {
        item.align = 'right'
        item.headerAlign = 'center'
        item.formatter = ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          if (cellValue === '-') return cellValue
          return formatNumValue(cellValue.toString(), 6)
        }
      } else {
        item.formatter = ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          if (cellValue === '-') return cellValue
          return cellValue
        }
      }

      if (item['children'] && Array.isArray(item['children']) && item['children'].length > 0) {
        return {
          ...item,
          children: filterVisisble(item['children'] as never)
        }
      }
      return item
    })
}

const getHeaderData = async (dwId: string) => {
  let res = await getDynamicColumn({
    dwId: dwId,
    checkPropackYs: isCheck.value
  })
  if (res.success) {
    gridOptions.columns = filterVisisble(res.data).map((item: any) => {
      if (item.field === 'name') {
        item.width = 280
        item.treeNode = true
        item.align = 'left'
        item.headerAlign = 'center'
      }
      return {
        ...item
      }
    })
    pageInfo.pageFlag = true
    return true
  } else {
    ElMessage.error(res.msg)
    return false
  }
}

const getDataList = async () => {
  gridOptions.loading = true
  gridOptions.data = []
  let params = {
    cj: '0',
    nd: formData.nd,
    parentId: '0',
    dwId: userInfo.value.org_id,
    checkPropackYs: isCheck.value
  }
  let res = await getData(params)
  if (res.success) {
    gridOptions.data = res.data
    pageInfo.pageFlag = true
    gridOptions.loading = false
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getYearDataList = async () => {
  let res = await getYearData()
  if (res.success) {
    pageInfo.ndDataList = res.data
    formData.nd = new Date().getFullYear().toString()
  } else {
    ElMessage.error(res.msg)
  }
}

const initParamLists = async () => {
  // 获取公共代码
  const res = await getPublicData('MBZ_TAB_TYPE')
  if (res.success) {
    tabList.value = res.data
    isZgs.value = res.data[0].code
  }
}

const initData = () => {
  initParamLists()
  getYearDataList()
  gridOptions.loading = true
  userDialogRef.value.getUser()
}

const gridEvent: VxeGridListeners<IObject> = {
  cellClick: handleCell
}

onMounted(initData)
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.toolButtoon {
  height: 30px;
  align-items: center;
  display: flex;
  margin-bottom: 10px;
  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .right {
    width: 350px;
    text-align: right;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.table {
  flex: 1 1 auto;
  min-height: 80%;
}
</style>

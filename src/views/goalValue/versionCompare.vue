<template>
  <div class="content" v-show="showPage">
    <div class="toolButtoon">
      <div class="left">
        <el-button :disabled="disabled" size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
        <el-button :disabled="disabled" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
      </div>
      <div class="right">
        <div class="info">
          <span class="highlight">
            年度:<span>{{ formData.nd }}</span>
          </span>
        </div>
      </div>
    </div>
    <div class="table">
      <el-tabs v-model="isZgs" @tab-click="handleTab">
        <el-tab-pane :key="item.code" :disabled="disabled" v-for="item in tabList" :label="item.name" :name="item.code" />
      </el-tabs>
      <vxe-grid ref="tableRef" v-bind="gridOptions"> </vxe-grid>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: '/goalValue/versionCompare'
}
</script>

<script setup lang="ts">
import { getCompareData, getCompareColumn } from '@/api/xmInfo/mbz'

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getYearData } from '@/api/common'
import { useRoute } from 'vue-router'
import { decrypt } from '@/utils/crypto'
import { getPublicData } from '@/api/common' //公共代码
import { TableCellColorMapper } from '@/utils/tableCellColorMapper'
import { exportVxeGrid } from '@/utils/excelExport'
import { formatNumValue } from '@/utils/utils'

const route = useRoute()

const tableRef = ref()

const disabled = computed(() => gridOptions.loading)

const showPage = computed(() => pageInfo.isShowPage)

const tabList = ref<any[]>([])
const isZgs = ref<any>('0')

const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
  pageFlag: boolean
  ndDataList: {
    yearName: string
    yearCode: string
  }[]
}>({
  loading: true,
  isShowPage: false,
  pageFlag: false,
  ndDataList: []
})

const formData = reactive({
  nd: ''
})

const userInfo = reactive<{
  specialOrgId: string
  versionIds: string
}>({
  specialOrgId: '',
  versionIds: ''
})

const count = ref(0)

const tableCellColorMapper = new TableCellColorMapper({
  mode: 'text',
  structure: 'tree'
})

const cellStyle = ({ row, column }: { row: any; column: any }) => {
  return tableCellColorMapper.getCellStyle(row, column?.field)
}

const gridOptions = reactive<any>({
  border: true,
  cellStyle: cellStyle,
  treeConfig: {
    lazy: true,
    transform: true,
    hasChildField: 'leaf',
    parentField: 'parentId',
    loadMethod: ({ row }: any) => {
      count.value++
      gridOptions.loading = true
      let params = {
        nd: formData.nd,
        parentId: row.id,
        isZgs: isZgs.value,
        specialorgid: userInfo.specialOrgId,
        cj: row.cj,
        versionIds: userInfo.versionIds
      }
      return new Promise((resolve: any) => {
        getCompareData(params).then((res: any) => {
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
  columnConfig: {
    resizable: true
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
  columns: [],
  data: []
})

const getExportData = (newArr: any[], data: any[]) => {
  const $table = tableRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push({
      cj: item.cj,
      name: item.name
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children)
    }
  })
  return newArr
}

// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    await expandAllTree(gridOptions.data, $table)
  }
}

const expandAllTree = async (data: any[], $table: any) => {
  for (const row of data) {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        await expandAllTree(row.children, $table)
      }
    }
  }
}

// 导出
const exportHandle = async () => {
  exportVxeGrid(tableRef.value, {
    isTree: true,
    fileName: '版本比对',
    colorMapper: tableCellColorMapper
  })
}

const getDataList = async () => {
  gridOptions.loading = true
  gridOptions.data.length = 0
  let params = {
    nd: formData.nd,
    parentId: '0',
    isZgs: isZgs.value,
    specialorgid: userInfo.specialOrgId,
    versionIds: userInfo.versionIds,
    cj: '0'
  }
  let res = await getCompareData(params)
  if (res.success) {
    gridOptions.data = res.data
    pageInfo.pageFlag = true
    gridOptions.loading = false
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getFlatColumns = (columns: any[]) => {
  if (!columns || columns.length === 0) {
    return []
  }
  columns.forEach((column: any) => {
    if (column.children && column.children.length > 0) {
      getFlatColumns(column.children)
    } else {
      if (column.visible && column['field'] !== 'name') {
        column.formatter = ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          if (cellValue === '-') return cellValue
          return formatNumValue(cellValue.toString(), 6)
        }
      }
    }
  })
}

const getHeaderData = async (specialOrgId: string, versionIds: string) => {
  let res = await getCompareColumn(specialOrgId, versionIds, isZgs.value)
  if (res.success) {
    gridOptions.columns = res.data.map((item: any) => {
      if (item.field === 'name') {
        item.treeNode = true
        item.align = 'left'
        item.headerAlign = 'center'
      }
      return {
        ...item
      }
    })
    getFlatColumns(gridOptions.columns)

    pageInfo.pageFlag = true
    pageInfo.isShowPage = true
    return true
  } else {
    pageInfo.isShowPage = false
    ElMessage.error(res.msg)
    return false
  }
}

const getYearDataList = async () => {
  let res = await getYearData()
  if (res.success) {
    pageInfo.ndDataList = res.data
    const params = JSON.parse(decrypt(route.query.versionParams as string))
    if (params.nd) {
      formData.nd = params.nd as string
    } else {
      formData.nd = new Date().getFullYear().toString()
    }
  } else {
    ElMessage.error(res.msg)
  }
}

const getRoleHandle = async () => {
  gridOptions.loading = false
  const params = JSON.parse(decrypt(route.query.versionParams as string))
  formData.nd = params.nd as string
  userInfo.specialOrgId = params.specialOrgId as string
  userInfo.versionIds = params.versionIds as string
  // 请求数据
  let res = await getHeaderData(userInfo.specialOrgId, userInfo.versionIds)
  if (!res) return
  await getDataList()
}

// tab切换
const handleTab = async () => {
  await getHeaderData(userInfo.specialOrgId, userInfo.versionIds)
  await getDataList()
  // if (tableRef.value) tableRef.value.setAllTreeExpand(true)
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
  getYearDataList()
  getRoleHandle()
  initParamLists()
}

watch(
  () => route.query,
  () => {
    if (route.name === '/goalValue/versionCompare' && route.query) {
      const params = JSON.parse(decrypt(route.query.versionParams as string))
      formData.nd = params.nd as string
      userInfo.specialOrgId = params.specialOrgId as string
      userInfo.versionIds = params.versionIds as string
    }
  },
  {
    deep: true
  }
)

onMounted(initData)
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;
}

.toolButtoon {
  height: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  .left {
    max-width: 600px;
    min-height: 0;
  }
  .right {
    text-align: right;
    font-weight: bold;
    color: #212529;

    span {
      display: inline-block;
      font-size: 14px;
      color: #555;
      padding: 5px 10px;
      background-color: #e9ecef;
      border-radius: 5px;
      min-height: 0;
      min-width: 0;
      margin-right: 10px;
    }
  }
}

.table {
  height: calc(100% - 40px);
}
</style>

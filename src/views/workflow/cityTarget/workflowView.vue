<!-- 二上上报审核审批页面 -->
<template>
  <div class="content" ref="fromTableRef">
    <div class="toolButtoon">
      <div class="left">
        <el-button :disabled="pageInfo.loading" size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
        <el-button :disabled="pageInfo.loading" size="mini" type="primary" plain @click="exportHandle1"> 页面导出 </el-button>
        <el-button :disabled="pageInfo.loading" type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
      </div>
      <div class="right">
        <div class="info">
          <span class="highlight">
            版本编号: <span>{{ wfDataString?.VERSION_NO }}</span>
          </span>
          <span class="highlight">
            版本名称: <span>{{ wfDataString?.VERSION_NAME }}</span>
          </span>
          <span class="highlight">
            年度:<span>{{ wfDataString?.ND }}</span>
          </span>
          <span class="highlight">
            单位:<span>{{ `万元` }}</span>
          </span>
        </div>
      </div>
    </div>
    <div class="table">
      <vxe-table
        ref="tableRef"
        border
        height="100%"
        :row-style="rowStyle"
        :loading="pageInfo.loading"
        :editConfig="tableInfo.editConfig"
        :treeConfig="tableInfo.treeConfig"
        :data="tableInfo.tableData"
      >
        <template v-for="item in tableInfo.columns" :key="item.id">
          <vxe-column
            header-align="center"
            show-overflow="tooltip"
            fixed="left"
            v-if="item.children.length == 0"
            border
            tree-node
            width="280"
            :title="item.title"
            :field="item.field"
            align="left"
          />
          <vxe-colgroup v-else :title="item.title" header-align="center">
            <template v-for="grop in item.children" :key="grop.id">
              <vxe-column :formatter="formatterData" header-align="center" border :title="grop.title" :field="grop.field" align="right" />
            </template>
          </vxe-colgroup>
        </template>
      </vxe-table>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: '/workflow/lslx/workflowDealEs'
}
</script>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getDynamicColumn, getTableData } from '@/api/targetBudget/cityTarget'
import { ElMessage, ElNotification } from 'element-plus'
import { formatValue } from '@/utils/utils'
import { loadUserWfInfo } from '@/api/workflow'

interface wfDataVo {
  DW_ID: string
  ND: string
  VERSION_ID: string
  VERSION_NAME: string
  VERSION_NO: string
}

//工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: ''
})
//工作流全局变量
const wfDataString = ref<wfDataVo>({
  DW_ID: '',
  ND: '',
  VERSION_ID: '',
  VERSION_NAME: '',
  VERSION_NO: ''
})
const tableRef = ref()
const pageInfo = reactive<{
  loading: boolean
  isShowPage: boolean
}>({
  loading: true,
  isShowPage: false
})
const count = ref(0)

const tableInfo = reactive<any>({
  tableData: [],
  columns: [],
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      count.value++
      pageInfo.loading = true
      let params = {
        nd: wfDataString.value.ND,
        parentId: row.id,
        dwId: wfDataString.value.DW_ID,
        specialorgid: userInfo.value.spOrgId,
        versionId: wfDataString.value.VERSION_ID
      }
      return new Promise((resolve: any) => {
        let Api = getTableData
        Api(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(res.data)
          } else {
            count.value = 0
            ElMessage.error(res.msg)
            resolve([])
          }
          if (!count.value) pageInfo.loading = false
        })
      })
    }
  },
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    enabled: true,
    beforeEditMethod: function ({ column, row }: any) {
      return row.id && !row.leaf && column.field !== 'name'
    }
  }
})

onMounted(() => {
  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = { ...data.wfData }
      getHeaderData()
    } else {
      ElMessage.error(res.msg)
    }
  })
})

const getExportData = (newArr: any[], data: any[], cj: number) => {
  const $table = tableRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push({
      name: item.name,
      cj: cj,
      leaf: item.leaf
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children, cj + 1)
    }
  })
  return newArr
}
const formatterData = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
}
// 自定义导出
const exportHandle1 = () => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  const $table = tableRef.value
  const fileName: any = '二上预算上报数据表'
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, tableInfo.tableData as any, 1)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3].cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })
      worksheet.eachRow((row: any, rowNumber: any) => {
        // 非末级当前行加粗
        if (newArr[rowNumber - 3]?.leaf) {
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

// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    await expandAllTree(tableInfo.tableData, $table)
  }
}
// 展开每一层
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
// 展开前三层
const threeLevel = async () => {
  const $table = tableRef.value
  for (const row of tableInfo.tableData) {
    if (row.leaf) {
      await $table.setTreeExpand(row, true)
      if (row.children) {
        for (const row1 of row.children) {
          if (row1.leaf) {
            await $table.setTreeExpand(row1, true)
          }
        }
      }
    }
  }
}
// 初始化表格数据
const newData = async () => {
  await getDataList()
  await threeLevel()
}
// 行样式
const rowStyle = ({ row }: any) => {
  if (row.leaf) {
    return {
      fontWeight: 'bold'
    }
  }
}

const getDataList = async () => {
  const api: any = getTableData
  pageInfo.loading = true
  tableInfo.tableData.length = 0
  let params = {
    nd: wfDataString.value.ND,
    dwId: wfDataString.value.DW_ID,
    specialorgid: userInfo.value.spOrgId,
    versionId: wfDataString.value.VERSION_ID
  }
  let res = await api(params)
  if (res.success) {
    tableInfo.tableData = res.data
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
  }
}
//获取表头
const getHeaderData = async () => {
  const params = {
    nd: wfDataString.value.ND,
    dwId: wfDataString.value.DW_ID,
    versionId: wfDataString.value.VERSION_ID
  }
  const api: any = getDynamicColumn
  let res = await api(params)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: any) => item.visible)
    pageInfo.isShowPage = true
    pageInfo.loading = false
    newData()
    return true
  } else {
    pageInfo.isShowPage = false
    ElMessage.error(res.msg)
    return false
  }
}
// 获取"workItemId"
const getQueryString = (name: string): string => {
  const allParams = window.location.href.split('?').reduce((acc, part) => {
    const params = new URLSearchParams(part.split('#')[0])
    params.forEach((value, k) => acc.set(k, value))
    return acc
  }, new Map())

  if (window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1]
    new URLSearchParams(hashQuery).forEach((value, k) => allParams.set(k, value))
  }
  return allParams.get(name)
}
// 关闭工作流
const closeDialogHandle = () => {
  try {
    window.parent.Appframe.closePopWindow(window)
  } catch (e) {
    window.parent.postMessage('close', '*')
  }
}
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: 100%;
  padding: 10px;
}

.header-group-cell {
  background-color: #212529 !important;
  text-align: center !important;
  font-weight: bold !important;
}

.vxe-table--render-default .vxe-header--column {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
}

.vxe-table--render-default .vxe-header--column .vex-cell {
  white-space: normal !important;
  line-height: 1.5 !important;
}

.toolButtoon {
  height: 30px;
  align-items: center;
  display: flex;
  margin-bottom: 10px;

  .left {
    display: flex;
    justify-content: space-between;
    max-width: 450px;
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
  margin: 0 auto;
  height: calc(100% - 40px);
}
</style>

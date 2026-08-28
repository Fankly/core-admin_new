<template>
  <div v-show="pageInfo.isShowPage" class="container">
    <div class="topBar">
      <div class="topBar-left" v-if="pageInfo.isShowPage">
        <el-button v-permission="'SAVE'" type="primary" size="mini" plain @click="saveHandle"
          >保 存</el-button
        >
        <el-button v-permission="'EXPORT'" type="primary" size="mini" plain @click="exportHandle"
          >导 出</el-button
        >
      </div>
      <div class="topBar-right">
        <div class="msg">
          <el-form :inline="true">
            <el-form-item style="width: 156px; margin-right: 20px" label="年度：">
              <el-select
                class="nd-select"
                v-model="params.nd"
                placeholder="请选择"
                @change="changeNdDataHandle"
              >
                <template v-for="item in list.ndList" :key="item.yearCode">
                  <el-option :label="item.yearName" :value="item.yearCode"></el-option>
                </template>
              </el-select>
            </el-form-item>
            <el-form-item label="单位：">
              <span class="font-style">{{ pageInfo.name }}</span>
            </el-form-item>
          </el-form>
        </div>
        <div class="help">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="table">
      <vxe-grid ref="gridRef" v-bind="gridOptions">
        <template #cnx_default="{ row }">
          <span v-if="!!row.itemId">&nbsp;&nbsp;&nbsp;&nbsp;{{ row.cnx }}</span>
          <span v-else style="font-weight: 700">{{ row.cnx }}</span>
        </template>
        <template v-for="item in flatColumns" :key="item.field" #[item.slots.default]="{ row }">
          <div style="text-align: right">{{ row[item.field] }}</div>
        </template>
        <template v-for="item in flatColumns" :key="item.field" #[item.slots.edit]="{ row }">
          <input
            @change="(event:Event) => changeEditValueHandle(event,row,item.field)"
            v-limit-input
            class="my-input"
            v-model="row[item.field]"
            maxlength="20"
          />
        </template>
      </vxe-grid>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/daily/kmfzbz'
}
</script>
<script setup lang="ts">
import { getYearData } from '@/api/common'
import {
  exportData,
  getDataList,
  getDynamicColumnData,
  getFormInfo,
  saveData
} from '@/api/fy/daily/kmfzbz'
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { VxeGridProps, VXETable } from 'vxe-table'
import { SaveLists } from '@/api/fy/daily/kmfzbz'
import { Decimal } from 'decimal.js'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

interface NdList {
  yearName: string
  yearCode: string
}

interface RowVO {
  id: string
  cnx: string
  itemId: string
  ljxdz: number
  pid: string
  [key: string]: number | string
}

const userDialogRef = ref()
const helpModalRef = ref()
const gridRef = ref()

const userInfo = ref()

const gridOptions = reactive<VxeGridProps<RowVO>>({
  border: true,
  keepSource: true,
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    beforeEditMethod({ row }: any) {
      if (row.itemId) {
        return true
      }
      return false
    }
  },
  columnConfig: {
    resizable: true
  },
  cellStyle: ({ row, column }: any) => {
    if (!isClickHeader(flatColumns, column.field)) {
      return {
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    }
    if (!row.itemId) {
      return {
        backgroundColor: 'rgba(232, 234, 236,0.5)'
      }
    }
  },
  loading: false,
  headerAlign: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  columns: [],
  data: []
})

const flatColumns = reactive<any[]>([])

const pageInfo = reactive({
  isShowPage: false,
  name: ''
})
const params = reactive({
  nd: '',
  dwId: ''
})

const list = reactive<{
  ndList: NdList[]
}>({
  ndList: []
})

const changeNdDataHandle = async () => {
  await getDynamicColumn()
  await getTableData()
}

const isClickHeader = (columns: any, field: string) => {
  let columnIndex = columns.findIndex((item: any) => {
    return item.edit && item.field === field
  })
  return columnIndex > -1
}
const changeEditValueHandle = (event: Event, row: any, field: string) => {
  let dwId = field.split('_')[0]
  let parentValue = new Decimal('0')
  let parentData: any
  let childrenSum = new Decimal('0')
  let childrenMbzSum = new Decimal('0')
  let totalSum = new Decimal('0')
  if (gridOptions.data) {
    for (let i = 0; i < gridOptions.data.length; i++) {
      let item: any = gridOptions.data[i]
      if (item.id === row.pid) {
        parentValue = item[dwId + '_ljmbz'] ? new Decimal(item[dwId + '_ljmbz']) : new Decimal('0')
        parentData = item
      }
      if (item.pid === row.pid) {
        let itemNum = item[dwId + '_bctzz'] ? new Decimal(item[dwId + '_bctzz']) : new Decimal('0')
        let itemMbzNum = item[dwId + '_ljmbz']
          ? new Decimal(item[dwId + '_ljmbz'])
          : new Decimal('0')
        childrenSum = childrenSum.add(itemNum)
        childrenMbzSum = childrenMbzSum.add(itemMbzNum)
      }
    }
  }
  totalSum = childrenSum.add(childrenMbzSum)
  let parentSum = parentData[dwId + '_ljmbz']
  if (!parentSum) {
    parentSum = new Decimal('0')
  }

  if (totalSum.comparedTo(parentSum) > 0) {
    ElMessage.warning('承诺项：' + row.cnx + '：本次调整值超过目标值！')
    childrenSum = childrenSum.sub(row[dwId + '_bctzz'])
    row[dwId + '_bctzz'] = 0
  }
  parentData[dwId + '_bctzz'] = childrenSum
}

const saveHandle = async () => {
  const $table = gridRef.value.getUpdateRecords()
  if ($table) {
    const updateData = $table.filter((item: RowVO) => !!item.itemId)
    if (updateData.length === 0) {
      ElMessage.warning('请修改后,再进行保存！')
      return
    }
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      const saveDataList: SaveLists[] = []
      updateData.forEach((item: RowVO) => {
        const keys = Object.keys(item)
        let editKeys = keys.filter((key) => key.includes('bctzz'))
        let editValues = editKeys.map((key) => {
          let dwId = key.split('_')[0]
          return {
            dwId: dwId,
            ysje: item[key]
          }
        })
        saveDataList.push({
          pid: item.pid,
          itemId: item.itemId,
          dwLists: editValues
        })
      })
      gridOptions.loading = true
      let res = await saveData({
        ...params,
        saveLists: saveDataList
      })
      if (res.success) {
        ElMessage.success('保存成功！')
        await getDynamicColumn()
        await getTableData()
        saveDataList.length = 0
        gridOptions.loading = false
      } else {
        ElMessage.warning(res.msg)
        gridOptions.loading = false
      }
    }
  }
}
const exportHandle = async () => {
  gridOptions.loading = true
  let res = await exportData(params)
  const blob = res
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
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  params.dwId = userInfo.value.org_id
  getPgaeInfo()
  if (isQuery) {
    pageInfo.isShowPage = true
    await getDynamicColumn()
    await getTableData()
  }
}

const getPgaeInfo = async () => {
  let res = await getFormInfo(params)
  if (res.success) {
    pageInfo.name = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const getTableData = async () => {
  gridOptions.loading = true
  let res = await getDataList(params)
  if (res.success) {
    gridOptions.data = res.data
    gridOptions.loading = false
  } else {
    ElMessage.error(res.msg)
    gridOptions.loading = false
  }
}

const getDynamicColumn = async () => {
  flatColumns.length = 0
  let res = await getDynamicColumnData(params)
  if (res.success) {
    gridOptions.columns = res.data
    addSlots(gridOptions.columns)
  } else {
    ElMessage.error(res.msg)
  }
}

const addSlots = (columnList: any) => {
  columnList.forEach((item: any) => {
    if (item.children && item.children.length !== 0) {
      addSlots(item.children)
    }
    if (item.visible && item.field) {
      if (item.field !== 'cnx') {
        flatColumns.push(item)
      }
      item.headerAlign = 'center'
      if (item.edit) {
        item.align = 'right'
        item.editRender = {
          name: 'input',
          autofocus: '.my-input',
          autoselect: true
        }
        item.slots = {
          edit: item.field + '_edit'
        }
      } else {
        item.slots = {
          default: item.field + '_default'
        }
      }
    }
  })
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const initParams = async () => {
  const ndDataList = await getYearData()
  list.ndList = ndDataList.data
  params.nd = new Date().getFullYear().toString()
}

onMounted(() => {
  userDialogRef.value.getUser()
  initParams()
})
</script>

<style scoped lang="less">
.container {
  position: relative;
  width: 100%;
  height: calc(100vh - 110px);
  .topBar {
    padding: 10px;
    display: flex;
    align-items: center;
    &-left {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
    &-right {
      height: 34px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .el-form {
        height: 34px;
      }
    }
  }
  .table {
    padding: 0 10px 10px 10px;
    height: calc(100% - 55px);
  }
}
.nd-select {
  width: 100px;
  :deep(.el-input__inner) {
    padding: 10px;
  }
}

.my-input {
  outline: none;
  border: none;
}
</style>

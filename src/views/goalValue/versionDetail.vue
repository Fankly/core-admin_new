<template>
  <div class="content" v-show="showPage">
    <div class="toolButtoon">
      <div class="left">
        <el-button v-if="isShow" :disabled="disabled" size="mini" type="primary" plain @click="saveHandle">保 存</el-button>
        <el-button :disabled="disabled" size="mini" type="primary" plain @click="expandHandle">一键展开</el-button>
        <el-button v-if="isShow" :disabled="disabled" size="mini" type="primary" plain @click="importHandle">导 入</el-button>
        <el-button :disabled="disabled" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
        <el-button v-if="isShow" :disabled="disabled" size="mini" type="primary" plain @click="versionNotifyHandle">版本预算通知</el-button>
        <el-button v-if="isShow" :disabled="disabled" size="mini" type="primary" plain @click="versionActiveHandle">版本预算激活</el-button>
      </div>
      <div class="right">
        <div class="info">
          <span class="highlight">
            版本编号: <span>{{ userInfo.versionNo }}</span>
          </span>
          <span class="highlight">
            版本名称: <span>{{ userInfo.versionName }}</span>
          </span>
          <span class="highlight">
            年度:<span>{{ formData.nd }}</span>
          </span>
        </div>
      </div>
    </div>
    <div class="table">
      <el-tabs v-model="isZgs" @tab-click="handleTab">
        <el-tab-pane :key="item.code" v-for="item in tabList" :disabled="disabled" :label="item.name" :name="item.code" />
      </el-tabs>
      <vxe-table
        :cell-style="cellStyle"
        :row-config="{ keyField: 'id', height: 32 }"
        :loading="pageInfo.loading"
        :column-config="{ resizable: true }"
        :border="true"
        align="center"
        show-overflow
        keep-source
        headerAlign="center"
        :editConfig="tableInfo.editConfig"
        :treeConfig="tableInfo.treeConfig"
        :data="tableInfo.tableData"
        height="92%"
        ref="tableRef"
        @edit-closed="getEditDataHandle"
      >
        <template v-for="item in tableInfo.columns" :key="item.columnKey">
          <vxe-column
            :fixed="item.fixed ? 'left' : ''"
            v-if="item.columnKey === 'name'"
            tree-node
            header-align="center"
            border
            width="280"
            :title="item.columnValue"
            :field="item.columnKey"
            align="left"
          >
          </vxe-column>
          <vxe-column
            :fixed="item.fixed ? 'left' : ''"
            :formatter="formatterData"
            v-else-if="item.eidt"
            header-align="center"
            border
            width="180"
            :title="item.columnValue"
            :field="item.columnKey"
            align="right"
            :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
          >
            <template #edit="{ row }">
              <input v-limit-number class="my-input" @change="sumhandle(row, item.columnKey)" v-model="row[item.columnKey]" maxlength="20" />
            </template>
          </vxe-column>
          <vxe-column
            :fixed="item.fixed ? 'left' : ''"
            :formatter="formatterData"
            v-else
            header-align="center"
            border
            width="180"
            :title="item.columnValue"
            :field="item.columnKey"
            align="right"
          >
          </vxe-column>
        </template>
      </vxe-table>
    </div>
  </div>
  <ImportExcel ref="importRef" />
  <Notify :versionId="userInfo.versionId" v-model:visible="notifyVisible" ref="userManagerRef" :special-org-id="userInfo.specialOrgId" />
</template>
<script lang="ts">
export default {
  name: '/goalValue/versionDetail'
}
</script>

<script setup lang="ts">
import ImportExcel from '@/components/ImportExcel/index.vue'
import Notify from '@/views/goalValue/components/Notify.vue'

import { getDynamicColumn, getImportTemplate } from '@/api/xmInfo/mbz'
import { exportData, getData, importData, saveData, SaveParam } from '@/api/goalValue/versionDetail'
import { activeVersion } from '@/api/goalValue/version'
import { summaryValue } from '@/utils/prearranged'

import { computed, onMounted, reactive, ref, watch } from 'vue'
import VXETable from 'vxe-table'
import { ElMessage } from 'element-plus'
import { getYearData } from '@/api/common'
import { Decimal } from 'decimal.js'
import { formatValue, toValidNumber } from '@/utils/utils'
import { useRoute } from 'vue-router'
import { Columns } from '@/views/xmInfo/interface'
import emits from '@/utils/emits'
import { decrypt } from '@/utils/crypto'
import { getPublicData } from '@/api/common' //公共代码

const route = useRoute()

const tableRef = ref()
const importRef = ref()
const userManagerRef = ref()

const notifyVisible = ref<Boolean>(false)

const tabList = ref<any[]>([])

const isZgs = ref<any>('0')

const disabled = computed(() => pageInfo.loading)

const isShow = computed(() => Number(userInfo.status) !== 3 && Number(userInfo.status) !== 4)

const showPage = computed(() => pageInfo.isShowPage)

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
  versionId: string
  versionName: string
  versionNo: string
  sendSpRoleId: string
  status: string
}>({
  specialOrgId: '',
  sendSpRoleId: '',
  versionId: '',
  versionName: '',
  versionNo: '',
  status: ''
})

const updateParams = reactive<SaveParam[]>([])

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
        nd: formData.nd,
        parentId: row.id,
        isZgs: isZgs.value,
        specialorgid: userInfo.specialOrgId,
        cj: row.cj,
        versionId: userInfo.versionId
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
const formatterData = ({ cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
}

const sumhandle = (row: any, key: string) => {
  row[key] = new Decimal(toValidNumber(row[key])).toFixed(6)
  const config: any = tableInfo.treeConfig
  const tableData = tableInfo.tableData
  summaryValue(tableData, config, key, 6, 'id')
}

// 获取编辑数据表格
const getEditDataHandle = ({ column, row }: any) => {
  if (typeof row[column.field] == 'undefined' || row[column.field] == null || row[column.field] == '') return
  const code: string = row['code']
  const id: string = row['id']
  const outIndex = updateParams.findIndex((item: any) => item.id === id)
  if (outIndex > -1) {
    const index = updateParams[outIndex].dwValues.findIndex((item: any) => item.dwId === column.field)
    if (index > -1) {
      updateParams[outIndex].dwValues[index].ysje = row[column.field]
    } else {
      updateParams[outIndex].dwValues.push({
        dwId: column.field,
        dwName: column.title,
        ysje: row[column.field]
      })
    }
  } else {
    updateParams.push({
      code: code,
      id: id,
      dfjz: '',
      dwValues: [{ dwId: column.field, dwName: column.title, ysje: row[column.field] }]
    })
  }
}

// 保存
const saveHandle = async () => {
  if (updateParams.length === 0) {
    ElMessage.warning('请编辑后再进行保存！')
    return
  }
  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    let res = await saveData({
      saveDatas: updateParams,
      nd: formData.nd,
      isZgs: isZgs.value,
      specialorgid: userInfo.specialOrgId,
      versionId: userInfo.versionId
    })
    if (res.success) {
      ElMessage.success('保存成功！')
      await getDataList()
      if (tableRef.value) tableRef.value.setAllTreeExpand(true)
      updateParams.length = 0
    } else {
      ElMessage.error(res.msg)
    }
  }
}

// 展开
const expandHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    await expandAllTree(tableInfo.tableData, $table)
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

// 导入
const importHandle = () => {
  let newParmas = {
    nd: formData.nd,
    isZgs: isZgs.value,
    specialorgid: userInfo.specialOrgId,
    versionId: userInfo.versionId
  }
  let params = {
    title: '目标总控值维护-导入',
    tempApi: () => getImportTemplate(newParmas),
    getTableList: getDataList,
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importData(newImportParams)
    },
    specialorgid: userInfo.specialOrgId
  }
  importRef.value.acceptParams(params)
}

// 导出
const exportHandle = () => {
  pageInfo.loading = true
  exportData({
    nd: formData.nd,
    isZgs: isZgs.value,
    specialorgid: userInfo.specialOrgId,
    versionId: userInfo.versionId
  }).then((res: any) => {
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
    pageInfo.loading = false
  })
}

// 通知
const versionNotifyHandle = async () => {
  notifyVisible.value = true
}

// 激活
const versionActiveHandle = async () => {
  const type = await VXETable.modal.confirm('是否确定激活？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    pageInfo.loading = true
    const res = await activeVersion({
      nd: formData.nd,
      specialorgid: userInfo.specialOrgId,
      sendSpRoleId: userInfo.sendSpRoleId,
      versionId: userInfo.versionId
    })
    if (res.success) {
      ElMessage.success('激活成功')
      pageInfo.loading = false
      emits.emit('onActive', true)
    } else {
      pageInfo.loading = false
      ElMessage.error(res.msg)
    }
  }
}

const isClickHeader = (columns: any, field: string) => {
  let columnsData = columns.filter((item: any) => item.eidt)
  let column = columnsData.find((item: any) => item.columnKey === field)
  return !!column
}

const cellStyle = ({ row, column }: any) => {
  if (tableInfo.editConfig && !tableInfo.editConfig.enabled) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
  if (!isClickHeader(tableInfo.columns, column.field)) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }

  if (!row.id || row.leaf) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
}

const getDataList = async () => {
  pageInfo.loading = true
  tableInfo.tableData.length = 0
  let params = {
    nd: formData.nd,
    parentId: '0',
    isZgs: isZgs.value,
    specialorgid: userInfo.specialOrgId,
    versionId: userInfo.versionId,
    cj: '0'
  }
  let res = await getData(params)
  if (res.success) {
    tableInfo.tableData = res.data
    pageInfo.pageFlag = true
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
  }
}

const getHeaderData = async (specialOrgId: string) => {
  let res = await getDynamicColumn(specialOrgId, isZgs.value, 'EDIT')
  if (res.success) {
    tableInfo.columns = res.data.filter((item: Columns) => !item.hidden)
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
  pageInfo.loading = false
  const params = JSON.parse(decrypt(route.query.versionParams as string))
  if (params.status === 3) {
    tableInfo.editConfig.enabled = false
  }
  formData.nd = params.nd as string
  userInfo.specialOrgId = params.specialOrgId as string
  userInfo.sendSpRoleId = params.sendSpRoleId as string
  userInfo.versionId = params.versionId as string
  userInfo.versionName = decodeURIComponent(params.versionName as string)
  userInfo.versionNo = params.versionNo as string
  userInfo.status = params.status as string
  tableInfo.editConfig.enabled = Number(userInfo.status) !== 3 && Number(userInfo.status) !== 4
  // 请求数据
  let res = await getHeaderData(userInfo.specialOrgId)
  if (!res) return
  await getDataList()
  if (tableRef.value) tableRef.value.setAllTreeExpand(true)
}

// tab切换
const handleTab = async () => {
  tableInfo.columns.length = 0
  if (tableInfo.columns.length == 0) {
    await getHeaderData(userInfo.specialOrgId)
    await getDataList()
    if (tableRef.value) tableRef.value.setAllTreeExpand(true)
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
  getRoleHandle()
}

watch(
  () => route.query,
  () => {
    if (route.name === '/goalValue/versionDetail' && route.query) {
      const params = JSON.parse(decrypt(route.query.versionParams as string))
      if (params.status === 3) {
        tableInfo.editConfig.enabled = false
      }
      formData.nd = params.nd as string
      userInfo.specialOrgId = params.specialOrgId as string
      userInfo.sendSpRoleId = params.sendSpRoleId as string
      userInfo.versionId = params.versionId as string
      userInfo.versionName = params.versionName as string
      userInfo.versionNo = params.versionNo as string
      userInfo.status = params.status as string
      tableInfo.editConfig.enabled = Number(userInfo.status) !== 3 && Number(userInfo.status) !== 4
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

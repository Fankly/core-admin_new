<template>
  <div v-show="pageInfo.isShowPage" class="container">
    <splitpane :splitSet="settingLR">
      <template #paneL>
        <div class="tree">
          <vxe-table
            show-overflow
            :cell-style="cellStyle"
            ref="treeRef"
            @current-change="treeNodeClickHandle"
            :row-config="{ height: 32, isCurrent: true }"
            :show-header="false"
            border="none"
            :tree-config="treeConfig"
            :column-config="{ resizable: true }"
            :data="list.yskmList"
            height="100%"
          >
            <vxe-column show-overflow field="name" title="预算科目名称" tree-node></vxe-column>
          </vxe-table>
        </div>
      </template>
      <template #paneR>
        <div class="topBar">
          <div class="topBar-left" v-if="pageInfo.isShowPage">
            <el-button
              v-permission="'ADD'"
              type="primary"
              size="mini"
              plain
              @click="operationHandle('add')"
              >新 增</el-button
            >
            <el-button
              :disabled="isShowEditBtn"
              v-permission="'EDIT'"
              type="primary"
              size="mini"
              plain
              @click="operationHandle('edit')"
              >编 辑</el-button
            >
            <el-button
              :disabled="isShowEditBtn"
              v-permission="'VIEW'"
              type="primary"
              size="mini"
              plain
              @click="operationHandle('view')"
              >查 看</el-button
            >
            <el-button
              :disabled="isShowDeleteBtn"
              v-permission="'DELETE'"
              type="danger"
              size="mini"
              plain
              @click="deleteHandle"
              >删 除</el-button
            >
            <el-button v-permission="'COPY'" type="primary" size="mini" plain @click="copyHandle"
              >复 制</el-button
            >
            <el-button
              :disabled="isShowEditBtn"
              v-permission="'ZXZWH'"
              type="primary"
              size="mini"
              plain
              @click="zxzwhHandle"
              >执行值维护</el-button
            >
            <el-button
              :disabled="isShowWhBtn"
              v-permission="'FSZWH'"
              type="primary"
              size="mini"
              plain
              @click="fszwhHandle"
              >国网商旅及其他发生值维护</el-button
            >
          </div>
          <div class="topBar-right">
            <div class="oprator">
              <span>年度：</span>
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
            </div>
            <div v-if="!isHideTemplateCode">
              <span style="margin-left: 10px">模板编码：</span>
              <el-select
                class="bzcbcx-select"
                v-model="params.templateCode"
                placeholder="请选择"
                @change="changeTemplateCodeDataHandle"
              >
                <template v-for="item in list.bzcbcxList" :key="item.code">
                  <el-option :label="item.name" :value="item.code"></el-option>
                </template>
              </el-select>
            </div>
          </div>
          <div style="margin-left: 10px" class="help">
            <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
          </div>
        </div>
        <div class="table">
          <vxe-table
            :row-config="{ height: 32 }"
            ref="tableRef"
            :loading="tableInfo.loading"
            show-overflow
            align="center"
            height="100%"
            :border="true"
            :column-config="{ resizable: true }"
            :data="tableInfo.tableData"
          >
            <vxe-column type="checkbox" width="60"></vxe-column>
            <vxe-column
              :width="item.width"
              :formatter="formatterValue"
              v-for="item in tableInfo.columns"
              :key="item.field"
              :title="item.title"
              :field="item.field"
            ></vxe-column>
          </vxe-table>
        </div>
      </template>
    </splitpane>
  </div>
  <searchConfigAdd
    :cnxDisabled="cnxDisabled"
    :selectedCnxDatas="selectedDatas"
    :sort="sort"
    :selectData="tableInfo.selectData"
    @save="saveHandle"
    :templateCode="params.templateCode"
    :nd="params.nd"
    ref="searchConfigAddRef"
    :opeartionFlag="tableInfo.operationFlag"
    :title="tableInfo.modalTitle"
  ></searchConfigAdd>
  <copyNd @copy="resetRootTree" ref="copyKmfzpzRef" :ndList="list.ndList" :nd="params.nd"></copyNd>
  <Maintenance :parmas="params" ref="maintenanceRef"></Maintenance>
  <Fszwh :parmas="params" ref="fszwhRef"></Fszwh>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/standardCost/searchConfig'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import searchConfigAdd from './components/searchConfigAdd.vue'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import copyNd from '@/views/fy/standardCost/components/copyNd.vue'
import Maintenance from '@/views/fy/standardCost/components/Maintenance.vue'
import Fszwh from '@/views/fy/standardCost/components/Fszwh.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

import { deleteData, getCnxLevelTree, getDataList, getFormData } from '@/api/fy/searchConfig'

import { computed, onMounted, reactive, ref } from 'vue'

import VXETable, { VxeTablePropTypes } from 'vxe-table'
import { getPublicData, getYearData } from '@/api/common'
import { ElMessage } from 'element-plus'

interface RowVO {
  cnx: string
  cnxName: string
  edit: boolean
  id: string
  isleaf: boolean
  name: string
  nd: string
  pid: string
  sort: string
}

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

interface Bzcbcx {
  code: string
  name: string
}

interface List {
  ndList: NdList[]
  yskmList: YskmList[]
  bzcbcxList: Bzcbcx[]
  options: any
}

interface YskmList {
  cnx: string | null
  id: string
  isleaf: boolean
  name: string
  pid: string
}

interface NdList {
  yearName: string
  yearCode: string
}

interface Columns {
  title: string
  field: string
  width: number | string
}

interface SelectData {
  id?: string
  pid: string
  name: string
  isEdit: string
  sfmrzk: string
  cnxs: {
    cnxId: string
    cnx: string
  }[]
  sort: string
}

interface TableInfo {
  columns: Columns[]
  tableData: any[]
  modalTitle: string
  operationFlag: string
  loading: boolean
  selectData: SelectData
}

interface Params {
  dwId: string
  pzId: string
  month: number
  nd: string
  templateCode: string
}

const userDialogRef = ref()
const helpModalRef = ref()
const searchConfigAddRef = ref()
const treeRef = ref()
const tableRef = ref()
const copyKmfzpzRef = ref()
const maintenanceRef = ref()
const fszwhRef = ref()
const selectedDatas = ref()
const cnxDisabled = ref(false)

const sort = ref(1)

const isHideTemplateCode = computed(() => list && list.bzcbcxList.length === 0)

const isShowEditBtn = computed(
  () => tableRef.value && tableRef.value.getCheckboxRecords().length !== 1
)

const isShowWhBtn = computed(
  () =>
    (tableRef.value && tableRef.value.getCheckboxRecords().length !== 1) ||
    !tableRef.value.getCheckboxRecords()[0].cnx
)

const isShowDeleteBtn = computed(
  () => tableRef.value && tableRef.value.getCheckboxRecords().length === 0
)

const settingLR: ContextProps = reactive({
  minPercent: 20,
  defaultPercent: 20,
  split: 'vertical'
})

const pageInfo = reactive({
  isShowPage: false
})

const params = reactive<Params>({
  nd: '',
  month: 0,
  dwId: '',
  templateCode: '',
  pzId: ''
})

const treeConfig = reactive<any>({
  lazy: true,
  hasChildField: 'isleaf',
  loadMethod({ row }: any) {
    return new Promise((resolve: any) => {
      tableInfo.loading = true
      getDataList({
        templateCode: params.templateCode,
        nd: params.nd,
        pid: row.id
      }).then((res: any) => {
        if (res.success) {
          resolve(res.data)
          tableInfo.loading = false
        } else {
          ElMessage.error(res.msg)
          tableInfo.loading = false
          resolve([])
        }
      })
    })
  }
})

const list = reactive<List>({
  ndList: [],
  yskmList: [],
  bzcbcxList: [],
  options: {
    label: 'name',
    children: '',
    isLeaf: 'leaf'
  }
})

const tableInfo = reactive<any>({
  columns: [
    {
      title: '序号',
      field: 'sort',
      width: 120
    },
    {
      title: '名称',
      field: 'name',
      width: 400
    },
    {
      title: '承诺项',
      field: 'cnxName',
      width: 'auto'
    },
    {
      title: '是否可维护发生值',
      field: 'edit',
      width: 120
    },
    {
      title: '是否是委托运维',
      field: 'isWtyw',
      width: 120
    },
    {
      title: '是否展开',
      field: 'sfmrzk',
      width: 120
    },
    {
      title: '是否为叶子节点',
      field: 'isleaf',
      width: 120
    }
  ],
  tableData: [],
  modalTitle: '',
  operationFlag: '',
  loading: false,
  selectData: {
    pid: '',
    name: '',
    isEdit: '',
    cnxs: [],
    sort: ''
  }
})

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const formatterValue = ({ row, column, cellValue }: any) => {
  if (column.field === 'edit') {
    return row.edit ? '是' : '否'
  }
  if (column.field === 'isWtyw') {
    return row.isWtyw === '1' ? '是' : '否'
  }
  if (column.field === 'isleaf') {
    return !row.isleaf ? '是' : '否'
  }
  if (column.field === 'sfmrzk') {
    return row.sfmrzk ? '是' : '否'
  }
  return cellValue
}

const changeNdDataHandle = async () => {
  list.yskmList.length = 0
  tableInfo.tableData.length = 0
  await resetTable()
  treeRef.value.setAllTreeExpand(true)
  treeRef.value.setCurrentRow(list.yskmList[0])
  await treeNodeClickHandle()
}

const changeTemplateCodeDataHandle = async () => {
  list.yskmList.length = 0
  tableInfo.tableData.length = 0
  await resetTable()
  treeRef.value.setAllTreeExpand(true)
  treeRef.value.setCurrentRow(list.yskmList[0])
  await treeNodeClickHandle()
}

const getCnxLevelTreeData = async (id: string) => {
  if (id) {
    let res = await getCnxLevelTree(id)
    if (res.success) {
      let defaultKeys: any = []
      let defaultChecked: any = []
      res.data.forEach((item: any) => {
        defaultChecked.push(...item.splice(item.length - 1, 1))
        defaultKeys.push(...item)
      })
      defaultKeys = Array.from(new Set(defaultKeys))
      let selectDatas = defaultChecked.join(',').split(',').concat()
      return [defaultKeys, selectDatas]
    } else {
      ElMessage.error(res.msg)
      return []
    }
  }
}

const operationHandle = async (flag: string) => {
  tableInfo.operationFlag = flag
  const $table = tableRef.value
  const $treeTable = treeRef.value
  if (flag === 'add') {
    if ($treeTable) {
      const selectRecord = $treeTable.getCurrentRecord()
      selectedDatas.value = []
      if (selectRecord && selectRecord.id) {
        tableInfo.selectData.pid = selectRecord.id
      } else {
        tableInfo.selectData.pid = '-1'
      }
      tableInfo.modalTitle = '标准成本查询配置-新增'
    }
  } else if (flag === 'edit') {
    if ($table) {
      const selectRecords = $table.getCheckboxRecords()
      if (selectRecords.length !== 1) {
        ElMessage.warning('请选择一条数据,进行编辑！')
        return
      }
      cnxDisabled.value = false
      const item = selectRecords[0]
      tableInfo.selectData.id = item.id
      tableInfo.selectData.pid = item.pid
      tableInfo.selectData.name = item.name
      tableInfo.selectData.isEdit = item.edit
      tableInfo.selectData.sort = item.sort
      tableInfo.selectData.sfmrzk = item.sfmrzk
      selectedDatas.value = await getCnxLevelTreeData(item.id)
      tableInfo.modalTitle = '标准成本查询配置-编辑'
    }
  } else if (flag === 'view') {
    const selectRecords = $table.getCheckboxRecords()
    if (selectRecords.length !== 1) {
      ElMessage.warning('请选择一条数据,进行查看！')
      return
    }
    cnxDisabled.value = true
    const item = selectRecords[0]
    tableInfo.selectData.id = item.id
    tableInfo.selectData.pid = item.pid
    tableInfo.selectData.name = item.name
    tableInfo.selectData.isEdit = item.edit
    tableInfo.selectData.sort = item.sort
    const selectedList = await getCnxLevelTreeData(item.id)
    selectedDatas.value = selectedList
    tableInfo.modalTitle = '标准成本查询配置-查看'
  }
  searchConfigAddRef.value.showModal = true
}

const deleteHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    const selectRecords: RowVO[] = $table.getCheckboxRecords()
    if (selectRecords.length === 0) {
      ElMessage.warning('请选择数据,进行删除！')
      return
    }
    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      let ids = selectRecords.map((item) => item.id)
      let res = await deleteData(ids)
      if (res.success) {
        ElMessage.success('删除成功！')
        await resetRootTree()
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const copyHandle = () => {
  copyKmfzpzRef.value.showModal = true
}

const zxzwhHandle = () => {
  const $table = tableRef.value
  if ($table) {
    const selectRecords = $table.getCheckboxRecords()
    if (selectRecords.length !== 1) {
      ElMessage.warning('请选择一条数据,进行维护！')
      return
    }
    const item = selectRecords[0]
    if (item && !item.edit) {
      ElMessage.warning('选择的数据,不支持执行值维护！')
      return
    }
    params.pzId = item.id
  }
  maintenanceRef.value.showModal = true
}

const fszwhHandle = () => {
  const $table = tableRef.value
  if ($table) {
    const selectRecords = $table.getCheckboxRecords()
    if (selectRecords.length !== 1) {
      ElMessage.warning('请选择一条数据,进行维护！')
      return
    }
    const item = selectRecords[0]
    if (item && !item.cnx) {
      ElMessage.warning('数据中不包含承诺项数据,请重新选择！')
      return
    }
    params.pzId = item.id
  }
  fszwhRef.value.showModal = true
}

const resetRootTree = async () => {
  await resetTable()
  treeRef.value.setAllTreeExpand(true)
  treeRef.value.setCurrentRow(list.yskmList[0])
  await treeNodeClickHandle()
}

const saveHandle = async () => {
  const $tree = treeRef.value
  const $table = tableRef.value
  if ($tree && $table) {
    const selectData = $tree.getCurrentRecord()
    selectData.isleaf = true
    $tree.reloadTreeExpand(selectData)
    let res = await getDataList({
      nd: params.nd,
      templateCode: params.templateCode,
      pid: selectData.id
    })
    if (res.success) {
      tableInfo.tableData = res.data
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const treeNodeClickHandle = async () => {
  const $table = treeRef.value
  if ($table) {
    const selectData = $table.getCurrentRecord()
    let res: Result = await getDataList({
      templateCode: params.templateCode,
      nd: params.nd,
      pid: selectData.id
    })

    sort.value = res.data?.length

    if (res.success) {
      tableInfo.tableData = res.data
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const initParams = async () => {
  // 获取公共代码
  const publicCodeList = await getPublicData('BZCBCXPZ_TEMPLATE_CODE')
  if (publicCodeList.success && publicCodeList.data.length !== 0) {
    list.bzcbcxList = publicCodeList.data
    params.templateCode = publicCodeList.data[0].code
  }
  const ndDataList: Result = await getYearData()
  list.ndList = ndDataList.data
  params.nd = new Date().getFullYear().toString()
  await resetTable()
  const $table = treeRef.value
  if ($table) {
    $table.setCurrentRow(list.yskmList[0])
    treeRef.value.setAllTreeExpand(true)
    await treeNodeClickHandle()
  }
}

const resetTable = async () => {
  let data = [
    {
      id: '-1',
      pid: '',
      cnx: '',
      cnxCode: '',
      isleaf: true,
      name: params.nd + '年度'
    }
  ]
  list.yskmList = data
}

const getRoleHandle = async () => {
  params.dwId = userDialogRef.value.userMsg.org_id
  let monthData: Result = await getFormData(params.dwId)
  params.month = monthData.data
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
  }
}

const cellStyle = () => {
  return {
    cursor: 'pointer'
  }
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
  .tree {
    padding: 10px;
    height: 100%;
  }

  .topBar {
    padding: 10px;
    display: flex;
    min-width: 0;
    min-height: 0;
    align-items: center;
    &-left {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
    &-right {
      display: flex;
      align-items: center;
    }
  }
  .table {
    padding: 0 10px 10px 10px;
    height: calc(100% - 52px);
  }
}

.nd-select {
  width: 100px;
  :deep(.el-input__inner) {
    padding: 10px;
  }
}

.bzcbcx-select {
  width: 170px;
  :deep(.el-input__inner) {
    padding: 10px;
  }
}
</style>

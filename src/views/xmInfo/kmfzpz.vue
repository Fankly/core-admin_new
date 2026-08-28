<template>
  <div v-show="pageInfo.isShowPage" class="container">
    <splitpane :splitSet="settingLR">
      <template #paneL>
        <div class="tree">
          <vxe-table
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
            <el-button :disabled="isDisabled" v-permission="'ADD'" type="primary" size="mini" plain @click="operationHandle('add')">新 增</el-button>
            <el-button :disabled="isShowEditBtn" v-permission="'EDIT'" type="primary" size="mini" plain @click="operationHandle('edit')"
              >编 辑</el-button
            >
            <el-button :disabled="isShowEditBtn" v-permission="'VIEW'" type="primary" size="mini" plain @click="operationHandle('view')"
              >查 看</el-button
            >
            <el-button :disabled="isShowDeleteBtn" v-permission="'DELETE'" type="danger" size="mini" plain @click="deleteHandle">删 除</el-button>
            <el-button v-permission="'COPY'" type="primary" size="mini" plain @click="copyHandle">复 制</el-button>
            <el-button v-permission="'ENABLE'" type="primary" size="mini" plain @click="isDisableHandle('1')">启用</el-button>
            <el-button v-permission="'DISABLE'" type="primary" size="mini" plain @click="isDisableHandle('0')">停用</el-button>
          </div>
          <div class="topBar-right">
            <span>年度：</span>
            <el-select class="nd-select" v-model="params.nd" placeholder="请选择" @change="changeNdDataHandle">
              <template v-for="item in list.ndList" :key="item.yearCode">
                <el-option :label="item.yearName" :value="item.yearCode"></el-option>
              </template>
            </el-select>
          </div>
        </div>
        <div class="search">
          <div class="form">
            <el-form :inline="true">
              <el-form-item label="科目名称：">
                <el-input v-model="formData.itemName" placeholder=""></el-input>
              </el-form-item>
              <el-form-item label="是否启用：">
                <el-select clearable style="width: 100%" v-model="formData.status">
                  <template v-for="item in list.statusList" :key="item.value">
                    <el-option :label="item.label" :value="item.value"></el-option>
                  </template>
                </el-select>
              </el-form-item>
            </el-form>
          </div>
          <div class="btn">
            <el-button plain type="primary" size="mini" @click="searchHandle">查 询</el-button>
            <el-button plain type="primary" size="mini" @click="resetHandle">重 置</el-button>
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
              :formatter="formatterStatus"
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
  <kmfzpzAdd
    :selectData="tableInfo.selectData"
    @save="saveHandle"
    :nd="params.nd"
    :yskmId="treeData.yskmId"
    ref="kmfzpzAddRef"
    :opeartionFlag="tableInfo.operationFlag"
    :title="tableInfo.modalTitle"
  ></kmfzpzAdd>
  <copyKmfzpz @copy="saveHandle" ref="copyKmfzpzRef" :ndList="list.ndList" :nd="params.nd"></copyKmfzpz>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: '/xmInfo/kmfzpz'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import kmfzpzAdd from '@/views/xmInfo/components/kmfzpzAdd.vue'
import copyKmfzpz from '@/views/xmInfo/components/copyKmfzpz.vue'
import { computed, onMounted, reactive, ref } from 'vue'

import { getYearData, getYskmTreeData } from '@/api/common'
import { DataList, deleteData, enableOrDisableData, getDataList } from '@/api/xmInfo/kmfzpz'
import { ElMessage } from 'element-plus'
import { VxeColumnPropTypes, VXETable, VxeTablePropTypes } from 'vxe-table'

interface List {
  ndList: NdList[]
  yskmList: YskmList[]
  options: any
  statusList: StatusList[]
}

interface RowVO {
  itemId: string
  itemName: string
  nd: string
  status: string
  yskmId: string
}

interface StatusList {
  label: string
  value: string
}

interface YskmList {
  cnx: string | null
  cnxCode: string | null
  cnxName: string | null
  id: string
  kmFlag: string
  leaf: boolean
  name: string
  pid: string
}

interface NdList {
  yearName: string
  yearCode: string
}

const userDialogRef = ref()
const treeRef = ref()
const kmfzpzAddRef = ref()
const copyKmfzpzRef = ref()

const settingLR: ContextProps = reactive({
  minPercent: 20,
  defaultPercent: 20,
  split: 'vertical'
})

const userInfo = ref()
const tableRef = ref()

const pageInfo = reactive({
  isShowPage: false
})

const formData = reactive({
  itemName: '',
  status: ''
})

const params = reactive({
  nd: ''
})

const treeConfig = reactive<VxeTablePropTypes.TreeConfig>({
  lazy: true,
  hasChildField: 'leafCode',
  loadMethod({ row }: any): Promise<any[]> {
    return new Promise((resolve: any) => {
      getYskmTreeData(params.nd, row.id).then((res: any) => {
        if (res.success) {
          resolve(res.data)
        } else {
          ElMessage.error(res.msg)
          resolve([])
        }
      })
    })
  }
})

const list = reactive<List>({
  ndList: [],
  yskmList: [],
  statusList: [
    {
      label: '停用',
      value: '0'
    },
    {
      label: '启用',
      value: '1'
    }
  ],
  options: {
    label: 'name',
    children: '',
    isLeaf: 'leaf'
  }
})

const tableInfo = reactive({
  columns: [
    {
      field: 'sort',
      title: '序号',
      width: 140
    },
    {
      field: 'yskmName',
      title: '科目名称',
      width: 220
    },
    {
      field: 'itemName',
      title: '名称',
      width: 'auto'
    },
    {
      field: 'nd',
      title: '年度',
      width: 160
    },
    {
      field: 'status',
      title: '状态',
      width: 160
    }
  ],
  tableData: [],
  modalTitle: '',
  operationFlag: '',
  loading: false,
  selectData: {
    itemId: '',
    itemName: '',
    status: '',
    sort: ''
  }
})

const treeData = reactive<{
  [key: string]: string
}>({
  yskmId: '',
  cnxCode: ''
})

const isDisabled = computed(() => !treeData.yskmId || !treeData.cnxCode)

const isShowEditBtn = computed(() => tableRef.value && tableRef.value.getCheckboxRecords().length !== 1)

const isShowDeleteBtn = computed(() => tableRef.value && tableRef.value.getCheckboxRecords().length === 0)

const changeNdDataHandle = async () => {
  list.yskmList.length = 0
  tableInfo.tableData.length = 0
  const yskmList = await getYskmTreeData(params.nd, params.nd)
  list.yskmList = yskmList.data
  await resetHandle()
}

const saveHandle = (params: DataList) => {
  getTableData()
}

const operationHandle = (flag: string) => {
  tableInfo.operationFlag = flag
  const $table = tableRef.value
  if (flag === 'add') {
    tableInfo.modalTitle = '科目辅助配置-新增'
  } else if (flag === 'edit') {
    if ($table) {
      const selectRecords = $table.getCheckboxRecords()
      if (selectRecords.length !== 1) {
        ElMessage.warning('请选择一条数据,进行编辑！')
        return
      }
      const item = selectRecords[0]
      tableInfo.selectData.itemId = item.itemId
      tableInfo.selectData.itemName = item.itemName
      tableInfo.selectData.status = item.status
      tableInfo.selectData.sort = item.sort
      tableInfo.modalTitle = '科目辅助配置-编辑'
    }
  } else if (flag === 'view') {
    const selectRecords = $table.getCheckboxRecords()
    if (selectRecords.length !== 1) {
      ElMessage.warning('请选择一条数据,进行查看！')
      return
    }
    const item = selectRecords[0]
    tableInfo.selectData.itemId = item.itemId
    tableInfo.selectData.itemName = item.itemName
    tableInfo.selectData.status = item.status
    tableInfo.selectData.sort = item.sort
    tableInfo.modalTitle = '科目辅助配置-查看'
  }
  kmfzpzAddRef.value.showModal = true
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
      // 只能删除停用状态的数据
      let selectData = selectRecords.filter((item) => item.status === '1')
      if (selectData.length > 0) {
        let selectNames = selectData.map((item) => item.itemName).join(',')
        ElMessage.warning(selectNames + '科目为启用状态，无法删除，请修改！')
        return
      }
      let ids = selectRecords.map((item) => item.itemId)
      let res = await deleteData(ids)
      if (res.success) {
        ElMessage.success('删除成功！')
        await getTableData()
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const searchHandle = async () => {
  await getTableData()
}

const resetHandle = async () => {
  formData.itemName = ''
  formData.status = ''
  const $table = treeRef.value
  if ($table) {
    treeData.yskmId = params.nd
    treeData.cnxCode = ''
    $table.clearCurrentRow()
    await getTableData()
  }
}

const copyHandle = () => {
  copyKmfzpzRef.value.showModal = true
}

const isDisableHandle = async (flag: string) => {
  let opeartionFlag = flag === '1' ? '启用' : '停用'
  const $table = tableRef.value
  if ($table) {
    const selectRecords: RowVO[] = $table.getCheckboxRecords()
    if (selectRecords.length === 0) {
      ElMessage.warning('请选择数据,进行' + opeartionFlag + '！')
      return
    }
    const type = await VXETable.modal.confirm('是否确定' + opeartionFlag + '？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      // 只能删除停用状态的数据
      let selectData = selectRecords.filter((item) => item.status === flag)
      if (selectData.length > 0) {
        let selectNames = selectData.map((item) => item.itemName).join(',')
        ElMessage.warning(selectNames + '科目为' + opeartionFlag + '状态，请检查后再进行操作！')
        return
      }
      let ids = selectRecords.map((item) => item.itemId)
      let res = await enableOrDisableData({
        ids,
        status: flag
      })
      if (res.success) {
        ElMessage.success(opeartionFlag + '成功！')
        await getTableData()
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const treeNodeClickHandle = async () => {
  const $table = treeRef.value
  if ($table) {
    const selectData = $table.getCurrentRecord()
    treeData.yskmId = selectData.id
    treeData.cnxCode = selectData.cnxCode
    // 重新请求表格数据
    await getTableData()
  }
}

const getTableData = async () => {
  tableInfo.loading = true
  let yskmId = treeData.yskmId || params.nd
  const tableData = await getDataList({
    nd: params.nd,
    status: formData.status,
    yskmId: Number(yskmId),
    itemName: formData.itemName
  })
  tableInfo.tableData = tableData.data
  tableInfo.loading = false
}

const formatterStatus: VxeColumnPropTypes.Formatter<RowVO> = ({ column, cellValue }) => {
  if (column.field === 'status') {
    const item = list.statusList.find((item: any) => item.value === cellValue)
    return item ? item.label : cellValue
  }
  return cellValue
}

const initParams = async () => {
  const ndDataList = await getYearData()
  list.ndList = ndDataList.data
  params.nd = new Date().getFullYear().toString()
  const yskmList = await getYskmTreeData(params.nd, params.nd)
  list.yskmList = yskmList.data
  await getTableData()
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
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

  .search {
    display: flex;
    padding: 0 10px;
    .el-form {
      height: 43px;
    }

    .form {
      flex: 1;
    }
    .btn {
      text-align: right;
      width: 200px;
    }
  }

  .topBar {
    padding: 10px;
    display: flex;
    align-items: center;
    &-left {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
  .table {
    padding: 0 10px 10px 10px;
    height: calc(100% - 95px);
  }
}

.nd-select {
  width: 100px;
  :deep(.el-input__inner) {
    padding: 10px;
  }
}
</style>

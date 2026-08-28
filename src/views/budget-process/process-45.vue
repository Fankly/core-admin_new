<template>
  <div class="container-main">
    <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
    <template v-if="isShowPage">
      <div v-loading="loading" class="process" element-loading-text="正在从服务器获取数据.....">
        <Split ratio="2/4">
          <template #one>
            <div class="left">
              <el-input style="margin-bottom: 10px" placeholder="输入关键字进行过滤" v-model="filterText"></el-input>
              <el-table
                @current-change="handleCurrentChange"
                class="treeTable"
                @selection-change="treeSelectChange"
                ref="taskTableRef"
                @select="selectClick"
                highlight-current-row
                border
                row-key="id"
                :data="treeTableData.filter((data: any) => !filterText || data.zyssxmc.toLowerCase().includes(filterText.toLowerCase()))"
              >
                <el-table-column
                  align="center"
                  v-for="item in treeColumns"
                  :key="item.columnKey"
                  :prop="item.columnKey"
                  :min-width="item.minWidth"
                  :label="item.columnName"
                  show-overflow-tooltip
                  :render-header="renderHeaderMethods"
                ></el-table-column>
              </el-table>
            </div>
          </template>
          <template #two>
            <div class="operate">
              <el-button v-permission="'ADD'" size="mini" type="success" @click="addHandle">新 增</el-button>
              <el-button v-permission="'DELETE'" size="mini" type="danger" @click="deleteHandle">删 除</el-button>
              <el-button v-permission="'BIND'" size="mini" type="warning" v-debounce="[historyHandle]"> 绑定记录 </el-button>
              <el-button v-permission="'EXPORT'" size="mini" type="info" v-debounce="[exportHandle]">导 出项目 </el-button>
              <el-button v-permission="'EXPORTSX'" size="mini" type="info" style="margin-right: 10px" v-debounce="[exportSxHandle]"
                >导 出事项
              </el-button>
            </div>
            <div class="right">
              <div class="search">
                <el-form size="mini" label-position="right" :label-width="120">
                  <el-row :gutter="24">
                    <el-col :span="8">
                      <el-form-item label="国网项目编码：">
                        <copyTextBox ref="xmbmRef"></copyTextBox>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="项目名称：">
                        <el-input clearable v-model="formData.xmmc"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="项目类型：">
                        <TreeSelect
                          ref="xmlxRef"
                          @clearData="clearDataHandle"
                          :is-leaf="false"
                          data-type="id"
                          :default-props="defaultProps.xmlxProps"
                          @selectChange="getProjectType"
                          style="width: 100%"
                          :data="searchData.projectTypeData"
                          node-key="id"
                        ></TreeSelect>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="24">
                    <el-col :span="8">
                      <el-form-item label="年度：">
                        <el-date-picker
                          @change="searchTreeAndTableHandle"
                          value-format="YYYY"
                          :clearable="false"
                          style="width: 100%"
                          v-model="formData.nd"
                          type="year"
                          placeholder="选择年"
                        ></el-date-picker>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="所属单位：">
                        <TreeSelect
                          ref="unitRef"
                          :is-leaf="false"
                          data-type="code"
                          :is-all="true"
                          :default-props="defaultProps.unitProps"
                          @selectChange="getChangeUnitData"
                          style="width: 100%"
                          :data="searchData.unitData"
                          node-key="objId"
                        ></TreeSelect>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8" style="text-align: right">
                      <el-button size="mini" type="primary" v-debounce="[searchHandle]"> 查 询</el-button>
                      <el-button size="mini" type="default" @click="resetHandle">重 置</el-button></el-col
                    >
                  </el-row>
                </el-form>
              </div>
              <div class="table">
                <el-table
                  @selection-change="handleSelectionChange"
                  ref="tableRef"
                  stripe
                  border
                  height="100%"
                  :data="tableData"
                  row-key="id"
                  :header-cell-style="{ 'text-align': 'center' }"
                >
                  <el-table-column type="selection" width="55" align="center"></el-table-column>
                  <template v-for="item in columns" :key="item.columnKey">
                    <el-table-column
                      show-overflow-tooltip
                      :prop="item.columnKey"
                      v-if="item.columnKey === 'xmmc' && item.checked"
                      width="200"
                      :label="item.columnName"
                      fixed
                    ></el-table-column>
                    <el-table-column
                      show-overflow-tooltip
                      :prop="item.columnKey"
                      align="center"
                      v-else-if="item.columnKey === 'gwxmbm' && item.checked"
                      width="200"
                      :label="item.columnName"
                      fixed
                    ></el-table-column>
                    <el-table-column
                      show-overflow-tooltip
                      :prop="item.columnKey"
                      :formatter="(row: any, column: any, cellValue: any) => formatHandle(row, column, cellValue, item.columnKey)"
                      align="center"
                      v-else-if="item.checked && setAlignCenter(item.columnKey)"
                      width="200"
                      :label="item.columnName"
                    ></el-table-column>
                    <el-table-column
                      show-overflow-tooltip
                      :prop="item.columnKey"
                      :formatter="(row: any, column: any, cellValue: any) => formatHandle(row, column, cellValue, item.columnKey)"
                      align="center"
                      v-else-if="item.checked"
                      width="200"
                      :label="item.columnName"
                    ></el-table-column>
                  </template>
                </el-table>
                <el-pagination
                  :current-page="page.page"
                  background
                  align="center"
                  :page-sizes="[10, 20, 50, 100, 500]"
                  :page-size="page.limit"
                  :total="parseInt(page.total + '')"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="limitChangeHandle"
                  @current-change="pageChangeHandle"
                ></el-pagination>
              </div>
            </div>
          </template>
        </Split>
        <newTerm
          :flag="false"
          :special-org-id="specialOrgId"
          :yssxId="formData.yssxId"
          :default-props="defaultProps"
          :search-data="searchData"
          @closeWin="(flag) => changeIsShowHandle(flag)"
          :is-show="isShow"
        ></newTerm>
        <el-dialog title="历史查询" width="50%" v-model="isHistory">
          <el-table
            fit
            highlight-current-row
            stripe
            border
            height="50vh"
            :data="historyData"
            row-key="id"
            :header-cell-style="{ 'text-align': 'center' }"
          >
            <template :key="item.columnKey" v-for="item in historyColumns">
              <el-table-column
                show-overflow-tooltip
                :prop="item.columnKey"
                :formatter="(row: any, column: any, cellValue: any) => formatHandle(row, column, cellValue, item.columnKey)"
                align="center"
                :label="item.columnName"
              ></el-table-column>
            </template>
          </el-table>
        </el-dialog>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: '/budget-process/process-45'
})
</script>

<script lang="ts" setup name="/budget-process/process-45">
import newTerm from '@/components/newTerm/index.vue'
import Split from '@/components/Split/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import baseService from '@/service/baseService'
import copyTextBox from '@/components/select/copyTextBox.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { h } from 'vue'

interface DefaultProps {
  defaultProps: {
    children: string
    label: string
  }
  xmlxProps: {
    children: string
    label: string
  }
  unitProps: {
    children: string
    label: string
  }
}

interface TreeData {
  id: string
  label: string
  num: number
  zyssxbm?: string
  children?: Array<TreeData>
}

const isShow: any = ref(false)
const xmbmRef = ref()
const tableRef = ref()
const xmlxRef = ref()
const unitRef = ref()
const loading = ref(false)
const userDialogRef = ref()
const specialOrgId = ref('')
const roleCode = ref('')
const filterText = ref('')
const treeData = reactive<Array<TreeData>>([])
const isHistory = ref(false)
const isShowPage = ref(false)
const historyColumns = ref([
  {
    columnKey: 'updateUser',
    columnName: '修改人'
  },
  {
    columnKey: 'updateTime',
    columnName: '修改时间'
  },
  {
    columnKey: 'xgqctName',
    columnName: '修改前预算事项名称'
  },
  {
    columnKey: 'xghctName',
    columnName: '修改后预算事项名称'
  }
])

let treeTableData: any = ref([])
const defaultProps: DefaultProps = reactive({
  defaultProps: {
    children: 'children',
    label: 'label'
  },
  xmlxProps: {
    children: 'children',
    label: 'name'
  },
  unitProps: {
    children: 'children',
    label: 'text'
  }
})
const multipleSelection: any = ref([])
const searchData = reactive({
  projectTypeData: [],
  ND: new Date().getFullYear().toString(),
  unitData: []
})
const columns = ref([
  {
    columnKey: 'xmmc',
    columnName: '项目名称',
    checked: true
  },
  {
    columnKey: 'gwxmbm',
    columnName: '国网项目编码',
    checked: true
  },
  {
    columnKey: 'proType',
    columnName: '项目类型',
    checked: true
  },
  {
    columnKey: 'xmbName',
    columnName: '项目包名称',
    checked: true
  },
  {
    columnKey: 'nd',
    columnName: '年度',
    checked: true
  },
  {
    columnKey: 'yjdw',
    columnName: '一级单位',
    checked: true
  },
  {
    columnKey: 'ejdw',
    columnName: '二级单位',
    checked: true
  },
  {
    columnKey: 'gkbm',
    columnName: '归口部门',
    checked: true
  },
  {
    columnKey: 'dnys',
    columnName: '当年预算',
    checked: true
  },
  {
    columnKey: 'xmxz',
    columnName: '项目性质',
    checked: true
  },
  {
    columnKey: 'saptime',
    columnName: '立项时间',
    checked: true
  },
  {
    columnKey: 'yjfl',
    columnName: '一级分类',
    checked: true
  },
  {
    columnKey: 'ejfl',
    columnName: '二级分类',
    checked: true
  },
  {
    columnKey: 'sjfl',
    columnName: '三级分类',
    checked: true
  }
])
const formData = reactive<any>({
  nd: new Date().getFullYear().toString(),
  xmlx: [],
  yjdw: [],
  ejdw: [],
  yssxId: '',
  xmmc: '',
  specialorgid: specialOrgId
})
const page = reactive({
  total: 0,
  limit: 10,
  page: 1,
  current: '1'
})
const tableData = ref([])
const historyData = ref([])
const treeColumns = ref([
  {
    columnKey: 'zyssxmc',
    columnName: '预算事项名称',
    minWidth: '50'
  },
  {
    columnKey: 'ysje',
    columnName: '金额',
    minWidth: '50'
  },
  {
    columnKey: 'num',
    columnName: '已关联项目数量',
    minWidth: '50'
  },
  {
    columnKey: 'xmje',
    columnName: '已关联项目金额',
    minWidth: '50'
  }
])
onMounted(() => {
  initData()
  getProjectTypeData()
  getUnitData()
})

const initData = () => {
  userDialogRef.value.getUser()
}

const searchTreeAndTableHandle = (value: string) => {
  searchData.ND = value
  getTreeData()
  searchHandle()
}

const clearDataHandle = () => {
  if (formData.xmlx && Array.isArray(formData.xmlx)) {
    formData.xmlx.length = 0
  } else {
    formData.xmlx = ''
  }
}

const renderHeaderMethods = ({ column }: any) => {
  return h('span', [h('span', column.label)])
}
const handleSelectionChange = (val: any) => {
  multipleSelection.value = val
}
const toggleSelection = (rows: any) => {
  if (rows) {
    rows.forEach((row: any) => {
      tableRef.value.toggleRowSelection(row)
    })
  } else {
    tableRef.value.clearSelection()
  }
}

interface TreeParams {
  specialorgid: string
  nd: string
}

const getTreeData = () => {
  loading.value = true
  const params: TreeParams = {
    specialorgid: specialOrgId.value,
    nd: searchData.ND
  }
  // 清空数据
  treeData.splice(0, treeData.length)
  baseService.post('process43/getCtlist/', params).then((res) => {
    if (res.success) {
      loading.value = false
      treeTableData.value = res.data
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
const getRoleHandle = () => {
  loading.value = false
  specialOrgId.value = userDialogRef.value.specialorgid
  roleCode.value = userDialogRef.value.roleCode
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
    getTreeData()
  }
}
const treeSelectChange = (val: any) => {
  formData.yssxId = ''
  if (val.length > 0) {
    formData.yssxId = val[0].id
  }
  searchHandle()
}
const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}
const getProjectTypeData = () => {
  let startDate: any = new Date().getFullYear()
  if (searchData.ND) {
    startDate = searchData.ND
  }
  loading.value = true
  const params = {
    parentId: '0',
    startDate: startDate
  }
  baseService.post('process40/getProTypeTreeNode/', params).then((res) => {
    if (res.success) {
      loading.value = false
      searchData.projectTypeData = res.data
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
const getProjectType = (value: any) => {
  formData.xmlx = value
}

interface UnitValue {
  level: number
  objCode: never
}

const getChangeUnitData = (value: any) => {
  // 设置一级单位和二级单位清空
  formData.yjdw = []
  formData.ejdw = []
  value.forEach((item: UnitValue) => {
    if (item.level === 1) {
      formData.yjdw.push(item.objCode)
    } else if (item.level === 2) {
      formData.ejdw.push(item.objCode)
    }
  })
}
const taskTableRef = ref()
const selectClick = (selection: any, row: any) => {
  if (selection.length > 1) {
    let del_row = selection.shift()
    taskTableRef.value.toggleRowSelection(del_row, false) // 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）
  }
}
const getUnitData = () => {
  loading.value = true
  const params = {
    parentCode: null,
    rootCode: 'childtree:DW_COM',
    objId: -1,
    level: 0
  }
  baseService.post('process40/getTreeNode/', params).then((res) => {
    if (res.success) {
      loading.value = false
      searchData.unitData = res.data
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
const changeIsShowHandle = (flag: any) => {
  isShow.value = flag
  getTreeData()
  searchHandle()
}
const historyHandle = () => {
  // 判断是否选择
  if (multipleSelection.value.length === 0) {
    ElMessage({
      type: 'warning',
      message: '请选择要查看的历史'
    })
    return
  } else if (multipleSelection.value.length > 1) {
    ElMessage({
      type: 'warning',
      message: '只能选择一条数据'
    })
    return
  }
  isHistory.value = true

  baseService.post(`process43/getHistory?xmid=${multipleSelection.value[0].xmid}`).then((res) => {
    if (res.success) {
      historyData.value = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
const searchHandle = () => {
  const gwxmbm = xmbmRef.value.array
  multipleSelection.value = []
  toggleSelection('')
  loading.value = true
  baseService
    .post('process43/getPage/', {
      ...formData,
      gwxmbm,
      page: page.page,
      limit: page.limit
    })
    .then((res) => {
      if (res.success) {
        loading.value = false
        page.total = res.data.total
        tableData.value = res.data.records
      } else {
        loading.value = false
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
}
const exportSxHandle = () => {
  loading.value = true
  baseService
    .export('/process43/exportCtlist', {
      nd: formData.nd,
      specialorgid: formData.specialorgid
    })
    .then((res) => {
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

      loading.value = false
    })
}
const exportHandle = () => {
  const xmbm = xmbmRef.value.array
  loading.value = true
  baseService
    .export('/process43/export', {
      ...formData,
      xmbm
    })
    .then((res) => {
      loading.value = false
      const blob: any = res
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      dom.download = '项目预算事项主数据关联存量项目.xlsx'
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
    })
}
const setAlignCenter = (columnkey: string) => {
  const arr = ['yjdw', 'ejdw', 'yjfl', 'ejfl', 'sjfl']
  return arr.includes(columnkey)
}
const formatHandle = (_row: any, _column: any, cellValue: any, columnKey: any) => {
  if (columnKey === 'dnys') {
    return cellValue ? parseFloat(cellValue).toFixed(4) : '0.0000'
  } else if (cellValue === null || cellValue === '') {
    return '-'
  }
  return cellValue
}
const addHandle = () => {
  if (!formData.yssxId) {
    ElMessage({
      type: 'warning',
      message: '请选择预算事项,再进行新增'
    })
    return
  }
  isShow.value = true
}
const handleCurrentChange = (val: any) => {
  formData.yssxId = val.id
  searchHandle()
}
const resetHandle = () => {
  xmbmRef.value.clear()
  // 清空查询条件
  formData.nd = new Date().getFullYear().toString()
  formData.xmlx = []
  formData.yjdw = []
  formData.ejdw = []
  formData.yssxId = ''
  formData.xmmc = ''
  xmlxRef.value.clearSelect()
  unitRef.value.clearSelect()
  multipleSelection.value = []
  toggleSelection('')
  searchHandle()
}
const deleteHandle = () => {
  // 判断是否选中
  if (multipleSelection.value.length === 0) {
    ElMessage({
      type: 'warning',
      message: '请选择要删除的数据'
    })
    return
  }
  // 增加comfirm
  ElMessageBox.confirm('是否删除选中数据', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      loading.value = true
      let xmIds = multipleSelection.value.map((item: any) => item.xmid)
      baseService.post('process43/delete', { ids: xmIds }).then((res) => {
        if (res.success) {
          loading.value = false
          ElMessage({
            type: 'success',
            message: '删除成功'
          })
          // 树刷新
          getTreeData()
          searchHandle()
        } else {
          loading.value = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    })
    .catch(() => {
      loading.value = false
    })
}
</script>

<style scoped lang="less">
.container-main {
  height: calc(100vh - 110px);
}

.process {
  width: 100%;
  height: calc(100vh - 110px);

  .operate {
    height: 40px;
    padding: 0 0 10px 0;
  }

  .container {
    display: flex;
    height: 100%;
    width: 100%;
  }
}

:deep(.treeTable th > .cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.left {
  :deep(.el-table__body tr.current-row > td) {
    color: #28a458;
    background: rgb(197, 213, 255) !important;
  }
}

.right {
  height: calc(100% - 40px);
  padding-left: 10px;

  .search {
    width: 100%;
    height: 85px;
  }

  .table {
    width: 100%;
    height: calc(100% - 127px);
  }
}
</style>

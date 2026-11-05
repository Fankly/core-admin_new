<script setup lang="ts">
import copyTextBox from '@/components/select/copyTextBox.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { computed, reactive, ref } from 'vue'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'

interface defaultProps {
  defaultProps: Object
  xmlxProps: Object
  unitProps: Object
}

interface SearchData {
  ND: String
  projectTypeData: Array<Object>
  unitData: Array<Object>
}

interface Props {
  flag: boolean
  isShow: boolean
  searchData: SearchData
  defaultProps: defaultProps
  yssxId: string
  zdtx?: string
  specialOrgId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'closeWin', flag: boolean): void
}>()

const termXmbmRef = ref()
const termXmlxRef = ref()
const termUnitRef = ref()
const multipleTableRef = ref()
const dialogVisible = computed({
  get: () => props.isShow,
  set: (value: boolean) => emit('closeWin', value)
})

const termData = reactive({
  xmmc: '',
  xmlx: [],
  isLink: '0',
  yjdw: [],
  ejdw: []
})
const tableLoad = ref(false)
const deleteFlag = ref(false)
const page = reactive({
  total: 0,
  limit: 10,
  page: 1,
  current: '1'
})

const resetDialogState = () => {
  resetHandle()
  // 重置表格
  tableData.value = []
  page.current = '1'
  page.total = 0
  page.limit = 10
  page.page = 1
}

const closeHandle = () => {
  resetDialogState()
  dialogVisible.value = false
}

const columns: any = ref([
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
    columnKey: 'zyssxmc',
    columnName: '预算事项名称',
    checked: true
  },
  {
    columnKey: 'islink',
    columnName: '是否已关联',
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
  },
  {
    columnKey: 'ztimestamp',
    columnName: '更新时间',
    checked: true
  }
])
let tableData = ref([])
const multipleSelection = ref([])

const getProjectType = (val: any) => {
  termData.xmlx = val
}

const clearDataHandle = () => {
  termData.xmlx.length = 0
}

interface UnitValue {
  level: Number
  objCode: never
}

const getUnitValue = (val: Array<any>) => {
  termData.yjdw = []
  termData.ejdw = []
  val.forEach((item: UnitValue) => {
    if (item.level === 1) {
      termData.yjdw.push(item.objCode)
    } else if (item.level === 2) {
      termData.ejdw.push(item.objCode)
    }
  })
}

const changeValue = (val: Boolean) => {
  return val ? (termData.isLink = '1') : (termData.isLink = '0')
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  loadData()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  loadData()
}
const toggleSelection = (rows: any) => {
  if (rows) {
    rows.forEach((row: any) => {
      multipleTableRef.value.toggleRowSelection(row)
    })
  } else {
    multipleTableRef.value.clearSelection()
  }
}
const loadData = () => {
  tableLoad.value = true
  multipleSelection.value = []
  toggleSelection('')
  let specialorgid = props.specialOrgId
  let zdtx = props.zdtx
  let gwxmbm = termXmbmRef.value.array
  const params = {
    zdtx,
    gwxmbm,
    specialorgid,
    page: page.page,
    limit: page.limit,
    ...termData,
    nd: props.searchData.ND
  }
  baseService.post('process43/getAddListNew/', params).then((res) => {
    if (res.success) {
      tableLoad.value = false
      page.total = res.data.total
      tableData.value = res.data.records
    } else {
      tableLoad.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

const formatHandle = (_row: any, _column: any, cellValue: any, columnKey: any) => {
  if (columnKey === 'dnys') {
    return cellValue ? parseFloat(cellValue).toFixed(4) : '0.0000'
  } else if (cellValue === null || cellValue === '') {
    return '-'
  }
  return cellValue
}

const setAlignCenter = (columnkey: string) => {
  const arr = ['yjdw', 'ejdw', 'yjfl', 'ejfl', 'sjfl']
  return arr.includes(columnkey)
}

const searchHandle = () => {
  loadData()
}

const saveHandle = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage({
      type: 'warning',
      message: '请选择数据'
    })
    return
  }
  let xmids = multipleSelection.value.map((item: any) => item.xmid)
  let str = props.flag ? 'process43/addNew/' : 'process43/add/'
  baseService
    .post(str, {
      yssxId: props.yssxId,
      xmids,
      specialorgid: props.specialOrgId
    })
    .then((res) => {
      if (res.success) {
        ElMessage({
          type: 'success',
          message: '保存成功'
        })
        closeHandle()
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
}

const resetHandle = () => {
  termData.xmmc = ''
  termData.xmlx = []
  termData.yjdw = []
  termData.ejdw = []
  termXmbmRef.value.clear()
  deleteFlag.value = false
  termXmlxRef.value.clearSelect()
  termUnitRef.value.clearSelect()
  // 重置勾选
  multipleSelection.value = []
  toggleSelection('')
}

const handleSelectionChange = (val: any) => {
  multipleSelection.value = val
}
</script>

<template>
  <el-dialog title="预算事项-新增" @close="resetDialogState" v-model="dialogVisible" fullscreen>
    <div class="container">
      <div class="search">
        <el-form class="formStyle" :inline="true" label-position="right" :label-width="120">
          <el-row>
            <el-col :span="6">
              <el-form-item label="项目编码：">
                <copyTextBox ref="termXmbmRef"></copyTextBox>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目名称：">
                <el-input clearable v-model="termData.xmmc"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="年度：">
                <el-date-picker
                  :clearable="false"
                  style="width: 100%"
                  v-model="props.searchData.ND"
                  type="year"
                  placeholder="选择年"
                  disabled
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :label-width="180" label="已关联">
                <el-checkbox @change="changeValue" v-model="deleteFlag"></el-checkbox>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <TreeSelect
                  @clearData="clearDataHandle"
                  ref="termXmlxRef"
                  :is-leaf="false"
                  data-type="id"
                  :default-props="props.defaultProps.xmlxProps"
                  @selectChange="getProjectType"
                  style="width: 100%"
                  :data="props.searchData.projectTypeData"
                  node-key="id"
                ></TreeSelect>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="所属单位：">
                <TreeSelect
                  ref="termUnitRef"
                  :is-leaf="false"
                  data-type="code"
                  :is-all="true"
                  :default-props="props.defaultProps.unitProps"
                  @selectChange="getUnitValue"
                  style="width: 100%"
                  :data="props.searchData.unitData"
                  node-key="objId"
                ></TreeSelect>
              </el-form-item>
            </el-col>
            <el-col :span="12" style="text-align: right">
              <el-button size="mini" type="primary" v-debounce="[searchHandle]"> 查 询</el-button>
              <el-button size="mini" type="default" @click="resetHandle">重 置</el-button>
              <el-button size="mini" type="warning" @click="saveHandle">确 定</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="content_table" ref="contentTables">
        <div class="content_table_center">
          <el-table
            @selection-change="handleSelectionChange"
            v-loading="tableLoad"
            ref="multipleTableRef"
            stripe
            border
            height="100%"
            :data="tableData"
            row-key="id"
            style="width: 100%; margin-top: 10px"
            :header-cell-style="{ 'text-align': 'center' }"
          >
            <el-table-column type="selection" width="55" align="center"></el-table-column>
            <template v-for="item in columns" :key="columns.columnKey">
              <el-table-column
                :show-overflow-tooltip="true"
                :prop="item.columnKey"
                v-if="item.columnKey === 'xmmc' && item.checked"
                width="200"
                :label="item.columnName"
                fixed
              ></el-table-column>
              <el-table-column
                :show-overflow-tooltip="true"
                :prop="item.columnKey"
                align="center"
                v-else-if="item.columnKey === 'gwxmbm' && item.checked"
                width="200"
                :label="item.columnName"
                fixed
              ></el-table-column>
              <el-table-column
                :show-overflow-tooltip="true"
                :prop="item.columnKey"
                :formatter="(row:any, column:any, cellValue:any) => formatHandle(row, column, cellValue, item.columnKey)"
                align="center"
                v-else-if="item.checked && setAlignCenter(item.columnKey)"
                width="200"
                :label="item.columnName"
              ></el-table-column>
              <el-table-column
                :show-overflow-tooltip="true"
                :prop="item.columnKey"
                :formatter="(row:any, column:any, cellValue:any) => formatHandle(row, column, cellValue, item.columnKey)"
                align="center"
                v-else-if="item.checked"
                width="200"
                :label="item.columnName"
              ></el-table-column>
            </template>
          </el-table>
        </div>
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
  </el-dialog>
</template>

<style scoped lang="less">
.container {
  width: 100%;
  height: 90vh;

  .search {
    height: 120px;
    width: 100%;

    .formStyle {
      box-sizing: border-box;
      padding-top: 20px;

      .el-form-item {
        width: 100%;
        margin-bottom: 14px;

        :deep(.el-form-item__label) {
          font-size: 13px;
        }

        .el-select {
          width: 100%;
        }
      }
    }
  }

  .content_table {
    height: calc(100% - 120px);

    .content_table_center {
      height: calc(100% - 60px);
    }
  }
}
</style>

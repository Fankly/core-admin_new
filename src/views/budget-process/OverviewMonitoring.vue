<script lang="ts">
export default {
  name: '/budget-process/OverviewMonitoring'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { useRouter } from 'vue-router'
import { CellStyle, QueryForm } from '@/views/budget-process/types/process-46'
import {
  getProTypeTreeNode,
  searchDataNew,
  exportDataNew,
  getRateConfig,
  updateRateConfig
} from '@/api/process'
import { cloneDeep } from 'lodash'
import { Decimal } from 'decimal.js'

onMounted(() => {
  initData()
})

const store = useStore()
const router = useRouter()

const isShowPage = ref(false)
const loading = ref(true)
const specialOrgId = ref('')
const roleCode = ref('')

// 表格数据
const tableData: any = ref([])

// ref
const userDialogRef = ref()
const proTypeRef = ref()
const mainRef = ref()

// 初始化数据
const initData = () => {
  selectRolesHandle()
  getRateConfigHandle()
  getProjectData()
}

// 获取关联率区间
const rateRange = ref<any>([])
const rateRangeList = ref<any>([])
const rateChangeColorHandle = ({ row, column, rowIndex, columnIndex }: CellStyle) => {
  const cellStyle: any = {
    color: '#000'
  }

  if (row.gll <= rateRange.value[0].zsbfb) {
    cellStyle.backgroundColor = 'rgba(215, 215, 215, 0.8)'
  } else if (row.gll > rateRange.value[0].zsbfb && row.gll < rateRange.value[1].zsbfb) {
    cellStyle.backgroundColor = 'rgba(0, 255, 0, 0.4)'
  } else if (row.gll >= rateRange.value[1].zsbfb && row.gll <= rateRange.value[2].zsbfb) {
    cellStyle.backgroundColor = 'rgba(255, 255, 0, 0.6)'
  } else if (row.gll > rateRange.value[2].zsbfb) {
    cellStyle.backgroundColor = 'rgba(255, 0, 0, 0.6)'
  }
  if (column.property && column.property === 'yssxmc') {
    return cellStyle
  }
}

const getRateConfigHandle = () => {
  loading.value = true
  getRateConfig().then((res: any) => {
    if (res.success) {
      loading.value = false
      rateRange.value = res.data
      rateRangeList.value = cloneDeep(res.data)
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

const dialogHandle = (flag: string) => {
  visibleDialog.value = false
  if (flag === '1') {
    // 提示文本
    const text = '是否确定关联率区间调整？'
    // 弹出提示框
    ElMessageBox.confirm(text, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        updateRateConfig(rateRangeList.value).then((res: any) => {
          if (res.success) {
            ElMessage({
              type: 'success',
              message: '关联率区间调整成功'
            })
            getRateConfigHandle()
            searchHandle()
          } else {
            ElMessage({
              type: 'error',
              message: res.msg
            })
          }
        })
      })
      .catch(() => {
        rateRangeList.value = cloneDeep(rateRange.value)
      })
  } else {
    rateRangeList.value = cloneDeep(rateRange.value)
  }
  // 获取input-form下el-input__inner
  const iptArr: any = document.querySelectorAll('.input-form .el-input__inner')
  // 设置背景颜色
  iptArr.forEach((item: any) => {
    item.style.background = ''
  })
}

// 查询条件
const queryForm: QueryForm = reactive({
  nd: new Date().getFullYear().toString(),
  xmlx: [],
  gkbm: '',
  yssxmc: ''
})

// 查询选择框数据
const selectData = reactive({
  projectType: []
})

// 获取选择的数据
const selectedData = (value: any, flag: string) => {
  queryForm[flag] = value
}

// 获取项目类型
const getProjectData = () => {
  loading.value = true
  const params = {
    parentId: '0',
    startDate: queryForm.nd
  }
  getProTypeTreeNode(params).then((res) => {
    if (res.success) {
      loading.value = false
      selectData.projectType = res.data
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

// 年份改变，项目类型改变
const changeDateHandle = (value: string) => {
  queryForm.nd = value
  getProjectData()
  searchHandle()
}

// 树形结构props类型
const treeProps = reactive({
  defaultProps: {
    children: 'children',
    label: 'text'
  },
  projectTypeProps: {
    children: 'children',
    label: 'name'
  }
})

// 表格数据设置
const tableColumn = reactive([
  {
    label: '事项id',
    prop: 'yssxId',
    hidden: true
  },
  {
    label: '事项名称',
    prop: 'yssxmc',
    hidden: false
  },
  {
    label: '年度',
    prop: 'nd',
    hidden: false
  },
  {
    label: '是否预安排',
    prop: 'isYap',
    hidden: false
  },
  {
    label: '预算立项辞条',
    prop: 'yslxct',
    hidden: false
  },
  {
    label: '归口部门',
    prop: 'gkbm',
    hidden: false
  },
  {
    label: '金额(万元)',
    prop: 'je',
    hidden: false
  },
  {
    label: '已关联项目金额(万元)',
    prop: 'yglxmje',
    hidden: false
  },
  {
    label: '关联率(%)',
    prop: 'gll',
    hidden: false
  },
  {
    label: '已关联项目数量',
    prop: 'yglxmsl',
    hidden: false
  },
  {
    label: '已入账成本(万元)',
    prop: 'yrzcb',
    hidden: false
  }
])

// 设置表格居中
const setTableCenter = (prop: string) => {
  const centerArr = ['nd', 'isYap', 'gkbm', 'gll', 'yglxmsl']
  const rightArr = ['je', 'yglxmje', 'yrzcb']
  if (centerArr.includes(prop)) {
    return 'center'
  } else if (rightArr.includes(prop)) {
    return 'right'
  } else {
    return 'left'
  }
}

// 分页
const page = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

// 导出
const exportDataHandle = () => {
  loading.value = true
  exportDataNew({
    ...queryForm,
    page: page.page,
    limit: page.limit,
    specialorgid: specialOrgId.value,
    roleCode: roleCode.value
  }).then((res: any) => {
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
    loading.value = false
  })
}

// 查询
const searchHandle = () => {
  loading.value = true
  try {
    searchDataNew({
      ...queryForm,
      page: page.page,
      limit: page.limit,
      specialorgid: specialOrgId.value,
      roleCode: roleCode.value
    }).then((res: any) => {
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
  } catch (error) {
    loading.value = false
    console.error(error)
  }
}

// 明细查询
const detailedQueryHandle = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage({
      type: 'warning',
      message: '请选择一条数据'
    })
    return
  }
  // 获取yssxIds
  const yssxIds = multipleSelection.value.map((item: any) => item.yssxId)

  store.commit('setProParams', {
    yssxIds: yssxIds,
    nd: queryForm.nd,
    specialorgid: specialOrgId.value,
    rateRange: cloneDeep(rateRange.value)
  })
  sessionStorage.setItem(
    'ProParams',
    JSON.stringify({
      yssxIds: yssxIds,
      nd: queryForm.nd,
      specialorgid: specialOrgId.value,
      rateRange: cloneDeep(rateRange.value)
    })
  )
  // 通过路由传递参数
  router.push({
    name: '/budget-process/ExecutionMonitorProcess'
  })
}

// 获取table多选数据
const multipleSelection = ref([])
const getMultipleSelection = (val: any) => {
  multipleSelection.value = val
}

// formatHandle 格式化数据
const formatHandle = (row: any, column: any) => {
  if (column.property === 'gll') {
    return new Decimal(row.gll).toFixed(2)
  }
  if (column.property === 'je' || column.property === 'yglxmje' || column.property === 'yrzcb') {
    if (row[column.property] === null || row[column.property] === undefined) {
      return '0.000000'
    }
    return new Decimal(row[column.property]).toFixed(6)
  }
  return row[column.property]
}

// 重置
const resetHandle = () => {
  queryForm.nd = new Date().getFullYear().toString()
  queryForm.xmlx = []
  queryForm.gkbm = ''
  queryForm.yssxmc = ''
  proTypeRef.value.clearSelect()
  searchHandle()
}

const selectRolesHandle = () => {
  loading.value = true
  userDialogRef.value.getUser()
}
const getRoleHandle = () => {
  loading.value = false
  specialOrgId.value = userDialogRef.value.specialorgid
  roleCode.value = userDialogRef.value.roleCode
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
    searchHandle()
  }
}

// 对话框显示隐藏
const visibleDialog = ref(false)

const rateAdjustmentHandle = () => {
  visibleDialog.value = !visibleDialog.value
}

// 表格列隐藏显示
const isHiddenColumn = (prop: string, hidden: boolean) => {
  tableColumn.forEach((item) => {
    if (item.prop === prop) {
      item.hidden = hidden
    }
  })
}

// 隐藏查询条件
const isHiddenQuery = ref(false)
const isHiddenQueryForm = () => {
  isHiddenQuery.value = !isHiddenQuery.value
  mainRef.value.style.height = isHiddenQuery.value ? 'calc(100% - 16px)' : 'calc(100% - 54px)'
}

const iptBlur = (row: any, event: any) => {
  // 根据row.id在哪个位置，判断位置之后的值是否比当前值大,后面的值比当前值大，提示错误，如果先输入后面的值，再输入前面的值，同样提示错误
  const index = rateRangeList.value.findIndex((item: any) => item.id === row.id)
  if (index < rateRangeList.value.length - 1) {
    if (row.zsbfb >= rateRangeList.value[index + 1].zsbfb) {
      ElMessage({
        type: 'error',
        message: '关联率区间调整错误'
      })
      // 还原
      rateRangeList.value[index].zsbfb = rateRange.value[index].zsbfb
    }
  }
  if (index > 0) {
    if (row.zsbfb <= rateRangeList.value[index - 1].zsbfb) {
      ElMessage({
        type: 'error',
        message: '关联率区间调整错误'
      })
      rateRangeList.value[index].zsbfb = rateRange.value[index].zsbfb
    }
  }
}

// 获取帮助信息
const getHelpMessageHandle = () => {
  ElMessageBox.alert(
    `关联率<=${rateRange.value[0].zsbfb}%时，事项名称标记为灰色；<br/>` +
      `关联率>${rateRange.value[0].zsbfb}%且<${rateRange.value[1].zsbfb}%时，事项名称标记为绿色；<br/>` +
      `关联率>=${rateRange.value[1].zsbfb}%且<=${rateRange.value[2].zsbfb}%时，事项名称标记为黄色；<br/>` +
      `关联率>${rateRange.value[2].zsbfb}%时，事项名称标记为红色。`,
    '关联率区间调整信息说明',
    {
      confirmButtonText: '确定',
      dangerouslyUseHTMLString: true
    }
  )
}

const clearDataHandle = () => {
  queryForm.xmlx.length = 0
}
</script>

<template>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <div v-loading="loading" class="container" v-if="isShowPage">
    <div class="operate">
      <div class="operate-button">
        <el-button v-permission="'DETAILED'" @click="detailedQueryHandle" size="mini" type="success"
          >明细查询
        </el-button>
        <el-button v-permission="'ADJUSTMENT'" @click="rateAdjustmentHandle" size="mini"
          >关联率区间调整</el-button
        >
      </div>
      <div class="operate-filter">
        <el-dropdown
          style="margin-right: 30px; cursor: pointer; font-size: 18px"
          trigger="click"
          :hide-on-click="false"
        >
          <el-tooltip content="列设置" placement="top">
            <span class="el-icon-s-operation"></span>
          </el-tooltip>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in tableColumn" :key="item.prop">
                <el-checkbox v-model="item.hidden" @change="isHiddenColumn(item.prop, item.hidden)">
                  {{ item.label }}
                </el-checkbox>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-tooltip content="隐藏/展示查询" placement="top">
          <span style="cursor: pointer; font-size: 18px" @click="isHiddenQueryForm">
            <i class="el-icon-arrow-down"></i>
          </span>
        </el-tooltip>
        <el-tooltip content="帮助" placement="top">
          <span
            style="cursor: pointer; margin-left: 30px; font-size: 18px"
            @click="getHelpMessageHandle"
          >
            <i class="el-icon-question"></i>
          </span>
        </el-tooltip>
      </div>
    </div>
    <div class="query" v-show="!isHiddenQuery">
      <div class="query-form">
        <el-form :model="queryForm" size="mini">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="年度：">
                <el-date-picker
                  style="width: 100%"
                  @change="changeDateHandle"
                  :clearable="false"
                  format="YYYY"
                  value-format="YYYY"
                  v-model="queryForm.nd"
                  type="year"
                  placeholder="请输入年份"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目类型：">
                <TreeSelect
                  @clearData="clearDataHandle"
                  ref="proTypeRef"
                  :is-leaf="false"
                  data-type="id"
                  :default-props="treeProps.projectTypeProps"
                  @selectChange="(value: any) => selectedData(value, 'xmlx')"
                  :data="selectData.projectType"
                  node-key="id"
                ></TreeSelect>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <el-input v-model="queryForm.gkbm"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="事项名称：">
                <el-input v-model="queryForm.yssxmc"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="query-button">
        <el-button @click="searchHandle" size="mini" type="success">查 询</el-button>
        <el-button @click="exportDataHandle" size="mini" type="info">导 出</el-button>
        <el-button @click="resetHandle" size="mini">重 置</el-button>
      </div>
    </div>
    <div class="main" ref="mainRef">
      <div class="show-msg">
        <span>
          关联率区间调整信息说明: 关联率&lt;={{ rateRange[0].zsbfb }}%时，事项名称标记为灰色；
          关联率&gt;{{ rateRange[0].zsbfb }}%且&lt;{{ rateRange[1].zsbfb }}%时，事项名称标记为绿色；
          关联率&gt;={{ rateRange[1].zsbfb }}%且&lt;={{
            rateRange[2].zsbfb
          }}%时，事项名称标记为黄色； 关联率>{{ rateRange[2].zsbfb }}%时，事项名称标记为红色。
        </span>
      </div>
      <div class="table">
        <el-table
          fit
          stripe
          @selection-change="getMultipleSelection"
          :cell-style="rateChangeColorHandle"
          :data="tableData"
          :header-cell-style="{ 'text-align': 'center' }"
          border
          height="100%"
        >
          <el-table-column align="center" type="selection" width="55"></el-table-column>
          <el-table-column align="center" type="index" width="55" label="序号" />
          <template v-for="item in tableColumn" :key="item.prop">
            <el-table-column
              :formatter="formatHandle"
              :align="setTableCenter(item.prop)"
              v-if="!item.hidden"
              :show-overflow-tooltip="true"
              :prop="item.prop"
              :label="item.label"
            ></el-table-column>
          </template>
        </el-table>
      </div>
      <div class="pagination">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page.limit"
          :total="parseInt(page.total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle"
          @current-change="pageChangeHandle"
        ></el-pagination>
      </div>
    </div>
  </div>
  <el-dialog width="30%" title="关联率区间调整" v-model="visibleDialog">
    <el-table :data="rateRangeList" stripe border fit :header-cell-style="{ textAlign: 'center' }">
      <el-table-column width="50" align="center" prop="id" label="序号"></el-table-column>
      <el-table-column width="100" prop="zsbfb" align="center" label="关联率(%)">
        <template #default="scope">
          <el-input-number
            :min="0"
            :max="100"
            :controls="false"
            @blur="iptBlur(scope.row, $event)"
            v-model="scope.row.zsbfb"
            class="ipt input-form"
            style="width: 100%"
          />
        </template>
      </el-table-column>
      <el-table-column prop="zbz" label="备注">
        <template #default="scope">
          <el-input
            class="input-form"
            :controls="false"
            @blur="iptBlur(scope.row, $event)"
            v-model="scope.row.zbz"
            style="width: 100%"
          />
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button type="primary" @click="dialogHandle('1')">确 定</el-button>
      <el-button @click="dialogHandle">取 消</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.container {
  width: 100%;
  height: calc(100vh - 135px);

  padding: 10px;

  .operate {
    display: flex;
    width: 100%;
    height: 28px;
    align-items: center;
    margin-bottom: 10px;

    &-button {
      width: 100%;
    }

    &-filter {
      width: 100%;
      text-align: right;
    }
  }

  .query {
    width: 100%;
    height: 28px;
    display: flex;
    margin-bottom: 10px;

    &-form {
      width: calc(100% - 200px);
      height: 28px;

      .el-row {
        height: 28px;

        .el-col {
          height: 28px;
        }
      }
    }

    &-button {
      width: 200px;
      height: 40px;
      text-align: right;
    }
  }

  .main {
    width: 100%;
    height: calc(100% - 54px);

    .show-msg {
      height: 29px;
      color: red;
    }

    .table {
      width: 100%;
      height: calc(100% - 69px);
    }

    .el-pagination {
      padding: 0;
      margin: 0;
    }
  }
}

.ipt {
  :deep(.el-input__inner) {
    text-align: center;
  }
}
</style>

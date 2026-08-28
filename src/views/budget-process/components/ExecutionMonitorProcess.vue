<script lang="ts">
export default {
  name: '/budget-process/ExecutionMonitorProcess'
}
</script>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { useRouter } from 'vue-router'
import { CellStyle, QueryFormProcess } from '@/views/budget-process/types/process-46'
import {
  getProTypeTreeNode,
  getRateConfig,
  searchProcess47New,
  exportProcess47New,
  getUnitTreeNode
} from '@/api/process'
import { Decimal } from 'decimal.js'

onMounted(() => {
  initData()
})

const store = useStore()
const router = useRouter()
const proParams = ref({
  nd: '',
  yssxIds: [],
  specialorgid: '',
  roleCode: '',
  rateRange: []
})
const nd = ref<string>('')
const yssxIds = ref([])
const specialorgid = ref<string>('')
const roleCode = ref<string>('')
const rateRangeList: any = ref([])
const loading = ref(true)
// 表格数据
const tableData: any = ref([])

watch(
  () => store.state.proParams,
  (newVal) => {
    proParams.value = newVal
    specialorgid.value = newVal.specialorgid
    roleCode.value = newVal.roleCode
    queryForm.nd = newVal.nd
    queryForm.yssxIds = newVal.yssxIds
    searchHandle()
  },
  {
    deep: true
  }
)

// ref
const proTypeRef = ref()
const mainRef = ref()

// 初始化数据
const initData = () => {
  proParams.value = store.getters.getProParams.nd
    ? store.getters.getProParams
    : JSON.parse(sessionStorage.getItem('ProParams') as string)
  nd.value = proParams.value.nd
  specialorgid.value = proParams.value.specialorgid
  roleCode.value = proParams.value.roleCode
  rateRangeList.value = proParams.value.rateRange
  yssxIds.value = proParams.value.yssxIds
  queryForm.nd = proParams.value.nd
  queryForm.yssxIds = proParams.value.yssxIds
  getProjectData()
  getUnitData()
  searchHandle()
  getRateConfigHandle()
}

// 获取单位数据
const getUnitData = () => {
  loading.value = true
  getUnitTreeNode(specialorgid.value).then((res) => {
    if (res.success) {
      loading.value = false
      selectData.unitData = res.data
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

// 获取关联率区间
const rateRange = ref<any>([])
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
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

// 查询条件
const queryForm: QueryFormProcess = reactive({
  nd: '',
  xmlx: [],
  gkbm: '',
  yssx: '',
  yssxIds: [],
  dwIds: []
})

// 查询选择框数据
const selectData: any = reactive({
  projectType: [],
  unitData: []
})

// 获取选择的数据
const selectedData = (value: any, flag: string) => {
  queryForm[flag] = value
}

// 获取项目类型
const getProjectData = () => {
  const params = {
    parentId: '0',
    startDate: queryForm.nd
  }
  loading.value = true
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

const clearDataHandle = () => {
  queryForm.xmlx.length = 0
}

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
    label: '预安排',
    prop: 'isYap',
    hidden: false
  },
  {
    label: '单位Id',
    prop: 'dwId',
    hidden: true
  },
  {
    label: '单位',
    prop: 'dwName',
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
  const centerArr = ['nd', 'isYap', 'gkbm', 'gll', 'yglxmsl', 'dwName', 'yslxct']
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
  exportProcess47New({
    ...queryForm,
    page: page.page,
    limit: page.limit,
    specialorgid: specialorgid.value,
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
  })
}

// 查询
const searchHandle = () => {
  getRateConfigHandle()
  loading.value = true
  searchProcess47New({
    ...queryForm,
    page: page.page,
    limit: page.limit,
    specialorgid: specialorgid.value,
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
  let data: Array<any> = multipleSelection.value.map((item: any) => {
    return {
      yssxId: item.yssxId,
      dwId: item.dwId
    }
  })
  store.commit('setPenetrateParams', {
    specialorgid: specialorgid.value,
    data: data,
    nd: queryForm.nd
  })
  sessionStorage.setItem(
    'PenetrateParams',
    JSON.stringify({
      specialorgid: specialorgid.value,
      data: data,
      nd: queryForm.nd
    })
  )
  router.push({
    name: '/budget-process/monitorDetails'
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
  queryForm.yssx = ''
  queryForm.dwIds.length = 0
  proTypeRef.value.clearSelect()
  searchHandle()
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
  mainRef.value.style.height = isHiddenQuery.value ? 'calc(100% - 40px)' : 'calc(100% - 80px)'
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
</script>

<template>
  <div v-loading="loading" class="container">
    <div class="operate">
      <div class="operate-button">
        <el-button @click="detailedQueryHandle" size="mini" type="success">明细清单</el-button>
      </div>
      <div class="operate-filter">
        <el-dropdown
          style="margin-right: 30px; cursor: pointer"
          trigger="click"
          :hide-on-click="false"
        >
          <span class="el-icon-s-operation" style="font-size: 18px"></span>
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
        <span style="cursor: pointer; font-size: 18px" @click="isHiddenQueryForm">
          <i class="el-icon-arrow-down"></i>
        </span>
        <span
          style="cursor: pointer; margin-left: 30px; font-size: 18px"
          @click="getHelpMessageHandle"
        >
          <i class="el-icon-question"></i>
        </span>
      </div>
    </div>
    <div class="query" v-show="!isHiddenQuery">
      <div class="query-form">
        <el-form :model="queryForm" :inline="true" size="mini" label-position="right">
          <el-row :gutter="24">
            <el-col :span="4">
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
            <el-col :span="5">
              <el-form-item label="单位：">
                <el-select v-model="queryForm.dwIds" collapse-tags multiple>
                  <el-option
                    v-for="item in selectData.unitData"
                    :key="item.code"
                    :label="item.name"
                    :value="item.code"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5">
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
            <el-col :span="5">
              <el-form-item label="归口部门：">
                <el-input v-model="queryForm.gkbm"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="事项名称：">
                <el-input v-model="queryForm.yssx"></el-input>
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
        <span v-if="rateRangeList.length !== 0">
          关联率区间调整信息说明: 关联率&lt;={{ rateRangeList[0].zsbfb }}%时，事项名称标记为灰色；
          关联率&gt;{{ rateRangeList[0].zsbfb }}%且&lt;{{
            rateRangeList[1].zsbfb
          }}%时，事项名称标记为绿色； 关联率&gt;={{ rateRangeList[1].zsbfb }}%且&lt;={{
            rateRangeList[2].zsbfb
          }}%时，事项名称标记为黄色； 关联率>{{ rateRangeList[2].zsbfb }}%时，事项名称标记为红色。
        </span>
      </div>
      <div class="table">
        <el-table
          @selection-change="getMultipleSelection"
          :cell-style="rateChangeColorHandle"
          :data="tableData"
          :header-cell-style="{ 'text-align': 'center' }"
          border
          fit
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
</template>

<style scoped lang="less">
.container {
  width: 100%;
  height: calc(100vh - 150px);
  padding: 10px;

  .operate {
    display: flex;
    width: 100%;
    height: 28px;
    margin: 10px 0 15px 0;
    display: flex;
    align-items: center;

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
    margin-bottom: 15px;

    &-form {
      width: calc(100% - 200px);
      height: 40px;
    }

    &-button {
      width: 200px;
      height: 40px;
      text-align: right;
    }
  }

  .main {
    width: 100%;
    height: calc(100% - 80px);

    .show-msg {
      height: 29px;
      color: red;
    }

    .table {
      width: 100%;
      height: calc(100% - 40px);
    }

    .pagination {
      width: 100%;
      height: 28px;

      .el-pagination {
        padding: 0;
        margin: 15px 0 10px 0;
      }
    }
  }
}

.ipt {
  :deep(.el-input__inner) {
    text-align: center;
  }
}
</style>

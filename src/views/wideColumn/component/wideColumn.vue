<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { exportData, searchData } from '@/api/wideColumn'
import { Decimal } from 'decimal.js'

onMounted(() => {
  initData()
})

interface Props {
  nd: boolean
  yd: boolean
  columnTables: any[]
  flag: string
}

const store = useStore()
const router = useRouter()
const props = defineProps<Props>()

const isShowPage = ref(false)
const loading = ref(true)
const specialOrgId = ref('')
const roleCode = ref('')

// 表格数据
const tableData: any = ref([])

// ref
const userDialogRef = ref()
const mainRef = ref()

const monthData: any = ref([])

// 初始化数据
const initData = () => {
  selectRolesHandle()
  getMonthData()
}
const getMonthData = () => {
  for (let i = 1; i <= 12; i++) {
    monthData.value.push({
      value: i.toString(),
      label: i.toString() + '月'
    })
  }
}

// 查询条件
const queryForm: any = reactive({
  nd: new Date().getFullYear().toString(),
  yd: (new Date().getMonth() + 1).toString(),
  tableCode: props.flag
})

// 设置表格居中
const setTableCenter = (prop: string) => {
  const centerArr = ['nd', 'isYap', 'gkbm', 'gll', 'yglxmsl', 'dwName']
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
  limit: 10,
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
  // 如果没有月度和年度，删除参数
  if (!props.nd) {
    delete queryForm.nd
  }
  if (!props.yd) {
    delete queryForm.yd
  }
  exportData({
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
  })
}

// 查询
const searchHandle = () => {
  loading.value = true
  if (!props.nd) {
    delete queryForm.nd
  }
  if (!props.yd) {
    delete queryForm.yd
  }
  searchData({
    ...queryForm,
    page: page.page,
    limit: page.limit,
    specialorgid: specialOrgId.value,
    roleCode: roleCode.value
  }).then((res: any) => {
    loading.value = false
    if (res.success) {
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
  queryForm.yd = (new Date().getMonth() + 1).toString()
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
  }
}

// 表格列隐藏显示
const isHiddenColumn = (columnKey: string, hidden: boolean) => {
  props.columnTables.forEach((item) => {
    if (item.columnKey === columnKey) {
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
</script>

<script lang="ts">
export default {
  name: 'WideColumn'
}
</script>

<template>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <div v-loading="loading" class="container" v-if="isShowPage">
    <div class="operate">
      <div class="operate-button">
        <el-button @click="exportDataHandle" size="mini" type="info">导 出</el-button>
      </div>
      <div class="operate-filter">
        <el-dropdown style="margin-right: 30px; cursor: pointer" trigger="click" :hide-on-click="false">
          <el-tooltip content="列设置" placement="top">
            <span class="el-icon-s-operation"></span>
          </el-tooltip>
          <template #dropdown>
            <el-dropdown-menu style="height: 200px">
              <el-dropdown-item v-for="item in props.columnTables" :key="item.prop">
                <el-checkbox v-model="item.hidden" @change="isHiddenColumn(item.columnKey, item.hidden)">
                  {{ item.columnValue }}
                </el-checkbox>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-tooltip content="隐藏/展示查询" placement="top">
          <span style="cursor: pointer" @click="isHiddenQueryForm">
            <i class="el-icon-arrow-down"></i>
          </span>
        </el-tooltip>
      </div>
    </div>
    <div class="query" v-show="!isHiddenQuery">
      <div class="query-form">
        <el-form :model="queryForm" :inline="true" size="mini" label-position="right">
          <el-row :gutter="12">
            <el-col :span="6" v-if="props.nd">
              <el-form-item label="年度：">
                <el-date-picker
                  style="width: 100%"
                  :clearable="false"
                  format="YYYY"
                  value-format="YYYY"
                  v-model="queryForm.nd"
                  type="year"
                  placeholder="请输入年份"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6" v-if="props.yd">
              <el-form-item label="月度：">
                <el-select v-model="queryForm.yd" collapse-tags>
                  <el-option v-for="item in monthData" :key="item.value" :label="item.label" :value="item.value"> </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="query-button">
        <el-button @click="searchHandle" size="mini" type="success">查 询</el-button>
        <el-button @click="resetHandle" size="mini">重 置</el-button>
      </div>
    </div>
    <div class="main" ref="mainRef">
      <div class="table">
        <el-table :data="tableData" :header-cell-style="{ 'text-align': 'center' }" border fit height="100%">
          <template v-for="item in props.columnTables" :key="item.columnKey">
            <el-table-column
              :width="140"
              :formatter="formatHandle"
              :align="setTableCenter(item.columnKey)"
              v-if="item.hidden"
              :show-overflow-tooltip="true"
              :prop="item.columnKey"
              :label="item.columnValue"
            ></el-table-column>
          </template>
        </el-table>
      </div>
      <el-pagination
        :current-page="page.page"
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

<style scoped lang="less">
.container {
  width: 100%;
  height: calc(100vh - 150px);
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

    .table {
      width: 100%;
      height: calc(100% - 40px);
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

<template>
  <div class="main" v-loading="loading">
    <!-- table表格列表 -->
    <div class="table">
      <vxe-grid
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        @cell-click="cellClickHandle"
        ref="gridRef"
        height="100%"
        v-bind="gridOptions"
      ></vxe-grid>
    </div>
    <div class="bottom">
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

<script setup lang="ts">
import {
  searchCsParamList,
  getDynamicTableByUser
} from '@/api/service/requirement'
import { Configs, MenuConfig } from '@/views/service/xq/interface'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { computed, defineExpose, onMounted, reactive, ref, defineProps } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { VxeGridProps, VXETable } from 'vxe-table'

interface RowVo {
  code: string
  name: string
  state: string
  crtsigningdate: string
  vendernumber: string
  vendername: string
  innervender_name: string
  yjdwms: string
  ejdwms: string
  startdate: string
  enddate: string
  leasemonth: string
  totalrenttax: string
  totalrentnottax: string
  npvratend: string
  wbscode: string
  wbsname: string
  fpqz_name: string
  retrntion_name: string
  exemption_name: string
  zlzcsyksynx: string
}

const route = useRoute()

const isShowModal = ref(false)
const loading = ref(false)
const gridRef = ref()
const searchCode = ref('ZLHTGL')
const searchDatas = ref<any>({})
const linkLength = ref(0)
const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  specialorgcode: '',
  spRoleId: ''
})

const store = useStore()
const userInfOther = ref<any>()
const defaultValueProp = ref<any>({})

const searchData = ref<{
  [key: string]: any
}>({})
const page = {
  total: 0,
  limit: 20,
  page: 1
}

const props = defineProps({
  selectData: {
    type: Object as any,
    required: true
  }
})

const isShowPage = ref(false)

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchDataHandle()
}

const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchDataHandle()
}

// 按钮-查询
const searchDataHandle = async () => {
  loading.value = true
  const getPageData = await searchCsParamList({
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    wbsCode: props.selectData.xmbm
    // bmId: userInfo.value.deptId || '',
    // dwId: userInfo.value.dwId || '',
    // searchCode: searchCode.value
  })
  if (getPageData.success) {
    gridOptions.data = getPageData.data.records
    page.total = getPageData.data.total
    loading.value = false
  } else {
    loading.value = false
  }
}

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  columnConfig: {
    resizable: true
  },
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  columns: []
})

const getDynamicTable = async () => {
  const res = await getDynamicTableByUser({
    searchCode: searchCode.value
  })
  if (res.success) {
    gridOptions.columns = res.data.map((item: any) => {
      if (item.columnKey === 'xmmc') {
        item['width'] = 280
      } else {
        item['width'] = 180
      }
      return {
        ...item,
        title: item.columnValue,
        field: item.columnKey
      }
    })
    gridOptions.columns?.unshift({
      type: 'checkbox',
      width: 80
    })
  }
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await gridRef.value.clearCheckboxRow()
  gridRef.value.setCheckboxRow(row, true)
}

onMounted(async () => {
  showHandle()
})

const showHandle = async () => {
  await getDynamicTable()
  await searchDataHandle()
}

defineExpose({
  isShowModal,
  loading
})
</script>

<style scoped lang="less">
.opeartion {
  display: flex;
  min-width: 0;
  min-height: 0;
  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .right {
    min-width: 0;
    min-height: 0;
  }
}
:deep(.el-select) {
  width: 100%;
}
:deep(.el-select .el-input__inner) {
  height: auto !important;
  min-height: 32px;
}
:deep(.el-select__tags) {
  height: auto !important;
  max-height: none !important;
  flex-wrap: wrap;
  padding: 2px 0;
  .el-select__input {
    max-width: 110px !important;
  }
}
:deep(.el-input__wrapper) {
  height: auto !important;
}
.main {
  height: 650px;
  display: flex;
  flex-direction: column;
  margin: 0 -100px;
  .opeartion {
    padding: 10px;
  }
  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>

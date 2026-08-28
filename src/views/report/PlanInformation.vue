<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="opeartion">
      <div class="left">
        <el-button type="primary" size="mini" plain @click="exportHandle">导 出</el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form label-position="right" :label-width="110" :model="searchForm">
        <Grid ref="gridRef" :gap="[12, 0]" :cols="4">
          <GridItem>
            <div class="search-form-item">
              <div class="search-form-date">
                <el-form-item prop="gwxmbm">
                  <template #label>
                    <el-space :size="4">
                      <span>{{ `国网项目编码` }}</span>
                    </el-space>
                    <span>&nbsp;：</span>
                  </template>
                  <div class="form">
                    <ReMultipleText v-model="searchForm.gwxmbm" />
                  </div>
                </el-form-item>
              </div>
            </div>
          </GridItem>
          <GridItem>
            <el-form-item prop="nd">
              <template #label>
                <el-space :size="4">
                  <span>{{ `年度` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select v-model="searchForm.nd" placeholder="请选择">
                  <template v-for="item in ndList" :key="item.yearCode">
                    <el-option :label="item.yearName" :value="item.yearCode"></el-option>
                  </template>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem />
          <GridItem>
            <el-form-item>
              <div class="operation">
                <el-button type="primary" size="mini" plain @click="searchHandle">查 询</el-button>
                <el-button size="mini" plain @click="resetHandle">重 置</el-button>
              </div>
            </el-form-item>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="table">
      <vxe-grid height="100%" v-bind="gridOptions"></vxe-grid>
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
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/report/PlanInformation'
}
</script>

<script setup lang="ts">
import GridItem from '@/components/Grid/components/GridItem.vue'
import Grid from '@/components/Grid/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { getYearData } from '@/api/common'
import { exportPageData, getProPlanInfoPage } from '@/api/report'
import { formatValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'

const userDialogRef = ref()
const helpModalRef = ref()
const userInfo = ref<any>()
const dwId = ref('')
const ndList = ref<
  {
    yearName: string
    yearCode: string
  }[]
>([])

const searchForm = reactive({
  nd: '',
  gwxmbm: ''
})

const pageInfo = reactive({
  isShowPage: false
})

const page = reactive({
  total: 0,
  limit: 20,
  page: 1,
  current: '1'
})

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  columnConfig: {
    resizable: true
  },
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  rowConfig: {
    height: 32
  },
  columns: [
    {
      field: 'gwxmbm',
      title: '国网项目编码',
      align: 'center'
    },
    {
      field: 'nd',
      title: '年度',
      align: 'center'
    },
    {
      field: 'ztzjh',
      title: '总投资计划(万元)',
      align: 'right',
      headerAlign: 'center',
      formatter: ({ cellValue }: { cellValue: string }) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
        return formatValue(cellValue + '', 6)
      }
    },
    {
      field: 'ljtzjh',
      title: '累计投资计划(万元)',
      align: 'right',
      headerAlign: 'center',
      formatter: ({ cellValue }: { cellValue: string }) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
        return formatValue(cellValue + '', 6)
      }
    },
    {
      field: 'csndtzjh',
      title: '初始年度投资计划(万元)',
      align: 'right',
      headerAlign: 'center',
      formatter: ({ cellValue }: { cellValue: string }) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
        return formatValue(cellValue + '', 6)
      }
    },
    {
      field: 'ndtzjh',
      title: '年度投资计划(万元)',
      align: 'right',
      headerAlign: 'center',
      formatter: ({ cellValue }: { cellValue: string }) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
        return formatValue(cellValue + '', 6)
      }
    },
    {
      field: 'time',
      title: '更新时间',
      align: 'center'
    }
  ],
  data: []
})

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const getRoleHandle = async () => {
  dwId.value = userDialogRef.value.userMsg.org_id
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    await searchHandle()
  }
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

const searchHandle = async () => {
  gridOptions.loading = true
  const res = await getProPlanInfoPage({
    nd: Number(searchForm.nd),
    dwId: dwId.value,
    gwxmbm: searchForm.gwxmbm,
    page: page.page,
    limit: Number(page.limit)
  })
  if (res.success) {
    gridOptions.data = res.data.records
    page.total = res.data.total
    gridOptions.loading = false
  } else {
    ElMessage.error(res.msg)
    gridOptions.loading = false
  }
}

const exportHandle = async () => {
  gridOptions.loading = true
  const params = {
    nd: Number(searchForm.nd),
    gwxmbm: searchForm.gwxmbm,
    page: page.page,
    dwId: dwId.value,
    limit: Number(page.limit)
  }
  exportPageData(params).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = '项目计划信息.xlsx'
    if (res.headers && res.headers['content-disposition']) {
      filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    }
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    gridOptions.loading = false
  })
}

const resetHandle = () => {
  searchForm.nd = new Date().getFullYear().toString()
  searchForm.gwxmbm = ''
  searchHandle()
}

const initParams = async () => {
  await userDialogRef.value.getUser()
  let res = await getYearData()
  if (res.success) {
    ndList.value = res.data
    searchForm.nd = new Date().getFullYear().toString()
  } else {
    ElMessage.error(res.msg)
  }
}

onMounted(initParams)
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  height: 100%;

  :deep(.el-form) {
    height: 43px;
  }
  .operation {
    text-align: right;
  }
  .opeartion {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .table {
    flex: 1;
    min-height: 0;
  }
}
</style>

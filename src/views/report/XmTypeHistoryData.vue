<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="opeartion" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-button :loading="gridOptions.loading" v-permission="'EXPORT'" type="primary" size="mini" plain @click="importHandle">导 入</el-button>
        <el-button :loading="gridOptions.loading" v-permission="'IMPORT'" type="primary" size="mini" plain @click="exportHandle">导 出</el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form label-position="right" :label-width="110" :model="searchForm">
        <Grid ref="gridRef" :gap="[12, 0]" :cols="4">
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
          <GridItem> </GridItem>
          <GridItem />
          <GridItem>
            <el-form-item>
              <div class="operation">
                <el-button :loading="gridOptions.loading" type="primary" size="mini" plain @click="searchHandle">查 询</el-button>
                <el-button :loading="gridOptions.loading" size="mini" plain @click="resetHandle">重 置</el-button>
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
  <ImportExcel ref="importRef" />
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/report/XmTypeHistoryData'
}
</script>

<script setup lang="ts">
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import userDialog from '@/components/select/userDialog.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { onMounted, reactive, ref } from 'vue'
import { getSubProtypeTree, getYearData } from '@/api/common'
import { ElMessage } from 'element-plus'
import { exportData, getImportTemplate, getXmTypeHistoryPage, importData } from '@/api/report'
import ImportExcel from '@/components/ImportExcel/index.vue'

const userDialogRef = ref()
const helpModalRef = ref()
const importRef = ref()
const userInfo = ref<any>()
const dwId = ref('')
const ndList = ref<any>([])
const xmlxTreeData = ref([])

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const searchForm = reactive({
  nd: '',
  proType: []
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
      field: 'nd',
      title: '年度',
      align: 'center'
    },
    {
      field: 'name',
      title: '项目名称',
      align: 'center'
    },
    {
      field: 'gwxmbm',
      title: '国网项目编码',
      align: 'center'
    },
    {
      field: 'proType',
      title: '项目类型',
      align: 'center'
    }
  ],
  data: []
})

const getRoleHandle = async () => {
  dwId.value = userDialogRef.value.userMsg.org_id
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    await searchHandle()
  }
}

const importHandle = async () => {
  let params = {
    title: '历史项目项目类型表-',
    tempApi: () => getImportTemplate(),
    importApi: (importParams: any) => {
      let newImportParams = {
        excelFormData: importParams.excelFormData
      }
      return importData(newImportParams)
    },
    getTableList: searchHandle,
    specialorgid: dwId.value
  }
  importRef.value.acceptParams(params)
}

const exportHandle = async () => {
  gridOptions.loading = true
  let proType = ''
  if (searchForm.proType && Array.isArray(searchForm.proType) && searchForm.proType.length !== 0) {
    proType = searchForm.proType.join(',')
  }
  const params = {
    nd: Number(searchForm.nd),
    proType: proType,
    page: page.page,
    limit: Number(page.limit)
  }
  exportData(params).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = '历史项目项目类型表.xlsx'
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
  let proType = ''
  if (searchForm.proType && Array.isArray(searchForm.proType) && searchForm.proType.length !== 0) {
    proType = searchForm.proType.join(',')
  }
  const res = await getXmTypeHistoryPage({
    nd: Number(searchForm.nd),
    proType: proType,
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

const resetHandle = () => {
  searchForm.nd = new Date().getFullYear().toString()
  searchForm.proType.length = 0
  searchHandle()
}

const initParams = async () => {
  const xmlxRes = await getSubProtypeTree()
  if (xmlxRes.success) {
    xmlxTreeData.value = xmlxRes.data
  }
  await userDialogRef.value.getUser()
  let res = await getYearData()
  if (res.success) {
    ndList.value = res.data
    if (res.data && res.data.length > 0) {
      ndList.value.unshift(
        {
          yearCode: res.data[0].yearCode - 3,
          yearName: res.data[0].yearCode - 3 + '年度'
        },
        {
          yearCode: res.data[0].yearCode - 2,
          yearName: res.data[0].yearCode - 2 + '年度'
        },
        {
          yearCode: res.data[0].yearCode - 1,
          yearName: res.data[0].yearCode - 1 + '年度'
        }
      )
    }
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

  .opeartion {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  :deep(.el-form) {
    height: 43px;
  }
  .operation {
    text-align: right;
  }
  .table {
    flex: 1;
    min-height: 0;
  }
}
</style>

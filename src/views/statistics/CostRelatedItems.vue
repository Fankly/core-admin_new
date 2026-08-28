<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="operation" v-if="pageInfo.isShowPage">
      <div class="left">
        <el-button type="primary" plain size="mini" v-permission="'EXPORT'" @click="exportDataHandle">导 出</el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form :model="formData" label-position="right" label-width="120px">
        <Grid ref="gridRef" :gap="[12, 0]" :cols="4">
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算事项` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.yssx"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `重点投向` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input v-model="formData.zdtx"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `项目类型` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <TreeSelect
                  ref="proTypeRef"
                  @selectChange="getProTypeDataChange"
                  :default-props="{ children: 'children', label: 'name' }"
                  :data="searchParamsList.proTypeList"
                  node-key="id"
                  data-type="id"
                />
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `预算控制类别` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select v-model="formData.yskzlb" style="width: 100%">
                  <el-option :key="item.code" :label="item.name" :value="item.code" v-for="item in searchParamsList.budgetCategoryList"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `一级分类` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select style="width: 100%" @change="changeYjflDataHandle" v-model="formData.yjfl" clearable>
                  <el-option v-for="item in searchParamsList.yjflList" :key="item.id" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `二级分类` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select style="width: 100%" @change="changeEjflDataHandle" v-model="formData.ejfl" clearable>
                  <el-option v-for="item in searchParamsList.ejflList" :key="item.id" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item>
              <template #label>
                <el-space :size="4">
                  <span>{{ `三级分类` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select style="width: 100%" v-model="formData.sjfl" clearable>
                  <el-option v-for="item in searchParamsList.sjflList" :key="item.id" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <div class="btn">
              <el-button type="primary" plain size="mini" @click="searchHandle">查 询</el-button>
              <el-button type="primary" plain size="mini" @click="resetHandle">重 置</el-button>
            </div>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="table">
      <vxe-table
        :loading="pageInfo.loading"
        resizable
        :rowConfig="{
          height: 32
        }"
        show-header-overflow
        show-overflow
        border
        stripe
        height="100%"
        :data="tableData"
      >
        <vxe-column align="center" v-for="item in columns" :key="item.field" :field="item.field" :title="item.title"></vxe-column>
      </vxe-table>
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
  name: '/statistics/CostRelatedItems'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { useGuide } from '@/hooks/useGuide'

import { ClassifyData, CobudgetCategory, FromData, ProTypeList, User, Yslxct } from '@/views/statistics/interface/CostRelatedItemsInterface'

import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

import { getAllProtypeTree, getPublicData, getSjflList, getYjflList } from '@/api/common'
import { getYslxct } from '@/api/matter/yssxMatter'
import { pageSearchData, exportData } from '@/api/statistics/CostRelatedItems'

const userDialogRef = ref()
const proTypeRef = ref()
const helpModalRef = ref()

const tableData = ref([])

const pageInfo = reactive({
  loading: false,
  isShowPage: false
})

const page = reactive({
  total: 0,
  limit: 20,
  page: 1,
  current: '1'
})

const userInfo = ref<User>({
  code: '',
  id: '',
  info: '',
  name: '',
  org_id: '',
  org_name: '',
  role_id: '',
  rolename: '',
  spRoleCode: '',
  specialorgid: '',
  specialorgname: '',
  systemId: '',
  systemName: ''
})

const formData = reactive<FromData>({
  yssx: '',
  yjfl: '',
  ejfl: '',
  sjfl: '',
  zdtx: '',
  yskzlb: '',
  xmlxList: []
})

const searchParamsList = reactive<{
  proTypeList: ProTypeList[]
  budgetCategoryList: CobudgetCategory[]
  yslxctList: Yslxct[]
  yjflList: ClassifyData[]
  ejflList: ClassifyData[]
  sjflList: ClassifyData[]
}>({
  proTypeList: [],
  budgetCategoryList: [],
  yslxctList: [],
  yjflList: [],
  ejflList: [],
  sjflList: []
})

const columns = reactive([
  {
    field: 'fl1',
    title: '一级分类'
  },
  {
    field: 'fl2',
    title: '二级分类'
  },
  {
    field: 'fl3',
    title: '三级分类'
  },
  {
    field: 'fl4',
    title: '四级分类'
  },
  {
    field: 'yskzlb',
    title: '预算控制类别'
  },
  {
    field: 'zdtx',
    title: '重点投向'
  },
  {
    field: 'yjfl',
    title: '一级分类'
  },
  {
    field: 'ejfl',
    title: '二级分类'
  },
  {
    field: 'sjfl',
    title: '三级分类'
  },
  {
    field: 'yssx',
    title: '预算事项'
  }
])

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const getProTypeDataChange = (val: string[]) => {
  formData.xmlxList = val
}

const getProTypeData = async () => {
  let res = await getAllProtypeTree()
  if (res.success) {
    searchParamsList.proTypeList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const getPublicCodeList = async () => {
  let res = await getPublicData('XMLB_YSLY')
  if (res.success) {
    searchParamsList.budgetCategoryList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const getZdtxList = async () => {
  let res = await getYslxct()
  if (res.success) {
    searchParamsList.yslxctList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const getYjflDataList = async () => {
  const res = await getYjflList('GWXMFL')
  if (res.success) {
    searchParamsList.yjflList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const getClassifyDataList = async (flag: string, code: string | number, dataList: ClassifyData[]) => {
  const findData = dataList.find((item) => item.code === code)
  if (findData) {
    const res = await getSjflList(findData.id)
    if (res.success) {
      if (flag === 'EJFL') searchParamsList.ejflList = res.data
      else searchParamsList.sjflList = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  }
}

const changeYjflDataHandle = (val: string) => {
  clearableHandle('EJFL')
  if (val) getClassifyDataList('EJFL', val, searchParamsList.yjflList)
}

const changeEjflDataHandle = (val: string) => {
  clearableHandle('SJFL')
  if (val) getClassifyDataList('SJFL', val, searchParamsList.ejflList)
}

const clearableHandle = (flag: string) => {
  if (flag === 'SJFL') {
    formData.sjfl = ''
    searchParamsList.sjflList.length = 0
  }
  if (flag === 'EJFL') {
    formData.ejfl = ''
    formData.sjfl = ''
    searchParamsList.ejflList.length = 0
    searchParamsList.sjflList.length = 0
  }
}

const exportDataHandle = () => {
  pageInfo.loading = true
  const params = {
    ...formData,
    ...page,
    specialorgid: userInfo.value.specialorgid
  }
  exportData(params).then((res) => {
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = '成本性项目类型主数据-数据导出.xlsx'
    if (res.headers && res.headers['content-disposition']) {
      filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    }
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    pageInfo.loading = false
  })
}

const searchHandle = async () => {
  pageInfo.loading = true
  const params = {
    ...formData,
    ...page,
    specialorgid: userInfo.value.specialorgid
  }
  const res = await pageSearchData(params)
  if (res.success) {
    tableData.value = res.data.records
    page.total = res.data.total
    pageInfo.loading = false
  } else {
    pageInfo.loading = false
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const resetHandle = async () => {
  proTypeRef.value.clearSelect()
  for (const key in formData) {
    if (key === 'xmlxList') {
      formData[key].length = 0
    } else {
      formData[key] = ''
    }
  }
  searchParamsList.ejflList.length = 0
  searchParamsList.sjflList.length = 0
  page.page = 1
  page.limit = 20
  await searchHandle()
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

const initSearchParams = async () => {
  getProTypeData()
  getPublicCodeList()
  getZdtxList()
  getYjflDataList()
}

const { startGuide } = useGuide({
  moduleKey: 'CostRelatedItems',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const getRoleHandle = () => {
  pageInfo.loading = false
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    startGuide()
    searchHandle()
  }
}

const initPageData = () => {
  pageInfo.loading = true
  initSearchParams()
  userDialogRef.value.getUser()
}

onMounted(initPageData)
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;

  .search {
    padding: 10px 0 0 0;
    .btn {
      display: flex;
      justify-content: flex-end;
      align-content: center;
      align-items: center;
    }
  }

  .table {
    min-height: 0;
    min-width: 0;
    flex: 1;
  }
}

.el-form-item--mini.el-form-item,
.el-form-item--small.el-form-item {
  margin-bottom: 10px;
}

.el-pagination {
  :deep(.btn-prev),
  :deep(.btn-next) {
    padding-left: 10px;
  }
}

.operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

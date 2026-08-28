<script lang="ts">
export default {
  name: '/service/xq/ZLRequireDetailSearch'
}
</script>
<script setup lang="ts">
import { getPublicData } from '@/api/common'
import { getDynamicSearchColumn, getDynamicTableByUser, zlxqmxcxExport, zlxqszySearch } from '@/api/service/requirement'
import DynamicReports from '@/components/DynamicReports/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import TreeSelect from '@/components/TreeSelect/index.vue'
import { useGuide } from '@/hooks/useGuide'
import { useProcess } from '@/hooks/useProcess'
import { useUser } from '@/hooks/useUser'
import baseService from '@/service/baseService'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { Configs } from '@/views/service/xq/interface'
import { ElMessage } from 'element-plus'
import { computed, defineExpose, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { VxeGridProps } from 'vxe-table'

interface RowVo {
  id: string
  ztName: string
  xmbm: string
  xmmc: string
  amount: string
  xmlx: string
  zdtx: string
  yssx: string
  sjflName: string
  gkbm_name: string
  yjdwName: string
  ejdwName: string
  cbzxName: string
  createTime: string
  cjr: string
  lyxt_name: string
}

const route = useRoute()
const formRef = ref()
const isShowModal = ref(false)
const loading = ref(false)
const helpModalRef = ref()
const selectData = ref<RowVo>()
const gridRef = ref()
const dynamicReportsRef = ref()
const editPageRef = ref()
const searchCode = ref('ZLXQMXCX')
const dynamciSearch = ref<Configs[]>([])
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
const title = '高级设置'
const userDialogRef = ref()

const { startGuide } = useGuide({
  moduleKey: 'ZLRequireDetailSearch',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const defaultValueProp = ref<any>({})

const searchData = ref<{
  [key: string]: any
}>({})
const page = {
  total: 0,
  limit: 20,
  page: 1
}

const spanComp = computed(() =>
  linkLength.value % 4 === 0 ? 24 : linkLength.value % 4 === 1 ? 18 : linkLength.value % 4 === 2 ? 12 : linkLength.value % 4 === 3 ? 6 : 24
)

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

const processData = reactive({
  isShowDialog: false,
  compName: null,
  id: ''
})

const processHandle = () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    useProcess(records, processData)
  }
}

const exportHandle = () => {
  loading.value = true
  const params = {
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    bmId: userInfo.value.deptId || '',
    dwId: userInfo.value.dwId || '',
    searchCode: searchCode.value
  }
  zlxqmxcxExport(params).then((res: any) => {
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

const handleFieldChange = async (prop: string, value: any, column: Configs) => {
  if (prop === 'yjdw') {
    if (value) {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'ejdw')
      const ejdwData = await baseService.post(findData.dyff, {
        YJDW: value,
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        parentCode: value
      })
      findData.options = ejdwData.data || []
    } else {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'ejdw')
      findData.options = []
      if (Array.isArray(searchDatas.value[findData.code])) {
        searchDatas.value[findData.code] = []
      } else {
        searchDatas.value[findData.code] = ''
      }
    }
  }

  if (prop === 'yjfl') {
    if (value) {
      const findEjflData: any = dynamciSearch.value.find((search) => search.code === 'ejfl')
      const ejflData = await baseService.post(findEjflData.dyff, {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        code: column.ggdm,
        parentCode: value
      })
      findEjflData.options = ejflData.data || []
    } else {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'ejfl')
      const findSjflData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
      findData.options = []
      findSjflData.options = []
      if (Array.isArray(searchDatas.value[findData.code])) {
        searchDatas.value[findData.code] = []
        searchDatas.value[findSjflData.code] = []
      } else {
        searchDatas.value[findData.code] = ''
        searchDatas.value[findSjflData.code] = ''
      }
    }
  }

  if (prop === 'ejfl') {
    if (value) {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
      const sjflData: any = await baseService.post(findData.dyff, {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        code: column.ggdm,
        parentCode: value
      })
      findData.options = sjflData.data || []
    } else {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
      findData.options = []
      if (Array.isArray(searchDatas.value[findData.code])) {
        searchDatas.value[findData.code] = []
      } else {
        searchDatas.value[findData.code] = ''
      }
    }
  }
}

const searchDataHandle = async () => {
  loading.value = true
  const getPageData = await zlxqszySearch({
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    bmId: userInfo.value.deptId || '',
    dwId: userInfo.value.dwId || '',
    searchCode: searchCode.value
  })
  if (getPageData.success) {
    gridOptions.data = getPageData.data.records
    page.total = getPageData.data.total
    loading.value = false
  } else {
    loading.value = false
  }
}

const initParamsData = async (method: any, params: any): Promise<any[]> => {
  const res = await baseService.post(method, params)
  if (res.success) {
    return res.data
  } else {
    ElMessage.error(res.msg)
    return []
  }
}

const viewHandle = () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看!')
      return
    }
    selectData.value = records[0] as RowVo
    editPageRef.value.isShowModal = true
  }
}

const resetHandle = () => {
  dynamciSearch.value.forEach((item) => {
    if (item.dependOnColumn) {
      if (item.options && Array.isArray(item.options)) {
        item.options = []
      }
    }
  })
  for (let valueKey in searchDatas.value) {
    let data = searchDatas.value[valueKey]
    if (Array.isArray(data)) {
      if (defaultValueProp.value[valueKey]) {
        searchDatas.value[valueKey] = defaultValueProp.value[valueKey]
      } else {
        searchDatas.value[valueKey].length = 0
      }
    } else {
      if (defaultValueProp.value[valueKey]) {
        searchDatas.value[valueKey] = defaultValueProp.value[valueKey]
      } else {
        searchDatas.value[valueKey] = ''
      }
    }
  }
  searchDataHandle()
}

const searchConfigHandle = async () => {
  loading.value = true
  const searchResData = await getDynamicSearchColumn({
    searchCode: searchCode.value
  })
  if (searchResData.success) {
    linkLength.value = searchResData.data.length
    searchResData.data.forEach((item: Configs) => {
      if (item.defaultValue) {
        if (item.multiple) {
          const defaultValue = item.defaultValue.split(',')
          defaultValueProp.value[item.code] = defaultValue
          searchDatas.value[item.code] = defaultValue
        } else {
          searchDatas.value[item.code] = item.defaultValue
          defaultValueProp.value[item.code] = item.defaultValue
        }
      }
      searchData.value[item.code] = item.link
    })
    const ggdms: any = []
    const codes: any = []
    const customData: any = []
    dynamciSearch.value = searchResData.data.map((item: Configs) => {
      if (item.dyff && item.ggdm && !item.dependOnColumn) {
        ggdms.push(item.ggdm)
        codes.push(item.code)
      }
      if (item.dyff && !item.ggdm && !item.dependOnColumn) {
        customData.push({
          dyff: item.dyff,
          code: item.code
        })
      }
      return {
        ...item,
        nodeKey: 'id',
        placeholder: '请选择' + item.name,
        disabled: false,
        clearable: true,
        filterable: true,
        multiple: item.multiple,
        options: [],
        treeProps: { children: 'children', label: 'name', value: 'id' }
      }
    })
    for (const item of customData) {
      if (item.code !== 'xmlx') {
        const initCustomData = await initParamsData(item.dyff, {
          bmId: userInfo.value.deptId || '',
          dwId: userInfo.value.dwId || ''
        })
        const findData = dynamciSearch.value.find((search) => search.code === item.code)
        if (findData) {
          findData.options = initCustomData
        }
      } else {
        const initCustomData = await baseService.get(item.dyff)
        const findData = dynamciSearch.value.find((search) => search.code === item.code)
        if (findData) {
          findData.options = initCustomData.data
          findData.treeProps = {
            children: 'children',
            label: 'name',
            value: 'id'
          }
        }
      }
    }

    if (ggdms.length > 0) {
      const initData = await initParamsData('/commonCode/getCommonCode', {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        codes: ggdms
      })
      dynamciSearch.value.forEach((item) => {
        const searchDataIndex = codes.findIndex((code: any) => code === item.code)
        const searchData = codes.find((code: any) => code === item.code)
        if (searchDataIndex !== -1 && searchData) {
          item.options = initData[searchDataIndex].codes
        }
      })
    }
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

const showHandle = async () => {
  await searchConfigHandle()
  await getDynamicTable()
  await searchDataHandle()
  startGuide()
}
// const userDialogRef = ref();
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfOther.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.value.specialorgid}`)
      if (flagData.success && flagData.data) {
        store.commit('setZlGlobalInfo', {
          deptId: userInfOther.value.specialorgid,
          deptName: userInfOther.value.specialorgname,
          dwId: userInfOther.value.org_id,
          dwName: userInfOther.value.org_name,
          roleId: userInfOther.value.role_id,
          roleCode: userInfOther.value.code,
          spRoleId: userInfOther.value.id,
          specialorgcode: userInfOther.value.specialorgcode,
          fqzzFlag: flagData.data
        })
        const zlGlobalInfo = store.getters.getZlGlobalInfo
        if (zlGlobalInfo && Object.keys(zlGlobalInfo).length > 0) {
          isShowPage.value = true
          userInfo.value = {
            ...(zlGlobalInfo as any)
          }
          showHandle()
        }
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const xmjdList = ref<any>([])

const getPublicCode = async () => {
  const res = await getPublicData('ZLYS_XMJD')
  if (res.success && res.data) {
    xmjdList.value = res.data
  }
}

onMounted(async () => {
  getPublicCode()
  const isRoel = await useUser('getZlGlobalInfo')
  if (isRoel && route.params.formJsc) {
    const zlGlobalInfo = store.getters.getZlGlobalInfo
    isShowPage.value = true
    userInfo.value = {
      ...(zlGlobalInfo as any)
    }
    await showHandle()
  } else {
    await userDialogRef.value.getUser()
  }
})

const showModalHandle = () => {
  searchConfigHandle()
  getDynamicTable()
}

const settingHandle = () => {
  dynamicReportsRef.value.isShowDrawer = true
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await gridRef.value.clearCheckboxRow()
  gridRef.value.setCheckboxRow(row, true)
}

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}
const isShowResetModal = ref(false)
const ids = ref([])

defineExpose({
  isShowModal,
  loading
})
</script>

<template>
  <div class="main" v-if="isShowPage" v-loading="loading">
    <div class="opeartion">
      <div class="left">
        <el-button v-permission="'VIEW'" plain type="primary" size="mini" @click="viewHandle"> 查 看 </el-button>
        <el-button v-permission="'EXPORT'" plain type="primary" size="mini" @click="exportHandle"> 导 出 </el-button>
        <el-button v-permission="'PROCESS'" plain type="primary" size="mini" @click="processHandle"> 流程履历 </el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form ref="formRef" :model="searchDatas" label-position="right" label-width="130px">
        <el-row :gutter="24">
          <template v-for="column in dynamciSearch" :key="column.code">
            <el-col :span="6" v-if="column.link">
              <el-form-item :label="column.name">
                <el-select
                  collapse-tags
                  v-if="column.type === 'select'"
                  v-model="searchDatas[column.code]"
                  style="width: 100%"
                  :placeholder="column.placeholder"
                  :disabled="column.disabled"
                  :clearable="column.clearable !== false"
                  :multiple="column.multiple"
                  :filterable="column.filterable"
                  @change="handleFieldChange(column.code, searchDatas[column.code], column)"
                >
                  <el-option
                    v-for="option in column.options"
                    :key="option.code"
                    :label="option.name"
                    :value="option.code"
                    :disabled="option.disabled"
                  />
                </el-select>
                <tree-select
                  v-else-if="column.type === 'treeSelect'"
                  v-model="searchDatas[column.code]"
                  :data="column.options"
                  :props="column.treeProps"
                  :node-key="column.nodeKey || 'id'"
                  :multiple="column.multiple"
                  :clearable="column.clearable !== false"
                  :filterable="column.filterable"
                  :placeholder="column.placeholder"
                  :disabled="column.disabled"
                  @change="handleFieldChange(column.code, searchDatas[column.code], column)"
                ></tree-select>
                <ReMultipleText
                  :placeholder="column.placeholder"
                  :dialog-title="column.name"
                  :tooltip-text="column.name"
                  v-else-if="column.type === 'inputText'"
                  v-model="searchDatas[column.code]"
                />
                <el-input maxlength="127" v-model="searchDatas[column.code]" v-else style="width: 100%"></el-input>
              </el-form-item>
            </el-col>
          </template>
          <el-col :span="spanComp">
            <div class="operation" style="text-align: right; margin-bottom: 10px">
              <el-button plain type="primary" size="mini" @click="searchDataHandle">查 询</el-button>
              <el-button plain type="primary" size="mini" @click="resetHandle">重 置</el-button>
              <el-button plain type="primary" size="mini" @click="settingHandle">高级设置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
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
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <DynamicReports :search-code="searchCode" :title="title" ref="dynamicReportsRef" @show-modal="showModalHandle"></DynamicReports>
  <CentralizedModification ref="editPageRef" :userInfo="userInfo" :formData="selectData" flag="VIEW"></CentralizedModification>
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
  <HelpModal ref="helpModalRef" />
</template>

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
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;

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

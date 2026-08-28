<script lang="ts">
export default {
  name: '/service/xq/RequireDetailSearch'
}
</script>
<script setup lang="ts">
import { getPublicData, getParamConfig } from '@/api/common'
import { getAppMenu } from '@/api/menu/menuConfig'
import { exportXm, exportXmAttach, getDynamicSearchColumn, getDynamicTableByUser, getXqlrPage } from '@/api/service/requirement'
import { reSendToJhxt } from '@/api/workflow'
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
import { Configs, MenuConfig } from '@/views/service/xq/interface'
import { ElMessage } from 'element-plus'
import { computed, defineExpose, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { freezeColumns } from '@/utils/utils'
import { VxeGridProps, VxeTable, VXETable } from 'vxe-table'

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
const searchCode = ref('XQLR-VIEW')
const dynamciSearch = ref<Configs[]>([])
const dynamicSearchMap = ref<Map<string, Configs>>(new Map())
const searchDatas = ref<any>({})
const linkLength = ref(0)
const maxDownloadNum = ref(100)
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

const { startGuide } = useGuide({
  moduleKey: 'RequireDetailSearch',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const store = useStore()
const userInfOther = ref<any>()
const title = '高级设置'

const operationBtn = ref<MenuConfig[]>([])
const searchBtn = ref<MenuConfig[]>([])
const userDialogRef = ref()

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
let searchRequestSeq = 0
const ctProjectCodeField = 'xmbm'

const getCurrentYear = () => new Date().getFullYear().toString()

const hasDefaultValue = (value: any) => value !== undefined && value !== null && value !== ''

const cloneDefaultValue = (value: any) => (Array.isArray(value) ? [...value] : value)

const getCtStorageKey = () => {
  const ctKey = route.query.ctKey
  return Array.isArray(ctKey) ? ctKey[0] : ctKey
}

const isCtEntry = computed(() => Boolean(route.params.formJsc || getCtStorageKey()))
const initLoading = ref(isCtEntry.value)
const showMain = computed(() => isShowPage.value || initLoading.value)
const pageLoading = computed(() => loading.value || initLoading.value)

const normalizeCtProjectCodes = (value: any): string[] => {
  if (!Array.isArray(value)) return []
  return value.map((item) => `${item}`.trim()).filter(Boolean)
}

const applyCtSearchCondition = () => {
  const ctKey = getCtStorageKey()
  if (!ctKey) return
  const ctStorageValue = sessionStorage.getItem(ctKey)
  if (!ctStorageValue) return

  try {
    const ctData = JSON.parse(ctStorageValue)
    const projectCodes = normalizeCtProjectCodes(ctData?.[ctProjectCodeField])
    if (!projectCodes.length) return
    searchDatas.value[ctProjectCodeField] = projectCodes.join(',') || ''
    page.page = 1
  } catch (e) {
    console.error(e)
  }
}

const isPlanYearField = (column: Configs) =>
  column.code?.toLowerCase() === 'jhssnd' || column.name?.includes('计划实施年度') || column.name?.includes('计划实施年份')

const normalizeRouteQueryValues = (value: any) =>
  (Array.isArray(value) ? value : [value])
    .filter((item) => item !== undefined && item !== null)
    .map((item) => `${item}`.trim())
    .filter(Boolean)

const setRouteSearchValue = (column: Configs | undefined, queryValue: any) => {
  if (!column) return
  const values = normalizeRouteQueryValues(queryValue)
  if (!values.length) return

  searchDatas.value[column.code] = column.type === 'inputText' ? values.join(',') : column.multiple ? values : values[0]
}

const applyRouteSearchCondition = () => {
  const projectCodeColumn = dynamciSearch.value.find((column) => column.code?.toLowerCase() === ctProjectCodeField)
  const planYearColumn = dynamciSearch.value.find(isPlanYearField)

  setRouteSearchValue(projectCodeColumn, route.query.xmbm)
  setRouteSearchValue(planYearColumn, route.query.nd)
}

const getColumnDefaultValue = (column: Configs) => {
  if (hasDefaultValue(column.defaultValue)) {
    if (column.multiple && typeof column.defaultValue === 'string') {
      return column.defaultValue.split(',')
    }
    return column.defaultValue
  }
  if (isPlanYearField(column)) {
    return column.multiple ? [getCurrentYear()] : getCurrentYear()
  }
}

const setDefaultSearchValue = (column: Configs) => {
  const defaultValue = getColumnDefaultValue(column)
  if (defaultValue === undefined) return
  defaultValueProp.value[column.code] = cloneDefaultValue(defaultValue)
  searchDatas.value[column.code] = cloneDefaultValue(defaultValue)
}

const createSearchColumn = (column: Configs) => {
  const valueKey = column.code === 'zt' ? 'code' : 'id'
  return {
    ...column,
    nodeKey: valueKey,
    placeholder: '请选择' + column.name,
    disabled: false,
    clearable: true,
    filterable: true,
    multiple: column.multiple,
    options: [],
    treeProps: { children: 'children', label: 'name', value: valueKey }
  }
}

const clearSearchItem = (column?: Configs) => {
  if (!column) return
  column.options = []
  if (Array.isArray(searchDatas.value[column.code])) {
    searchDatas.value[column.code] = []
  } else {
    searchDatas.value[column.code] = ''
  }
}

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
  exportXm(params).then((res: any) => {
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

const batchDownloadAttach = () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    if (records.length > maxDownloadNum.value) {
      ElMessage.warning(`一次最多支持 ${maxDownloadNum.value}个项目附件下载，请分批处理！`)
      return
    }
    isfileTypeModal.value = true
  }
}

const closefileTypeHandle = () => {
  modalForm.fjId = ''
  isfileTypeModal.value = false
}

const resetfileTypeHandle = () => {
  loading.value = true
  const $grid = gridRef.value
  const records = $grid.getCheckboxRecords()
  const ids = records.map((item: any) => item.id)
  exportXmAttach({ ids, fjId: modalForm.fjId || '' })
    .then((res: any) => {
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
      closefileTypeHandle()
    })
    .catch(() => {
      loading.value = false
      closefileTypeHandle()
    })
}

const handleFieldChange = async (prop: string, value: any, column: Configs) => {
  if (prop === 'yjdw') {
    const findData = dynamicSearchMap.value.get('ejdw')
    if (value) {
      if (!findData) return
      const ejdwData = await baseService.post(findData.dyff, {
        YJDW: value,
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        parentCode: value
      })
      findData.options = ejdwData.data || []
    } else {
      clearSearchItem(findData)
    }
  }

  if (prop === 'yjfl') {
    const findData = dynamicSearchMap.value.get('ejfl')
    const findSjflData = dynamicSearchMap.value.get('sjfl')
    if (value) {
      if (!findData) return
      const ejflData = await baseService.post(findData.dyff, {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        code: column.ggdm,
        parentCode: value
      })
      findData.options = ejflData.data || []
    } else {
      clearSearchItem(findData)
      clearSearchItem(findSjflData)
    }
  }

  if (prop === 'ejfl') {
    const findData = dynamicSearchMap.value.get('sjfl')
    if (value) {
      if (!findData) return
      const sjflData: any = await baseService.post(findData.dyff, {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        code: column.ggdm,
        parentCode: value
      })
      findData.options = sjflData.data || []
    } else {
      clearSearchItem(findData)
    }
  }
}

const searchDataHandle = async () => {
  const currentSeq = ++searchRequestSeq
  loading.value = true
  try {
    const getPageData = await getXqlrPage({
      ...searchDatas.value,
      limit: page.limit,
      page: page.page,
      bmId: userInfo.value.deptId || '',
      dwId: userInfo.value.dwId || '',
      searchCode: searchCode.value
    })
    if (currentSeq !== searchRequestSeq) return
    if (getPageData.success) {
      gridOptions.data = getPageData.data.records
      page.total = getPageData.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    if (currentSeq === searchRequestSeq) {
      loading.value = false
    }
  }
}

const searchHandle = () => {
  page.page = 1
  searchDataHandle()
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
    if (!records[0].sfxqlr) return
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
    if (Object.prototype.hasOwnProperty.call(defaultValueProp.value, valueKey)) {
      searchDatas.value[valueKey] = cloneDefaultValue(defaultValueProp.value[valueKey])
      continue
    }
    if (Array.isArray(data)) {
      searchDatas.value[valueKey] = []
      continue
    }
    searchDatas.value[valueKey] = ''
  }
  page.page = 1
  searchDataHandle()
}

const searchConfigHandle = async () => {
  loading.value = true
  try {
    const searchResData = await getDynamicSearchColumn({
      searchCode: searchCode.value
    })
    if (!searchResData.success) return

    const searchColumns = searchResData.data || []
    const commonCodeConfigs: Array<{ code: string; ggdm: string }> = []
    const customData: Array<{ dyff: string; code: string }> = []

    defaultValueProp.value = {}
    searchColumns.forEach((item: Configs) => {
      setDefaultSearchValue(item)
      searchData.value[item.code] = item.link
      if (item.dyff && item.ggdm && !item.dependOnColumn) {
        commonCodeConfigs.push({
          ggdm: item.ggdm,
          code: item.code
        })
      }
      if (item.dyff && !item.ggdm && !item.dependOnColumn) {
        customData.push({
          dyff: item.dyff,
          code: item.code
        })
      }
    })

    linkLength.value = searchColumns.filter((item: Configs) => item.link).length
    dynamciSearch.value = searchColumns.map(createSearchColumn)
    dynamicSearchMap.value = new Map(dynamciSearch.value.map((item) => [item.code, item]))

    await Promise.all(
      customData.map(async (item) => {
        const findData = dynamicSearchMap.value.get(item.code)
        if (!findData) return
        if (item.code !== 'xmlx') {
          const initCustomData = await initParamsData(item.dyff, {
            bmId: userInfo.value.deptId || '',
            dwId: userInfo.value.dwId || ''
          })
          findData.options = initCustomData
        } else {
          const initCustomData = await baseService.get(item.dyff)
          findData.options = initCustomData.data || []
        }
      })
    )

    if (commonCodeConfigs.length > 0) {
      const initData = await initParamsData('/commonCode/getCommonCode', {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        codes: commonCodeConfigs.map((item) => item.ggdm)
      })
      commonCodeConfigs.forEach((item, index) => {
        const findData = dynamicSearchMap.value.get(item.code)
        if (findData) {
          findData.options = initData[index]?.codes || []
        }
      })
    }
  } catch (e) {
    console.error(e)
  } finally {
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
    freezeColumns(gridOptions.columns as any, 2)
  }
}

const showHandle = async () => {
  await Promise.all([searchConfigHandle(), getDynamicTable()])
  applyRouteSearchCondition()
  applyCtSearchCondition()
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
        store.commit('setXqGlobalInfo', {
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
        const xqGlobalInfo = store.getters.getXqGlobalInfo
        if (xqGlobalInfo && Object.keys(xqGlobalInfo).length > 0) {
          isShowPage.value = true
          userInfo.value = {
            ...(xqGlobalInfo as any)
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

  const code = await getPublicData('XQLR_VIEW_DOWNLOAD_FJTYPE')
  if (code.success && code.data) {
    fileTypeList.value = code.data
  }
}

const getMaxDownloadNum = async () => {
  const res = await getParamConfig('XQLR_VIEW_BXPORT_MAX_NUM')
  if (res.success && res.data) {
    maxDownloadNum.value = parseInt(res.data) || 100
  }
}

onMounted(async () => {
  try {
    getPublicCode()
    getMaxDownloadNum()
    const isRoel = await useUser()
    if (isRoel && route.params.formJsc) {
      const xqGlobalInfo = store.getters.getXqGlobalInfo
      isShowPage.value = true
      userInfo.value = {
        ...(xqGlobalInfo as any)
      }
      await showHandle()
    } else {
      const operationRes = await getAppMenu({
        appNo: 'XQK',
        label: '1'
      })
      const searchRes = await getAppMenu({
        appNo: 'XQK',
        label: '2'
      })
      if (operationRes.success && searchRes.success) {
        operationBtn.value = operationRes.data
        searchBtn.value = searchRes.data
      }
      await userDialogRef.value.getUser()
    }
  } finally {
    initLoading.value = false
  }
})

watch(
  () => [route.query.ctKey, route.query.nd, route.query.xmbm],
  async (queryValues, oldQueryValues) => {
    if (!isShowPage.value || queryValues.every((value, index) => value === oldQueryValues[index])) return
    if (!queryValues.some((value) => normalizeRouteQueryValues(value).length)) return

    applyRouteSearchCondition()
    applyCtSearchCondition()
    await searchHandle()
  }
)

const showModalHandle = async () => {
  await Promise.all([searchConfigHandle(), getDynamicTable()])
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

const modalLoading = ref(false)
const modalformRef = ref()
const isShowResetModal = ref(false)
const isfileTypeModal = ref(false)
const fileTypeList = ref<any[]>([])
const modalForm = reactive({
  xmjd: '',
  fjId: ''
})
const ids = ref([])
const modalFormRules = reactive({
  xmjd: [{ required: true, message: '请选择项目阶段', trigger: ['change'] }]
})

const reSendBtnHandle = async () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    isShowResetModal.value = true
    ids.value = records.map((item: any) => item.id)
  }
}

const reSendToJhxtHandle = async () => {
  if (modalformRef.value) await modalformRef.value.validate()
  try {
    const type = await VXETable.modal.confirm('确认是否推送?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      modalLoading.value = true
      const res = await reSendToJhxt({
        ids: ids.value,
        xmjd: modalForm.xmjd
      })
      if (res.success) {
        ElMessage.success('推送成功！')
        closeResendHandle()
        await searchDataHandle()
      } else {
        throw new Error(res.msg)
      }
    }
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  } finally {
    modalLoading.value = false
  }
}

const closeResendHandle = () => {
  isShowResetModal.value = false
  modalForm.xmjd = ''
  ids.value = []
}

defineExpose({
  isShowModal,
  loading
})
</script>

<template>
  <div class="main" v-if="showMain" v-loading="pageLoading">
    <template v-if="isShowPage">
      <div class="opeartion">
        <div class="left">
          <el-button v-permission="'BTJHXT'" plain type="primary" size="mini" @click="reSendBtnHandle">补推计划系统</el-button>
          <el-button v-permission="'VIEW'" plain type="primary" size="mini" @click="viewHandle">查 看</el-button>
          <el-button v-permission="'EXPORT'" plain type="primary" size="mini" @click="exportHandle">导 出</el-button>
          <el-button v-permission="'BATCH_DOWNLOAD_ATTACH'" plain type="primary" size="mini" @click="batchDownloadAttach">附件批量下载</el-button>
          <el-button v-permission="'PROCESS'" plain type="primary" size="mini" @click="processHandle">流程履历</el-button>
        </div>
        <div class="right">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
      <div class="search">
        <el-form ref="formRef" :model="searchDatas" label-position="right" label-width="120px">
          <el-row :gutter="24">
            <template v-for="column in dynamciSearch" :key="column.code">
              <el-col :span="6" v-if="column.link">
                <el-form-item :label="column.name">
                  <el-select
                    collapse-tags
                    style="width: 100%"
                    v-if="column.type === 'select'"
                    v-model="searchDatas[column.code]"
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
                <el-button plain type="primary" size="mini" @click="searchHandle">查 询</el-button>
                <el-button plain size="mini" @click="resetHandle">重 置</el-button>
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
    </template>
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
  <vxe-modal title="补推计划系统" v-model="isShowResetModal" :loading="modalLoading">
    <template #default>
      <el-form ref="modalformRef" label-suffix=":" :model="modalForm" :rules="modalFormRules">
        <el-form-item prop="xmjd" label="项目阶段">
          <el-select style="width: 100%" v-model="modalForm.xmjd">
            <el-option v-for="item in xmjdList" :key="item.code" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button type="primary" size="mini" plain @click="reSendToJhxtHandle">推 送</el-button>
        <el-button size="mini" plain @click="closeResendHandle">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
  <vxe-modal title="选择导出的附件类型" v-model="isfileTypeModal" :loading="modalLoading">
    <template #default>
      <el-form ref="modalformRef" label-suffix=":" :model="modalForm" :rules="modalFormRules">
        <el-form-item prop="fjId" label="附件类型">
          <el-select style="width: 100%" v-model="modalForm.fjId">
            <el-option v-for="item in fileTypeList" :key="item.code" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button type="primary" size="mini" plain @click="resetfileTypeHandle">确 定</el-button>
        <el-button size="mini" plain @click="closefileTypeHandle">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
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

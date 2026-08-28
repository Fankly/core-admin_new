<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import type { VxeGridProps, VxeGridInstance } from 'vxe-table'
import { ElMessage } from 'element-plus'
import DynamicReports from '@/components/DynamicReports/index.vue'
import TreeSelect from '@/components/TreeSelect/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import baseService from '@/service/baseService'
import { useProcess } from '@/hooks/useProcess'
import { getDynamicTableByUser, getDynamicSearchColumn } from '@/api/service/requirement'
import type { TabConfig, SearchParams, SearchColumn } from './types'
import { Result } from '@/api/types'
import { getDynamicColumnByHzxx } from '@/api/service/Storage/confirmOutbound'
import { freezeColumns } from '@/utils/utils'

interface UserInfo {
  bmName: string
  dwName: string
  bmId: string
  roleId: string
  roleCode: string
  dwId: string
  specialOrgCode: string
  spRoleId: string
}

interface ApiResponse<T = any> {
  success: boolean
  data: {
    records: T[]
    total: number
  }
  msg: string
}

interface ServiceGeneralReportProps {
  searchCode: string
  tabLayout: 'top' | 'middle'
  buttonPermissions: string[]
  searchApi: (params: SearchParams) => Promise<ApiResponse<any>>
  exportApi?: (params: SearchParams) => Promise<any>
  userInfo: UserInfo
  tabs?: TabConfig[]
  keepSearchOnTabChange?: boolean
  freezeLeftCount?: number
}

const props = withDefaults(defineProps<ServiceGeneralReportProps>(), {
  tabs: () => [],
  tabLayout: 'top',
  keepSearchOnTabChange: false,
  freezeLeftCount: 0
})

const emit = defineEmits(['tabChange', 'selectionChange', 'search', 'export', 'drillThrough'])

const CACHE_LIMIT = 5
const DEBOUNCE_DELAY = 300
const THROTTLE_DELAY = 2000

const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

const throttle = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let lastExec = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastExec > delay) {
      fn(...args)
      lastExec = now
    }
  }
}

interface TabState {
  loading: boolean
  searchData: Record<string, any>
  defaultValueProp: Record<string, any>
  dynamicSearch: SearchColumn[]
  gridOptions: VxeGridProps
  page: { total: number; limit: number; page: number }
  checkedData: any[]
  selectData: any
  linkLength: number
  abortController: AbortController | null
  initialized: boolean
}

const activeTabCode = ref('')
const centralizedModificationRef = ref<InstanceType<typeof CentralizedModification>>()
const lruCache = ref<string[]>([])
const searchConfigCache = new Map<string, SearchColumn[]>()
const tableColumnCache = new Map<string, any[]>()
const tabStates = reactive<Map<string, TabState>>(new Map())
const gridRefs = ref<Record<string, VxeGridInstance>>({})
const helpModalRef = ref()
const dynamicReportsRef = ref()
const processData = reactive({
  isShowDialog: false,
  compName: '',
  id: ''
})

const normalizedTabs = computed(() => {
  if (props.tabs && props.tabs.length > 0) return props.tabs
  return [{ code: 'default', name: '列表', searchCode: props.searchCode }]
})

const showTabsHeader = computed(() => props.tabs && props.tabs.length > 1)
const currentTab = computed(() => normalizedTabs.value.find((t) => t.code === activeTabCode.value) || normalizedTabs.value[0])
const currentState = computed(() => tabStates.get(activeTabCode.value))

const spanComp = computed(() => {
  const len = currentState.value?.linkLength || 0
  return len % 4 === 0 ? 24 : len % 4 === 1 ? 18 : len % 4 === 2 ? 12 : 6
})

const isChecked = computed(() => !currentState.value?.checkedData || currentState.value.checkedData.length === 0)

const createTabState = (): TabState => ({
  loading: false,
  searchData: {},
  defaultValueProp: {},
  dynamicSearch: [],
  gridOptions: {
    border: true,
    columnConfig: { resizable: true },
    loading: false,
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    height: '100%',
    rowConfig: { height: 32 },
    columns: [],
    data: []
  },
  page: { total: 0, limit: 20, page: 1 },
  checkedData: [],
  selectData: null,
  linkLength: 0,
  abortController: null,
  initialized: false
})

const initParamsData = async (method: string, params: any) => {
  try {
    const res = await baseService.post(method, params)
    if (res.success) return res.data
    ElMessage.error(res.msg)
    return []
  } catch {
    return []
  }
}

const initTab = async (code: string) => {
  if (!tabStates.has(code)) {
    tabStates.set(code, createTabState())
  }

  const state = tabStates.get(code)!
  if (state.initialized) return

  state.loading = true
  const tabConfig = normalizedTabs.value.find((t) => t.code === code)
  const searchCode = tabConfig?.searchCode || props.searchCode

  const transformColumn = (item: any, depth = 1) => {
    if (depth > 3) {
      throw new Error(`多级表头嵌套层级不能超过3层,当前节点:${item?.columnValue || '未知列'}`)
    }
    const children = Array.isArray(item.children) ? item.children : []
    const isLeaf = children.length === 0

    if (isLeaf) {
      if (!item.columnKey) {
        throw new Error(`多级表头配置错误:叶子节点:【${item.columnValue || '未知列'}】缺少columnKey`)
      }
      return {
        ...item,
        title: item.columnValue,
        field: item.columnKey,
        className: item.detail ? 'drill-through-column' : '',
        params: { isDrill: !!item.detail },
        width: item.width || 180
      }
    }

    if (item.columnKey) {
      console.warn(`多级表头配置警告,分组节点【${item.columnValue || '未知列'}】不应包括columnKey,已自动忽略`)
    }
    const { columnKey, field, ...resetProps } = item

    return {
      ...resetProps,
      title: item.columnValue,
      children: children.map((child: any) => transformColumn(child, depth + 1))
    }
  }

  try {
    const [searchRes, tableRes]: Result[] = await Promise.all([
      searchConfigCache.has(searchCode)
        ? Promise.resolve({ success: true, data: searchConfigCache.get(searchCode)!, code: 200, msg: 'success' })
        : getDynamicSearchColumn({ searchCode }),
      tableColumnCache.has(searchCode)
        ? Promise.resolve({ success: true, data: tableColumnCache.get(searchCode)!, code: 200, msg: 'success' })
        : tabConfig?.isMultiLevelHeader
        ? getDynamicColumnByHzxx({ searchCode })
        : getDynamicTableByUser({ searchCode })
    ])

    if (searchRes.success) {
      if (!searchConfigCache.has(searchCode)) {
        searchConfigCache.set(searchCode, searchRes.data)
      }

      state.linkLength = searchRes.data.length
      const columns: SearchColumn[] = []
      const ggdms: string[] = []
      const codes: string[] = []
      const customData: any[] = []

      searchRes.data.forEach((item: SearchColumn) => {
        if (item.defaultValue) {
          if (item.multiple) {
            const defVal = item.defaultValue.split(',')
            state.defaultValueProp[item.code] = defVal
            state.searchData[item.code] = defVal
          } else {
            state.searchData[item.code] = item.defaultValue
            state.defaultValueProp[item.code] = item.defaultValue
          }
        }

        if (item.dyff && item.ggdm && !item.dependOnColumn) {
          ggdms.push(item.ggdm)
          codes.push(item.code)
        }
        if (item.dyff && !item.ggdm && !item.dependOnColumn) {
          customData.push({ dyff: item.dyff, code: item.code })
        }

        columns.push({
          ...item,
          nodeKey: 'id',
          placeholder: '请选择' + item.name,
          disabled: false,
          clearable: true,
          filterable: true,
          multiple: item.multiple,
          options: [],
          treeProps: { children: 'children', label: 'name', value: 'id' }
        })
      })

      state.dynamicSearch = columns

      for (const item of customData) {
        let options = []
        if (item.code !== 'xmlx') {
          options = await initParamsData(item.dyff, {
            bmId: props.userInfo.bmId || '',
            roleId: props.userInfo.roleId,
            dwId: props.userInfo.dwId || ''
          })
        } else {
          const res = await baseService.get(item.dyff)
          options = res.data
        }
        const col = state.dynamicSearch.find((c) => c.code === item.code)
        if (col) col.options = options
      }

      if (ggdms.length > 0) {
        const initData = await initParamsData('/commonCode/getCommonCode', {
          bmId: props.userInfo.bmId || '',
          dwId: props.userInfo.dwId || '',
          roleId: props.userInfo.roleId,
          codes: ggdms
        })
        if (Array.isArray(initData)) {
          state.dynamicSearch.forEach((col) => {
            const idx = codes.indexOf(col.code)
            if (idx !== -1) col.options = initData[idx].codes
          })
        }
      }
    }

    if (tableRes.success) {
      if (!tableColumnCache.has(searchCode)) {
        tableColumnCache.set(searchCode, tableRes.data)
      }

      const cols = tableRes.data.map((item: any) => transformColumn(item))
      cols.unshift({ type: 'checkbox', width: 80 })
      freezeColumns(cols, props.freezeLeftCount)
      state.gridOptions.columns = cols
    }

    if (props.keepSearchOnTabChange && lruCache.value.length > 1) {
      const prevCode = lruCache.value[lruCache.value.length - 2]
      const prevState = tabStates.get(prevCode)
      if (prevState) {
        Object.keys(prevState.searchData).forEach((key) => {
          if (state.dynamicSearch.some((c) => c.code === key)) {
            state.searchData[key] = prevState.searchData[key]
          }
        })
      }
    }

    if (tabConfig?.params) {
      Object.assign(state.searchData, tabConfig.params)
    }

    state.initialized = true
    await loadTableData(code)
  } catch (err) {
    console.error(err)
    ElMessage.error('初始化失败')
  } finally {
    state.loading = false
  }
}

const loadTableData = async (code: string) => {
  const state = tabStates.get(code)
  if (!state) return

  if (state.abortController) {
    state.abortController.abort()
  }
  const controller = new AbortController()
  state.abortController = controller

  state.loading = true
  state.checkedData = []

  const tabConfig = normalizedTabs.value.find((t) => t.code === code)
  const searchCode = tabConfig?.searchCode || props.searchCode

  const params = {
    ...state.searchData,
    limit: state.page.limit,
    page: state.page.page,
    bmId: props.userInfo.bmId || '',
    dwId: props.userInfo.dwId || '',
    roleId: props.userInfo.roleId,
    roleCode: props.userInfo.roleCode,
    searchCode: searchCode
  }

  try {
    const res = await props.searchApi(params)
    if (controller.signal.aborted) return

    if (res.success) {
      state.gridOptions.data = res.data.records || []
      state.page.total = Number(res.data.total)
      emit('search', params)
    } else {
      state.gridOptions.data = []
      state.page.total = 0
      ElMessage.warning(res.msg || '查询失败')
    }
  } catch (err: any) {
    if (err.name !== 'AbortError' && !controller.signal.aborted) {
      state.gridOptions.data = []
      ElMessage.error('查询出错')
    }
  } finally {
    if (!controller.signal.aborted) {
      state.loading = false
      state.abortController = null
    }
  }
}

const debouncedSearch = debounce((tabCode: string) => {
  const state = tabStates.get(tabCode)
  if (state) {
    state.page.page = 1
    loadTableData(tabCode)
  }
}, DEBOUNCE_DELAY)

const handleTabClick = (tab: any) => {
  const code = tab.props.name
  activeTabCode.value = code

  const idx = lruCache.value.indexOf(code)
  if (idx > -1) {
    lruCache.value.splice(idx, 1)
    lruCache.value.push(code)
  } else {
    if (lruCache.value.length >= CACHE_LIMIT) {
      const removed = lruCache.value.shift()
      if (removed) {
        const state = tabStates.get(removed)
        if (state?.abortController) {
          state.abortController.abort()
        }
        tabStates.delete(removed)
        delete gridRefs.value[removed]
      }
    }
    lruCache.value.push(code)
    initTab(code)
  }

  emit('tabChange', currentTab.value)
}

const handleFieldChange = async (prop: string, value: any, _column: SearchColumn) => {
  const state = currentState.value
  if (!state) return

  const recursiveClear = (parentProp: string) => {
    const children = state.dynamicSearch.filter((item) => item.dependOnColumn === parentProp)
    children.forEach((child) => {
      state.searchData[child.code] = child.multiple ? [] : ''
      child.options = []
      recursiveClear(child.code)
    })
  }

  const dependentColumns = state.dynamicSearch.filter((item) => item.dependOnColumn === prop)

  recursiveClear(prop)

  const hasValue = Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''
  const fetchPromises = dependentColumns.map(async (depColumn) => {
    if (depColumn.dyff && hasValue) {
      try {
        let options = []
        if (typeof depColumn.dyff === 'string') {
          const params: any = {
            [prop]: value,
            code: depColumn.ggdm || '',
            parentCode: value,
            bmId: props.userInfo.bmId || '',
            roleId: props.userInfo.roleId,
            dwId: props.userInfo.dwId || ''
          }
          options = await initParamsData(depColumn.dyff, params)
        }
        depColumn.options = options
      } catch (err) {
        console.error('Failed to load dependent field options:', err)
        depColumn.options = []
      }
    }
  })

  await Promise.all(fetchPromises)
}

const resetHandle = () => {
  const state = currentState.value
  if (!state) return

  state.dynamicSearch.forEach((item) => {
    if (item.dependOnColumn && Array.isArray(item.options)) {
      item.options = []
    }
  })

  Object.keys(state.searchData).forEach((key) => {
    const defaultValue = state.defaultValueProp[key]
    if (Array.isArray(state.searchData[key])) {
      state.searchData[key] = defaultValue !== undefined ? defaultValue : []
    } else {
      state.searchData[key] = defaultValue !== undefined ? defaultValue : ''
    }
  })

  state.page.page = 1
  loadTableData(activeTabCode.value)
}

const viewHandle = () => {
  const state = currentState.value
  if (!state) return
  const records = state.checkedData
  if (!records || records.length !== 1) {
    ElMessage.warning('请选择一条数据进行查看!')
    return
  }
  state.selectData = records[0]
  centralizedModificationRef.value.isShowModal = true
}

const processHandle = () => {
  const state = currentState.value
  if (!state) return

  state.loading = true
  try {
    const records = state.checkedData
    if (records.length === 0) return
    useProcess(records, processData)
  } finally {
    state.loading = false
  }
}

const exportHandle = throttle(() => {
  if (!props.exportApi) return
  const state = currentState.value
  if (!state) return

  state.loading = true
  const tabConfig = currentTab.value
  const searchCode = tabConfig.searchCode || props.searchCode

  const params = {
    ...state.searchData,
    limit: state.page.limit,
    page: state.page.page,
    bmId: props.userInfo.bmId || '',
    dwId: props.userInfo.dwId || '',
    roleId: props.userInfo.roleId,
    searchCode: searchCode
  }

  props
    .exportApi(params)
    .then((res: any) => {
      let blob: Blob
      let filename = '导出.xlsx'
      const disposition = res.headers?.['content-disposition']
      if (disposition) {
        const match = disposition.split(';')[1]?.split('=')[1]
        if (match) filename = decodeURI(decodeURI(match))
      }
      if (res instanceof Blob) {
        blob = res
      } else if (res.data instanceof Blob) {
        blob = res.data
      } else {
        throw new Error('Invalid export response')
      }
      const dom = document.createElement('a')
      const url = window.URL.createObjectURL(blob)
      dom.href = url
      dom.download = filename
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      state.loading = false
      emit('export', params)
    })
    .catch(() => {
      state.loading = false
      ElMessage.error('导出失败')
    })
}, THROTTLE_DELAY)

const pageChangeHandle = (val: number) => {
  if (currentState.value) {
    currentState.value.page.page = val
    loadTableData(activeTabCode.value)
  }
}

const limitChangeHandle = (val: number) => {
  if (currentState.value) {
    currentState.value.page.page = 1
    currentState.value.page.limit = val
    loadTableData(activeTabCode.value)
  }
}

const checkChangeHandle = ({ records }: any) => {
  if (currentState.value) {
    currentState.value.checkedData = records
    emit('selectionChange', records)
  }
}

const cellClickHandle = async ({ row, column, field }: any) => {
  if (column.type === 'checkbox') return

  if (column.params && column.params?.isDrill) {
    emit('drillThrough', { row, column, field })
  }
  const state = currentState.value
  const grid = gridRefs.value[activeTabCode.value]
  if (state && grid) {
    state.checkedData = []
    await grid.clearCheckboxRow()
    grid.setCheckboxRow(row, true)
    state.checkedData.push(row)
    emit('selectionChange', [row])
  }
}

const showModalHandle = () => {
  const code = activeTabCode.value
  const tabConfig = normalizedTabs.value.find((t) => t.code === code)
  const searchCode = tabConfig?.searchCode || props.searchCode

  if (tabStates.has(code)) {
    tabStates.delete(code)
  }

  searchConfigCache.delete(searchCode)
  tableColumnCache.delete(searchCode)

  initTab(code)
}

const settingHandle = () => {
  if (dynamicReportsRef.value) {
    dynamicReportsRef.value.isShowDrawer = true
  }
}

const getHelpMessageHandle = () => {
  if (helpModalRef.value) {
    helpModalRef.value.showModal = true
  }
}

const refresh = () => loadTableData(activeTabCode.value)
const reset = () => resetHandle()
const getSelectedRows = () => currentState.value?.checkedData || []
const clearCache = () => {
  lruCache.value.forEach((code) => {
    const state = tabStates.get(code)
    if (state?.abortController) {
      state.abortController.abort()
    }
    tabStates.delete(code)
    delete gridRefs.value[code]
  })
  lruCache.value = []
  searchConfigCache.clear()
  tableColumnCache.clear()
}

const isShowButton = (btnRole: string) => {
  return props.buttonPermissions.includes(btnRole)
}

onMounted(() => {
  if (normalizedTabs.value.length > 0) {
    const code = normalizedTabs.value[0].code
    activeTabCode.value = code
    lruCache.value.push(code)
    initTab(code)
  }
})

onUnmounted(() => {
  lruCache.value.forEach((code) => {
    const state = tabStates.get(code)
    if (state?.abortController) {
      state.abortController.abort()
    }
  })
  searchConfigCache.clear()
  tableColumnCache.clear()
})

const getTabConfig = (code: string) => {
  return normalizedTabs.value.find((t) => t.code === code) || ({} as TabConfig)
}

defineExpose({ refresh, reset, getSelectedRows, clearCache })
</script>

<template>
  <div class="service-general-report">
    <div class="tabs-container" v-if="showTabsHeader && (!tabLayout || tabLayout === 'top')">
      <el-tabs v-model="activeTabCode" @tab-click="handleTabClick" type="card">
        <el-tab-pane v-for="tab in normalizedTabs" :key="tab.code" :label="tab.name" :name="tab.code" />
      </el-tabs>
    </div>

    <div class="content-wrapper">
      <template v-for="tab in lruCache" :key="tab">
        <div
          v-show="activeTabCode === tab"
          :class="['tab-content', tabLayout === 'middle' ? 'is-middle-layout' : '']"
          v-loading="tabStates.get(tab)?.loading"
          element-loading-text="正在加载..."
        >
          <template v-if="tabStates.get(tab)">
            <div :class="['top-section', tabLayout === 'middle' ? 'card-style' : '']">
              <div class="opeartion">
                <div class="left">
                  <el-button
                    v-if="isShowButton('VIEW') && getTabConfig(tab).showViewBtn"
                    plain
                    type="primary"
                    size="mini"
                    @click="viewHandle"
                    :disabled="isChecked"
                  >
                    项目信息查看
                  </el-button>
                  <slot name="operation" :selected-list="tabStates.get(tab)?.checkedData || []" :tab-code="tab"></slot>
                  <el-button
                    v-if="props.exportApi && isShowButton('EXPORT') && getTabConfig(tab).showExportBtn"
                    plain
                    type="primary"
                    size="mini"
                    @click="exportHandle"
                  >
                    导 出
                  </el-button>
                  <el-button
                    v-if="isShowButton('PROCESS') && getTabConfig(tab).showProcessBtn"
                    plain
                    type="primary"
                    size="mini"
                    @click="processHandle"
                    :disabled="isChecked"
                  >
                    流程履历
                  </el-button>
                </div>
                <div class="right">
                  <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
                </div>
              </div>

              <div class="search">
                <el-form label-position="right" label-width="120px">
                  <el-row :gutter="24">
                    <template v-for="column in tabStates.get(tab)?.dynamicSearch" :key="column.code">
                      <el-col :span="6" v-if="column.link">
                        <el-form-item :label="column.name">
                          <el-select
                            v-if="column.type === 'select'"
                            v-model="tabStates.get(tab)!.searchData[column.code]"
                            :placeholder="column.placeholder"
                            :disabled="column.disabled"
                            :clearable="column.clearable !== false"
                            :multiple="column.multiple"
                            :filterable="column.filterable"
                            collapse-tags
                            style="width: 100%"
                            @change="handleFieldChange(column.code, tabStates.get(tab)!.searchData[column.code], column)"
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
                            v-model="tabStates.get(tab)!.searchData[column.code]"
                            :data="column.options"
                            :props="column.treeProps"
                            :node-key="column.nodeKey || 'id'"
                            :multiple="column.multiple"
                            :clearable="column.clearable !== false"
                            :filterable="column.filterable"
                            :placeholder="column.placeholder"
                            :disabled="column.disabled"
                            @change="handleFieldChange(column.code, tabStates.get(tab)!.searchData[column.code], column)"
                          ></tree-select>
                          <ReMultipleText
                            v-else-if="column.type === 'multipleInput'"
                            v-model="tabStates.get(tab)!.searchData[column.code]"
                            :placeholder="column.placeholder"
                            :dialog-title="column.name"
                            :tooltip-text="column.name"
                          ></ReMultipleText>
                          <el-input v-else v-model="tabStates.get(tab)!.searchData[column.code]" :maxlength="127" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                    </template>
                    <el-col :span="spanComp">
                      <div class="operation" style="text-align: right; margin-bottom: 10px">
                        <el-button plain type="primary" size="mini" @click="debouncedSearch(tab)">查 询</el-button>
                        <el-button plain size="mini" @click="resetHandle">重 置</el-button>
                        <el-button plain type="primary" size="mini" @click="settingHandle">高级设置</el-button>
                      </div>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
            </div>

            <div class="tabs-container" v-if="showTabsHeader && (!tabLayout || tabLayout === 'middle')">
              <el-tabs v-model="activeTabCode" @tab-click="handleTabClick" type="card">
                <el-tab-pane v-for="tab in normalizedTabs" :key="tab.code" :label="tab.name" :name="tab.code" />
              </el-tabs>
            </div>

            <div :class="['bottom-section', tabLayout === 'middle' ? 'card-style' : '']">
              <div class="table">
                <vxe-grid
                  :ref="(el:any) => { if(el) gridRefs[tab] = el as VxeGridInstance }"
                  v-bind="tabStates.get(tab)!.gridOptions"
                  :checkbox-config="{ trigger: 'row', highlight: true }"
                  @checkbox-change="checkChangeHandle"
                  @checkbox-all="checkChangeHandle"
                  @cell-click="cellClickHandle"
                  height="100%"
                >
                </vxe-grid>
              </div>

              <div class="bottom">
                <el-pagination
                  background
                  align="center"
                  layout="total, sizes, prev, pager, next, jumper"
                  :current-page="tabStates.get(tab)!.page.page"
                  :page-size="tabStates.get(tab)!.page.limit"
                  :page-sizes="[10, 20, 50, 100, 500]"
                  :total="tabStates.get(tab)!.page.total"
                  @size-change="limitChangeHandle"
                  @current-change="pageChangeHandle"
                ></el-pagination>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>

    <DynamicReports ref="dynamicReportsRef" :search-code="currentTab.searchCode || props.searchCode" title="高级设置" @show-modal="showModalHandle" />

    <slot name="viewComponent" :row-data="currentState?.selectData"></slot>

    <component
      :is="processData.compName"
      v-if="processData.isShowDialog"
      :isShowDialog="processData.isShowDialog"
      :id="processData.id"
      @closeDialog="processData.isShowDialog = false"
    ></component>
    <CentralizedModification
      ref="centralizedModificationRef"
      :userInfo="props.userInfo"
      :formData="currentState?.selectData"
      flag="VIEW"
    ></CentralizedModification>
    <HelpModal ref="helpModalRef" />
  </div>
</template>

<style scoped lang="less">
@import './index.less';

:deep(.drill-through-column) {
  cursor: pointer;
  color: var(--color-primary);
  text-decoration: underline;

  &-hover {
    color: #067973;
  }
}
</style>

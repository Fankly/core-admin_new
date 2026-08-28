<!-- 物料库 -->
<template>
  <div v-if="isShowPage" class="material-library">
    <div class="list-card">
      <!-- 操作按钮 -->
      <div class="material-toolbar">
        <div class="material-toolbar__commands">
          <el-button class="rule-action rule-action--primary" size="mini" type="primary" plain :loading="exporting" @click="handleExport">
            <span>导 出</span>
          </el-button>
        </div>
        <div class="material-toolbar__tools">
          <ToolbarButtons
            v-model:search-visible="searchVisible"
            :tool-button="['search', 'setting', 'help']"
            @setting-click="openColSetting"
            @help-click="openHelp"
          />
        </div>
      </div>

      <!-- 公用查询条件：项目编码、项目名称、单位、项目类型、物料编码、物料名称 -->
      <SearchForm
        v-show="searchVisible"
        :columns="searchColumns"
        :search-param="searchParam"
        :search-col="4"
        :search="handleSearch"
        :reset="handleReset"
      />

      <!-- 标签页：每个页签右上角展示该页签统计总数 -->
      <div class="material-tabs">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane v-for="item in tabList" :key="item.code" :name="item.code">
            <template #label>
              <span class="material-tab-label">
                <span class="material-tab-label__name">{{ item.name }}</span>
                <span class="material-tab-label__count">{{ formatTotal(tabTotalMap[item.code]) }}</span>
              </span>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 各页签按需挂载 + v-show：切换页签不销毁重建，保留分页 -->
      <div v-for="item in tabList" :key="item.code" v-show="activeTab === item.code" class="material-tab-pane">
        <RangeVxeTable
          v-if="mountedTabs[item.code]"
          :ref="(el) => setTableRef(item.code, el)"
          class="rule-range-table"
          row-key="id"
          row-click-mode="exclusive"
          :border="true"
          :pagination="true"
          :request-auto="false"
          :init-param="{ sjly: item.code }"
          :request-api="getPageList"
          :data-callback="(data) => callBackHandle(item.code, data)"
          :columns="columnsMap[item.code] || []"
          column-setting
          :loading="loading"
        />
      </div>
    </div>
  </div>
  <HelpModal ref="helpModalRef" />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="handleRoleLoaded" />
</template>

<script setup lang="ts" name="/ai/materialLibrary/index">
import { nextTick, onMounted, provide, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import type { VxeGridProps } from 'vxe-table'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import SearchForm from '@/components/SearchForm/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import type { ColumnProps } from '@/components/ProTable/interface'
import type { RangeVxeTableExpose } from '@/components/RangeVxeTable/interface'
import { getPublicData, getSubProtypeTree } from '@/api/common'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import { apiExportHandle } from '@/utils/export'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import { exportMaterialLibrary, getMaterialLibraryColumns, getMaterialLibraryPage } from '@/api/ai/materialLibrary'
import type { MaterialLibraryColumn, MaterialLibrarySearchParams } from '@/api/ai/materialLibrary'

/** 物料库标签页公共代码（后端配置，返回 {code,name} 列表） */
const MATERIAL_LIBRARY_TAB_CODE = 'AI_MATERIAL_LIBRARY_SJLY_COM'

const store = useStore()
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const helpModalRef = ref<any>()
const isShowPage = ref(false)
const loading = ref(false)
const exporting = ref(false)
const searchVisible = ref(true)

const currentUserRole = ref<UserRole>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

provide('currentUserRole', currentUserRole)

/** 各页签表格实例：键为页签 code */
const tableRefs = reactive<Record<string, RangeVxeTableExpose | null>>({})
/** 各页签表头列：键为页签 code（由后端返回） */
const columnsMap = reactive<Record<string, VxeGridProps['columns']>>({})
/** 各页签统计总数：键为页签 code（取自分页查询 total） */
const tabTotalMap = reactive<Record<string, number>>({})
/** 页签列表 */
const tabList = ref<{ code: string; name: string }[]>([])
/** 当前激活页签 */
const activeTab = ref('')
/** 页签首次挂载标记，已挂载后切换用 v-show 常驻 */
const mountedTabs = reactive<Record<string, boolean>>({})
let pendingRequests = 0

/** 查询条件下拉选项（与价格查询页保持一致） */
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const projectTypeList = ref<any[]>([])
const searchEnumMap = ref(new Map<string, any[]>())
provide('enumMap', searchEnumMap)

const syncSearchOptions = () => {
  searchEnumMap.value = new Map([
    ['yjdw', yjdwList.value],
    ['ejdwList', ejdwList.value],
    ['proTypeList', projectTypeList.value]
  ])
}

/** 一级单位切换时清空并重新加载二级单位 */
const handleYjdwChange = async (value: string) => {
  searchParam.ejdwList = []
  ejdwList.value = []
  syncSearchOptions()
  if (!value) return

  try {
    const res = await getEjdwList({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      YJDW: value,
      parentCode: value
    })
    if (res.success) {
      ejdwList.value = Array.isArray(res.data) ? res.data : []
      syncSearchOptions()
    } else {
      ElMessage.error(res.msg || '二级单位获取失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '二级单位获取失败')
  }
}

/** 查询条件：项目编码、项目名称、单位、项目类型、物料编码、物料名称 */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'xmbm',
    label: '项目编码',
    search: {
      order: 1,
      render: ReMultipleText as any,
      props: { class: 'material-code-input', dialogTitle: '项目编码', tooltipText: '项目编码', placeholder: '请输入项目编码，多个编码用逗号分隔' }
    }
  },
  { prop: 'xmmc', label: '项目名称', search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入项目名称' } } },
  {
    prop: 'yjdw',
    label: '一级单位',
    search: { el: 'select', order: 3, props: { clearable: true, filterable: true, onChange: handleYjdwChange } },
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'ejdwList',
    label: '二级单位',
    search: { el: 'select', order: 4, props: { clearable: true, filterable: true, multiple: true, collapseTags: true } },
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'proTypeList',
    label: '项目类型',
    search: {
      el: 'tree-select',
      order: 5,
      render: ElTreeSelect as any,
      props: {
        showCheckbox: true,
        expandOnClickNode: true,
        checkOnClickNode: false,
        collapseTags: true,
        clearable: true
      }
    },
    fieldNames: { label: 'name', value: 'middleId', children: 'children' }
  },
  {
    prop: 'wlbm',
    label: '物料编码',
    search: {
      order: 6,
      render: ReMultipleText as any,
      props: { class: 'material-code-input', dialogTitle: '物料编码', tooltipText: '物料编码', placeholder: '请输入物料编码，多个编码用逗号分隔' }
    }
  },
  { prop: 'wlmc', label: '物料名称', search: { el: 'input', order: 7, props: { clearable: true, placeholder: '请输入物料名称' } } }
])
/** 公用查询参数（各页签共享） */
const searchParam = reactive<Record<string, any>>({ xmbm: '', xmmc: '', yjdw: '', ejdwList: [], proTypeList: [], wlbm: '', wlmc: '' })

const formatTotal = (value: number | undefined) => (value == null ? 0 : value)

const setTableRef = (code: string, el: any) => {
  tableRefs[code] = el
}

const getActiveTable = () => tableRefs[activeTab.value]

/** 打开当前页签表格的列设置 */
const openColSetting = () => {
  getActiveTable()?.openColSetting()
}

/** 打开帮助弹窗 */
const openHelp = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

/** 将后端列定义转换为 vxe-grid 列配置 */
const toGridColumns = (cols: MaterialLibraryColumn[]): VxeGridProps['columns'] => {
  if (!Array.isArray(cols) || cols.length === 0) return []
  const fixedColumnState = { visibleLeafIndex: 0 }

  const convertColumn = (col: MaterialLibraryColumn): any => {
    const children = Array.isArray(col.children) ? col.children.map(convertColumn) : []
    const hasWidth = col.width !== undefined && col.width !== null && col.width !== ''
    const column: any = {
      field: col.field || undefined,
      title: col.title,
      width: hasWidth ? col.width : undefined,
      minWidth: !hasWidth && children.length === 0 ? 140 : undefined,
      visible: col.visible !== false,
      align: 'center',
      headerAlign: 'center'
    }

    if (children.length === 0 && col.visible !== false) {
      fixedColumnState.visibleLeafIndex += 1
      if (fixedColumnState.visibleLeafIndex <= 1) column.fixed = 'left'
    }
    if (children.length > 0) column.children = children
    if (col.edit && children.length === 0) {
      column.editRender = {
        name: 'input',
        autofocus: '.my-input',
        autoselect: true
      }
    }
    return column
  }

  const list: VxeGridProps['columns'] = [{ type: 'seq', title: '序号', width: 60, fixed: 'left' }]
  list.push(...cols.map(convertColumn))
  return list
}

/** 加载某页签表头（按 code 缓存，避免重复请求） */
const loadColumns = async (code: string) => {
  if (columnsMap[code]) return
  try {
    const res = await getMaterialLibraryColumns({ sjly: code })
    if (!res.success) throw new Error(res.msg || '表头加载失败')
    columnsMap[code] = toGridColumns(res.data || [])
  } catch (e) {
    columnsMap[code] = [{ type: 'seq', title: '序号', width: 60 }]
    ElMessage.error((e as Error)?.message || '表头加载失败，请稍后重试')
  }
}

const splitCodes = (value: unknown): string[] => {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** 加载一级单位、二级单位和项目类型选项 */
const loadSearchOptions = async () => {
  yjdwList.value = []
  ejdwList.value = []
  projectTypeList.value.splice(0, projectTypeList.value.length)
  syncSearchOptions()

  const [yjdwRes, projectTypeRes] = await Promise.all([
    getYjdwList({ bmId: currentUserRole.value.bmId, dwId: currentUserRole.value.dwId }),
    getSubProtypeTree()
  ])
  if (yjdwRes.success) {
    yjdwList.value = Array.isArray(yjdwRes.data) ? yjdwRes.data : []
  } else {
    ElMessage.error(yjdwRes.msg || '一级单位获取失败')
  }
  if (projectTypeRes.success && Array.isArray(projectTypeRes.data)) {
    projectTypeList.value.push(...projectTypeRes.data)
  } else if (!projectTypeRes.success) {
    ElMessage.error(projectTypeRes.msg || '项目类型获取失败')
  }
  syncSearchOptions()
}

/** 组装查询参数（角色上下文 + 页签标识 + 查询条件 + 分页） */
const buildQueryParams = (params: Record<string, any> = {}): MaterialLibrarySearchParams => {
  const tabCode = params.sjly || activeTab.value
  const table = tableRefs[tabCode] || getActiveTable()
  return {
    bmId: currentUserRole.value.bmId || '',
    dwId: currentUserRole.value.dwId || '',
    roleCode: currentUserRole.value.roleCode || '',
    userId: String(store.getters.getUserMsg?.id || ''),
    sjly: tabCode,
    xmbmList: splitCodes(searchParam.xmbm),
    xmmc: searchParam.xmmc || '',
    yjdw: searchParam.yjdw || '',
    ejdwList: Array.isArray(searchParam.ejdwList) ? searchParam.ejdwList : [],
    proTypeList: Array.isArray(searchParam.proTypeList) ? searchParam.proTypeList : [],
    wlbmList: splitCodes(searchParam.wlbm),
    wlmc: searchParam.wlmc || '',
    page: params.page ?? table?.pageable?.current ?? 1,
    size: params.size ?? params.limit ?? table?.pageable?.size ?? 100
  }
}

/** 数据回调：透传数据并回写当前页签统计总数（total 取自分页查询结果） */
const callBackHandle = (code: string, data: any) => {
  tabTotalMap[code] = Number(data?.total || 0)
  return data
}

/** 列表请求：返回分页数据 */
const getPageList = async (params: any) => {
  pendingRequests += 1
  loading.value = true
  try {
    return await getMaterialLibraryPage(buildQueryParams(params))
  } finally {
    pendingRequests -= 1
    loading.value = pendingRequests > 0
  }
}

/** 查询：回到第一页并刷新所有页签 */
const handleSearch = async () => {
  // 查询条件由所有页签共享，确保未激活页签也同步更新数据和统计总数。
  tabList.value.forEach((item) => {
    mountedTabs[item.code] = true
  })
  await nextTick()
  await Promise.all(
    tabList.value.map(async (item) => {
      const table = tableRefs[item.code]
      if (!table) return
      if (table.pageable) table.pageable.current = 1
      table.clearSelection()
      await table.getTableList()
    })
  )
}

/** 重置：清空公用查询条件后查询 */
const handleReset = () => {
  searchParam.xmbm = ''
  searchParam.xmmc = ''
  searchParam.yjdw = ''
  searchParam.ejdwList = []
  searchParam.proTypeList = []
  searchParam.wlbm = ''
  searchParam.wlmc = ''
  ejdwList.value = []
  syncSearchOptions()
  handleSearch()
}

/** 切换页签：初始化已完成各页签查询，切换时只调整布局 */
const handleTabChange = async (code: string) => {
  activeTab.value = code
  if (!mountedTabs[code]) {
    mountedTabs[code] = true
    await loadColumns(code)
    await nextTick()
    return
  }
  getActiveTable()?.doLayout?.()
}

/** 加载标签页公共代码 */
const loadTabList = async () => {
  try {
    const res = await getPublicData(MATERIAL_LIBRARY_TAB_CODE)
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      tabList.value = res.data.map((item: any) => ({ code: String(item.code), name: item.name }))
      return
    }
    throw new Error(res.msg || '公共代码未配置页签数据')
  } catch (e) {
    tabList.value = []
    ElMessage.error(`${(e as Error)?.message || '公共代码加载失败'}（${MATERIAL_LIBRARY_TAB_CODE}），请完成配置后刷新页面重试`)
  }
}

/** 角色权限就绪后初始化：默认页签拉表头 + 列表 */
const handleRoleLoaded = async () => {
  isShowPage.value = Boolean(userRoleSelectorRef.value?.canRender)
  if (!isShowPage.value) return
  try {
    await loadSearchOptions()
  } catch (e: any) {
    ElMessage.error(e?.message || '查询条件加载失败')
  }
  await loadTabList()
  if (tabList.value.length === 0) return
  activeTab.value = tabList.value[0].code
  tabList.value.forEach((item) => {
    mountedTabs[item.code] = true
  })
  await nextTick()
  await Promise.all(tabList.value.map((item) => loadColumns(item.code)))
  await nextTick()
  await Promise.all(tabList.value.map((item) => tableRefs[item.code]?.getTableList()))
}

/** 导出：按当前查询条件（含页签标识）导出 */
const handleExport = async () => {
  exporting.value = true
  try {
    await apiExportHandle(buildQueryParams(), `物料库-${currentTabName()}`, exportMaterialLibrary)
  } catch (e) {
    ElMessage.error((e as Error)?.message || '导出失败，请检查查询条件后重试')
  } finally {
    exporting.value = false
  }
}

const currentTabName = () => tabList.value.find((item) => item.code === activeTab.value)?.name || '物料库'

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>

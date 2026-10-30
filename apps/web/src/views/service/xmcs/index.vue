<!-- 在线测算项目清单 -->
<template>
  <div class="container" v-loading="projectGridOptions.loading" v-if="isShowPage">
    <div class="operation">
      <el-dropdown placement="bottom" style="margin: 0 10px">
        <el-button size="small" plain type="primary">项目管理<i class="el-icon-arrow-down el-icon--right" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-permission="'ADD'" @click="handleBtn('ADD', '新增')">新 增</el-dropdown-item>
            <el-dropdown-item v-permission="'EDIT'" @click="handleBtn('EDIT', '编辑')">编 辑</el-dropdown-item>
            <el-dropdown-item v-permission="'DELETE'" @click="handleRemove">删 除</el-dropdown-item>
            <el-dropdown-item v-permission="'IMPORT'" @click="handleImport('info')">信息导入</el-dropdown-item>
            <el-dropdown-item v-permission="'EXPORT'" @click="handleExport">导 出</el-dropdown-item>
            <el-dropdown-item v-permission="'IMPORT'" @click="handleImport('dy')">动因导入</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown placement="bottom" style="margin: 0 10px">
        <el-button size="small" plain type="primary">在线测算<i class="el-icon-arrow-down el-icon--right" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-permission="'ZXCS'" @click="handleZxcs('1', 'EDIT')"> 定额测算 </el-dropdown-item>
            <el-dropdown-item v-permission="'ZXCS'" @click="handleZxcs('2', 'EDIT')"> 406号文测算 </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown placement="bottom" style="margin: 0 10px">
        <el-button size="small" v-permission="'CSCX'" plain type="primary">测算查询<i class="el-icon-arrow-down el-icon--right" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-permission="'JBXX'" @click="handleBtn('VIEW', '查看')">基本信息</el-dropdown-item>
            <el-dropdown-item v-permission="'DECS'" @click="handleZxcs('1', 'VIEW')"> 定额测算 </el-dropdown-item>
            <el-dropdown-item v-permission="'SLLHWCS'" @click="handleZxcs('2', 'VIEW')"> 406号文测算 </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button size="small" v-permission="'GHDECSMB'" plain type="primary" @click="handleZxcsMb">更换定额测算模板</el-button>
      <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" style="margin-left: auto" />
    </div>
    <div>
      <el-form :model="searchForm" label-suffix=" : " label-width="120px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="项目名称">
              <ReMultipleText
                v-model="searchForm.xmmc"
                dialog-title="项目名称"
                tooltip-text="项目名称"
                placeholder="请输入项目名称,多个项目名称以逗号分隔"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="部门">
              <el-select style="width: 100%" v-model="searchForm.dept" placeholder="请选择部门" clearable @change="handleChangeDept">
                <el-option v-for="(item, index) in deptList" :key="index" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="专业细分">
              <el-select style="width: 100%" v-model="searchForm.zyxf" placeholder="请选择专业细分" clearable>
                <el-option v-for="(item, index) in zyxfList" :key="index" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select style="width: 100%" v-model="searchForm.zxcsStatus" placeholder="请选择状态" clearable>
                <el-option v-for="(item, index) in zxcsStatusList" :key="index" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="编制人">
              <el-input maxlength="32" v-model.trim="searchForm.creatorGl" placeholder="请输入编制人" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="权限">
              <el-select style="width: 100%" v-model="searchForm.sfjkzj" placeholder="请选择权限" clearable>
                <el-option label="仅自己" value="1" />
                <el-option label="全部" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6" />
          <!-- <el-col :span="6" /> -->
          <!-- <el-col :span="6" /> -->
          <el-col :span="6">
            <div style="text-align: right; margin-bottom: 10px">
              <el-button type="primary" plain @click="handleSearch">查 询</el-button>
              <el-button plain @click="handleReset">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <!-- 项目信息 -->
    <div class="panel-section is-top" :style="{ flexBasis: projectPanelHeight + 'px' }">
      <div class="panel-body">
        <vxe-grid ref="gridRef" :empty-text="projectGridOptions.emptyRender" v-bind="projectGridOptions" @cell-click="handleProjectRowClick" />
      </div>
      <div class="main-pagination">
        <el-pagination
          :current-page="pagination.page"
          background
          :page-sizes="[20, 50, 100, 200]"
          :page-size="pagination.limit"
          :total="parseInt(pagination.total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleChangeSizeChange"
          @current-change="handleChangeCurrentChange"
        ></el-pagination>
      </div>
    </div>
    <!-- 上下拖拽分隔条 -->
    <div class="panel-resizer" @mousedown="onResizerMouseDown">
      <span class="panel-resizer__handle"></span>
    </div>
    <!-- 动因信息 -->
    <div class="panel-section is-bottom">
      <div class="panel-body">
        <div v-if="!currentProjectRow" class="dy-empty">请选择上方一条项目数据查看动因信息</div>
        <vxe-grid v-else :empty-text="dyGridOptions.emptyRender" v-bind="dyGridOptions" />
      </div>
    </div>
  </div>
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <!-- 新增编辑 -->
  <xmModal ref="xmModalRef" :user-info="userInfo" @search-handle="closeModal" />
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
  <!-- 帮助 -->
  <HelpModal ref="helpModalRef" />
  <select-modal ref="selectModalRef" @show-modal="showModal" :title="'定额测算模板'" :label="'定额测算模板'" :options="deModeOptions" />
</template>

<script setup lang="tsx">
defineOptions({ name: "/service/xmcs/index" })
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import {
  checkProjectDyAndAttach,
  query,
  deleteHandler,
  getImportTemplateByDy,
  importExcelByDy,
  getImportTemplate,
  importExcel,
  exportExcel,
  updateMblx,
  queryZyxfList
} from '@/api/service/xmcs/index'
import { ElMessage } from 'element-plus'
import userDialog from '@/components/select/userDialog.vue'
import baseService from '@/service/baseService'
import xmModal from '@/views/service/xmcs/components/xmModal.vue' //新增
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { apiExportHandle } from '@/utils/export'
import { useRouter, useRoute } from 'vue-router'
import { encrypt } from '@/utils/crypto'
import { useStore } from '@/store/business'
import { mianPage } from '@/views/service/xmcs/hooks/index'
import { getPublicCodeList, getCommonCodeByParentCode } from '@/api/common'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { usePage } from '@/hooks/useUser'
import selectModal from '@/components/yssxTable/selectModalNew.vue'
import { VXETable } from 'vxe-table'

const store = useStore()
const route = useRoute()
const router = useRouter()
const countInfo = ref<any>({})
const userDialogRef = ref()
const xmModalRef = ref()
const selectModalRef = ref()
const isShowPage = ref(false)
const importRef = ref()
const paramsPage = ref({})
const gridRef = ref()
const queryParams = ref<string>('')
const searchForm = ref<any>({
  xmmc: '',
  zxcsStatus: '',
  sfjkzj: '0',
  dept: '',
  creatorGl: ''
})

const zxcsStatusList = ref<any[]>([])
const zyxfList = ref<any[]>([])
const deptList = ref<any[]>([])
const { objectSpanMethod, cellStyle, userInfo, deModeOptions, projectColumns, dyColumns, gzlData, buildSpanCache, spanMergeCache } = mianPage()

// 当前选中的项目行（用于下方动因信息表展示）
const currentProjectRow = ref<any>(null)

// 上下拖拽分隔：上方项目信息表的高度（px）。下方动因信息表自动占满剩余空间
const projectPanelHeight = ref(360) // 默认约 55vh，可在 onMounted 内根据视口校正
const resizerState = reactive({
  dragging: false,
  startY: 0,
  startHeight: 0
})
const MIN_PROJECT_HEIGHT = 160 // 上方表最小高度
const MAX_PROJECT_RATIO = 0.9 // 上方表最多占可用区 90%，给下方留出可见区
const onResizerMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  resizerState.dragging = true
  resizerState.startY = e.clientY
  resizerState.startHeight = projectPanelHeight.value
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onResizerMouseMove)
  window.addEventListener('mouseup', onResizerMouseUp)
}
const onResizerMouseMove = (e: MouseEvent) => {
  if (!resizerState.dragging) return
  const delta = e.clientY - resizerState.startY
  const containerEl = document.querySelector('.container')
  const containerH = containerEl ? containerEl.clientHeight : window.innerHeight
  const maxH = Math.floor(containerH * MAX_PROJECT_RATIO)
  let next = resizerState.startHeight + delta
  if (next < MIN_PROJECT_HEIGHT) next = MIN_PROJECT_HEIGHT
  if (next > maxH) next = maxH
  projectPanelHeight.value = next
}
const onResizerMouseUp = () => {
  if (!resizerState.dragging) return
  resizerState.dragging = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onResizerMouseMove)
  window.removeEventListener('mouseup', onResizerMouseUp)
}

// 项目信息表配置（项目级，不合并单元格）
const projectGridOptions = reactive<any>({
  stripe: true,
  border: true,
  loading: false,
  headerAlign: 'center',
  emptyRender: '请查询',
  align: 'center',
  height: '100%',
  showOverflow: true,
  checkboxConfig: { trigger: 'row', highlight: true, range: true },
  rowConfig: { isHover: true, height: 32 },
  columnConfig: { resizable: true },
  size: 'mini',
  data: [],
  columns: projectColumns
})

// 动因信息表配置（不分页、纯展示）
const dyGridOptions = reactive<any>({
  stripe: true,
  border: true,
  loading: false,
  headerAlign: 'center',
  emptyRender: '暂无动因信息',
  align: 'center',
  height: '100%',
  showOverflow: true,
  rowConfig: { height: 32 },
  columnConfig: { resizable: true },
  size: 'mini',
  data: [],
  columns: dyColumns,
  cellStyle: cellStyle,
  spanMethod: objectSpanMethod
})

const helpModalRef = ref()
const getHelpMessageHandle = () => {
  if (helpModalRef.value) {
    helpModalRef.value.showModal = true
  }
}
const getCodeList = async () => {
  const code: any = await getPublicCodeList({
    codes: ['ZXCS_STATUS', 'ZXCSBM_COM']
  })
  zxcsStatusList.value = code.data['ZXCS_STATUS']
  deptList.value = code.data['ZXCSBM_COM']
}

const handleChangeDept = async (val: any) => {
  zyxfList.value.length = 0
  const code: any = await queryZyxfList({ deptCode: val })
  if (code.success) {
    zyxfList.value = code.data
  } else {
    ElMessage.error(code.msg)
  }
}

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0 as number | string
})
//查询
const handleSearch = () => {
  if (searchForm.value.creatorGl != '') {
    searchForm.value.sfjkzj = '0'
  }
  getPageList()
}
//重置
const handleReset = () => {
  for (const key in searchForm.value) {
    searchForm.value[key] = null
  }
  searchForm.value.sfjkzj = '0'
  zyxfList.value.length = 0
  // 重置时清空下方动因信息表
  currentProjectRow.value = null
  dyGridOptions.data.length = 0
  spanMergeCache.value = []
  // pagination.page = 1
  // pagination.limit = 100
  // getPageList()
}
const closeModal = () => {
  pagination.page = 1
  pagination.limit = 20
  getPageList()
}

const handleChangeSizeChange = async (val: number) => {
  if (val <= 0) return
  pagination.limit = val
  pagination.page = 1
  getPageList()
}

const handleChangeCurrentChange = async (val: number) => {
  if (val <= 0) return
  pagination.page = val
  getPageList()
}

const getPageList = async () => {
  projectGridOptions.emptyRender = '查询中'
  paramsPage.value = {
    ...searchForm.value,
    creator: countInfo.value.name,
    creatorAccount: countInfo.value.namecode
  }
  const params = {
    ...paramsPage.value,
    page: pagination.page,
    limit: pagination.limit
  }
  projectGridOptions.loading = true
  // 切换查询条件时清空下方动因信息表
  currentProjectRow.value = null
  dyGridOptions.data.length = 0
  spanMergeCache.value = []
  try {
    projectGridOptions.data.length = 0
    const res: any = await query({ ...params })
    projectGridOptions.data.length = 0
    projectGridOptions.emptyRender = '查无数据'
    if (!res.success) return ElMessage.error(res.msg)
    if (res.success) {
      if (res.data.records.length > 0) {
        projectGridOptions.data = [...res.data.records]
      } else {
        projectGridOptions.data.length = 0
        projectGridOptions.emptyRender = '查无数据'
      }
      pagination.total = res.data.total
    }
  } finally {
    projectGridOptions.loading = false
  }
}

// 获取选中项目（项目表为项目级数据，一行一项目；保留按 id 去重以防重复勾选）
const getSelectedProjects = () => {
  const $table = gridRef.value
  const records = $table.getCheckboxRecords() || []
  const map = new Map()
  records.forEach((row: any) => {
    if (!map.has(row.id)) map.set(row.id, row)
  })
  return Array.from(map.values())
}

// 点击项目行：勾选当前行并高亮，同时下方动因信息表加载其动因明细
const handleProjectRowClick = async ({ row, column }: any) => {
  if (column?.type === 'checkbox') return
  // 勾选当前行触发高亮（保留其它已勾选行，不破坏工具栏多选）
  await gridRef.value?.clearCheckboxRow()
  await gridRef.value?.setCheckboxRow(row, true)
  currentProjectRow.value = row
  dyGridOptions.data = gzlData(row?.dyList || [])
  // 构建 dy 合并缓存，驱动 objectSpanMethod 合并同动因的多行工作量
  buildSpanCache(dyGridOptions.data)
}

//新增、编辑
const handleBtn = (type: any, text: any) => {
  const selectedList = getSelectedProjects()
  if (type != 'ADD') {
    if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
    if (selectedList[0].editFlag != '1' && type == 'EDIT') return ElMessage.warning('非当前账号创建，不能【编辑】！')
  }

  const countParams = { creator: countInfo.value.name, creatorAccount: countInfo.value.namecode }
  const params = {
    searchParams: type != 'ADD' ? { ...selectedList[0], ...countParams } : { ...countParams },
    type: text
  }
  xmModalRef.value.acceptParams(params)
}

// 删除
const handleRemove = async () => {
  const selectedList = getSelectedProjects()
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  if (selectedList[0].editFlag != '1') return ElMessage.warning('非当前账号创建，不能【删除】！')
  const status = selectedList.every((item: any) => item.zxcsstatus == '0' || !item.zxcsstatus)
  if (!status) return ElMessage.warning('状态为【待定额测算】的数据才可删除！')
  const type = await VXETable.modal.confirm(`删除后不能恢复，确定删除？`, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  let res = await deleteHandler(selectedList)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('删除成功！')
  handleReset()
}

// 导入
const handleImport = (type: any) => {
  let newParmas = { creator: countInfo.value.name, creatorAccount: countInfo.value.namecode }
  importRef.value.fromData = { ...newParmas }
  let tempApi: any = type == 'info' ? getImportTemplate : getImportTemplateByDy
  let importApi: any = type == 'info' ? importExcel : importExcelByDy
  if (!tempApi && !importApi) return
  let params = {
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: '在线测算项目清单',
    specialorgid: userInfo.value.deptId,
    getTableList: handleReset
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

// 导出
const handleExport = () => {
  const params = { ...paramsPage.value, creator: countInfo.value.name, creatorAccount: countInfo.value.namecode }
  const fileName = '在线测算项目清单'
  apiExportHandle(params, fileName, exportExcel)
}

// 在线测算
const handleZxcs = async (type: any, handler: any) => {
  const selectedList = getSelectedProjects()
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  if (type == '2' && selectedList[0].zxcsstatus == '0') return ElMessage.warning('406号文未测算！')
  if (selectedList[0].editFlag != '1' && handler == 'EDIT') return ElMessage.warning('非当前账号创建，不能测算！')
  if (selectedList[0].zxcsstatus == '0') {
    const isDone = await checkProjectDyAndAttach({ xmId: selectedList[0].id })
    if (isDone.success) {
      const apiReturn: any = isDone.data
      if (!apiReturn.hasDy || !apiReturn.allAttachUploaded) {
        const dyMsg = !apiReturn.hasDy ? '请维护动因' : ''
        const fileMsg = !apiReturn.allAttachUploaded ? `缺少附件：${apiReturn.missingAttachTypes}` : ''
        ElMessage.warning(`${dyMsg} ${fileMsg}`)
        return
      }
    }
  }
  queryParams.value = encrypt(
    JSON.stringify({
      xmid: selectedList[0].id,
      creatorAccount: countInfo.value.namecode,
      deptId: userInfo.value.deptId,
      dwId: userInfo.value.dwId,
      spRoleId: userInfo.value.spRoleId,
      isAdministrator: false,
      handler: handler == 'VIEW'
    })
  )
  if (type == '1') {
    const urltype = selectedList[0].mblx
    const modalType: any = deModeOptions.value.find((item: any) => item.code == urltype)
    router.push({
      name: modalType.url,
      query: {
        xmcsParams: queryParams.value
      }
    })
    return
  }
  router.push({
    name: '/service/xmcs/xscs',
    query: {
      xmcsParams: queryParams.value
    }
  })
}

//定额测算模板更换
const handleZxcsMb = () => {
  const selectedList = getSelectedProjects()
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  if (selectedList[0].editFlag != '1') return ElMessage.warning('非当前账号创建，不能【更换定额测算模板】！')
  selectModalRef.value.open()
  return
}

const showModal = async (val: any) => {
  const selectedList = getSelectedProjects()
  const params = {
    id: selectedList[0].id,
    mblx: val
  }
  const res: any = await updateMblx(params)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success(`定额测算模板更换成功!`)
  await getPageList()
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value.userMsg
  if (isQuery) {
    const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.specialorgid}`)
    if (flagData.success && flagData.data) {
      userInfo.value = {
        deptId: userInfOther.specialorgid,
        deptName: userInfOther.specialorgname,
        dwId: userInfOther.org_id,
        dwName: userInfOther.org_name,
        roleId: userInfOther.role_id,
        roleCode: userInfOther.code,
        roleName: userInfOther.rolename,
        spRoleId: userInfOther.id,
        specialorgcode: userInfOther.specialorgcode,
        fqzzFlag: flagData.data
      }
      isShowPage.value = true
      await getCodeList()
    }
  }
}

const loadByRouteParams = async () => {
  const { roleId, specialorgid, spRoleId, xmmc }: any = route.params
  const isRoel = await usePage(roleId, specialorgid, spRoleId)
  if (isRoel) {
    searchForm.value.xmmc = xmmc
    isShowPage.value = true
    await getCodeList()
    await getPageList()
  } else {
    userDialogRef.value.getUser()
  }
}

watch(
  () => route.params,
  async (newParams, oldParams) => {
    if (!isShowPage.value) return
    if (newParams?.xmmc === oldParams?.xmmc) return
    searchForm.value.xmmc = newParams?.xmmc ?? ''
    pagination.page = 1
    await getPageList()
  },
  { deep: true }
)

onMounted(async () => {
  countInfo.value = { ...store.getters.getUserMsg }
  // 默认上方项目信息表占可用区约 60%，下方动因信息表占剩余
  nextTick(() => {
    const containerEl = document.querySelector('.container')
    const containerH = containerEl ? containerEl.clientHeight : window.innerHeight
    projectPanelHeight.value = Math.max(MIN_PROJECT_HEIGHT, Math.floor(containerH * 0.6))
  })
  await loadByRouteParams()
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-y: auto;
  .operation {
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .panel-section {
    display: flex;
    flex-direction: column;
    min-height: 0;
    &.is-top {
      flex: 0 0 auto; /* 高度由 projectPanelHeight 控制 */
    }
    &.is-bottom {
      flex: 1 1 0; /* 占满剩余空间 */
      min-height: 120px;
    }
  }
  .panel-body {
    min-height: 0;
    flex: 1 1 0;
    .dy-empty {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #909399;
      font-size: 13px;
      border: 1px solid #ebeef5;
      border-top: none;
      background: #fff;
    }
  }
  .main-pagination {
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-end;
  }
  .panel-resizer {
    flex: 0 0 6px;
    position: relative;
    margin: 2px 0;
    cursor: row-resize;
    user-select: none;
    &:hover,
    &:active {
      background: rgba(0, 112, 107, 0.08);
    }
    &__handle {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: #c0c4cc;
      transition: background-color 0.2s;
    }
    &:hover &__handle,
    &:active &__handle {
      background: #00706b;
    }
  }
}
</style>

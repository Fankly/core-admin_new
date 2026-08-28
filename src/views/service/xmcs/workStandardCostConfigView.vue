<!-- 作业标准成本体系配置-查看/导出 -->
<template>
  <div class="main" v-if="userMsg.isShowPage" v-loading="loading">
    <div class="operation">
      <div class="left">
        <el-button size="mini" type="primary" plain :disabled="!isDirSelected" @click="handleExport">导 出</el-button>
      </div>
    </div>
    <div class="body">
      <splitpane :splitSet="pageConfig">
        <template #paneL>
          <div class="panel-left">
            <div class="panel-left-header">
              <span class="panel-title">
                <i class="el-icon-folder-opened"></i>
                <span>作业标准分类目录</span>
              </span>
            </div>
            <div class="panel-left-content">
              <el-tree
                ref="treeRef"
                :data="treeData"
                node-key="id"
                :props="treeProps"
                :expand-on-click-node="false"
                :highlight-current="true"
                @node-click="handleNodeClick"
              >
                <template #default="{ node, data }">
                  <span class="custom-tree-node">
                    <i class="tree-node-icon" :class="node.isLeaf ? ['el-icon-document', 'is-leaf'] : ['el-icon-folder', 'is-parent']"></i>
                    <span class="tree-node-label" :title="data.dirName">{{ data.dirName }}</span>
                  </span>
                </template>
              </el-tree>
            </div>
          </div>
        </template>
        <template #paneR>
          <div class="panel-right">
            <div class="panel-right-search">
              <span class="panel-right-search-label">作业名称：</span>
              <el-input
                v-model.trim="detailQuery.zymc"
                placeholder="请输入作业名称"
                clearable
                :maxlength="128"
                class="panel-right-search-item"
                @keyup.enter="handleDetailSearch"
                @clear="handleDetailSearch"
              />
              <el-button type="primary" @click="handleDetailSearch">查 询</el-button>
              <el-button @click="resetDetailSearch">重 置</el-button>
            </div>
            <div class="panel-right-table">
              <vxe-grid ref="gridRef" v-bind="gridOptions" />
            </div>
            <div class="main-pagination">
              <el-pagination
                :current-page="page.currentPage"
                background
                :page-sizes="[20, 50, 100, 200]"
                :page-size="page.pageSize"
                :total="parseInt(page.total + '')"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              ></el-pagination>
            </div>
          </div>
        </template>
      </splitpane>
    </div>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/service/xmcs/workStandardCostConfigView">
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watchEffect } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
import { getParamValueMulti } from '@/api/common'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionContext, PermissionInjectionKey, UserRole } from '@/components/UserRoleSelector/interface'
import { apiExportHandle } from '@/utils/export'
import { queryDir, query, exportExcel } from '@/api/service/xmcs/workStandardCostConfig'

/** 导出文件名默认值；可通过系统参数 ZYBZCB_EXPORT_FILENAME 覆盖 */
const DEFAULT_EXPORT_FILE_NAME = '作业标准成本明细'
const EXPORT_FILE_NAME_PARAM = 'ZYBZCB_EXPORT_FILENAME'

const loading = ref(false)
const exportFileName = ref(DEFAULT_EXPORT_FILE_NAME)
const treeRef = ref<InstanceType<typeof ElTree>>()
const gridRef = ref()
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const treeData = ref<any[]>([])
const currentNode = ref<any>(null)
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

const treeProps = { children: 'children', label: 'dirName' }

const userMsg = reactive({
  isShowPage: false
})

const pageConfig = reactive<ContextProps>({
  minPercent: 16,
  maxPercent: 32,
  defaultPercent: 20,
  split: 'vertical'
})

const page = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const detailQuery = reactive({
  zymc: ''
})

const isDirSelected = computed(() => !!currentNode.value)

// 组件卸载标志，阻止卸载后的异步回调更新状态
let cancelled = false
// 明细查询请求序号，丢弃过期响应，避免快速切换目录时表格错配
let detailRequestId = 0

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  height: '100%',
  size: 'mini',
  rowConfig: { height: 32 },
  columnConfig: { resizable: true },
  data: [],
  columns: [
    { field: 'zybm', title: '作业编码', width: 140, fixed: 'left' },
    { field: 'zymc', title: '作业名称', minWidth: 160, fixed: 'left' },
    { field: 'zynrms', title: '作业内容描述', minWidth: 200 },
    { field: 'dydj', title: '电压等级', width: 100 },
    { field: 'rl', title: '容量(KVA)', width: 100 },
    { field: 'sbdw', title: '设备单位', width: 100 },
    { field: 'rcjbm', title: '人材机编码', width: 140 },
    { field: 'rcjmc', title: '人材机名称', minWidth: 160 },
    { field: 'dw', title: '单位', width: 80 },
    { field: 'dj', title: '单价(元)', width: 100, align: 'right' },
    { field: 'sl', title: '数量', width: 100, align: 'right' },
    { field: 'je', title: '金额(元)', width: 120, align: 'right' },
    { field: 'sortNo', title: '排序', width: 80 },
    { field: 'remark', title: '备注', minWidth: 160 }
  ]
})

const getRoleParams = () => ({
  dwId: currentUserRole.value.dwId,
  bmId: currentUserRole.value.bmId,
  roleId: currentUserRole.value.roleId
})

const getDetailParams = () => ({
  dirId: currentNode.value.id,
  ...getRoleParams(),
  zymc: detailQuery.zymc.trim()
})

const getTreeData = async () => {
  loading.value = true
  try {
    const res: any = await queryDir()
    if (cancelled) return
    if (!res.success) {
      treeData.value = []
      currentNode.value = null
      gridOptions.data = []
      page.total = 0
      return ElMessage.error(res.msg)
    }
    treeData.value = Array.isArray(res.data) ? res.data : res.data?.records || []
  } finally {
    if (!cancelled) loading.value = false
  }
}

const handleNodeClick = (data: any) => {
  currentNode.value = data
  // 切换目录时清空查询条件，避免条件误带到其他目录
  detailQuery.zymc = ''
  page.currentPage = 1
  loadDetail()
}

const handleDetailSearch = () => {
  if (!currentNode.value) return ElMessage.warning('请选择目录！')
  page.currentPage = 1
  loadDetail()
}

const resetDetailSearch = () => {
  if (!currentNode.value) return ElMessage.warning('请选择目录！')
  detailQuery.zymc = ''
  page.currentPage = 1
  loadDetail()
}

const loadDetail = async () => {
  if (!currentNode.value) {
    gridOptions.data = []
    page.total = 0
    return
  }
  const requestId = ++detailRequestId
  const dirId = currentNode.value.id
  gridOptions.loading = true
  try {
    const res: any = await query({
      ...getDetailParams(),
      page: page.currentPage,
      limit: page.pageSize
    })
    if (cancelled || requestId !== detailRequestId || currentNode.value?.id !== dirId) return
    if (!res.success) return ElMessage.error(res.msg)
    const records = Array.isArray(res.data) ? res.data : res.data?.records || []
    gridOptions.data = records
    page.total = Array.isArray(res.data) ? res.data.length : Number(res.data?.total || 0)
  } finally {
    if (!cancelled && requestId === detailRequestId) gridOptions.loading = false
  }
}

const handleSizeChange = (val: number) => {
  page.pageSize = val
  page.currentPage = 1
  loadDetail()
}

const handleCurrentChange = (val: number) => {
  page.currentPage = val
  loadDetail()
}

// 从系统参数读取导出文件名，未配置或失败时使用默认值
const loadExportFileName = async () => {
  try {
    const res = await getParamValueMulti([EXPORT_FILE_NAME_PARAM])
    const name = res.success ? String(res.data?.[EXPORT_FILE_NAME_PARAM] || '').trim() : ''
    exportFileName.value = name || DEFAULT_EXPORT_FILE_NAME
  } catch {
    exportFileName.value = DEFAULT_EXPORT_FILE_NAME
  }
}

// 明细导出
const handleExport = async () => {
  if (!currentNode.value) return ElMessage.warning('请选择目录！')
  if (loading.value) return
  loading.value = true
  try {
    // useResponseFileName: false，确保系统参数配置的文件名生效，不被响应头覆盖
    await apiExportHandle(getDetailParams(), exportFileName.value, exportExcel, { useResponseFileName: false })
  } finally {
    loading.value = false
  }
}

const getRoleHandle = async () => {
  const canRender = userRoleSelectorRef.value?.canRender
  if (canRender) {
    userMsg.isShowPage = true
    await Promise.all([getTreeData(), loadExportFileName()])
  }
}

provide('currentUserRole', currentUserRole)
const permissionContext = reactive<PermissionContext>({
  permissions: [],
  isLoading: false
})
watchEffect(() => {
  permissionContext.permissions = userRoleSelectorRef.value?.permissions || []
  permissionContext.isLoading = userRoleSelectorRef.value?.loading || false
})
provide(PermissionInjectionKey, permissionContext)

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})

onBeforeUnmount(() => {
  cancelled = true
})
</script>

<style scoped lang="less">
@primary-color: var(--color-primary, var(--el-color-primary, #00706b));
@primary-soft: var(--color-primary-light, var(--el-color-primary-light-9, #edf8f7));

.main {
  width: 100%;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;

  .operation {
    padding-bottom: 10px;
    display: flex;
    align-items: center;

    .left {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    :deep(.el-button) {
      margin-left: 0;
    }
  }

  .body {
    flex: 1;
    min-height: 0;
  }

  .panel-left,
  .panel-right {
    height: 100%;
    min-height: 0;
    padding: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    background: var(--el-bg-color, #ffffff);
    border: 1px solid rgba(0, 112, 107, 0.13);
    border-radius: 8px;
  }

  .panel-left {
    &-header {
      margin-bottom: 12px;
      padding-bottom: 12px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
    }

    .panel-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #00706b;
      font-size: 15px;
      font-weight: 600;

      i {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: @primary-color;
        background: @primary-soft;
        border-radius: 8px;
      }
    }

    &-content {
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
  }

  .panel-right-search {
    flex: 0 0 auto;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    &-label {
      flex: 0 0 auto;
      white-space: nowrap;
      color: #606266;
    }

    &-item {
      width: 200px;
    }
  }

  .panel-right-table {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .main-pagination {
    padding-top: 10px;
    text-align: right;
  }
}

.custom-tree-node {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  font-size: 13px;

  .tree-node-icon {
    flex-shrink: 0;
    color: #00706b;
    font-size: 14px;
  }

  .tree-node-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

:deep(.el-tree) {
  background: transparent;

  .el-tree-node.is-current > .el-tree-node__content {
    background: @primary-color !important;

    .tree-node-icon,
    .tree-node-label {
      color: #ffffff !important;
      font-weight: 600;
    }
  }
}
</style>

<!-- 作业标准成本体系配置 -->
<template>
  <div class="main" v-if="userMsg.isShowPage" v-loading="loading">
    <div class="operation">
      <div class="left">
        <el-button v-if="hasPermission('ADD_DIR')" size="mini" type="primary" plain @click="handleDirBtn('ADD')">新增目录</el-button>
        <el-button v-if="hasPermission('EDIT_DIR')" size="mini" type="primary" plain :disabled="!currentNode" @click="handleDirBtn('EDIT')">
          编辑目录
        </el-button>
        <el-button v-if="hasPermission('DELETE_DIR')" size="mini" type="danger" plain :disabled="!currentNode" @click="handleDirRemove">
          删除目录
        </el-button>
        <el-divider direction="vertical" />
        <el-button v-if="hasPermission('ADD')" size="mini" type="primary" plain :disabled="!isLeafDirSelected" @click="handleDetailBtn('新增')">
          新 增
        </el-button>
        <el-button v-if="hasPermission('EDIT')" size="mini" type="primary" plain :disabled="!hasOneSelected" @click="handleDetailBtn('编辑')">
          编 辑
        </el-button>
        <el-button v-if="hasPermission('VIEW')" size="mini" type="primary" plain :disabled="!hasOneSelected" @click="handleDetailBtn('查看')">
          查 看
        </el-button>
        <el-button v-if="hasPermission('DELETE')" size="mini" type="danger" plain :disabled="!hasSelected" @click="handleDetailRemove">
          删 除
        </el-button>
        <el-button v-if="hasPermission('IMPORT')" size="mini" type="primary" plain :disabled="!isDirSelected" @click="handleImport">导 入</el-button>
        <el-button v-if="hasPermission('EXPORT')" size="mini" type="primary" plain :disabled="!isDirSelected" @click="handleExport">导 出</el-button>
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
            <div class="panel-left-search">
              <el-input @input="changeFilterHandle" v-model="filterText" placeholder="请输入目录名称" prefix-icon="el-icon-search" clearable />
            </div>
            <div class="panel-left-content">
              <el-tree
                ref="treeRef"
                :data="treeData"
                node-key="id"
                :props="treeProps"
                :expand-on-click-node="false"
                :highlight-current="true"
                :filter-node-method="filterNodeHandle"
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
              <span class="panel-right-search-label">作业编码：</span>
              <ReMultipleText
                v-model="detailQuery.zybm"
                placeholder="请输入作业编码,多个用逗号分隔"
                dialog-title="批量输入作业编码"
                class="panel-right-search-item"
                @change="handleDetailSearch"
              />
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
              <vxe-grid ref="gridRef" v-bind="gridOptions" @checkbox-change="handleCheckboxChange" @checkbox-all="handleCheckboxChange" >
                <template #mlcjbm="{ row }">
                  <el-tooltip effect="dark" placement="bottom" popper-class="project-info-full-tooltip" :enterable="true">
                    <div style="cursor: pointer; color: var(--color-primary)">
                      {{ `${row.zybm || ''}` }}
                    </div>
                    <template #content>
                      <div class="project-info-full-tooltip__content">{{ `${row.dirPath || ''}` }}</div>
                    </template>
                  </el-tooltip>
                </template>
                <template #mlcjmc="{ row }">
                  <el-tooltip effect="dark" placement="bottom" popper-class="project-info-full-tooltip" :enterable="true">
                    <div style="cursor: pointer; color: var(--color-primary)">
                      {{ `${row.zymc || ''}` }}
                    </div>
                    <template #content>
                      <div class="project-info-full-tooltip__content">{{ `${row.dirPath || ''}` }}</div>
                    </template>
                  </el-tooltip>
                </template>
              </vxe-grid>
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
  <!-- 目录新增/编辑 -->
  <zyDirModal ref="dirModalRef" @save-data-after="getTreeData" />
  <!-- 明细新增/编辑/查看 -->
  <zyDetailModal ref="detailModalRef" @save-data-after="loadDetail" />
  <!-- 明细导入 -->
  <ImportExcel ref="importRef" />
</template>

<script setup lang="ts" name="/service/xmcs/workStandardCostConfig">
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watchEffect } from 'vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionContext, PermissionInjectionKey, UserRole } from '@/components/UserRoleSelector/interface'
import zyDirModal from '@/views/service/xmcs/components/zyDirModal.vue'
import zyDetailModal from '@/views/service/xmcs/components/zyDetailModal.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import { ReMultipleText } from '@/components/ReMultipleText'
import { apiExportHandle } from '@/utils/export'
import { queryDir, deleteDir, query, deleteHandler, getImportTemplate, importExcel, exportExcel } from '@/api/service/xmcs/workStandardCostConfig'

const loading = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()
const gridRef = ref()
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const dirModalRef = ref()
const detailModalRef = ref()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const filterText = ref('')
const treeData = ref<any[]>([])
const currentNode = ref<any>(null)
const checkedRows = ref<any[]>([])
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
  zybm: '',
  zymc: ''
})

// 选中任意目录时可维护明细
const isDirSelected = computed(() => !!currentNode.value)
const isLeafDirSelected = computed(() => {
  if (!currentNode.value) return false
  const children = currentNode.value.children
  return !Array.isArray(children) || children.length === 0
})
const permissions = computed(() => userRoleSelectorRef.value?.permissions || [])
const hasSelected = computed(() => checkedRows.value.length > 0)
const hasOneSelected = computed(() => checkedRows.value.length === 1)

let filterTimer: number | undefined
// 组件卸载标志，阻止卸载后的异步回调更新状态
let cancelled = false

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
  checkboxConfig: { trigger: 'row', highlight: true },
  data: [],
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left' },
    { field: 'zybm', title: '作业编码', width: 140, fixed: 'left', slots: { default: 'mlcjbm' } },
    { field: 'zymc', title: '作业名称', minWidth: 160, fixed: 'left', slots: { default: 'mlcjmc' } },
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

const handleCheckboxChange = ({ records }: any) => {
  checkedRows.value = records
}

const getRoleParams = () => ({
  dwId: currentUserRole.value.dwId,
  bmId: currentUserRole.value.bmId,
  roleId: currentUserRole.value.roleId
})

const hasPermission = (permission: string) => permissions.value.includes(permission)

const getDetailParams = () => ({
  dirId: currentNode.value.id,
  ...getRoleParams(),
  zybm: detailQuery.zybm.trim(),
  zymc: detailQuery.zymc.trim()
})

const getTreeData = async () => {
  loading.value = true
  try {
    const res: any = await queryDir()
    if (cancelled) return
    if (!res.success) {
      // 加载失败时清空旧数据与选中状态，避免展示过期树
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

const changeFilterHandle = (val: string) => {
  if (filterTimer) window.clearTimeout(filterTimer)
  filterTimer = window.setTimeout(() => {
    treeRef.value?.filter(val)
    // 过滤后当前选中节点可能已被隐藏，需同步状态避免“无高亮但右侧仍有数据”
    syncCurrentNodeAfterFilter(val)
    filterTimer = undefined
  }, 200)
}

const filterNodeHandle = (value: string, data: any) => {
  if (!value) return true
  return (data.dirName || '').indexOf(value) !== -1
}

// 过滤后校验当前节点是否仍可见，不可见则清空选中状态
const syncCurrentNodeAfterFilter = (val: string) => {
  if (!currentNode.value) return
  if (!val || filterNodeHandle(val, currentNode.value)) return
  currentNode.value = null
  checkedRows.value = []
  gridRef.value?.clearCheckboxRow?.()
  gridOptions.data = []
  page.total = 0
}

const handleNodeClick = (data: any) => {
  currentNode.value = data
  checkedRows.value = []
  gridRef.value?.clearCheckboxRow?.()
  // detailQuery.zybm = ''
  // detailQuery.zymc = ''
  page.currentPage = 1
  loadDetail()
}

const handleDetailSearch = () => {
  if (!currentNode.value) return ElMessage.warning('请选择目录！')
  page.currentPage = 1
  loadDetail()
}

const resetDetailSearch = () => {
  detailQuery.zybm = ''
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
  checkedRows.value = []
  gridRef.value?.clearCheckboxRow?.()
  gridOptions.loading = true
  try {
    const res: any = await query({
      ...getDetailParams(),
      page: page.currentPage,
      limit: page.pageSize
    })
    if (!res.success) return ElMessage.error(res.msg)
    const records = Array.isArray(res.data) ? res.data : res.data?.records || []
    gridOptions.data = records
    // 后端返回分页结构 { records, total }；兼容纯数组（取当前页条数，但不丢总数）
    page.total = Array.isArray(res.data) ? res.data.length : Number(res.data?.total || 0)
  } finally {
    if (!cancelled) gridOptions.loading = false
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

// 目录新增/编辑
const handleDirBtn = (type: string) => {
  if (type === 'EDIT') {
    if (!currentNode.value) return ElMessage.warning('请选择目录！')
    dirModalRef.value.acceptParams({
      type: '编辑',
      parentId: currentNode.value.parentId ?? '0',
      parentName: currentNode.value.parentName || '',
      nodeLevel: currentNode.value.nodeLevel,
      row: currentNode.value
    })
    return
  }
  // 新增：选中节点作为父级（层级+1），未选中则新增一级目录
  const parent = currentNode.value
  dirModalRef.value.acceptParams({
    type: '新增',
    parentId: parent ? parent.id : '0',
    parentName: parent ? parent.dirName : '',
    nodeLevel: parent ? parent.nodeLevel + 1 : 1
  })
}

const handleDirRemove = () => {
  if (!currentNode.value) return ElMessage.warning('请选择目录！')
  const children = currentNode.value.children || []
  if (children.length > 0) return ElMessage.warning('存在子目录，不能删除！')
  const dirId = currentNode.value.id
  ElMessageBox.confirm('删除后不能恢复，确定删除该目录？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      // 删除前探测目录下是否仍有明细数据，避免级联删除或产生孤儿数据
      const probe: any = await query({ ...getRoleParams(), dirId, page: 1, limit: 1 })
      if (probe.success) {
        const probeTotal = Array.isArray(probe.data) ? probe.data.length : Number(probe.data?.total || 0)
        if (probeTotal > 0) return ElMessage.warning('该目录下存在作业明细，不能删除！')
      }
      const res = await deleteDir([dirId])
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('删除成功！')
      currentNode.value = null
      gridOptions.data = []
      page.total = 0
      getTreeData()
    })
    .catch(() => {})
}

// 明细新增/编辑/查看
const handleDetailBtn = (type: string) => {
  if (type === '新增') {
    if (!currentNode.value) return ElMessage.warning('请选择目录！')
    if (!isLeafDirSelected.value) return ElMessage.warning('请选择末级目录！')
  } else {
    if (checkedRows.value.length !== 1) return ElMessage.warning('请选择一条数据！')
  }
  detailModalRef.value.acceptParams({
    type,
    // 编辑/查看使用行数据原 dirId，避免切换目录竞态导致归属被覆盖
    dirId: type === '新增' ? currentNode.value.id : checkedRows.value[0]?.dirId ?? currentNode.value.id,
    row: type === '新增' ? undefined : checkedRows.value[0]
  })
}

const handleDetailRemove = () => {
  if (checkedRows.value.length === 0) return ElMessage.warning('请选择数据！')
  ElMessageBox.confirm('删除后不能恢复，确定删除？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const ids = checkedRows.value.map((item: any) => item.id)
      const res = await deleteHandler(ids)
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('删除成功！')
      // 删除后回到第一页查询
      page.currentPage = 1
      loadDetail()
    })
    .catch(() => {})
}

// 明细导入
const handleImport = () => {
  if (!currentNode.value) return ElMessage.warning('请选择目录！')
  if (loading.value) return
  loading.value = true
  try {
    const params = getDetailParams()
    importRef.value?.acceptParams({
      title: '作业标准成本明细',
      specialorgid: currentUserRole.value.dwId,
      tempApi: () => getImportTemplate(params),
      importApi: (importParams: any) =>
        importExcel({
          ...params,
          excelFormData: importParams.excelFormData
        }),
      getTableList: loadDetail
    })
  } finally {
    // acceptParams 仅打开弹窗，同步释放锁；导入过程由 ImportExcel 内部 loading 控制
    loading.value = false
  }
}

// 明细导出
const handleExport = async () => {
  if (!currentNode.value) return ElMessage.warning('请选择目录！')
  if (loading.value) return
  loading.value = true
  try {
    await apiExportHandle(getDetailParams(), '作业标准成本明细', exportExcel)
  } finally {
    loading.value = false
  }
}

const getRoleHandle = async () => {
  const canRender = userRoleSelectorRef.value?.canRender
  if (canRender) {
    userMsg.isShowPage = true
    await getTreeData()
  }
}

provide('currentUserRole', currentUserRole)
// 提供响应式权限上下文：通过 watchEffect 同步子组件 ref 的值，
// inject 方访问 permissions/isLoading 即可建立响应式依赖
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
  if (filterTimer) window.clearTimeout(filterTimer)
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

    &-search {
      padding-bottom: 12px;
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

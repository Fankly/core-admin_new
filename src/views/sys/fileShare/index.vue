<!-- 文件目录与文件分享 -->
<template>
  <div class="container" v-if="isShowPage">
    <el-row :gutter="0" class="main-layout" :class="{ 'main-layout--left-collapsed': isLeftCollapsed }">
      <!-- 左侧：文件目录树 -->
      <el-col id="ai-audit-range-tree" :span="6" class="left-column">
        <el-card shadow="never" class="tree-list-card">
          <div class="panel-header">
            <div class="section-title">
              <i class="el-icon-folder-opened section-title__icon" aria-hidden="true"></i>
              文件目录
            </div>
            <div class="panel-header__actions">
              <i
                class="el-icon-plus section-title__icon section-title__icon--action"
                v-permission="'ADDML'"
                aria-hidden="true"
                title="新增目录"
                @click="handlePlusClick"
              />
              <i
                class="el-icon-sort section-title__icon section-title__icon--action"
                aria-hidden="true"
                title="一键展开/收起"
                @click="handleExpandAll"
              />
              <i class="el-icon-refresh section-title__icon section-title__icon--action" aria-hidden="true" title="刷新" @click="handleRefreshTree" />
            </div>
          </div>
          <div class="tree-list">
            <div v-if="treeLoadError" class="tree-error" role="alert">
              <i class="el-icon-warning-outline tree-error__icon" aria-hidden="true"></i>
              <p>{{ treeLoadError }}</p>
              <el-button size="small" type="primary" @click="retryTreeLoad">重新加载</el-button>
            </div>
            <el-tree
              v-else
              ref="treeRef"
              :highlight-current="true"
              :props="defaultProps"
              :expand-on-click-node="false"
              node-key="id"
              :current-node-key="chooseNode || undefined"
              lazy
              :load="loadNode"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <span class="tree-node">
                  <i :class="data.leaf === '1' ? 'el-icon-document' : 'el-icon-folder'" class="tree-node__icon" aria-hidden="true"></i>
                  <span class="tree-node__label" :title="node.label">{{ `${node.label}(${data.attachNum || 0})` }}</span>
                  <span class="tree-node__actions" @click.stop>
                    <i class="el-icon-plus tree-node__action" title="新增目录" v-permission="'ADD'" @click="handleTreeNodePLUS(node, data)"></i>
                    <i class="el-icon-edit tree-node__action" title="编辑目录" v-permission="'EDIT'" @click="handleTreeNodeEdit(node, data)"></i>
                    <i
                      class="el-icon-delete tree-node__action tree-node__action--danger"
                      v-permission="'DELETE'"
                      title="删除目录"
                      @click="handleTreeNodeDelete(node, data)"
                    ></i>
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-card>
      </el-col>
      <!-- 右侧：文件列表 -->
      <el-col :span="18" class="right-column">
        <el-card shadow="never" class="detail-card">
          <div class="detail-header">
            <div class="detail-header__top">
              <div class="detail-header__meta">
                <div class="section-title">
                  <i class="el-icon-document section-title__icon" aria-hidden="true"></i>
                  文件列表
                </div>
                <el-tag v-if="chooseNodeName" size="small" class="current-node-tag" effect="plain">
                  {{ chooseNodeName }}
                </el-tag>
                <span v-else class="current-node-placeholder">请选择左侧文件目录</span>
              </div>
            </div>
          </div>
          <div class="table-panel">
            <RangeVxeTableStyle
              class="range-pro-table"
              :cell-style="columnStyle"
              @cell-click="downloadReport"
              @search="handleTableQuery"
              @reset="handleTableQuery"
              :pagination="true"
              :border="true"
              :tool-button="['setting', 'help']"
              :data-callback="callBackHandle"
              :request-api="getInusePageList"
              :request-auto="false"
              :columns="inuseColumns"
              row-click-mode="exclusive"
              ref="inuseTableRef"
              stripe
              row-key="id"
              :loading="loading || actionLoading"
            >
              <template #tableHeader>
                <div style="display: flex; gap: 10px; width: 400px">
                  <el-input clearable placeholder="输入文件名进行过滤" @clear="handleSearch" v-model.trim="attachName">
                    <template #append>
                      <i class="el-icon-search" @click="handleSearch" style="color: var(--color-primary); cursor: pointer"></i>
                    </template>
                  </el-input>
                  <vxe-button
                    v-permission="'UPLOAD'"
                    size="mini"
                    status="primary"
                    icon="el-icon-upload"
                    @click="uploadHandle"
                    class="upload-btn pulse"
                    style="width: 150px"
                  >
                    文件上传
                  </vxe-button>
                </div>
              </template>
              <template #operation="{ row }">
                <el-tooltip content="预览文件" placement="top">
                  <i class="el-icon-view row-action-icon" @click="handlePreview(row)"></i>
                </el-tooltip>
                <el-tooltip content="编辑备注" placement="top">
                  <i class="el-icon-edit row-action-icon" @click="handleEditRemark(row)" v-permission="'EDITBZ'"></i>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <i class="el-icon-delete row-action-icon row-action-icon--danger" @click="handleDeleteFile(row)" v-permission="'DELETEFILE'"></i>
                </el-tooltip>
              </template>
            </RangeVxeTableStyle>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <remarkModal v-if="modalsReady" ref="remarkModalRef" @success="handleRemarkSave" />
  <directoryModal v-if="modalsReady" ref="directoryModalRef" @success="handleDirectorySave" />
  <previewModal v-if="modalsReady" ref="previewModalRef" />
</template>

<script setup lang="ts" name="/sys/fileShare/index">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, onBeforeUnmount, onActivated, ref, nextTick, defineAsyncComponent, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { useStore } from 'vuex'
import RangeVxeTableStyle from '@/components/RangeVxeTableStyle/index.vue'
import { apiExportHandle } from '@/utils/export'
import {
  getChildDirectory,
  addDirectory,
  deleteDirectory,
  getAttachByDirectory,
  editAttach,
  deleteAttachFromDirectory,
  uploadAttachToDirectory,
  downloadAttach
} from '@/api/sys/fileShare'

// 弹窗按需异步加载，降低首屏解析成本
const remarkModal = defineAsyncComponent(() => import('@/views/sys/fileShare/components/remarkModal/index.vue'))
const directoryModal = defineAsyncComponent(() => import('@/views/sys/fileShare/components/directoryModal/index.vue'))
const previewModal = defineAsyncComponent(() => import('@/views/sys/fileShare/components/previewModal/index.vue'))

const store = useStore()

// ========== 类型定义 ==========
interface TreeNode {
  id: string
  name: string
  directoryName?: string
  leaf?: string
  children?: TreeNode[]
  isLeaf?: boolean
}

interface AttachRow {
  id: string
  attachName?: string
  remark?: string
  uuid?: string
  [key: string]: any
}

// ========== 响应式状态 ==========
const countInfo = ref<any>()
const attachName = ref<string>('')
const chooseNode = ref<string>('')
const chooseNodeName = ref<string>('')
const isLeftCollapsed = ref(false)
const userDialogRef = ref()
const isShowPage = ref(false)
/** 首屏展示后再挂载弹窗，避免阻塞可交互 */
const modalsReady = ref(false)
const inuseTableRef = ref<any>(null)
const remarkModalRef = ref()
const directoryModalRef = ref()
const previewModalRef = ref()
const uploadRef = ref<any>(null)
const treeRef = ref<any>(null)
const loading = ref(false)
const actionLoading = ref(false)
const treeLoadError = ref('')
/** 一键展开/刷新进行中标记，防止重复触发 */
const treeExpanding = ref(false)
/** 列表请求序号，丢弃过期响应，避免快速切节点闪旧数据 */
let tableReqSeq = 0
/** 当前表格延迟布局任务，页面从 keep-alive 恢复时需等容器重新可见 */
let tableLayoutFrame = 0

const defaultProps = markRaw({
  label: 'directoryName',
  isLeaf: (data: TreeNode) => data.leaf === '1'
})

// ========== 表格列配置（vxe-grid） ==========
const operationColumn = markRaw({
  field: 'operation',
  title: '操作',
  width: 130,
  fixed: 'right',
  align: 'center',
  slots: { default: 'operation' }
})
const inuseColumns = markRaw<any[]>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'directoryName', title: '所属目录', width: 180 },
  { field: 'attachName', title: '文件名', minWidth: 300, headerAlign: 'center', align: 'left' },
  { field: 'size', title: '文件大小', width: 100 },
  { field: 'uploadUser', title: '上传人', width: 100 },
  { field: 'updtime', title: '最后修改日期', width: 150 },
  { field: 'remark', title: '备注', minWidth: 300 },
  operationColumn
])

const layoutActiveTable = async () => {
  await nextTick()
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
  tableLayoutFrame = requestAnimationFrame(() => {
    tableLayoutFrame = 0
    inuseTableRef.value?.doLayout?.()
  })
}

// 处理搜索
const handleSearch = () => {
  reloadActiveTable()
}

// ========== 表格相关 ==========
const reloadActiveTable = () => {
  const table = inuseTableRef.value
  table?.clearSelection()
  table?.getTableList()
}

/** 查询/重置后只清理选择，避免重复请求 */
const handleTableQuery = () => {
  inuseTableRef.value?.clearSelection()
}

const refreshTable = async () => {
  if (!chooseNode.value) return
  loading.value = true
  inuseTableRef.value?.getTableList()
}

/** 数据回调：仅透传 */
const callBackHandle = (data: any) => data

/**
 * 列表请求：
 * - 序号直接拒绝过期响应，阻止旧节点数据写入当前表格
 */
const getInusePageList = (params: any) => {
  const seq = ++tableReqSeq
  const nodeAtRequest = chooseNode.value
  loading.value = true
  return getAttachByDirectory({ ...params, id: chooseNode.value, attachName: attachName.value })
    .then((res) => {
      if (seq !== tableReqSeq || nodeAtRequest !== chooseNode.value) {
        throw new Error('STALE_TABLE_REQUEST')
      }
      loading.value = false
      return res
    })
    .catch((err) => {
      if (seq === tableReqSeq && nodeAtRequest === chooseNode.value) loading.value = false
      if ((err as Error)?.message !== 'STALE_TABLE_REQUEST' && seq === tableReqSeq) {
        ElMessage.error((err as Error)?.message || '列表加载失败，请稍后重试')
      }
      throw err
    })
}

const columnStyle = ({ row, column }: any) => {
  if (column.field == 'attachName') {
    return {
      color: 'var(--color-primary, #00857c)',
      cursor: 'pointer'
    }
  }
}

// ========== 文件操作 ==========
// 下载文件
const downloadReport = ({ row, column }: { row: any; column: any }) => {
  if (column.field == 'attachName') {
    try {
      const uuid: any = row.uuid
      const fileName: any = `${row.attachName}`
      const params: any = {
        uuid: uuid,
        fileName: fileName
      }
      if (!uuid) return ElMessage.warning('报告未维护，请勿重复点击！')
      apiExportHandle(params, fileName, downloadAttach)
    } catch (e: any) {
      console.error(e.toString())
    }
  }
}
/** 上传文件：选中文件后直传至当前目录 */
const uploadHandle = async () => {
  if (!chooseNode.value) {
    ElMessage.warning('请先选择左侧文件目录')
    uploadRef.value?.clearFiles?.()
    return
  }
  try {
    const $table = inuseTableRef.value?.gridRef
    // const types = ['gif', 'jpg', 'jpeg', 'png', 'wps', 'et', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf', 'zip', 'tar', 'ofd']
    const { files } = await $table.readFile({ multiple: true })
    const records = Array.from(files).map((file: any) => {
      // if (types) {
      //   const ns = file.name.split('.')
      //   const type = ns[ns.length - 1].toLowerCase()
      //   if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
      // }
      return {
        name: file.name,
        file: file
      }
    })
    const formData = new FormData()
    for (const record of records) {
      formData.append('files', record.file)
      formData.append('attachNames', record.name)
    }
    const attachNames = records.map(({ name }: any) => name)
    loading.value = true
    const res = await uploadAttachToDirectory({ excelFormData: formData, id: chooseNode.value, attachNames })
    if (!res.success) throw new Error(res.msg)
    // 刷新页面,调用查询接口
    ElMessage.success('附件上传成功')
    reloadActiveTable()
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
  return
}

/** 编辑备注：打开弹窗回显 */
const handleEditRemark = (row: AttachRow) => {
  remarkModalRef.value?.acceptParams({ id: row.id, attachName: row.attachName, remark: row.remark })
}

/** 预览文件：下载带鉴权的文件流后交给 OfficePreview 渲染 */
const handlePreview = (row: AttachRow) => {
  if (!row.uuid) return ElMessage.warning('报告未维护，无法预览！')
  previewModalRef.value?.acceptParams({ uuid: row.uuid, attachName: row.attachName })
}

/** 备注保存回调 */
const handleRemarkSave = async ({ id, remark }: { id: string; remark: string }) => {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await editAttach({ id, remark })
    if (res.success) {
      ElMessage.success('保存成功')
      reloadActiveTable()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '保存失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

/** 删除文件：ids 数组 */
const handleDeleteFile = async (row: AttachRow) => {
  try {
    const type = await VXETable.modal.confirm('确定删除该文件吗？', '提示', { status: 'warning' })
    if (type !== 'confirm') {
      ElMessage.info('已取消')
      return
    }
  } catch {
    return
  }
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await deleteAttachFromDirectory({ ids: [row.id] })
    if (res.success) {
      ElMessage.success('删除成功')
      reloadActiveTable()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '删除失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

// ========== 树相关（懒加载） ==========
/**
 * el-tree 懒加载：根节点 level=0 传 '0'，其余传节点 id。
 * leaf=1 视为末级，不展示展开箭头（由 defaultProps.isLeaf 控制）。
 */
const loadNode = async (node: any, resolve: (data: TreeNode[]) => void) => {
  const parentId = node.level === 0 ? '0' : node.data?.id
  try {
    const res = await getChildDirectory(parentId)
    if (!res.success) {
      ElMessage.error(res.msg || '文件目录加载失败')
      resolve([])
      return
    }
    const list: TreeNode[] = Array.isArray(res.data) ? res.data : []
    resolve(list)
  } catch (e) {
    ElMessage.error((e as Error)?.message || '文件目录加载失败，请稍后重试')
    resolve([])
  }
}

/** 重新加载整棵树（删除/新增后调用） */
const reloadTree = () => {
  const tree = treeRef.value
  if (!tree) return
  // 重置懒加载缓存，重新拉取根节点
  tree.store.root.loaded = false
  tree.store.root.expand()
}

const retryTreeLoad = () => {
  treeLoadError.value = ''
  reloadTree()
}

/**
 * 递归拉取并展开所有非末级节点（懒加载树的一键展开）。
 * - 先 loadData 加载子节点，再 expand，避免重复请求。
 * - isLeaf 由 defaultProps.isLeaf 函数在 load 后计算。
 */
const expandNodeRecursive = async (node: any) => {
  if (!node) return
  if (node.isLeaf) return
  if (!node.loaded) {
    await new Promise<void>((resolve) => {
      node.loadData(() => resolve())
    })
  }
  if (!node.expanded) node.expand()
  const children = node.childNodes || []
  for (const child of children) {
    await expandNodeRecursive(child)
  }
}

/** 递归收起所有节点 */
const collapseNodeRecursive = (node: any) => {
  if (!node) return
  if (node.expanded) node.collapse()
  const children = node.childNodes || []
  for (const child of children) {
    collapseNodeRecursive(child)
  }
}

/** 判断所有非末级节点是否均已展开 */
const isAllExpanded = (node: any): boolean => {
  if (!node || node.isLeaf) return true
  if (!node.loaded || !node.expanded) return false
  const children = node.childNodes || []
  return children.every((child: any) => isAllExpanded(child))
}

const handleExpandAll = async () => {
  const tree = treeRef.value
  if (!tree || treeExpanding.value) return
  treeExpanding.value = true
  try {
    const root = tree.store.root
    if (isAllExpanded(root)) {
      collapseNodeRecursive(root)
    } else {
      await expandNodeRecursive(root)
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '操作失败，请稍后重试')
  } finally {
    treeExpanding.value = false
  }
}

/** 刷新：重置树缓存重新拉取根节点，随后恢复默认全展开状态 */
const handleRefreshTree = async () => {
  if (treeExpanding.value) return
  reloadTree()
  await nextTick()
  await handleExpandAll()
}

const handleNodeClick = (data: TreeNode) => {
  // 重复点击同一节点不刷新
  if (chooseNode.value === data.id) return
  chooseNode.value = data.id
  chooseNodeName.value = data.directoryName || data.name
  refreshTable()
}

/** 顶部「+」：新增目录 */
const handlePlusClick = () => {
  directoryModalRef.value?.acceptParams({ parentId: '0' })
}
/** 树节点新增：新增目录名 */
const handleTreeNodePLUS = (_node: any, data: TreeNode) => {
  directoryModalRef.value?.acceptParams({ parentId: data.id })
}
/** 树节点编辑：编辑目录名 */
const handleTreeNodeEdit = (_node: any, data: TreeNode) => {
  directoryModalRef.value?.acceptParams({
    id: data.id,
    directoryName: data.directoryName || data.name,
    sortCode: data.sortCode,
    leaf: data.leaf,
	parentId: data.parentId
  })
}

/** 树节点删除 */
const handleTreeNodeDelete = async (_node: any, data: TreeNode) => {
  try {
    const type = await VXETable.modal.confirm('确定删除该目录吗？', '提示', { status: 'warning' })
    if (type !== 'confirm') {
      ElMessage.info('已取消')
      return
    }
  } catch {
    return
  }
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await deleteDirectory({ ids: [data.id] })
    if (res.success) {
      ElMessage.success('删除成功')
      // 删除的是当前选中节点：清空表格
      if (chooseNode.value === data.id) {
        chooseNode.value = ''
        chooseNodeName.value = ''
        inuseTableRef.value?.clearSelection?.()
      }
      reloadTree()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '删除失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

/** 目录新增/编辑保存回调 */
const handleDirectorySave = async (params: { id?: string; parentId?: string; directoryName: string; leaf?: number }) => {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await addDirectory(params)
    if (res.success) {
      ElMessage.success('保存成功')
      reloadTree()
      await nextTick()
      await handleExpandAll()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '保存失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  const isQuery = userDialogRef.value?.isQuery
  if (!isQuery) return
  isShowPage.value = true
  // 页面可交互后再挂弹窗，降低首屏压力
  requestAnimationFrame(() => {
    modalsReady.value = true
  })
  // 默认展开所有节点（等树挂载）
  await nextTick()
  handleExpandAll()
}

// ========== 生命周期 ==========
onMounted(async () => {
  countInfo.value = { ...store.getters.getUserMsg }
  await userDialogRef.value?.getUser()
})

// 路由页签由 keep-alive 缓存，返回时需要主动恢复隐藏期间失效的表格尺寸
onActivated(() => {
  layoutActiveTable()
})

onBeforeUnmount(() => {
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>

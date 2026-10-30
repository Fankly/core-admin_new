<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal"
    resize
    show-zoom
    fullscreen
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="1100px"
    height="600px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="air-modal-body air-modal-body--table">
      <div class="step-manage-toolbar">
        <el-input
          v-model.trim="keyword"
          clearable
          size="small"
          placeholder="输入步骤名称进行过滤"
          style="width: 240px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <i class="el-icon-search" @click="handleSearch" style="color: var(--color-primary, #00706b); cursor: pointer"></i>
          </template>
        </el-input>
        <el-button v-permission="'UPLOAD'" plain size="small" type="primary" @click="handleAdd"> 新 增 </el-button>
      </div>
      <div class="air-modal-table">
        <RangeVxeTableStyle
          class="range-pro-table"
          @search="handleTableQuery"
          @reset="handleTableQuery"
          :pagination="true"
          :border="true"
          :tool-button="false"
          :data-callback="callBackHandle"
          :request-api="getPageList"
          :request-auto="true"
          :columns="columns"
          row-click-mode="none"
          ref="tableRef"
          stripe
          row-key="id"
          :loading="loading || actionLoading"
        >
          <template #operation="{ row }">
            <el-tooltip content="编辑" placement="top">
              <i class="el-icon-edit row-action-icon" @click="handleEdit(row)" v-permission="'EDITBZ'"></i>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <i class="el-icon-delete row-action-icon row-action-icon--danger" @click="handleDelete(row)" v-permission="'DELETEFILE'"></i>
            </el-tooltip>
          </template>
        </RangeVxeTableStyle>
      </div>
    </div>
    <remarkModal ref="remarkModalRef" @success="handleRemarkSave" />
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'stepManageModal'
}
</script>

<script setup lang="ts">
import { ref, markRaw, nextTick, defineAsyncComponent } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import RangeVxeTableStyle from '@/components/RangeVxeTableStyle/index.vue'
import { processGetPage, processSaveOrUpdate, processDelete } from '@/api/xmInfo/stageConfig'

interface AttachRow {
  id?: string
  code?: string
  name?: string
  groupCode?: string
  groupName?: string
  operationType?: number | string
  operationRole?: string
  mainCode?: string
  wfCode?: string
  wfNodeCode?: string
  pslx?: number | string
  opeartionDes?: string
  remark?: string
  sortCode?: number | string
  flowStatus?: string
  [key: string]: any
}

const emit = defineEmits<{
  (e: 'success'): void
}>()

const remarkModal = defineAsyncComponent(() => import('@/views/xmInfo/stageConfig/components/remarkModal/index.vue'))

const isShowModal = ref(false)
const loading = ref(false)
const actionLoading = ref(false)
const keyword = ref('')
const modalTitle = ref('步骤管理')
const tableRef = ref<any>(null)
const remarkModalRef = ref()

/** 请求序号：丢弃过期响应，避免快速搜索闪旧数据 */
let reqSeq = 0

const operationTypeMap = markRaw<Record<string, string>>({ '1': '普通操作', '2': '工作流审批', '3': '评审意见' })
const pslxMap = markRaw<Record<string, string>>({ '1': '外围系统评审', '2': '联合会审评审', '3': '省专业预审退回', '4': '省财务、发展线下会审' })
const yjclbmTypeMap = markRaw<Record<string, string>>({ '1': '直接获取', '2': '通过脚本获取' })

const operationColumn = markRaw({
  field: 'operation',
  title: '操作',
  width: 130,
  fixed: 'right',
  align: 'center',
  slots: { default: 'operation' }
})

const columns = markRaw<any[]>([
  { type: 'seq', width: 50, title: '序号', fixed: 'left' },
  { field: 'groupCode', title: '环节编码', width: 120, fixed: 'left' },
  { field: 'groupName', title: '环节名称', width: 150, fixed: 'left' },
  { field: 'code', title: '步骤编号', width: 100, fixed: 'left' },
  { field: 'name', title: '步骤名称', minWidth: 180, fixed: 'left' },
  { field: 'operationRole', title: '操作角色', width: 150 },
  { field: 'operationRoleCode', title: '角色编码', width: 150 },
  {
    field: 'yjclbmType',
    title: '预计处理部门获取方式',
    width: 160,
    formatter: ({ cellValue }: any) => yjclbmTypeMap[String(cellValue)] || cellValue || '-'
  },
  { field: 'yjclbm', title: '预计处理部门', minWidth: 200 },
  {
    field: 'operationType',
    title: '操作类型',
    width: 150,
    formatter: ({ cellValue }: any) => {
      if (cellValue == null || cellValue === '') return '-'
      return String(cellValue)
        .split(',')
        .map((v: string) => operationTypeMap[v.trim()] || v.trim())
        .filter(Boolean)
        .join('、')
    }
  },
  {
    field: 'pslx',
    title: '评审类型',
    width: 150,
    formatter: ({ cellValue }: any) => pslxMap[String(cellValue)] || cellValue || '-'
  },
  { field: 'mainCode', title: '关键操作节点', width: 150 },
  { field: 'wfCode', title: '流程编码', width: 150 },
  { field: 'wfNodeCode', title: '流程节点编码', width: 150 },
  { field: 'opeartionDes', title: '普通业务操作说明', minWidth: 300, headerAlign: 'center', align: 'left' },
  { field: 'remark', title: '说明', minWidth: 300, headerAlign: 'center', align: 'left' },
  { field: 'sortCode', title: '排序', minWidth: 150 },
  { field: 'flowStatus', title: '状态', minWidth: 150 },
  operationColumn
])

const callBackHandle = (data: any) => data

const reloadTable = () => {
  tableRef.value?.clearSelection()
  tableRef.value?.getTableList()
}

const handleSearch = () => {
  reloadTable()
}

const handleTableQuery = () => {
  tableRef.value?.clearSelection()
}

const getPageList = (params: any) => {
  const seq = ++reqSeq
  loading.value = true
  return processGetPage({ ...params, name: keyword.value })
    .then((res: any) => {
      if (seq !== reqSeq) throw new Error('STALE_TABLE_REQUEST')
      loading.value = false
      return res
    })
    .catch((err: any) => {
      if (seq === reqSeq) loading.value = false
      if ((err as Error)?.message !== 'STALE_TABLE_REQUEST' && seq === reqSeq) {
        ElMessage.error((err as Error)?.message || '列表加载失败，请稍后重试')
      }
      throw err
    })
}

const handleAdd = () => {
  remarkModalRef.value?.acceptParams({})
}

const handleEdit = (row: AttachRow) => {
  remarkModalRef.value?.acceptParams({ ...row })
}

const handleRemarkSave = async (params: AttachRow) => {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await processSaveOrUpdate({ ...params })
    if (res.success) {
      ElMessage.success('保存成功')
      // 延后到下一帧再刷新：表单弹窗 destroy-on-close 卸载与本表 reload+自动列宽重算
      // 同帧执行会互相阻塞主线程，造成保存后明显卡顿。
      nextTick(() => {
        reloadTable()
        emit('success')
      })
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '保存失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

const handleDelete = async (row: AttachRow) => {
  try {
    const type = await VXETable.modal.confirm('确定删除该步骤吗？', '提示', { status: 'warning' })
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
    const res = await processDelete({ ids: [row.id] })
    if (res.success) {
      ElMessage.success('删除成功')
      reloadTable()
      emit('success')
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '删除失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

const handleClose = () => {
  keyword.value = ''
  isShowModal.value = false
}

const acceptParams = () => {
  keyword.value = ''
  modalTitle.value = '步骤管理'
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';

.step-manage-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

/* 操作列 icon：比主页面更大、间距更宽，弹窗内点击更易命中 */
.air-modal-table .row-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin: 0 6px;
  color: var(--color-primary, #00706b);
  font-size: 18px;
  line-height: 1;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;

  &:hover {
    color: #ffffff;
    background-color: #2a9a92;
    border-color: #2a9a92;
  }

  &:active {
    background-color: #005f5a;
    border-color: #005f5a;
  }
}

.air-modal-table .row-action-icon--danger {
  color: #f56c6c;

  &:hover {
    color: #ffffff;
    background-color: #f56c6c;
    border-color: #f56c6c;
  }

  &:active {
    background-color: darken(#f56c6c, 6%);
    border-color: darken(#f56c6c, 6%);
  }
}
</style>

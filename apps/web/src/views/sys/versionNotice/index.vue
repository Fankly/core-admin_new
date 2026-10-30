<!-- 版本发布通知 -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      @search="resetTable"
      @reset="resetTable"
      @row-click="handleClickRow"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      row-key="id"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader="scope">
        <el-button v-permission="'ADD'" size="small" @click="handleBtn(scope.selectedList, 'ADD')" plain type="primary">新 增</el-button>
        <el-button
          v-permission="'EDIT'"
          :disabled="scope.selectedList.length !== 1"
          size="small"
          @click="handleBtn(scope.selectedList, 'EDIT')"
          plain
          type="primary"
        >
          编 辑
        </el-button>
        <el-button
          v-permission="'DELETE'"
          :disabled="scope.selectedList.length === 0"
          size="small"
          @click="handleBtn(scope.selectedList, 'DELETE')"
          plain
          type="primary"
        >
          删 除
        </el-button>
        <el-button
          v-permission="'SUBMIT'"
          :disabled="scope.selectedList.length !== 1"
          size="small"
          @click="handleNotice(scope.selectedList, 'POST')"
          plain
          type="primary"
        >
          发布通知
        </el-button>
        <el-button
          v-permission="'SAVE'"
          :disabled="scope.selectedList.length !== 1"
          size="small"
          @click="handleNotice(scope.selectedList, 'WITHDRAW')"
          plain
          type="primary"
        >
          撤回通知
        </el-button>
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <maintModal ref="rangeModalRef" @search-handle="searchHandle" />
</template>

<script setup lang="ts">
defineOptions({ name: "/sys/versionNotice/index" })
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ProTable from '@/components/ProTablePage/index.vue'
import maintModal from '@/views/sys/versionNotice/components/maintModal/index.vue'
import { versionNoticePage, versionNoticeRemove, versionNoticePublish, versionNoticeRevoke } from '@/api/sys/versionNotice'

// ========== 类型定义 ==========

interface SelectedRow {
  id: string
  status: string
  [key: string]: any
}

type OperationType = 'ADD' | 'EDIT' | 'DELETE'

// ========== 响应式状态 ==========
const rangeModalRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)

// ========== 表格列配置 ==========
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'versionNo',
    label: '版本号',
    search: { el: 'input', order: 1 },
    width: 150
  },
  {
    prop: 'versionTitle',
    label: '通知标题',
    search: { el: 'input', order: 2 },
    width: 280
  },
  {
    prop: 'versionContent',
    label: '检修内容',
    render: ({ row }: any) => {
      // 富文本去除 HTML 标签后截取摘要展示
      const text = row.versionContent
        ? row.versionContent
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim()
        : ''
      return text
    },
    width: 400
  },
  { prop: 'releaseDate', label: '检修日期', width: 320 },
  { prop: 'noticeTime', label: '通知生效时间', width: 160 },
  { prop: 'noticeExpireTime', label: '通知失效时间', width: 160 },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    search: { el: 'select', order: 3 },
    enum: [
      { label: '草稿', value: '0', tagType: 'info' },
      { label: '已发布', value: '1', tagType: 'success' },
      { label: '已撤回', value: '2', tagType: 'warning' },
      { label: '已过期', value: '3', tagType: 'warning' }
    ],
    render: ({ row }: any) => {
      return row.statusName
    }
  },
  { prop: 'createUser', label: '创建人', width: 100 },
  { prop: 'createTime', label: '创建时间', width: 160 },
  { prop: 'updateUser', label: '最后更新人', width: 100 },
  { prop: 'updateTime', label: '最后更新时间', width: 160 }
])

// ========== 表格相关 ==========

const resetTable = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (params: any) => {
  loading.value = true
  return versionNoticePage(params)
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    if (isQuery) {
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

// ========== 新增/编辑/删除操作 ==========
const handleBtn = async (selectedList: SelectedRow[], type: OperationType) => {
  if (type === 'EDIT' && selectedList.length !== 1) return ElMessage.warning('请选择一条数据！')
  if (type === 'DELETE' && selectedList.length === 0) return ElMessage.warning('请选择数据！')
  if (type === 'EDIT' || type === 'DELETE') {
    const hasPostData = selectedList.some(({ status }: any) => status == '1')
    if (hasPostData) return ElMessage.warning('包含已发布数据无法操作，请重新选择！')
  }

  if (type === 'ADD' || type === 'EDIT') {
    const params = {
      searchParams: type === 'EDIT' ? { ...selectedList[0] } : {},
      type: type === 'ADD' ? '新增' : '编辑'
    }
    rangeModalRef.value.acceptParams(params)
    return
  }

  // 删除操作
  const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', {
    status: 'warning'
  })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  const idList = selectedList.map((item) => item.id)
  const res = await versionNoticeRemove(idList)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('删除成功！')
  resetTable()
}

// ========== 发布/撤回通知 ==========
const handleNotice = async (selectedList: SelectedRow[], type: 'POST' | 'WITHDRAW') => {
  if (selectedList.length !== 1) return ElMessage.warning('请选择一条数据！')
  const row = selectedList[0]

  const actionMap = {
    POST: {
      canExec: row.status != '1',
      warn: '该通知已发布，请勿重复发布！',
      confirm: '确定发布该通知吗？',
      api: versionNoticePublish,
      success: '发布成功！'
    },
    WITHDRAW: {
      canExec: row.status == '1',
      warn: '该通知未发布，无法撤回！',
      confirm: '确定撤回该通知吗？',
      api: versionNoticeRevoke,
      success: '撤回成功！'
    }
  }
  const action = actionMap[type]
  if (!action.canExec) return ElMessage.warning(action.warn)

  const confirmResult = await VXETable.modal.confirm(action.confirm, '提示', { status: 'warning' })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  const res = await action.api(row.id)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success(action.success)
  resetTable()
}

const searchHandle = (val: any) => {
  if (!val) return
  resetTable()
}

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>

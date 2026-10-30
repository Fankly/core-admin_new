<!-- 提示词管理（vxe-grid，对齐标杆 RangeVxeTable） -->
<template>
  <div v-if="isShowPage" class="prompt-word-page">
    <div class="list-card">
      <RangeVxeTable
        ref="tableRef"
        class="pwm-vxe-table"
        stripe
        row-key="templateId"
        row-click-mode="exclusive"
        :border="true"
        :pagination="true"
        :request-auto="true"
        :request-api="getPageList"
        :data-callback="callBackHandle"
        :columns="tableColumns"
        :tool-button="['setting', 'help']"
        :loading="loading"
      >
        <template #tableHeader="scope">
          <div class="pwm-command-group" aria-label="提示词管理操作">
            <el-button v-permission="'ADD'" size="small" type="primary" @click="handleAdd">新 增</el-button>
            <el-button v-permission="'EDIT'" :disabled="scope.selectedList.length !== 1" size="small" type="primary" @click="handleEdit(scope.selectedList)"
              >编 辑</el-button
            >
            <el-button v-permission="'DELETE'" :disabled="scope.selectedList.length === 0" size="small" type="danger" @click="handleDelete(scope.selectedList)"
              >删 除</el-button
            >
          </div>
        </template>
      </RangeVxeTable>
    </div>
  </div>
  <editModal ref="editModalRef" @search-handle="searchHandle" />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts">
import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'

defineOptions({ name: "/ai/automaticPromptWordManagement/index" })
import { nextTick, onMounted, provide, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import editModal from '@/views/ai/automaticPromptWordManagement/components/editModal/index.vue'
import { listPromptTemplate, removePromptTemplate } from '@/api/ai/automaticPromptWordManagement'
import type { PromptTemplateVO } from '@/api/ai/automaticPromptWordManagement'

const editModalRef = ref()
const tableRef = ref<any>(null)
const loading = ref(false)
/** 页面权限：多角色选择弹窗 */
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const isShowPage = ref(false)
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
provide(CurrentUserRoleInjectionKey, currentUserRole)

/** vxe-grid 列（resizable：表头拖动调整列宽） */
const tableColumns = reactive<NonNullable<VxeGridProps['columns']>>([
  { type: 'checkbox', width: 50 },
  { field: 'templateId', title: '主键ID', width: 200, showOverflow: 'tooltip', resizable: true },
  { field: 'promptCode', title: '提示词编码', minWidth: 220, showOverflow: 'tooltip', resizable: true },
  { field: 'promptContent', title: '提示词内容', minWidth: 480, showOverflow: 'tooltip', resizable: true }
])

/** 刷新列表（清空勾选） */
const resetTable = () => {
  tableRef.value?.clearSelection()
  tableRef.value?.getTableList()
}

/** 角色/按钮权限就绪后初始化页面数据 */
const getRoleHandle = async (): Promise<void> => {
  isShowPage.value = Boolean(userRoleSelectorRef.value?.canRender)
  if (!isShowPage.value) return
  await nextTick()
  resetTable()
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

/**
 * 列表取数：接口一次性返回全部（按主键倒序），分页在前端切片，
 * 保留与系统一致的 el-pagination 交互。
 */
const getPageList = (params: any) => {
  loading.value = true
  const page = Number(params?.page) || 1
  const limit = Number(params?.limit) || 20
  const emptyResult = { records: [] as PromptTemplateVO[], total: 0, current: page, size: limit, pages: 1 }
  return listPromptTemplate()
    .then((res) => {
      if (!res?.success) {
        ElMessage.error(res?.msg || '查询失败')
        return { ...res, data: emptyResult }
      }
      const all: PromptTemplateVO[] = Array.isArray(res.data) ? res.data : []
      const start = (page - 1) * limit
      return {
        ...res,
        data: {
          records: all.slice(start, start + limit),
          total: all.length,
          current: page,
          size: limit,
          pages: Math.max(1, Math.ceil(all.length / limit))
        }
      }
    })
    .finally(() => {
      loading.value = false
    })
}

/** 弹窗保存成功后刷新 */
const searchHandle = () => {
  resetTable()
}

const handleAdd = () => {
  editModalRef.value?.acceptParams({ type: '新增提示词', searchParams: {} })
}

const handleEdit = (selectedList: PromptTemplateVO[]) => {
  if (selectedList.length !== 1) return ElMessage.warning('请选择一条数据！')
  editModalRef.value?.acceptParams({ type: '编辑提示词', searchParams: { ...selectedList[0] } })
}

const handleDelete = async (selectedList: PromptTemplateVO[]) => {
  if (!selectedList.length) return ElMessage.warning('请选择数据！')

  const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', { status: 'warning' })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  const ids = selectedList.map((item) => item.templateId).filter((id) => id !== undefined && id !== null && id !== '')
  if (!ids.length) return ElMessage.warning('请选择有效数据！')

  try {
    const res = await removePromptTemplate(ids)
    if (!res.success) return ElMessage.error(res.msg)
    ElMessage.success('删除成功！')
    resetTable()
  } catch (error) {
    // http 层已提示错误
  }
}

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>

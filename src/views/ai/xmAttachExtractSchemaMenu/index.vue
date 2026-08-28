<template>
  <div v-if="isShowPage" class="container">
    <ProTable
      ref="proTableRef"
      row-key="schemaId"
      stripe
      :border="true"
      :columns="tableColumns"
      :data-callback="callBackHandle"
      :loading="loading"
      :pagination="true"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      @reset="resetTable"
      @row-click="handleClickRow"
      @search="resetTable"
    >
      <template #tableHeader="scope">
        <el-button v-permission="'ADD'" size="mini" plain type="primary" @click="handleBtn(scope.selectedList, 'ADD')">新 增</el-button>
        <el-button
          v-permission="'EDIT'"
          :disabled="scope.selectedList.length !== 1"
          size="mini"
          plain
          type="primary"
          @click="handleBtn(scope.selectedList, 'EDIT')"
          >编 辑</el-button
        >
        <el-button
          v-permission="'DELETE'"
          :disabled="scope.selectedList.length === 0"
          size="mini"
          plain
          type="primary"
          @click="handleBtn(scope.selectedList, 'DELETE')"
          >删 除</el-button
        >
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <EditModal ref="editModalRef" :attachment-types="attachmentTypes" @saved="resetTable" />
</template>

<script setup lang="ts" name="/ai/xmAttachExtractSchemaMenu/index">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ProTable from '@/components/ProTablePage/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { getPublicCodeList } from '@/api/common'
import { getXmAttachExtractSchemaMenu, removeSchema } from '@/api/ai/xmAttachExtractSchemaMenu'
import type { SchemaRow } from '@/api/ai/xmAttachExtractSchemaMenu'
import EditModal from './components/EditModal.vue'

const ATTACHMENT_TYPE_CODE = 'FJ_TYPE'

type OperationType = 'ADD' | 'EDIT' | 'DELETE'

interface AttachmentTypeOption {
  code: string
  name: string
}

interface RoleContext {
  bmId: string
  dwId: string
  roleId: string
  roleCode: string
  userId: string
}

const store = useStore()
const proTableRef = ref<any>()
const userDialogRef = ref<any>()
const editModalRef = ref<any>()
const isShowPage = ref(false)
const loading = ref(false)
const attachmentTypes = ref<AttachmentTypeOption[]>([])
const roleContext = ref<RoleContext>({ bmId: '', dwId: '', roleId: '', roleCode: '', userId: '' })

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  {
    prop: 'fjType',
    label: '附件类型',
    isShow: false,
    enum: attachmentTypes.value,
    fieldNames: { label: 'name', value: 'code' },
    search: {
      el: 'select',
      order: 1,
      props: { clearable: true, filterable: true, placeholder: '请选择附件类型' }
    }
  },
  {
    prop: 'schemaName',
    label: '模板名称',
    minWidth: 220,
    search: {
      el: 'input',
      order: 2,
      props: { clearable: true, placeholder: '请输入模板名称' }
    }
  },
  { prop: 'fjTypeName', label: '附件类型', minWidth: 180 },
  { prop: 'schemaDesc', label: '备注', minWidth: 320, showOverflow: true }
])

const loadAttachmentTypes = async () => {
  try {
    const res = await getPublicCodeList({ codes: [ATTACHMENT_TYPE_CODE] })
    if (!res.success) return ElMessage.error(res.msg || '加载附件类型失败')
    attachmentTypes.value.length = 0
    attachmentTypes.value.push(...(res.data?.[ATTACHMENT_TYPE_CODE] || []))
  } catch (error) {
    ElMessage.error((error as Error).message || '加载附件类型失败')
  }
}

const resetTable = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

const handleClickRow = (row: SchemaRow) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element?.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (params: any) => {
  loading.value = true
  return getXmAttachExtractSchemaMenu({
    bmId: roleContext.value.bmId,
    dwId: roleContext.value.dwId,
    fjType: params.fjType || '',
    limit: String(params.limit ?? ''),
    page: String(params.page ?? ''),
    roleCode: roleContext.value.roleCode,
    roleId: roleContext.value.roleId,
    schemaName: params.schemaName || '',
    userId: roleContext.value.userId
  })
}

const getRoleHandle = () => {
  if (!userDialogRef.value?.isQuery) return
  const userMsg = userDialogRef.value?.userMsg || {}
  roleContext.value = {
    bmId: userMsg.specialorgid || '',
    dwId: userMsg.org_id || '',
    roleId: userMsg.role_id || userMsg.id || '',
    roleCode: userMsg.code || userDialogRef.value?.roleCode || '',
    userId: store.getters.getUserMsg?.id || ''
  }
  isShowPage.value = true
}

const handleBtn = async (selectedList: SchemaRow[], type: OperationType) => {
  if (type === 'ADD' || type === 'EDIT') {
    editModalRef.value?.acceptParams({
      title: type === 'ADD' ? '新增' : '编辑',
      row: type === 'EDIT' ? selectedList[0] : undefined
    })
    return
  }

  if (!selectedList.length) return ElMessage.warning('请选择数据！')
  const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', { status: 'warning' })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  const schemaIds = selectedList.map((item) => item.schemaId).filter(Boolean)
  if (!schemaIds.length) return ElMessage.warning('请选择有效数据！')

  try {
    const res = await removeSchema(schemaIds)
    if (!res.success) return ElMessage.error(res.msg || '删除失败')
    ElMessage.success('删除成功！')
    resetTable()
  } catch (error) {
    ElMessage.error((error as Error).message || '删除失败')
  }
}

onMounted(async () => {
  await loadAttachmentTypes()
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
.container {
  padding: 10px;
}
</style>

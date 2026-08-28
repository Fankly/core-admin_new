<template>
  <div class="operation">
    <el-button v-if="hasPermission('EXPORT')" type="primary" plain @click="handleExport">导 出</el-button>
  </div>
</template>

<script setup lang="ts" name="materialTaskDetailToolbar">
import { inject, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { usePermission } from '@/hooks/usePermission'
import { apiExportHandle } from '@/utils/export'
import { CrudTableRefInjectionKey, CurrentUserRoleInjectionKey, defaultUserRole } from '@/views/suzhou/common/types/crud'
import { getRoleQueryParams } from '@/views/suzhou/common/utils/params'
import { MATERIAL_TASK_DETAIL_EXPORT_API, MATERIAL_TASK_DETAIL_EXPORT_FILE_NAME } from '@/views/suzhou/materialTaskDetail/config'

const { hasPermission } = usePermission()
const materialTableRef = inject(CrudTableRefInjectionKey, ref())
const currentUserRole = inject(CurrentUserRoleInjectionKey, ref(defaultUserRole()))

const handleExport = async () => {
  try {
    const params = {
      ...(materialTableRef.value?.getSearchParams?.() || {}),
      ...getRoleQueryParams(currentUserRole.value)
    }
    await apiExportHandle(params, MATERIAL_TASK_DETAIL_EXPORT_FILE_NAME, MATERIAL_TASK_DETAIL_EXPORT_API, {
      useResponseFileName: true
    })
  } catch (error) {
    ElMessage.error((error as Error).message || '导出失败!')
  }
}
</script>

<style scoped></style>

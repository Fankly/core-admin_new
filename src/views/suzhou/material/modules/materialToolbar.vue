<template>
  <div class="operation">
    <el-button v-if="hasPermission('ADD')" type="primary" plain @click="openModal('add')">新 增</el-button>
    <el-button v-if="hasPermission('EDIT')" :disabled="!isChecked" type="primary" plain @click="openModal('edit')">编 辑</el-button>
    <el-button v-if="hasPermission('DELETE')" :disabled="!isChecked" type="primary" plain @click="deleteByMaterialCode">删 除</el-button>
    <el-button v-if="hasPermission('EXPORT')" type="primary" plain @click="handleExport">导 出</el-button>
    <el-button v-if="hasPermission('LOG')" type="primary" plain @click="handleLog">日 志</el-button>
  </div>
  <FormModal
    height="530px"
    width="900px"
    ref="formModalRef"
    labelWidth="120px"
    :title="materialTitleConfig.modalTitle"
    :mode="mode"
    :fields="materialFormFields"
    :data="formData"
    @save="handleSave"
    @close="handleClose"
  />
  <MaterialTaskLog ref="materialTaskLogRef" />
</template>

<script setup lang="ts" name="materialToolbar">
import { computed, onMounted, reactive, ref } from 'vue'
import FormModal from '@/components/FormModal'
import { getPublicCodesList } from '@/api/common'
import { useCrudToolbar } from '@/views/suzhou/common/hooks/useCrudToolbar'
import { usePermission } from '@/hooks/usePermission'
import { MATERIAL_TOOLBAR_CONFIG } from '@/views/suzhou/material/config'
import MaterialTaskLog from '@/views/suzhou/material/modules/materialTaskLog.vue'
import { DEFAULT_MATERIAL_TITLE, MATERIAL_JUDGMENT_RESULT_NAME_CODE, resolveMaterialTitleConfig } from '@/views/suzhou/material/utils/titleConfig'

const { hasPermission } = usePermission()
const formModalRef = ref<InstanceType<typeof FormModal>>()
const materialTitleConfig = ref(resolveMaterialTitleConfig())
const toolbarConfig = reactive({
  ...MATERIAL_TOOLBAR_CONFIG,
  exportFileName: DEFAULT_MATERIAL_TITLE
})

const {
  formFields,
  formData,
  handleSave,
  handleClose,
  openModal,
  deleteByMaterialCode,
  isChecked,
  mode,
  handleExport,
  handleLog,
  materialTaskLogRef
} = useCrudToolbar(formModalRef, toolbarConfig)

const materialFormFields = computed(() =>
  formFields.value.map((field) => ({
    ...field,
    disabled: field.prop === 'materialCode' && mode.value === 'edit' ? true : field.disabled
  }))
)

const getMaterialTitleConfig = async () => {
  try {
    const res = await getPublicCodesList({ codes: [MATERIAL_JUDGMENT_RESULT_NAME_CODE] })
    if (!res.success) return
    const config = resolveMaterialTitleConfig(res.data?.[0]?.codes)
    materialTitleConfig.value = config
    toolbarConfig.exportFileName = config.exportFileName
  } catch {
    materialTitleConfig.value = resolveMaterialTitleConfig()
    toolbarConfig.exportFileName = DEFAULT_MATERIAL_TITLE
  }
}

onMounted(() => {
  getMaterialTitleConfig()
})
</script>

<style scoped></style>

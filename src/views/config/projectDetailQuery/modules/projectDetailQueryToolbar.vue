<template>
  <div class="operation">
    <el-button v-if="hasPermission('ADD')" type="primary" plain @click="openModal('add')">新 增</el-button>
    <el-button v-if="hasPermission('EDIT')" :disabled="!isChecked" type="primary" plain @click="openModal('edit')">编 辑</el-button>
    <el-button v-if="hasPermission('DELETE')" :disabled="!isChecked" type="primary" plain @click="deleteData">删 除</el-button>
  </div>
  <FormModal
    height="260px"
    width="800px"
    ref="formModalRef"
    labelWidth="120px"
    title="项目明细明细配置"
    :mode="mode"
    :fields="formFields"
    :data="formData"
    @save="handleSave"
    @close="handleClose"
  />
</template>

<script setup lang="ts" name="projectDetailQueryToolbar">
import FormModal from '@/components/FormModal'
import { useProjectDetailQueryToolbar } from '@/views/config/projectDetailQuery/hooks/useProjectDetailQueryToolbar'
import { usePermission } from '@/hooks/usePermission'

const { hasPermission } = usePermission()
const { formFields, formModalRef, formData, handleSave, handleClose, openModal, deleteData, isChecked, mode } = useProjectDetailQueryToolbar()
</script>

<style scoped></style>

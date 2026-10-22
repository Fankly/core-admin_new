<template>
  <vxe-modal
    :loading="loading"
    position="center"
    show-footer
    v-model="dialogVisible"
    :show-close="false"
    title="发现有多个角色，请选择一个进入"
    width="600"
    height="400"
    @close="cancel"
  >
    <el-radio-group class="role-radio-group" v-model="selectedRoleId" :disabled="loading">
      <el-radio v-for="item in roleList" :value="item.id" :key="item.id" @change="setCurrentUserRole(item)">{{ item.name }}</el-radio>
    </el-radio-group>
    <template #footer>
      <div style="text-align: center">
        <el-button plain @click="cancel">取消</el-button>
        <el-button plain type="primary" :loading="loading" @click="confirmRole">确定</el-button>
      </div>
    </template>
  </vxe-modal>
  <slot v-if="canRender" />
</template>

<script setup lang="ts">
import { useRoleSelector } from './useRoleSelector'

defineOptions({ name: 'UserRoleSelector' })
const emit = defineEmits<{ loadCompany: [] }>()
const {
  dialogVisible,
  selectedRoleId,
  roleList,
  confirmRole,
  cancel,
  setCurrentUserRole,
  loading,
  getUser,
  getButtonPermissions,
  currentUserRole,
  canRender,
  permissions
} = useRoleSelector(emit)
defineExpose({ loading, getUser, getButtonPermissions, currentUserRole, canRender, permissions })
</script>

<style scoped lang="less">
.role-radio-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>

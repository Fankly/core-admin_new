<template>
  <div class="operation-left-tool__button">
    <template :key="dropdown.permission" v-for="dropdown in dropDownMenu">
      <template v-if="hasPermission(dropdown.permission)">
        <el-dropdown v-if="dropdown.type === 'dropdown'" style="margin-right: 10px" trigger="click">
          <el-button type="primary" size="mini" plain>{{ dropdown.label }}<i class="el-icon-arrow-down" style="margin-left: 6px"></i> </el-button>
          <template #dropdown>
            <template v-for="dropdownChild in dropdown.children" :key="dropdownChild.permission">
              <el-dropdown-menu v-if="hasPermission(dropdownChild.permission)">
                <el-dropdown-item @click="dropdownChild.click">{{ dropdownChild.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </template>
        </el-dropdown>
        <el-button v-else @click="dropdown.click" type="primary" size="mini" plain>
          {{ dropdown.label }}
        </el-button>
      </template>
    </template>
  </div>
  <div class="operation-right-tool__button">
    <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
  </div>
  <ApprovalBatchEditModal :search="props.search" ref="approvalBatchEditModalRef" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts">
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { useBatchOperation } from '@/views/service/approval/batch/components/hooks/useBatchOperation'
import { usePermission } from '@/hooks/usePermission'
import ApprovalBatchEditModal from '@/views/service/approval/batch/components/ApprovalBatchEditModal.vue'

interface Props {
  search: () => void
}

const props = defineProps<Props>()

const { hasPermission } = usePermission()
const { dropDownMenu, approvalBatchEditModalRef, helpModalRef, getHelpMessageHandle } = useBatchOperation(props)
</script>

<style scoped></style>

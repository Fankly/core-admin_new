<template>
  <div class="container" v-if="isShowPage">
    <div class="top">
      <div class="left">
        <projectDetailQueryToolbar />
      </div>
      <div class="right">
        <div class="tool-button">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="main">
      <projectDetailQueryTable ref="projectDetailQueryTableRef" />
    </div>
  </div>
  <HelpModal ref="helpModalRef" />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/config/projectDetailQuery/index">
import ProjectDetailQueryToolbar from '@/views/config/projectDetailQuery/modules/projectDetailQueryToolbar.vue'
import ProjectDetailQueryTable from '@/views/config/projectDetailQuery/modules/projectDetailQueryTable.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { useProjectDetailQuery } from '@/views/config/projectDetailQuery/hooks/useProjectDetailQuery'
import { onMounted } from 'vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'

const { helpModalRef, projectDetailQueryTableRef, userRoleSelectorRef, getRoleHandle, isShowPage, getHelpMessageHandle } = useProjectDetailQuery()

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/projectDetailQuery';
</style>

<template>
  <MaterialPage :toolbar="MaterialTaskDetailTestToolbar" :search="MaterialTaskDetailTestSearch" :config="MATERIAL_TASK_DETAIL_TEST_PAGE_CONFIG" />
</template>

<script setup lang="ts">
defineOptions({ name: "/suzhou/materialTaskDetailTest/index" })
import MaterialPage from '@/views/suzhou/common/components/MaterialPage.vue'
import MaterialTaskDetailTestToolbar from '@/views/suzhou/materialTaskDetailTest/modules/materialTaskDetailTestToolbar.vue'
import MaterialTaskDetailTestSearch from '@/views/suzhou/materialTaskDetailTest/modules/materialTaskDetailTestSearch.vue'
import { MATERIAL_TASK_DETAIL_TEST_PAGE_CONFIG } from '@/views/suzhou/materialTaskDetailTest/config'
</script>

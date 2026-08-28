<template>
  <div class="container" v-if="isShowPage">
    <div class="top">
      <div class="left">
        <component :is="toolbar" />
      </div>
      <div class="right" v-if="showHelp">
        <div class="tool-button">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="search" v-if="search">
      <component :is="search" />
    </div>
    <div class="main">
      <MaterialTable ref="materialTableRef" :columns="tableColumns">
        <template v-for="name in tableSlotNames" #[name]="slotProps" :key="name">
          <slot :name="name" v-bind="slotProps"></slot>
        </template>
      </MaterialTable>
    </div>
    <slot :current-user-role="currentUserRole" />
  </div>
  <HelpModal v-if="showHelp" ref="helpModalRef" />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="SuzhouMaterialPage">
import type { Component, PropType } from 'vue'
import { computed, onMounted, useSlots } from 'vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import MaterialTable from '@/views/suzhou/common/components/MaterialTable.vue'
import { useCrudPage } from '@/views/suzhou/common/hooks/useCrudPage'
import type { CrudPageConfig, CrudRequest } from '@/views/suzhou/common/types/crud'

const props = defineProps({
  toolbar: {
    type: [Object, Function] as PropType<Component>,
    required: true
  },
  search: {
    type: [Object, Function] as PropType<Component>,
    default: null
  },
  showHelp: {
    type: Boolean,
    default: false
  },
  searchFn: {
    type: Function,
    default: null
  },
  columns: {
    type: Array,
    default: () => []
  },
  config: {
    type: Object as PropType<CrudPageConfig<any>>,
    default: null
  }
})
const emit = defineEmits(['pageVisible'])

const tableColumns = computed(() => props.config?.columns || props.columns)
const slots = useSlots()
const tableSlotNames = computed(() => Object.keys(slots).filter((name) => name !== 'default'))
const searchApi: CrudRequest = (params) => {
  const request = props.config?.searchApi || (props.searchFn as CrudRequest | null)
  if (!request) return Promise.resolve({ success: false, msg: '未配置查询接口' })
  return request(params)
}

const { userRoleSelectorRef, materialTableRef, helpModalRef, currentUserRole, getRoleHandle: loadRolePage, isShowPage, getHelpMessageHandle } =
  useCrudPage(searchApi, props.config?.defaultSearchParams)

const getRoleHandle = async () => {
  await loadRolePage()
  if (isShowPage.value) {
    emit('pageVisible')
  }
}

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import '../styles/material';
</style>

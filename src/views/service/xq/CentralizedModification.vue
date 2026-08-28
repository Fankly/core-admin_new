<template>
  <div class="main" v-if="isShowPage">
    <RequirementCartWorkbench ref="workbenchRef" :userInfo="userInfo" show-help @help="getHelpMessageHandle" @reloaded="startGuide" />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/service/xq/CentralizedModification'
}
</script>
<script setup lang="ts">
import { getAppMenu } from '@/api/menu/menuConfig'
import HelpModal from '@/components/HelpModal/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useGuide } from '@/hooks/useGuide'
import { useUser } from '@/hooks/useUser'
import baseService from '@/service/baseService'
import RequirementCartWorkbench from '@/views/service/xq/components/RequirementCartWorkbench.vue'
import { MenuConfig } from '@/views/service/xq/interface'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const store = useStore()
const userInfo = ref<any>({})
const userDialogRef = ref()
const helpModalRef = ref()
const workbenchRef = ref<InstanceType<typeof RequirementCartWorkbench>>()
const isShowModal = ref(false)
const isShowPage = ref(false)
const userLever = ref('')
const operationBtn = ref<MenuConfig[]>([])
const searchBtn = ref<MenuConfig[]>([])

const loading = computed(() => workbenchRef.value?.loading || false)

const { startGuide } = useGuide({
  moduleKey: 'CentralizedModification',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const reloadWorkbench = async () => {
  await nextTick()
  await workbenchRef.value?.reload()
  startGuide()
}

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`)
      if (flagData.success && flagData.data) {
        userLever.value = flagData.data
        store.commit('setXqGlobalInfo', {
          deptId: userInfo.value.specialorgid,
          deptName: userInfo.value.specialorgname,
          dwId: userInfo.value.org_id,
          dwName: userInfo.value.org_name,
          roleId: userInfo.value.role_id,
          roleCode: userInfo.value.code,
          spRoleId: userInfo.value.id,
          specialorgcode: userInfo.value.specialorgcode,
          fqzzFlag: userLever.value
        })
        const xqGlobalInfo = store.getters.getXqGlobalInfo
        userInfo.value = {
          ...(xqGlobalInfo as any)
        }
        await reloadWorkbench()
      }
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  const isRoel = await useUser()

  if (isRoel && route.params.formJsc) {
    const xqGlobalInfo = store.getters.getXqGlobalInfo
    isShowPage.value = true
    userInfo.value = {
      ...(xqGlobalInfo as any)
    }
    await reloadWorkbench()
  } else {
    const operationRes = await getAppMenu({
      appNo: 'XQK',
      label: '1'
    })
    const searchRes = await getAppMenu({
      appNo: 'XQK',
      label: '2'
    })
    if (operationRes.success && searchRes.success) {
      operationBtn.value = operationRes.data
      searchBtn.value = searchRes.data
    }
    await userDialogRef.value.getUser()
  }
})

defineExpose({
  isShowModal,
  loading
})
</script>

<style scoped lang="less">
.main {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

:deep(.requirement-cart-workbench) {
  flex: 1;
  min-height: 0;
}
</style>

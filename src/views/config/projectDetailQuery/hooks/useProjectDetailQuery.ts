import { provide, ref } from 'vue'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type HelpModal from '@/components/HelpModal/index.vue'
import { RowVO } from '@/views/config/projectDetailQuery/types/projectDetailQuery'
import { UserRole } from '@/components/UserRoleSelector/interface'
import type projectDetailQueryTable from '@/views/config/projectDetailQuery/modules/projectDetailQueryTable.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'

export const useProjectDetailQuery = () => {
  const isShowPage = ref(false)
  const checkedData = ref<RowVO[]>([])
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const projectDetailQueryTableRef = ref<InstanceType<typeof projectDetailQueryTable>>()
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()
  const currentUserRole = ref<UserRole>({
    bmName: '',
    dwName: '',
    bmId: '',
    roleId: '',
    roleCode: '',
    dwId: '',
    specialOrgCode: '',
    spRoleId: ''
  })
  const dataType = ref('1')

  provide('currentUserRole', currentUserRole)
  provide('checkedData', checkedData)
  provide('dataType', dataType)
  provide('projectDetailQueryTableRef', projectDetailQueryTableRef)
  provide(PermissionInjectionKey, {
    get permissions() {
      return userRoleSelectorRef.value?.permissions || []
    },
    get isLoading() {
      return userRoleSelectorRef.value?.loading || false
    }
  })

  const getRoleHandle = async () => {
    if (userRoleSelectorRef.value) {
      isShowPage.value = userRoleSelectorRef.value.canRender
    }
  }

  // 获取帮助信息
  const getHelpMessageHandle = () => {
    if (helpModalRef.value) helpModalRef.value.showModal = true
  }

  return {
    isShowPage,
    projectDetailQueryTableRef,
    helpModalRef,
    userRoleSelectorRef,
    getRoleHandle,
    getHelpMessageHandle
  }
}

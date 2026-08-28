import { UserRole } from '@/components/UserRoleSelector/interface'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { ref, provide } from 'vue'

export const useCapital = () => {
  const isShowPage = ref(false)
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const year = new Date().getFullYear().toString()
  const nd = ref<string>(year)
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
  const getRoleHandle = async () => {
    if (userRoleSelectorRef.value) {
      isShowPage.value = userRoleSelectorRef.value.canRender
    }
  }

  provide('nd', nd)
  provide('currentUserRole', currentUserRole)

  return {
    userRoleSelectorRef,
    getRoleHandle,
    isShowPage
  }
}

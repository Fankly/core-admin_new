import { nextTick, provide, ref, unref } from 'vue'
import type { Ref } from 'vue'
import HelpModal from '@/components/HelpModal/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import {
  CheckedRowsInjectionKey,
  CrudSearchApiInjectionKey,
  CrudTableRefInjectionKey,
  CurrentUserRoleInjectionKey,
  defaultUserRole
} from '@/views/suzhou/common/types/crud'
import type { CrudQueryParams, CrudRequest, CrudTableExpose } from '@/views/suzhou/common/types/crud'
import { useStore } from 'vuex'

export const useCrudPage = <T = any>(searchApi: CrudRequest, defaultSearchParams: CrudQueryParams = {}) => {
  const isShowPage = ref(false)
  const checkedData = ref<T[]>([])
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const materialTableRef = ref<CrudTableExpose>()
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()
  const currentUserRole = ref<UserRole>(defaultUserRole())
  const store = useStore()

  provide(CurrentUserRoleInjectionKey, currentUserRole)
  provide(CheckedRowsInjectionKey, checkedData as Ref<any[]>)
  provide(CrudTableRefInjectionKey, materialTableRef)
  provide(CrudSearchApiInjectionKey, searchApi)

  // UserRoleSelector still consumes this legacy string key.
  provide('currentUserRole', currentUserRole)
  provide('checkedData', checkedData)
  provide('materialTableRef', materialTableRef)
  provide('searchFn', searchApi)

  provide(PermissionInjectionKey, {
    get permissions() {
      return unref(userRoleSelectorRef.value?.permissions) || []
    },
    get isLoading() {
      return Boolean(unref((userRoleSelectorRef.value as any)?.loading))
    }
  })

  const getRoleHandle = async () => {
    if (!userRoleSelectorRef.value) return
    isShowPage.value = Boolean(unref(userRoleSelectorRef.value.canRender))
    if (!isShowPage.value) return
    await nextTick()
    await materialTableRef.value?.searchData({ ...defaultSearchParams }, { resetPage: true })
    store.commit('setSZWLlobalInfo', userRoleSelectorRef.value.currentUserRole)
  }

  const getHelpMessageHandle = () => {
    if (helpModalRef.value) helpModalRef.value.showModal = true
  }

  return {
    isShowPage,
    materialTableRef,
    helpModalRef,
    userRoleSelectorRef,
    currentUserRole,
    getRoleHandle,
    getHelpMessageHandle
  }
}

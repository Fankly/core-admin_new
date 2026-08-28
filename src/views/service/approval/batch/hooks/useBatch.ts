import { UserRole } from '@/components/UserRoleSelector/interface'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import { ref, provide, reactive } from 'vue'
import { RowVO } from '@/views/targetBudget/provinceTarget/types/provinceTarget'
import { ElForm, ElMessage } from 'element-plus'
import { getPageData } from '@/api/service/IhhsMeeting/approval/batch'
import { getPublicCodeList } from '@/api/common'

export const useBatch = () => {
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const curYear = new Date().getFullYear().toString()
  const searchFormRef = ref<InstanceType<typeof ElForm>>()
  const isShowPage = ref(false)
  const loading = ref(false)
  const selectedData = ref<RowVO[]>([])
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
  const ndList = ref<{ code: string; name: string }[]>([])
  const tableData = ref<RowVO[]>([])
  const searchForm = ref({
    nd: curYear,
    pspcCode: '',
    pspcName: ''
  })

  const page = reactive({
    total: 0,
    limit: 20,
    page: 1,
    current: '1'
  })

  const initParams = async () => {
    const codes = ['ZLYS_XMJHSSND']
    try {
      const res = await getPublicCodeList({
        codes: codes
      })
      if (!res.success) throw new Error(res.msg)
      ndList.value = res.data[codes[0]]
    } catch (error) {
      ndList.value = []
    }
  }

  const getRoleHandle = async () => {
    if (userRoleSelectorRef.value) {
      isShowPage.value = userRoleSelectorRef.value.canRender
      await initParams()
      await searchMainPageData()
    }
  }

  // 查询列表数据
  const searchMainPageData = async () => {
    loading.value = true
    try {
      const res = await getPageData({
        ...searchForm.value,
        bmId: currentUserRole.value.bmId,
        dwId: currentUserRole.value.dwId,
        roleCode: currentUserRole.value.roleCode,
        roleId: currentUserRole.value.roleId,
        page: page.page,
        limit: page.limit
      })
      if (!res.success) throw new Error(res.msg)
      tableData.value = res.data.records || []
      page.total = res.data.total || 0
      selectedData.value = []
    } catch (error) {
      ElMessage({
        duration: 1500,
        type: 'error',
        message: (error as Error).message
      })
    } finally {
      loading.value = false
    }
  }

  // 重置数据
  const resetData = () => {
    searchFormRef.value?.resetFields()
    page.limit = 20
    page.page = 1
    searchMainPageData()
  }

  provide('currentUserRole', currentUserRole)
  provide('selectedData', selectedData)
  provide('page', page)
  provide('searchForm', searchForm)
  provide('tableData', tableData)
  provide(PermissionInjectionKey, {
    get permissions() {
      return userRoleSelectorRef.value?.permissions || []
    },
    get isLoading() {
      return userRoleSelectorRef.value?.loading || false
    }
  })

  return {
    page,
    isShowPage,
    userRoleSelectorRef,
    searchFormRef,
    searchForm,
    currentUserRole,
    searchMainPageData,
    resetData,
    ndList,
    loading,
    getRoleHandle
  }
}

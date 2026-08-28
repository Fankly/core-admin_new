import { provide, reactive, ref } from 'vue'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { UserRole } from '@/components/UserRoleSelector/interface'
import Operation from '@/views/targetBudget/provinceTarget/components/Operation.vue'
import Table from '@/views/targetBudget/provinceTarget/components/Table.vue'
import Search from '@/views/targetBudget/provinceTarget/components/Search.vue'
import { PublicCode, RowVO } from '@/views/targetBudget/provinceTarget/types/provinceTarget'
import { getPublicCodeList } from '@/api/common'
import { getVersionPage } from '@/api/targetBudget/provinceTarget'
import { ElMessage } from 'element-plus'

export const useProvinceTarget = () => {
  const isShowPage = ref(false)
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const operationRef = ref<InstanceType<typeof Operation>>()
  const tableRef = ref<InstanceType<typeof Table>>()
  const searchRef = ref<InstanceType<typeof Search>>()
  const buttonPermissions = ref<string[]>([])
  const selectedData = ref<RowVO[]>([])
  const searchForm = reactive({
    versionName: '',
    status: '',
    gkbmName: ''
  })
  const tableData = ref<RowVO[]>([])
  const year = new Date().getFullYear().toString()
  const nd = ref<string>(year)
  // 年度数据
  const ndList = ref<PublicCode[]>([])
  // 状态数据
  const statusList = ref<PublicCode[]>([])
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
  const page = reactive({
    total: 0,
    limit: 20,
    page: 1,
    current: '1'
  })

  provide('currentUserRole', currentUserRole)
  provide('buttonPermissions', buttonPermissions)
  provide('selectedData', selectedData)
  provide('searchForm', searchForm)
  provide('nd', nd)
  provide('page', page)
  provide('tableData', tableData)

  const getRoleHandle = async () => {
    if (userRoleSelectorRef.value) {
      isShowPage.value = userRoleSelectorRef.value.canRender
      buttonPermissions.value = await userRoleSelectorRef.value.getButtonPermissions()
      searchMainPageData()
    }
  }

  // 查询列表数据
  const searchMainPageData = async () => {
    try {
      const res = await getVersionPage({
        nd: nd.value,
        ...searchForm,
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
    }
  }

  // 获取公共代码数据
  const getPublicCodeData = async () => {
    try {
      const res = await getPublicCodeList({
        codes: ['SYTC_MBZ_VER_STATUS', 'NDCX']
      })
      if (!res.success) throw new Error(res.msg)
      ndList.value = res.data['NDCX']
      statusList.value = res.data['SYTC_MBZ_VER_STATUS']
    } catch (error) {
      ElMessage({
        duration: 1500,
        type: 'error',
        message: `获取年度和状态数据失败:${(error as Error).message}`
      })
      ndList.value = []
      statusList.value = []
    }
  }

  return {
    getPublicCodeData,
    getRoleHandle,
    userRoleSelectorRef,
    ndList,
    statusList,
    operationRef,
    tableRef,
    searchRef,
    isShowPage,
    searchMainPageData
  }
}

import { inject, Ref, ref } from 'vue'
import { SearchParams, UnitLevel } from '@/views/service/budget/budgeting/types/budgeting'
import { getPublicCodeList } from '@/api/common'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { UserRole } from '@/components/UserRoleSelector/interface'
import { BaseMethod } from '@/api/base/BaseMethod'
import { useBudgetingTable } from '@/views/service/budget/budgeting/hooks/useBudgetingTable'

export const useBudgetingSearch = () => {
  const baseMethod = new BaseMethod()
  const { searchData } = useBudgetingTable()
  const formRef = ref()
  const searchForm = inject<Ref<SearchParams>>(
    'searchForm',
    ref({
      ejdw: '',
      gwxmbms: '',
      xmStatus: '',
      xmbName: '',
      xmbms: '',
      xmmc: '',
      yjdw: '',
      ysStatus: ''
    })
  )
  const currentUserRole = inject<Ref<UserRole>>(
    'currentUserRole',
    ref({
      bmName: '',
      dwName: '',
      bmId: '',
      roleId: '',
      roleCode: '',
      dwId: '',
      specialOrgCode: '',
      spRoleId: ''
    })
  )

  const unitLevelOneList = ref<UnitLevel[]>([])
  const unitLevelTwoList = ref<UnitLevel[]>([])

  const budgetStatusList = ref([])
  const projectFlowStatusList = ref([])

  // 获取一二级单位
  const getParentUnitList = async () => {
    const unitLevelOneRes = await baseService.post('/bizOrgTree/getYjdw', {
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId
    })
    unitLevelOneList.value = unitLevelOneRes.data
  }
  const getChildUnitList = async (parentUnitCode: string) => {
    unitLevelTwoList.value = []
    searchForm.value['ejdw'] = ''
    if (parentUnitCode) {
      const ejdwData = await baseService.post('/bizOrgTree/getEjdw', {
        YJDW: parentUnitCode,
        bmId: currentUserRole.value.bmId,
        dwId: currentUserRole.value.dwId,
        parentCode: parentUnitCode
      })
      unitLevelTwoList.value = ejdwData.data || []
    }
  }

  // 获取公共代码数据
  const getCommonCodeList = async () => {
    try {
      const commonCodeArr = ['CIRCUL_STATUS', 'YSFS_COM']
      const commonCodeDataRes = await getPublicCodeList({
        codes: commonCodeArr
      })
      if (!commonCodeDataRes.success) throw new Error(commonCodeDataRes.msg)
      projectFlowStatusList.value = commonCodeDataRes.data['CIRCUL_STATUS']
      budgetStatusList.value = commonCodeDataRes.data['YSFS_COM']
    } catch (e) {
      showErrorMsg(e as Error)
    }
  }

  const showErrorMsg = (error: Error): void => {
    ElMessage({
      message: `${error.message}`,
      type: 'error',
      duration: 5000
    })
  }

  const handleResetData = async () => {
    formRef.value.resetFields()
    unitLevelTwoList.value = []
    await handleSearchData()
  }
  const handleSearchData = searchData

  return {
    formRef,
    searchForm,
    handleResetData,
    handleSearchData,
    unitLevelOneList,
    unitLevelTwoList,
    budgetStatusList,
    projectFlowStatusList,
    getParentUnitList,
    getChildUnitList,
    getCommonCodeList
  }
}

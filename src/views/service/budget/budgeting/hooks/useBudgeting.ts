import { provide, reactive, ref } from 'vue'
import type HelpModal from '@/components/HelpModal/index.vue'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type BudgetingTable from '@/views/service/budget/budgeting/modules/BudgetingTable.vue'
import { UserRole } from '@/components/UserRoleSelector/interface'
import { RowVO, SearchParams } from '@/views/service/budget/budgeting/types/budgeting'
import { ContextProps } from '@/components/ReSplitPane'

export const useBudgeting = () => {
  const checkedData = ref<RowVO[]>([])
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const budgetingTableRef = ref<InstanceType<typeof BudgetingTable>>()
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()
  const gridRef = ref()
  const colRef = ref()
  const settingLR: ContextProps = reactive({
    minPercent: 15,
    defaultPercent: 15,
    split: 'vertical'
  })
  const isShowPage = ref(false)
  const isShowSearch = ref(true)
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
  const searchForm = ref<SearchParams>({
    ejdw: '',
    gwxmbms: '',
    xmStatus: '',
    xmbName: '',
    xmbms: '',
    xmmc: '',
    yjdw: '',
    ysStatus: ''
  })

  const year = ref('')
  const colSetting = ref([])
  const activeTab = ref('0')

  provide('currentUserRole', currentUserRole)
  provide('gridRef', gridRef)
  provide('year', year)
  provide('searchForm', searchForm)
  provide('activeTab', activeTab)
  provide('checkedData', checkedData)

  const initPublicParams = () => {
    year.value = new Date().getFullYear().toString()
  }

  const getRoleHandle = async () => {
    if (userRoleSelectorRef.value) {
      isShowPage.value = userRoleSelectorRef.value.canRender
    }
  }

  // 获取帮助信息
  const getHelpMessageHandle = () => {
    if (helpModalRef.value) helpModalRef.value.showModal = true
  }

  const handleIsShowSearch = () => {
    isShowSearch.value = !isShowSearch.value
  }

  const openColSetting = () => {
    colSetting.value = budgetingTableRef.value?.getColumnsData() || []
    colRef.value.openColSetting()
  }

  return {
    openColSetting,
    budgetingTableRef,
    colRef,
    gridRef,
    colSetting,
    settingLR,
    handleIsShowSearch,
    isShowSearch,
    activeTab,
    initPublicParams,
    currentUserRole,
    isShowPage,
    userRoleSelectorRef,
    helpModalRef,
    getRoleHandle,
    getHelpMessageHandle
  }
}

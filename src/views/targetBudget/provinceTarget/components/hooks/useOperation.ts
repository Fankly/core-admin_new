import { computed, inject, reactive, Ref, ref, toRef } from 'vue'
import { DropDownData, OperationProps, Page, RowVO } from '@/views/targetBudget/provinceTarget/types/provinceTarget'
import TargetBudgetVersion from '@/views/targetBudget/provinceTarget/components/TargetBudgetVersion.vue'
import TargetBudgetMaintain from '@/views/targetBudget/provinceTarget/components/TargetBudgetMaintain.vue'
import TargetBudgetVersionCompare from '@/views/targetBudget/provinceTarget/components/TargetBudgetVersionCompare.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import { ElMessage } from 'element-plus'
import { UserRole } from '@/components/UserRoleSelector/interface'
import { provinceTargetDeleteVersion } from '@/api/targetBudget/provinceTarget'
import { VXETable } from 'vxe-table'
import { validateDeptData, validatePro } from '../../utils'
import { useProcess } from '@/hooks/useProcess'
import { getProcessMessage } from '@/api/common'

export const useOperation = (props: OperationProps) => {
  const selecteWarningMsg = '请选择一条数据,进行操作!'
  const CREATE_VALIDATE_MESSAGE = '省预算处正在进行目标值调整，暂不支持平衡调整，请稍候！'
  const EDIT_VALIDATE_MESSAGE = '省预算处正在进行目标值调整，暂不支持平衡调整，请稍候！'

  const bmName = ref('')

  const OPERATION_STATUS = ['1', '4']

  const selectedData = inject<Ref<RowVO[]>>('selectedData')!
  const currentUserRole = inject<Ref<UserRole>>('currentUserRole')!
  const page = inject<Page>('page')!

  const targetBudgetVersionRef = ref<InstanceType<typeof TargetBudgetVersion>>()
  const targetBudgetMaintainRef = ref<InstanceType<typeof TargetBudgetMaintain>>()
  const targetBudgetVersionCompareRef = ref<InstanceType<typeof TargetBudgetVersionCompare>>()
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()
  const buttonPermissions = inject<Ref<string[]>>('buttonPermissions')!
  const nd = inject<Ref<string>>('nd')!
  const btnDisabledStatus = ref(false)
  const ndList = toRef(props, 'ndList')
  const processData = reactive({
    isShowDialog: false,
    isShowLog: false,
    searchApi: getProcessMessage,
    compName: null,
    id: ''
  })

  const hasSelected = computed(() => selectedData.value.length !== 1)

  // 版本管理 创建
  const handleVersionCreate = async () => {
    // 校验本部门创建初始
    const validateDept = await validateDeptData(currentUserRole.value.bmId, nd.value)
    if (validateDept && (validateDept !== '0' || validateDept !== 0)) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: '已存在"草稿"、"审核驳回"或"已提交"状态的版本,无法创建新版本!'
      })
      return
    }

    // 校验省部门创建初始
    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: nd.value
    })
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: CREATE_VALIDATE_MESSAGE
      })
      return
    }
    const params = {
      operationFlag: 'CREATE',
      ...currentUserRole.value,
      bmName: validateResult['bmName'] || currentUserRole.value.bmName,
      nd: nd.value
    }
    // 打开modal
    targetBudgetVersionRef.value.acceptParams(params)
  }

  // 编辑
  const handleVersionEdit = async () => {
    // 判断是否选择一条数据,进行编辑
    if (hasSelected.value) {
      handleTipsMessage(selecteWarningMsg, 'warning')
      return
    }
    // 判断选择数据的状态
    if (!OPERATION_STATUS.includes(selectedData.value[0].status.toString())) {
      handleTipsMessage('仅“草稿”和“审核驳回”状态支持编辑操作!', 'warning')
      return
    }
    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: nd.value
    })
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: EDIT_VALIDATE_MESSAGE
      })
      return
    }
    const params = {
      operationFlag: 'EDIT',
      ...currentUserRole.value,
      ...selectedData.value[0],
      bmName: validateResult['bmName'] || currentUserRole.value.bmName,
      nd: nd.value
    }
    // 打开modal
    targetBudgetVersionRef.value.acceptParams(params)
  }

  // 版本比对
  const handleVersionCompare = () => {
    // 判断是否选择一条数据,进行比对
    if (selectedData.value && selectedData.value.length !== 2) {
      handleTipsMessage('请选择两条数据,进行数据比对!', 'warning')
      return
    }
    const params = {
      operationFlag: 'EDIT',
      ...currentUserRole.value,
      selectedData: selectedData.value,
      bmName: currentUserRole.value.bmName,
      nd: nd.value
    }
    // 打开modal
    targetBudgetVersionCompareRef.value.acceptParams(params)
  }

  // 删除
  const handleVersionDelete = async () => {
    // 判断是否选择一条数据,进行删除
    if (selectedData.value && selectedData.value.length === 0) {
      handleTipsMessage('请至少选择一条数据!', 'warning')
      return
    }
    // 判断选择数据的状态
    const statusRes = selectedData.value.some((item) => !OPERATION_STATUS.includes(item.status.toString()))
    if (statusRes) {
      handleTipsMessage('仅“草稿”和“审核驳回”状态支持删除操作!', 'warning')
      return
    }
    try {
      // 调用删除接口
      const ids = selectedData.value.map((item) => item.id)
      // 确认框
      const type = await VXETable.modal.confirm('确认是否删除?', '提示', {
        status: 'question',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'confirm') {
        const res = await provinceTargetDeleteVersion(ids)
        if (!res.success) throw new Error(res.data)
        ElMessage.success('保存成功!')
        props.search()
      }
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    }
  }

  // 目标值管理
  const handleTargetMaintain = async () => {
    // 判断是否选择一条数据,进行编辑
    if (hasSelected.value) {
      handleTipsMessage(selecteWarningMsg, 'warning')
      return
    }
    // 判断选择数据的状态
    const statusRes = selectedData.value.some((item) => !OPERATION_STATUS.includes(item.status.toString()))
    if (statusRes) {
      handleTipsMessage('仅“草稿”和“审核驳回”状态支持维护操作!', 'warning')
      return
    }
    const validateResult = await validatePro(
      {
        bmId: currentUserRole.value.bmId,
        dwId: currentUserRole.value.dwId,
        nd: nd.value
      },
      false
    )
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: '省预算处正在进行目标值调整，暂不支持平衡调整，请稍候！'
      })
      return
    }
    const params = {
      isChangeData: false,
      operationFlag: 'EDIT',
      ...currentUserRole.value,
      ...selectedData.value[0],
      bmName: validateResult['bmName'] || currentUserRole.value.bmName,
      nd: nd.value
    }
    // 打开modal
    targetBudgetMaintainRef.value?.acceptParams(params)
  }
  const handleTargetView = () => {
    // 判断是否选择一条数据,进行编辑
    if (hasSelected.value) {
      handleTipsMessage(selecteWarningMsg, 'warning')
      return
    }
    const params = {
      operationFlag: 'VIEW',
      ...currentUserRole.value,
      ...selectedData.value[0],
      nd: nd.value
    }
    // 打开modal
    targetBudgetMaintainRef.value?.acceptParams(params)
  }

  // 流程履历
  const handleProcess = () => {
    if (hasSelected.value) {
      handleTipsMessage(selecteWarningMsg, 'warning')
      return
    }
    useProcess(selectedData.value, processData)
  }

  // 年度日期
  const handleChangeNdData = () => {
    page.page = 1
    props.search()
  }

  const dropDownMenu = ref<DropDownData[]>([
    {
      label: '版本管理',
      permission: 'VERSION',
      type: 'dropdown',
      children: [
        {
          label: '版本创建',
          permission: 'VERSION_ADD',
          click: handleVersionCreate
        },
        {
          label: '版本编辑',
          permission: 'VERSION_EDIT',
          click: handleVersionEdit
        },
        {
          label: '版本比对',
          permission: 'VERSION_COMPARE',
          click: handleVersionCompare
        },
        {
          label: '版本删除',
          permission: 'VERSION_DELETE',
          click: handleVersionDelete
        }
      ]
    },
    {
      label: '目标值管理',
      permission: 'TARGETVALUE',
      type: 'dropdown',
      children: [
        {
          label: '目标值维护',
          permission: 'TARGETVALUE_MAINTAIN',
          click: handleTargetMaintain
        },
        {
          label: '目标值查看',
          permission: 'TARGETVALUE_VIEW',
          click: handleTargetView
        }
      ]
    },
    {
      label: '流程履历',
      permission: 'PROCESS',
      click: handleProcess,
      type: 'button'
    }
  ])

  // 初始化信息
  const initMessage = async () => {
    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: nd.value
    })
    if (validateResult) bmName.value = validateResult['bmName'] || currentUserRole.value.bmName
  }

  const checkPermissions = (permission: string): boolean => {
    if (!permission) return false
    return buttonPermissions.value.includes(permission)
  }

  const handleTipsMessage = (warnMsg: string, type: 'warning' | 'success' | 'error') => {
    ElMessage({
      message: warnMsg,
      type: type,
      duration: 1500
    })
  }

  const getHelpMessageHandle = () => {
    helpModalRef.value.showModal = true
  }

  initMessage()

  return {
    ndList,
    nd,
    bmName,
    targetBudgetVersionRef,
    targetBudgetMaintainRef,
    targetBudgetVersionCompareRef,
    checkPermissions,
    dropDownMenu,
    handleChangeNdData,
    getHelpMessageHandle,
    helpModalRef,
    btnDisabledStatus,
    processData,
    buttonPermissions
  }
}

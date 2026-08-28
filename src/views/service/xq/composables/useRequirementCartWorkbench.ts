import {
  deleteXm,
  exportXm,
  finishHandleOperations,
  getBqshFlag,
  getDynamicSearchColumn,
  getDynamicTableByUser,
  getTbcPage,
  getXqlrPage,
  isNeedCheck,
  submit,
  submitCbxqsh,
  ykxmBack,
  checkWhenSubmitXm
} from '@/api/service/requirement'
import { useProcess } from '@/hooks/useProcess'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import baseService from '@/service/baseService'
import { validatePreAudit } from '@/utils/preAudit'
import { formatNumValue } from '@/utils/utils'
import { Configs } from '@/views/service/xq/interface'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useStore } from 'vuex'
import VXETable, { VxeGridProps } from 'vxe-table'

interface RowVo {
  id: string
  ztName: string
  xmbm: string
  xmmc: string
  amount: string
  xmlx: string
  zdtx: string
  yssx: string
  sjflName: string
  gkbm_name: string
  yjdwName: string
  ejdwName: string
  cbzxName: string
  createTime: string
  cjr: string
  lyxt_name: string
  yssx_new_id: string
  xqlr_wf_code?: string
}

type MaybeRef<T> = T | { value: T }

interface RequirementCartWorkbenchOptions {
  userInfo: MaybeRef<Record<string, any>>
  submitLevel: MaybeRef<string | undefined>
}

export const useRequirementCartWorkbench = (options: RequirementCartWorkbenchOptions) => {
  const store = useStore()
  const formRef = ref()
  const matterRef = ref()
  const dynamicReportsRef = ref()
  const createDeptEditModalRef = ref()
  const selectData = ref<RowVo>()
  const selectDatas = ref<RowVo[]>()
  const gridRef = ref()
  const editPageRef = ref()
  const queryProTypeModalRef = ref()
  const gridSecRef = ref()
  const searchCode = ref('XQLR')
  const activeName = ref('first')
  const dynamciSearch = ref<Configs[]>([])
  const searchDatas = ref<any>({})
  const searchSecDatas = ref<any>({})
  const linkLength = ref(0)
  const loading = ref(false)
  const flag = ref('EDIT')
  const title = '高级设置'

  const resolveValue = <T>(value: MaybeRef<T>): T => {
    if (value && typeof value === 'object' && 'value' in value) {
      return value.value
    }
    return value as T
  }

  const getUserInfo = (): Record<string, any> => resolveValue(options.userInfo) || {}
  const getSubmitLevel = () => resolveValue(options.submitLevel)

  const processData = reactive<any>({
    isShowDialog: false,
    compName: null,
    id: ''
  })

  const searchData = ref<{
    [key: string]: any
  }>({})

  const page = reactive({
    total: 0,
    limit: 20,
    page: 1
  })

  const pageSec = reactive({
    total: 0,
    limit: 20,
    page: 1
  })

  const secColumns = [
    {
      type: 'checkbox',
      width: 80
    },
    {
      title: '项目编码',
      field: 'xmbm',
      width: 180
    },
    {
      title: '项目名称',
      field: 'xmmc',
      width: 180
    },
    {
      title: '是否打捆',
      field: 'pack',
      width: 180,
      formatter: ({ cellValue }: any) => {
        return cellValue ? '是' : '否'
      }
    },
    {
      title: '申报预算（万元）',
      field: 'amount',
      width: 180,
      align: 'right',
      formatter: ({ cellValue }: any) => {
        return formatNumValue(cellValue, 6)
      }
    },
    {
      title: '一级分类',
      field: 'yjfl',
      width: 180
    },
    {
      title: '二级分类',
      field: 'ejfl',
      width: 180
    },
    {
      title: '三级分类',
      field: 'sjfl',
      width: 180
    },
    {
      title: '一级单位',
      field: 'yjdw',
      width: 180
    },
    {
      title: '二级单位',
      field: 'ejdw',
      width: 180
    },
    {
      title: '成本中心',
      field: 'applyCenter',
      width: 180
    },
    {
      title: '创建部门',
      field: 'createDeptName',
      width: 180
    },
    {
      title: '创建人',
      field: 'creator',
      width: 180
    }
  ]

  const gridOptions = reactive<VxeGridProps<RowVo>>({
    border: true,
    columnConfig: {
      resizable: true
    },
    loading: false,
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    height: '100%',
    rowConfig: {
      height: 32
    },
    columns: [],
    rowStyle: ({ row }: any) => {
      if (['Q01', 'Q02', 'Q03'].includes(row['zt'])) {
        return { color: 'red' }
      }
    }
  })

  const gridSecOptions = reactive<any>({
    border: true,
    columnConfig: {
      resizable: true
    },
    loading: false,
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    height: '100%',
    rowConfig: {
      height: 32
    },
    columns: []
  })

  const spanComp = () =>
    linkLength.value % 4 === 0 ? 24 : linkLength.value % 4 === 1 ? 18 : linkLength.value % 4 === 2 ? 12 : linkLength.value % 4 === 3 ? 6 : 24

  const confirmSubmitModal = async (message = '确认是否提交?') => {
    return VXETable.modal.confirm(message, '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
  }

  const isZeroReviewResult = (value: any) => value === 0 || value === '0'

  const hasJointReviewZeroResult = (record: any) => isZeroReviewResult(record.xxhs_jl_cw) || isZeroReviewResult(record.xxhs_jl_fz)

  const shouldShowJointReviewConfirm = (records: any[]) => records.every((record: any) => hasJointReviewZeroResult(record))

  const shouldShowJointReviewWarning = (records: any[]) =>
    records.some((record: any) => hasJointReviewZeroResult(record)) && !shouldShowJointReviewConfirm(records)

  const searchDataHandle = async () => {
    const currentUser = getUserInfo()
    loading.value = true
    const getPageData = await getXqlrPage({
      ...searchDatas.value,
      limit: page.limit,
      page: page.page,
      bmId: currentUser.deptId || '',
      dwId: currentUser.dwId || '',
      searchCode: searchCode.value
    })
    if (getPageData.success) {
      gridOptions.data = getPageData.data.records
      page.total = getPageData.data.total
    }
    loading.value = false
  }

  const submitDirectlyHandle = async (submitListIds: string[]) => {
    const res = await submit(submitListIds)
    if (res.success) {
      ElMessage.success('提交成功')
      await searchDataHandle()
    } else {
      ElMessage.error(res.msg)
    }
  }

  const initParamsData = async (method: any, params: any): Promise<any[]> => {
    const res = await baseService.post(method, params)
    if (res.success) {
      return res.data
    } else {
      ElMessage.error(res.msg)
      return []
    }
  }

  const pageChangeHandle = (currentPageNum: number) => {
    if (activeName.value === 'first') {
      page.page = currentPageNum
      searchDataHandle()
    } else {
      pageSec.page = currentPageNum
      getSecTableData()
    }
  }

  const limitChangeHandle = (currentLimitNum: number) => {
    if (activeName.value === 'first') {
      page.page = 1
      page.limit = currentLimitNum
      searchDataHandle()
    } else {
      pageSec.page = 1
      pageSec.limit = currentLimitNum
      getSecTableData()
    }
  }

  const settingHandle = () => {
    dynamicReportsRef.value.isShowDrawer = true
  }

  const openModal = () => {
    const $grid = gridSecRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      if (records && records.length !== 1) {
        ElMessage.warning('请选择一条数据进行操作!')
        return
      }
      const row = records[0] || {}
      const params = {
        row: row,
        getTableData: getSecTableData,
        getFirstTableData: searchDataHandle
      }
      queryProTypeModalRef.value.acceptParams(params)
    }
  }

  const handleFieldChange = async (prop: string, value: any, column: Configs) => {
    const currentUser = getUserInfo()
    if (prop === 'yjdw') {
      if (value) {
        const findData: any = dynamciSearch.value.find((search) => search.code === 'ejdw')
        const ejdwData = await baseService.post(findData.dyff, {
          YJDW: value,
          bmId: currentUser.deptId || '',
          dwId: currentUser.dwId || '',
          parentCode: value
        })
        findData.options = ejdwData.data || []
      } else {
        const findData: any = dynamciSearch.value.find((search) => search.code === 'ejdw')
        findData.options = []
        if (Array.isArray(searchDatas.value[findData.code])) {
          searchDatas.value[findData.code] = []
        } else {
          searchDatas.value[findData.code] = ''
        }
      }
    }

    if (prop === 'yjfl') {
      if (value) {
        const findEjflData: any = dynamciSearch.value.find((search) => search.code === 'ejfl')
        const ejflData = await baseService.post(findEjflData.dyff, {
          bmId: currentUser.deptId || '',
          dwId: currentUser.dwId || '',
          code: column.ggdm,
          parentCode: value
        })
        findEjflData.options = ejflData.data || []
      } else {
        const findData: any = dynamciSearch.value.find((search) => search.code === 'ejfl')
        const findSjflData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
        findData.options = []
        findSjflData.options = []
        if (Array.isArray(searchDatas.value[findData.code])) {
          searchDatas.value[findData.code] = []
          searchDatas.value[findSjflData.code] = []
        } else {
          searchDatas.value[findData.code] = ''
          searchDatas.value[findSjflData.code] = ''
        }
      }
    }

    if (prop === 'ejfl') {
      if (value) {
        const findData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
        const sjflData: any = await baseService.post(findData.dyff, {
          bmId: currentUser.deptId || '',
          dwId: currentUser.dwId || '',
          code: column.ggdm,
          parentCode: value
        })
        findData.options = sjflData.data || []
      } else {
        const findData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
        findData.options = []
        if (Array.isArray(searchDatas.value[findData.code])) {
          searchDatas.value[findData.code] = []
        } else {
          searchDatas.value[findData.code] = ''
        }
      }
    }
  }

  const editHandle = () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      if (records && records.length !== 1) {
        ElMessage.warning('请选择一条数据进行修改!')
        return
      }
      selectData.value = records[0] as RowVo
      if (!selectData.value['yssx_new_id']) {
        ElMessage.warning('当前项目未关联事项，请先关联事项!')
        return
      }
      const isReadOnly = records.some((item: any) => item.read_only == '1')
      if (isReadOnly) return ElMessage.warning('该项目了类型不允许修改，请通过专业系统进行调整！')
      flag.value = 'EDIT'
      editPageRef.value.isShowModal = true
    }
  }

  const matterHandle = async () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      if (records && records.length === 0) {
        ElMessage.warning('请选择至少一条数据进行事项关联!')
        return
      }
      const type = await VXETable.modal.confirm('确认是否进行事项关联?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'confirm') {
        if (records && records.length > 0) {
          const xmlx = records.filter((item: any) => item.xmlx !== records[0].xmlx)
          if (xmlx.length !== 0) {
            ElMessage.warning('不同项目类型项目不能进行事项关联!')
            return
          }
          selectDatas.value = records
          matterRef.value.isShowModal = true
        }
      }
    }
  }

  const deleteHandle = async () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      if (records && records.length === 0) {
        ElMessage.warning('请选择至少一条数据进行删除!')
        return
      }
      const type = await VXETable.modal.confirm('确认是否删除?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'confirm') {
        const submitListIds = records.map((item: any) => item.id)
        const res = await deleteXm({
          xmIds: submitListIds
        })
        if (res.success) {
          ElMessage.success('删除成功')
          await searchDataHandle()
        } else {
          ElMessage.error(res.msg)
        }
      }
    }
  }

  const createDeptHandle = async () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      if (records && records.length === 0) {
        ElMessage.warning('请选择至少一条数据进行创建部门修改!')
        return
      }
      if (records && records.length > 0) {
        const ejdw = records.filter((item: any) => item.ejdw !== records[0].ejdw)
        if (ejdw.length !== 0) {
          ElMessage.warning('不同的二级单位不能同时进行创建部门修改!')
          return
        }
        createDeptEditModalRef.value?.acceptParams({
          selectDatas: records,
          search: searchDataHandle
        })
      }
    }
  }

  const backHandle = async () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      if (records && records.length === 0) {
        ElMessage.warning('请选择至少一条数据进行退回!')
        return
      }
      const type = await VXETable.modal.confirm('确认是否退回?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'confirm') {
        const submitListIds = records.map((item: any) => item.id)
        const res = await ykxmBack({
          xmIds: submitListIds
        })
        if (res.success) {
          ElMessage.success('退回成功')
          await searchDataHandle()
        } else {
          ElMessage.error(res.msg)
        }
      }
    }
  }

  const resetHandle = () => {
    for (const valueKey in searchDatas.value) {
      const data = searchDatas.value[valueKey]
      if (Array.isArray(data)) {
        searchDatas.value[valueKey].length = 0
      } else {
        searchDatas.value[valueKey] = ''
      }
    }
    searchDataHandle()
  }

  const resetSecHandle = () => {
    for (const valueKey in searchSecDatas.value) {
      const data = searchSecDatas.value[valueKey]
      if (Array.isArray(data)) {
        searchSecDatas.value[valueKey].length = 0
      } else {
        searchSecDatas.value[valueKey] = ''
      }
    }
    getSecTableData()
  }

  const wfParam = ref<WFParam>({
    XMIDS: '',
    CTBM: '',
    FQZZ: '',
    FQBM: ''
  })

  const getRecordWorkflowCode = (record: any) => `${record?.xqlr_wf_code || ''}`.trim()

  const validateSelectedWorkflowCode = (records: any[]) => {
    const wfCode = getRecordWorkflowCode(records[0])
    if (!wfCode) {
      ElMessage.warning('选中数据未配置工作流编码,请检查!')
      return ''
    }
    const someWorkflowCodeType = records.some((item: any) => getRecordWorkflowCode(item) !== wfCode)
    if (someWorkflowCodeType) {
      ElMessage.warning('选中数据的工作流编码必须一致,请检查!')
      return ''
    }
    return wfCode
  }

  const submitCbxqshWorkflowHandle = async (
    submitListIds: Array<string | number>,
    getDataRes: any,
    cityBm: string,
    sxgkbm: string,
    sfxysgksp: string,
    wfCode: string
  ) => {
    const currentUser = getUserInfo()
    const wfUserInfo: WFUserInfo = {
      userId: store.getters.getUserMsg.id,
      spOrgId: currentUser.deptId || '',
      spRoleId: currentUser.spRoleId || ''
    }

    wfParam.value.XMIDS = submitListIds.join(',')
    wfParam.value.FQZZ = currentUser.fqzzFlag
    wfParam.value.FQBM = currentUser.specialorgcode === 'BM_CWZC' ? 'CWB' : 'YWB'
    wfParam.value.AQBQSH = getDataRes.data.AQBQSH || ''
    wfParam.value.YFBQSH = getDataRes.data.YFBQSH || ''
    wfParam.value.DWLX = getDataRes.data.DWLX || ''
    wfParam.value.CTBM = cityBm || ''
    wfParam.value.SXGKBM = sxgkbm || ''
    wfParam.value.SFXYSGKSP = sfxysgksp || ''

    loading.value = true
    submitWorkflow(store.getters.getUserMsg.systemCode, wfCode, '', wfUserInfo, wfParam.value, {}, (nextPersonAndPath: string, wfData: WFData) =>
      submitWFCallback(nextPersonAndPath, wfData, wfCode)
    )
  }

  const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData, wfCode: string) => {
    const currentUser = getUserInfo()
    loading.value = true
    const spfrom = {
      userId: store.getters.getUserMsg.id,
      spOrgId: currentUser.deptId || '',
      spRoleId: currentUser.spRoleId || '',
      wfCode: wfCode,
      wfData: wfParam.value,
      nextPersonAndPath: nextPersonAndPath
    }
    const res = await submitCbxqsh({
      ...spfrom
    })
    if (res.success) {
      loading.value = false
      ElMessage.success('提交成功')
      await searchDataHandle()
    } else {
      loading.value = false
      const msg = res.msg.split('|').join('<br/>')
      ElMessage.error({
        type: 'error',
        dangerouslyUseHTMLString: true,
        message: msg
      })
    }
  }

  // 复制提交
  const submitWorkflowHandle = async () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      const currentUser = getUserInfo()
      if (records && records.length === 0) {
        ElMessage.warning('请选择至少一条数据进行提交!')
        return
      }
      if (records && records.length > 100) {
        ElMessage.warning('系统最多支持提交100条数据,建议您分批操作!')
        return
      }
      let workflowFlag = false
      const ctbm = records[0].ctbm
      const sxgkbm = records[0].sxgkbm
      const sfxysgksp = records[0].sfxysgksp
      if (records.length !== 1) {
        const xmlx = records[0].xmlx
        const someType = records.some((item: any) => item.xmlx !== xmlx)
        const someCtbmType = records.some((item: any) => item.ctbm !== ctbm)
        const someSgksp = records.some((item: any) => item.sxgkbm !== sxgkbm)
        const isGmb = records.some((item: any) => item.sfgmb === '1')
        if (isGmb) {
          ElMessage.warning('是否规模包为[是],只能单次提交!')
          return
        }
        if (someType) {
          ElMessage.warning('提交数据的项目类型必须一致,请检查!')
          return
        }
        if (someCtbmType) {
          ElMessage.warning('提交数据的市管部门必须一致,请检查!')
          return
        }
        if (someSgksp) {
          ElMessage.warning('提交数据的事项归口部门必须一致,请检查!')
          return
        }

        if (getSubmitLevel() != 'CITY') {
          const submitListDeptId = records
            .map((item: any) => item['create_dep_id'])
            .filter((createDepId: any) => createDepId != currentUser.deptId.toString())
          if (submitListDeptId && submitListDeptId.length !== 0) {
            ElMessage.warning('仅能提交当前登录用户所属部门数据!')
            return
          }
        }

        const workflowRecords = records.filter((item: any) => Number(item.sfxyxqsh) === 1)
        if (workflowRecords.length > 0 && workflowRecords.length < records.length) {
          ElMessage.warning('所选需求数据的审批方式不一致，包含需履行审批流程和无需履行审批流程的数据，无法合并提交，请分类选择后分别提交。')
          return
        }
        workflowFlag = workflowRecords.length === records.length
      } else {
        const record = records[0]
        if (Number(record['sfxyxqsh']) === 1) {
          workflowFlag = true
        } else {
          workflowFlag = false
        }
      }
      const submitListIds = records.map((item: any) => item.id)
      const submitListIdsStr = submitListIds.join(',')
      const jointReviewWorkflowSubmit = shouldShowJointReviewConfirm(records)
      const wfCode = workflowFlag || jointReviewWorkflowSubmit ? validateSelectedWorkflowCode(records) : ''
      if ((workflowFlag || jointReviewWorkflowSubmit) && !wfCode) {
        return
      }

      if (shouldShowJointReviewWarning(records)) {
        ElMessage.warning('选中数据中存在联合会审退回项目评审为“不通过”的数据，请分开提交!')
        return
      }

      // 确认是否提交之前做预审；level2/3 点「是」直接提交，不再二次确认
      const preAuditResult = await validatePreAudit(submitListIds)
      if (preAuditResult === false) {
        return
      }

      const confirmMessage = jointReviewWorkflowSubmit ? '联合会审退回项目评审为“不通过”，需重新审批流程，等待下次评审会议，是否提交？' : undefined
      const confirmed = preAuditResult === 'directSubmit' || (await confirmSubmitModal(confirmMessage)) === 'confirm'
      if (confirmed) {
        if (jointReviewWorkflowSubmit) {
          const getListRes = await getBqshFlag(submitListIdsStr, currentUser.dwId || '')
          if (getListRes.success) {
            await submitCbxqshWorkflowHandle(submitListIds, getListRes, ctbm, sxgkbm, sfxysgksp, wfCode)
          } else {
            ElMessage.error(getListRes.msg)
          }
          return
        }

        if (workflowFlag) {
          const res: any = await isNeedCheck({ yssxIds: submitListIdsStr })
          if (!res.success) return ElMessage.error(res.msg)
          const isFlag = res.data.flag
          const isMessage = res.data.msg

          if (isFlag == '1' && isMessage == '') {
            const getListRes = await getBqshFlag(submitListIdsStr, currentUser.dwId || '')
            if (getListRes.success) {
              await submitCbxqshWorkflowHandle(submitListIds, getListRes, ctbm, sxgkbm, sfxysgksp, wfCode)
            } else {
              ElMessage.error(getListRes.msg)
            }
            return
          }

          const text = await VXETable.modal.confirm(isMessage, '提示', {
            confirmButtonText: '是',
            cancelButtonText: '否'
          })
          if (text != 'confirm') return
          if (isFlag == '0') {
            const flowRes: any = await finishHandleOperations({ yssxIds: submitListIdsStr })
            if (flowRes.success) {
              ElMessage.success('提交成功')
              await searchDataHandle()
            } else {
              ElMessage.error(flowRes.msg)
            }
          } else {
            const getListRes = await getBqshFlag(submitListIdsStr, currentUser.dwId || '')
            if (getListRes.success) {
              await submitCbxqshWorkflowHandle(submitListIds, getListRes, ctbm, sxgkbm, sfxysgksp, wfCode)
            } else {
              ElMessage.error(getListRes.msg)
            }
          }
        } else {
          await submitDirectlyHandle(submitListIds)
        }
      }
    }
  }

  const submitsWorkflowHandle = async () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      const currentUser = getUserInfo()
      if (records && records.length === 0) {
        ElMessage.warning('请选择至少一条数据进行提交!')
        return
      }
      if (records && records.length > 100) {
        ElMessage.warning('系统最多支持提交100条数据,建议您分批操作!')
        return
      }
      let workflowFlag = false
      const ctbm = records[0].ctbm
      const sxgkbm = records[0].sxgkbm
      const sfxysgksp = records[0].sfxysgksp
      if (records.length !== 1) {
        const xmlx = records[0].xmlx
        const someType = records.some((item: any) => item.xmlx !== xmlx)
        const someCtbmType = records.some((item: any) => item.ctbm !== ctbm)
        const someSgksp = records.some((item: any) => item.sxgkbm !== sxgkbm)
        const isGmb = records.some((item: any) => item.sfgmb === '1')
        if (isGmb) {
          ElMessage.warning('是否规模包为[是],只能单次提交!')
          return
        }
        if (someType) {
          ElMessage.warning('提交数据的项目类型必须一致,请检查!')
          return
        }
        if (someCtbmType) {
          ElMessage.warning('提交数据的市管部门必须一致,请检查!')
          return
        }
        if (someSgksp) {
          ElMessage.warning('提交数据的事项归口部门必须一致,请检查!')
          return
        }

        if (getSubmitLevel() != 'CITY') {
          const submitListDeptId = records
            .map((item: any) => item['create_dep_id'])
            .filter((createDepId: any) => createDepId != currentUser.deptId.toString())
          if (submitListDeptId && submitListDeptId.length !== 0) {
            ElMessage.warning('仅能提交当前登录用户所属部门数据!')
            return
          }
        }

        const someWorkflowStatus = records.every((item: any) => Number(item.sfxyxqsh) === 1)
        if (someWorkflowStatus) {
          workflowFlag = true
        } else {
          workflowFlag = false
        }
      } else {
        const record = records[0]
        if (Number(record['sfxyxqsh']) === 1) {
          workflowFlag = true
        } else {
          workflowFlag = false
        }
      }
      const submitListIds = records.map((item: any) => item.id)
      const submitListIdsStr = submitListIds.join(',')
      const jointReviewWorkflowSubmit = shouldShowJointReviewConfirm(records)
      const wfCode = workflowFlag || jointReviewWorkflowSubmit ? validateSelectedWorkflowCode(records) : ''
      if ((workflowFlag || jointReviewWorkflowSubmit) && !wfCode) {
        return
      }

      const isCheck: any = await checkWhenSubmitXm(submitListIds)
      if (!isCheck.success) return ElMessage.error(isCheck.msg)
      const isData = isCheck.data
      if (!isData.success) return ElMessage.error(isData.msg)

      if (shouldShowJointReviewWarning(records)) {
        ElMessage.warning('选中数据中存在联合会审退回项目评审为“不通过”的数据，请分开提交!')
        return
      }

      // 确认是否提交之前做预审；level2/3 点「是」直接提交，不再二次确认
      const preAuditResult = await validatePreAudit(submitListIds)
      if (preAuditResult === false) {
        return
      }

      const confirmMessage = jointReviewWorkflowSubmit ? '联合会审退回项目评审为“不通过”，需重新审批流程，等待下次评审会议，是否提交？' : undefined
      const confirmed = preAuditResult === 'directSubmit' || (await confirmSubmitModal(confirmMessage)) === 'confirm'
      if (confirmed) {
        if (jointReviewWorkflowSubmit) {
          const getListRes = await getBqshFlag(submitListIdsStr, currentUser.dwId || '')
          if (getListRes.success) {
            await submitCbxqshWorkflowHandle(submitListIds, getListRes, ctbm, sxgkbm, sfxysgksp, wfCode)
          } else {
            ElMessage.error(getListRes.msg)
          }
          return
        }

        if (workflowFlag) {
          const res: any = await isNeedCheck({ yssxIds: submitListIdsStr })
          if (!res.success) return ElMessage.error(res.msg)
          const isFlag = res.data.flag
          const isMessage = res.data.msg

          if (isFlag == '1' && isMessage == '') {
            const getListRes = await getBqshFlag(submitListIdsStr, currentUser.dwId || '')
            if (getListRes.success) {
              await submitCbxqshWorkflowHandle(submitListIds, getListRes, ctbm, sxgkbm, sfxysgksp, wfCode)
            } else {
              ElMessage.error(getListRes.msg)
            }
            return
          }

          const text = await VXETable.modal.confirm(isMessage, '提示', {
            confirmButtonText: '是',
            cancelButtonText: '否'
          })
          if (text != 'confirm') return
          if (isFlag == '0') {
            const flowRes: any = await finishHandleOperations({ yssxIds: submitListIdsStr })
            if (flowRes.success) {
              ElMessage.success('提交成功')
              await searchDataHandle()
            } else {
              ElMessage.error(flowRes.msg)
            }
          } else {
            const getListRes = await getBqshFlag(submitListIdsStr, currentUser.dwId || '')
            if (getListRes.success) {
              await submitCbxqshWorkflowHandle(submitListIds, getListRes, ctbm, sxgkbm, sfxysgksp, wfCode)
            } else {
              ElMessage.error(getListRes.msg)
            }
          }
        } else {
          await submitDirectlyHandle(submitListIds)
        }
      }
    }
  }

  const searchConfigHandle = async () => {
    const currentUser = getUserInfo()
    loading.value = true
    const searchResData = await getDynamicSearchColumn({
      searchCode: searchCode.value,
      searchType: '1'
    })
    if (searchResData.success) {
      linkLength.value = searchResData.data.length
      searchResData.data.forEach((item: Configs) => {
        searchData.value[item.code] = item.link
      })
      const ggdms: any = []
      const codes: any = []
      const customData: any = []
      dynamciSearch.value = searchResData.data.map((item: Configs) => {
        if (item.dyff && item.ggdm && !item.dependOnColumn) {
          ggdms.push(item.ggdm)
          codes.push(item.code)
        }
        if (item.dyff && !item.ggdm && !item.dependOnColumn) {
          customData.push({
            dyff: item.dyff,
            code: item.code
          })
        }
        return {
          ...item,
          nodeKey: 'id',
          placeholder: '请选择' + item.name,
          disabled: false,
          clearable: true,
          filterable: true,
          multiple: item.multiple,
          options: [],
          treeProps: { children: 'children', label: 'name', value: 'id' }
        }
      })
      for (const item of customData) {
        if (item.code !== 'xmlx') {
          const initCustomData = await initParamsData(item.dyff, {
            bmId: currentUser.deptId || '',
            dwId: currentUser.dwId || ''
          })
          const findData = dynamciSearch.value.find((search) => search.code === item.code)
          if (findData) {
            findData.options = initCustomData
          }
        } else {
          const initCustomData = await baseService.get(item.dyff)
          const findData = dynamciSearch.value.find((search) => search.code === item.code)
          if (findData) {
            findData.options = initCustomData.data
            findData.treeProps = {
              children: 'children',
              label: 'name',
              value: 'id'
            }
          }
        }
      }

      if (ggdms.length > 0) {
        const initData = await initParamsData('/commonCode/getCommonCode', {
          bmId: currentUser.deptId || '',
          dwId: currentUser.dwId || '',
          codes: ggdms
        })
        dynamciSearch.value.forEach((item) => {
          const searchDataIndex = codes.findIndex((code: any) => code === item.code)
          const searchData = codes.find((code: any) => code === item.code)
          if (searchDataIndex !== -1 && searchData) {
            item.options = initData[searchDataIndex].codes
          }
        })
      }
    }
    loading.value = false
  }

  const exportHandle = () => {
    const currentUser = getUserInfo()
    loading.value = true
    const params = {
      ...searchDatas.value,
      limit: page.limit,
      page: page.page,
      bmId: currentUser.deptId || '',
      dwId: currentUser.dwId || '',
      searchCode: searchCode.value
    }
    exportXm(params).then((res: any) => {
      const blob = res
      const dom = document.createElement('a')
      const url = window.URL.createObjectURL(blob)
      dom.href = url
      const filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      loading.value = false
    })
  }

  const getDynamicTable = async () => {
    const res = await getDynamicTableByUser({
      searchCode: searchCode.value
    })
    if (res.success) {
      gridOptions.columns = res.data.map((item: any) => {
        if (item.columnKey === 'amount') {
          item.align = 'right'
          item.headerAlign = 'center'
          item.formatter = ({ cellValue }: any) => {
            return formatNumValue(cellValue, 6)
          }
        }
        return {
          ...item,
          title: item.columnValue,
          field: item.columnKey,
          width: 180
        }
      })
      gridOptions.columns?.unshift({
        type: 'checkbox',
        width: 80
      })
    }
  }

  const processHandle = () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      useProcess(records, processData)
    }
  }

  const getSecTableData = async () => {
    const currentUser = getUserInfo()
    try {
      loading.value = true
      const res = await getTbcPage({
        bmId: currentUser.deptId || '',
        dwId: currentUser.dwId || '',
        ...searchSecDatas.value,
        ...pageSec
      })
      if (res.success) {
        gridSecOptions.data = res.data.records
        pageSec.total = res.data.total
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const cellClickHandle = async (row: any, column: any, selectedGrid: string) => {
    const compRef = selectedGrid === '1' ? gridRef : gridSecRef
    if (column.type === 'checkbox') return
    await compRef.value.clearCheckboxRow()
    compRef.value.setCheckboxRow(row, true)
  }

  const reload = async () => {
    gridSecOptions.columns = secColumns
    await getSecTableData()
    await getDynamicTable()
    await searchDataHandle()
    await searchConfigHandle()
  }

  return {
    activeName,
    backHandle,
    cellClickHandle,
    createDeptEditModalRef,
    createDeptHandle,
    deleteHandle,
    dynamciSearch,
    dynamicReportsRef,
    editHandle,
    editPageRef,
    exportHandle,
    flag,
    formRef,
    getSecTableData,
    gridOptions,
    gridRef,
    gridSecOptions,
    gridSecRef,
    handleFieldChange,
    limitChangeHandle,
    loading,
    matterHandle,
    matterRef,
    openModal,
    page,
    pageChangeHandle,
    pageSec,
    processData,
    processHandle,
    queryProTypeModalRef,
    reload,
    resetHandle,
    resetSecHandle,
    searchCode,
    searchDataHandle,
    searchDatas,
    searchSecDatas,
    selectData,
    selectDatas,
    settingHandle,
    spanComp,
    submitsWorkflowHandle,
    submitWorkflowHandle,
    title
  }
}

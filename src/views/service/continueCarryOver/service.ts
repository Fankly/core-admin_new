import { PublicParams, RowVo } from '@/views/service/continueCarryOver/interface'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'
import { Ref, ref } from 'vue'
import { checkBeforeSubmit, deleteAttach, downloadAttach, resetRecords, sendSapData, uploadAttach } from '@/api/service/continueCarryOver'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { formatValue } from '@/utils/utils'
import { submitActivity } from '@/api/workflow/xjjz'
import { getBqshFlag } from '@/api/service/requirement'

export function service(loading: Ref<boolean>) {
  const store = useStore()
  const searchData = ref<() => void>()
  const workFlowCode = 'WF_MISXJJZSHLC'

  const wfParam = ref<WFParam>({
    XMID: '',
    FQZZ: '',
    FQBM: '',
    XMLX: '0',
    ['ZBCB_FLAG']: '1'
  })

  const userInfo = ref<PublicParams>({
    bmId: '',
    nd: '',
    protypeId: '',
    dwId: '',
    userId: '',
    specialorgcode: '',
    fqzz: '',
    spRoleId: ''
  })

  const setUserInfo = (user: PublicParams) => {
    userInfo.value = user
  }

  const getUserInfo = () => {
    return userInfo.value
  }

  const searchTable = () => {
    if (searchData.value) searchData.value()
  }

  const setSearchTable = (loadData: () => void) => {
    searchData.value = loadData
  }

  // 提交
  const handleSubmit = async (selectedData: RowVo[]) => {
    const isProcess = await validateSubmit(selectedData)
    if (isProcess) {
      const isSubmit = await VXETable.modal.confirm('是否确认提交审批？', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (isSubmit === 'confirm') {
        //   调用接口
        const checkRes = await checkSubmitRes(selectedData)
        if (checkRes) {
          await submitWorkflowHandle(selectedData)
        }
      }
    }
  }

  // 发送SAP
  const fbProToSapHandler = async (selectedData: RowVo[]) => {
    try {
      const res = await validateSAP(selectedData)
      if (res && Array.isArray(res)) {
        const isQuery = await VXETable.modal.confirm('确认发送所选项目的预算吗？')
        if (isQuery === 'confirm') {
          loading.value = true
          const xmIds = selectedData.map((item) => item.xmId)
          const res = await sendSapData(xmIds)
          if (!res.success) throw new Error(res.msg)
          handleSuccessMsg('发送SAP系统完成！')
        }
      }
    } catch (e) {
      handleErrorMsg((e as Error).message)
    } finally {
      searchTable()
      loading.value = false
    }
  }

  // 撤回
  const retractHandle = async (selectedData: RowVo[]) => {
    const res = validateRetract(selectedData)
    if (res && Array.isArray(res)) {
      const isQuery = await VXETable.modal.confirm('确认撤销续建结转的项目吗？')
      if (isQuery === 'confirm') {
        try {
          loading.value = true
          const isRetractData = await resetRecords(res)
          if (!isRetractData.success) throw new Error(isRetractData.msg)
          handleSuccessMsg('撤销成功！')
          searchTable()
        } catch (e) {
          handleErrorMsg((e as Error).message)
        } finally {
          loading.value = false
        }
      }
    }
  }

  const uploadFjHandle = async (selectedData: RowVo[], gridRef: Ref<any>) => {
    try {
      const res = validateUploadFile(selectedData)
      if (res) {
        handleWarnMsg('预算资金审批中或预算资金审批通过的项目不可重复上传！')
        return
      }
      const $grid = gridRef.value
      if ($grid) {
        const hasFile = selectedData.some((item) => item.xjjzUuid)
        let haveAttachFlag = false
        if (hasFile) {
          haveAttachFlag = true
        }
        if (haveAttachFlag) {
          const type = await VXETable.modal.confirm('该记录已经存在附件，是否覆盖已有的附件？', '提示', {
            confirmButtonText: '是',
            cancelButtonText: '否'
          })
          if (type !== 'confirm') {
            return
          }
        }
        const types = ['doc', 'docx', 'xls', 'xlsx', 'rar', 'zip', 'txt', 'cab', 'pdf', 'ceb']
        const { files } = await $grid.readFile({ multiple: false })
        const formData = new FormData()
        let fileName = ''
        const ns = files[0].name.split('.')
        const type = ns[ns.length - 1].toLowerCase()
        fileName = files[0].name
        if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
        formData.append('file', files[0])
        loading.value = true
        //   上传文件
        const ids = selectedData.map((item) => item.xmId).join(',')
        const res = await uploadAttach(fileName, ids, formData)
        if (res.success) {
          // 刷新页面,调用查询接口
          handleSuccessMsg('附件上传成功')
          searchTable()
        } else {
          throw new Error(res.msg)
        }
      }
    } catch (e) {
      handleErrorMsg((e as Error).message)
    } finally {
      loading.value = false
    }
  }

  // 附件删除
  const deleteFjHandle = async (selectedData: RowVo[]) => {
    try {
      const res = validateUploadFile(selectedData)
      if (res) {
        handleWarnMsg('预算资金审批中或预算资金审批通过的项目不可删除附件！')
        return
      }
      const type = await VXETable.modal.confirm('确认删除附件吗？')
      if (type === 'confirm') {
        loading.value = true
        const ids = selectedData.map((item) => item.xmId)
        const res = await deleteAttach({
          ids: ids
        })
        if (!res.success) throw new Error(res.msg)
        handleSuccessMsg('附件删除成功!')
        searchTable()
      }
    } catch (e) {
      handleErrorMsg((e as Error).message)
    } finally {
      loading.value = false
    }
  }

  // 附件下载
  const downloadFile = async (uuid: string, fileName: string) => {
    loading.value = true
    const blob: any = await downloadAttach(uuid)
    const dom = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    dom.download = `${decodeURI(decodeURI(fileName))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  }

  const handleWarnMsg = (warnMsg: string) => {
    ElMessage.warning(warnMsg)
  }

  const handleSuccessMsg = (successMsg: string) => {
    ElMessage.success(successMsg)
  }

  const handleErrorMsg = (successMsg: string) => {
    ElMessage.error(successMsg)
  }

  const isFieldAllEqual = <T extends Record<string, any>, K extends keyof T>(arr: T[], filed: K): boolean => {
    if (!Array.isArray(arr) || arr.length === 0) return false
    if (arr.length === 1) return true
    const field = arr[0][filed]
    return arr.every((item) => item[filed] === field)
  }

  // 校验前接口
  const checkSubmitRes = async (selectedData: RowVo[]): Promise<boolean> => {
    try {
      const idObjArray = selectedData.map((item) => {
        return {
          gwxmbm: item.gwxmbm,
          isPack: item.isPack,
          xmId: item.xmId,
          xmxz: item.xmxz,
          ysbzId: item.ysbzId
        }
      })
      const res = await checkBeforeSubmit(idObjArray)
      if (!res.success) throw new Error(res.msg)
      return true
    } catch (e) {
      handleWarnMsg((e as Error).message)
      return false
    }
  }

  // 校验附件
  const validateUploadFile = (selectedData: RowVo[]) => {
    return selectedData.some((item) => item.circulStatus === '2' || item.circulStatus === '4')
  }

  // 校验撤回
  const validateRetract = (selectedData: RowVo[]): boolean | string[] => {
    if (selectedData.length === 0) {
      handleWarnMsg('请选择要撤回的项目!')
      return false
    }
    const idArray: string[] = []
    for (let i = 0; i < selectedData.length; i++) {
      const record = selectedData[i]
      if (record.circulStatus.toString() === '2' || record.circulStatus.toString() === '4') {
        handleWarnMsg('存在预算编制审核中或审核通过的项目，不能撤回！')
        return false
      }
      idArray.push(record.xmId)
    }
    return idArray
  }

  // 校验事项
  const isLinkMatter = (selectedData: RowVo[], key: keyof RowVo, compareValue: string): boolean => {
    if (selectedData.length === 0) return true
    for (let i = 0; i < selectedData.length; i++) {
      const selectedRow = selectedData[i]
      if (selectedRow[key].toString() !== compareValue) return true
    }
    return false
  }

  // 校验提交
  const validateSubmit = async (selectedData: RowVo[]): Promise<boolean> => {
    // 检验是否有项目
    if (selectedData.length == 0) {
      handleWarnMsg('请选择一条或多条项目提交审核！')
      return false
    }
    // 校验是否进行事项关联
    const validateMatter = isLinkMatter(selectedData, 'xjjzSfglsx', '1')
    if (validateMatter) {
      handleWarnMsg('请关联事项后,进行提交审核！')
      return false
    }
    // 校验项目类型
    const validateProType = isFieldAllEqual(selectedData, 'proType')
    if (!validateProType) {
      handleWarnMsg('请选择相同类型的项目进行提交审核！')
      return false
    }

    // 校验项目性质
    const validateProXz = isFieldAllEqual(selectedData, 'xmxz')
    if (!validateProXz) {
      handleWarnMsg('多个项目同时提交时，只能提交项目性质相同的项目！')
      return false
    }
    for (let i = 0; i < selectedData.length; i++) {
      const record = selectedData[i]
      if (record.ysspgn.toString() === '0') {
        handleWarnMsg('选择的项目类型中，有预算编制功能被限制，不能提交审核！')
        return false
      }
      const circulStatus = record.circulStatus.toString()
      if (circulStatus == '2' || circulStatus === '4') {
        handleWarnMsg('预算资金审批中或预算资金审批通过的项目不可重复提交！')
        return false
      }
      const kgsj = record.kgsj
      if (!kgsj) {
        handleWarnMsg('存在开工时间为空的项目，请先编制开工时间！')
        return false
      }
      const yjwcsj = record.yjwcsj
      if (!yjwcsj) {
        handleWarnMsg('存在预计完成时间为空的项目，请先编制预计完成时间！')
        return false
      }
      const jzyy = record.jzyy
      if (!jzyy) {
        handleWarnMsg('存在续建结转原因为空的项目，请先编制续建结转原因为空！')
        return false
      }
      const dnys = record.dnys
      if (dnys === '' || dnys === null) {
        handleWarnMsg('存在当年预算为空的项目，请先编制当年预算！')
        return false
      }
      if (record.dntzjh.toString() !== '0' && record.xmxz.toString() === '2') {
        handleWarnMsg('结转项目当年投资计划必须为0！')
        return false
      }
      if (!record.xjjzUuid) {
        handleWarnMsg('请先上传附件信息！')
        return false
      }
    }
    return true
  }

  // 校验SAP
  const validateSAP = async (selectedData: RowVo[]): Promise<boolean | string[]> => {
    if (selectedData.length === 0) {
      handleWarnMsg('请选择要发布SAP预算的项目!')
      return false
    }
    const idArray: string[] = []
    for (let i = 0; i < selectedData.length; i++) {
      const circulStatus = selectedData[i].circulStatus.toString()
      if (circulStatus !== '4' && circulStatus !== '7') {
        handleWarnMsg('存在预算审批未通过的项目，无法发送！')
        return false
      }
      if (selectedData[i].circulStatus === '4' || selectedData[i].circulStatus == '7') {
        idArray.push(selectedData[i].xmId)
      }
    }
    if (idArray.length === 0) {
      handleWarnMsg('没有符合条件发送SAP预算的项目记录')
      return false
    }
    return idArray
  }

  // 工作流
  const submitWorkflowHandle = async (selectedData: RowVo[]) => {
    try {
      const wfUserInfo: WFUserInfo = {
        userId: store.getters.getUserMsg.id,
        spOrgId: userInfo.value.bmId || '',
        spRoleId: userInfo.value.spRoleId || ''
      }
      const xmIds = selectedData.map((item) => item.xmId).join(',')
      const getDataRes = await getBqshFlag(xmIds, userInfo.value.dwId || '')
      if (getDataRes.success) {
        wfParam.value.XMID = xmIds
        wfParam.value.FQZZ = userInfo.value.fqzz
        wfParam.value.FQBM = userInfo.value.specialorgcode
        wfParam.value.DWLX = getDataRes.data.DWLX || ''
        wfParam.value.XMLX = '0'
        wfParam.value['ZBCB_FLAG'] = selectedData[0].zbcbFlag
        // 获取需要的参数
        submitWorkflow(store.getters.getUserMsg.systemCode, workFlowCode, '', wfUserInfo, wfParam.value, {}, submitWFCallback)
      }
    } catch (e) {
      handleErrorMsg((e as Error).message)
    }
  }

  const submitWFCallback = async (nextPersonAndPath: string, wfData: any) => {
    loading.value = true
    try {
      const list: any[] = JSON.parse(wfData).WorkFlowDataList.WorkFlowData
      const obj: any = {}
      list.forEach((item) => {
        obj[item.DataCode] = item.DataValue
      })
      const spfrom = {
        userId: store.getters.getUserMsg.id,
        spOrgId: userInfo.value.bmId,
        spRoleId: userInfo.value.spRoleId,
        wfCode: workFlowCode,
        wfData: obj,
        nextPersonAndPath: nextPersonAndPath
      }
      const res = await submitActivity({
        ...spfrom
      })
      if (!res.success) throw new Error('提交失败!')
      if (res.success) {
        ElMessage.success('提交成功!')
      }
    } catch (e) {
      handleErrorMsg((e as Error).message)
    } finally {
      loading.value = false
      searchTable()
    }
  }

  const formatterHandle = ({ cellValue }: { cellValue: string }) => {
    if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
    return formatValue(cellValue, Number(6))
  }

  return {
    formatterHandle,
    handleSubmit,
    setUserInfo,
    getUserInfo,
    searchTable,
    setSearchTable,
    deleteFjHandle,
    fbProToSapHandler,
    submitWorkflowHandle,
    downloadFile,
    uploadFjHandle,
    retractHandle,
    handleWarnMsg,
    handleErrorMsg,
    handleSuccessMsg
  }
}

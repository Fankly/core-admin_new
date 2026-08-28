import { ElMessage } from 'element-plus'
import { reactive, ref, Ref } from 'vue'
import { RowVO } from '../interface'
import { checkXjjzExistence, exceptionHandling, isOpenPMSXmCloseValidate, processPMSXmCloseValidate, validationPro } from '@/api/service/xmgbdk'
import { VxeGridProps, VXETable } from 'vxe-table'
import { useProcess } from '@/hooks/useProcess'
import Decimal from 'decimal.js'
import { getParamValueMulti } from '@/api/common'
import { formatNumValue } from '@/utils/utils'

interface UserInfo {
  dwId: string
  bmId: string
  specialorgcode: string
  id: string
}

export const useService = (
  gridRef: Ref<any>,
  operationModalRef: Ref<any>,
  historyModalRef: Ref<any>,
  handleSearchPageData: () => void,
  gridOptions: VxeGridProps<RowVO>
) => {
  const selectedData = ref<RowVO[]>([])

  const processData = reactive({
    isShowDialog: false,
    compName: null,
    id: ''
  })

  const userInfo = ref<UserInfo>({
    dwId: '',
    bmId: '',
    specialorgcode: '',
    id: ''
  })

  const setUserInfo = (user: UserInfo) => {
    userInfo.value = user
  }

  const getUserInfo = () => {
    return userInfo.value
  }

  const resetSelectedData = () => {
    selectedData.value = []
  }

  const setSelectedData = () => {
    const $grid = gridRef.value
    if ($grid) {
      const records = $grid.getCheckboxRecords()
      selectedData.value = records as RowVO[]
    }
  }

  const getSelectedData = (): RowVO[] => {
    return selectedData.value
  }

  // 校验业务冻结
  const validateBeforeClose = async (closeStatus: string): Promise<boolean> => {
    setSelectedData()
    const selectedDataValue = getSelectedData()
    // 获取公共参数
    // 项目关闭 仅项目执行状态=已立项 且项目打开关闭状态为空、关闭验证通过、关闭验证不通过、关闭审批驳回项目可发起关闭流程；其它状态不允许发起
    // 项目重新打开 仅项目执行状态=已关闭 且项目打开关闭状态为项目关闭已完成、打开验证通过、打开验证不通过、打开审批驳回项目可发起项目重新打开流程；其它状态不允许发起
    const params = ['XMGB_STATUS', 'XMDK_STATUS']
    const getPublicParams = await getParamValueMulti(params)
    let xmgbStatus = ['01', '02', '03', '06', '07', '09']
    let xmdkStatus = ['04', '06', '07', '08']
    if (getPublicParams.data && getPublicParams.data[params[0]] && getPublicParams.data[params[1]]) {
      xmgbStatus = getPublicParams.data[params[0]].split(',')
      xmdkStatus = getPublicParams.data[params[1]].split(',')
    }
    const status = closeStatus === '01' ? xmgbStatus : xmdkStatus
    const result =
      closeStatus === '01'
        ? selectedDataValue.find((item) => !(item.circulStatus === '6' && (!item.xmgbdkzt || status.includes(item.xmgbdkzt ?? ''))))
        : selectedDataValue.find((item) => !(item.circulStatus === '8' && (!item.xmgbdkzt || status.includes(item.xmgbdkzt ?? ''))))
    if (result) {
      const tipFont = closeStatus === '01' ? '关闭' : '项目打开'
      ElMessage.warning(`项目打开关闭状态为${result.xmgbdkztName ? result.xmgbdkztName : '空'}，不允许发起${tipFont}流程！`)
      return false
    }
    // 校验项目类型是否相同
    const allSameProType = selectedDataValue.every((item) => item.proTypeId === selectedDataValue[0].proTypeId)
    if (!allSameProType) {
      ElMessage.warning('请选择项目类型相同的项目一起提交！')
      return false
    }
    // 校验项目类型是否相同
    const allSameCtbm = selectedDataValue.every((item) => item.ctbm === selectedDataValue[0].ctbm)
    if (!allSameCtbm) {
      ElMessage.warning('请选择市管部门相同的项目一起提交！')
      return false
    }
    if (selectedDataValue.length > 30 || selectedDataValue.length === 0) {
      ElMessage.warning('请选择不多于30条记录！')
      return false
    }
    return true
  }

  // PMS3.0项目关闭校验
  const openPMSValidateData = async (): Promise<boolean> => {
    try {
      const openPMSValidateRes = await isOpenPMSXmCloseValidate()
      if (!openPMSValidateRes.success) throw new Error(openPMSValidateRes.msg)
      //在项目关闭页面，点击【关闭】按钮时，针对三级分类范围内项目调用PMS3.0项目关闭校验结果查询接口进行校验，
      //根据接口返回resultType和comparisonResult组合判断，
      //不满足要求的弹出提示，中止关闭后续流程；满足要求的继续后续项目关闭流程
      if (openPMSValidateRes.data.openPMSValidate) {
        const records = getSelectedData()
        const validateXm = []
        for (let i = 0; i < records.length; i++) {
          const obj = {
            sjfl: '',
            gwxmbm: ''
          }
          obj['sjfl'] = records[i].sjfl
          obj['gwxmbm'] = records[i].gwxmbm
          validateXm.push(obj)
        }

        const validateRes = await processPMSXmCloseValidate(validateXm)
        if (!validateRes.success) throw new Error(validateRes.msg)
        if (validateRes.data.PMSValidateMsg) throw new Error(validateRes.data.PMSValidateMsg)
        return true
      } else {
        return true
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
      return false
    }
  }

  const validatePrjData = async (closeStats: string): Promise<boolean> => {
    const records = getSelectedData()
    let gwxmbm = ''
    let ids = ''
    let protype = ''
    for (let i = 0; i < records.length; i++) {
      if (records[0].zbcbFlag !== records[i].zbcbFlag) {
        ElMessage.warning('资本性项目和成本性项目需分开提交！')
        return false
      }
      // 预算变更审批流程中不可关闭
      if (
        closeStats === '01' &&
        !(
          records[i].auditStatus === '4' ||
          records[i].auditStatus === '1' ||
          records[i].auditStatus === '0' ||
          records[i].auditStatus === '3' ||
          records[i].auditStatus === '10' ||
          !records[i].auditStatus
        )
      ) {
        ElMessage.warning('国网项目编码为' + records[i].gwxmbm + '的项目在预算变更流程中,项目不可关闭！')
        return false
      }

      //判断关闭的项目是否存在下一年的续建结转项目
      const code = records[i].gwxmbm
      const nd = records[i].nd //年度
      if (closeStats === '01') {
        const checkXjjzExistenceRes = await checkXjjzExistence(code, nd)
        if (!checkXjjzExistenceRes.success) {
          ElMessage.error(checkXjjzExistenceRes.msg)
          return false
        }
        const flag = checkXjjzExistenceRes.data.flag
        const pmsAttachflag = checkXjjzExistenceRes.data.pmsAttachflag
        if (flag === 'true') {
          ElMessage.warning('国网项目编码为' + records[i].gwxmbm + '的项目，存在下一年的续建结转，不可关闭！')
          return false
        }
        if (pmsAttachflag === 'true') {
          ElMessage.warning('国网项目编码为' + records[i].gwxmbm + '的项目，未挂接PMS结算相关附件！')
          return false
        }
      }
      if (closeStats === '01' && records[i].circulStatus !== '6') {
        ElMessage.warning('请选择已立项记录！')
        return false
      }
      if (closeStats === '02' && records[i].circulStatus !== '8') {
        ElMessage.warning('请选择已关闭记录！')
        return false
      }
      if (records[i].xmgbdkzt === '11' || records[i].xmgbdkzt === '21') {
        ElMessage.warning('您选择的是审核中的项目，请选择非审核中项目！')
        return false
      }
      if (records.length !== 1 && records[i].yjfl === '01' && records[i].ejfl !== '18') {
        ElMessage.warning('您所选的项目包含大基建项目，请选择一条记录提交！')
        return false
      }
      if (closeStats === '02') {
        if (i == 0) {
          protype = records[i].proTypeId
        } else {
          if (protype.toString() === '7' || protype.toString() === '56') {
            if (protype.toString() !== records[i].proTypeId) {
              ElMessage.warning('大中型基建项目和资本性项目前期项目只能选择相同类型项目一起提交！')
              return false
            }
          }
          if (records[i].proTypeId.toString() === '7' || records[i].proTypeId.toString() === '56') {
            if (protype.toString() !== records[i].proTypeId.toString()) {
              ElMessage.warning('大中型基建项目和资本性项目前期项目只能选择相同类型项目一起提交！')
              return false
            }
          }
          protype = records[i].proTypeId
        }
      }
      if (gwxmbm === '') {
        gwxmbm += records[i].gwxmbm
        ids += records[i].xmid
      } else {
        gwxmbm += ',' + records[i].gwxmbm
        ids += ',' + records[i].xmid
      }
    }
    if (closeStats === '01') {
      // 校验预算信息
      const validateYsRes = await validateYs(records)
      if (!validateYsRes) return false
      const type = await VXETable.modal.confirm('请确认提交记录的项目成本均已完成入账？点击【是】', '确认', {
        status: 'warning',
        cancelButtonText: '否',
        confirmButtonText: '是'
      })
      if (type === 'confirm') {
        return await validationProData(gwxmbm, ids, closeStats, records)
      }

      return false
    } else {
      return await validationProData(gwxmbm, ids, closeStats, records)
    }
  }

  const getXsData = async (): Promise<string> => {
    try {
      const res = await getParamValueMulti(['MIS_XMGBDK_PZXS'])
      if (!res.success) throw new Error(res.msg)
      if (!res.data) return '1'
      return res.data['MIS_XMGBDK_PZXS']
    } catch (error) {
      handleError(error as Error)
      return '1'
    }
  }

  const validateYs = async (records: RowVO[]): Promise<boolean> => {
    let findRec = null
    // 系数
    const xs = await getXsData()
    const xsDec = new Decimal(xs)
    for (let i = 0; i < records.length; i++) {
      const item = records[i]
      // 比较当年入账金额与当年预算*系数
      // 当年预算
      const dnys = item.dnys.toString() || '0'
      const dnysDec = new Decimal(dnys)

      // 当年入账金额
      const dnrzje = item.dncwzc.toString() || '0'
      const dnrzjeDec = new Decimal(dnrzje)
      const mulRes = dnysDec.mul(xsDec)
      const res = dnrzjeDec.comparedTo(mulRes)
      if (res === 1) findRec = item
    }
    if (!findRec) return true
    ElMessage.warning(
      `【${findRec.xmmc}】项目，当年入账金额(不含税)【${formatNumValue(findRec.dncwzc.toString(), 6)}】大于当年预算【${formatNumValue(
        findRec.dnys.toString(),
        6
      )}】*系数【${xs}】，不允许关闭，请先进行计划预算变更调整!`
    )
    return false
  }

  const validationProData = async (gwxmbm: string, ids: string, closeStats: string, records: RowVO[]): Promise<boolean> => {
    try {
      const validationProRes = await validationPro(gwxmbm, closeStats, ids)
      if (!validationProRes.success) throw new Error(validationProRes.msg)
      const errorMsg = validationProRes.data?.errorMsg
      if (!errorMsg) {
        // 跳转界面,参数用户的ID,xmmc,gwxmbm
        operationModalRef.value.acceptParams(
          {
            ids: ids,
            zztbs: closeStats
          },
          getUserInfo(),
          records,
          handleSearchPageData
        )
        return true
      } else {
        ElMessage.warning(errorMsg)
        // 刷新页面
        handleSearchPageData()
        return false
      }
    } catch (error) {
      handleError(error as Error)
      return false
    }
  }

  const handleProjectClose = async () => {
    gridOptions.loading = true
    const status = '01'
    try {
      const validateRes = await validateBeforeClose(status)
      if (validateRes) {
        const openPMSValidateDataRes = await openPMSValidateData()
        if (openPMSValidateDataRes) {
          await validatePrjData(status)
        }
      }
    } finally {
      gridOptions.loading = false
    }
  }

  const handleProjectReject = async () => {
    gridOptions.loading = true
    const status = '02'
    try {
      const validateRes = await validateBeforeClose(status)
      if (validateRes) {
        await validatePrjData(status)
      }
    } finally {
      gridOptions.loading = false
    }
  }

  const handleViewProcess = async () => {
    try {
      gridOptions.loading = true
      // 获取数据
      const $grid = gridRef.value
      if ($grid) {
        const records: RowVO[] = $grid.getCheckboxRecords()
        if (records.length !== 1) {
          ElMessage({
            message: '请选择一个项目!',
            type: 'warning'
          })
          return
        }
        const resultData = records.map((item) => {
          return {
            ...item,
            id: item.xmid
          }
        })
        useProcess(resultData, processData)
      }
    } catch (e) {
      handleError(e as Error)
    } finally {
      gridOptions.loading = false
    }
  }

  const handleError = (error: Error): void => {
    ElMessage({
      message: `${error.message}`,
      type: 'error',
      duration: 5000
    })
  }

  const handleDealHistory = () => {
    const $grid = gridRef.value
    if ($grid) {
      const records: RowVO[] = $grid.getCheckboxRecords()
      if (records.length !== 1) {
        ElMessage.warning('请选择一个项目进行查看!')
        return
      }
      historyModalRef.value.acceptParams(getUserInfo(), records)
    }
  }

  const handleAbnormalDealData = async () => {
    try {
      const $grid = gridRef.value
      if ($grid) {
        const records: RowVO[] = $grid.getCheckboxRecords()
        if (records.length === 0) {
          ElMessage.warning('请至少选择一个项目进行操作!')
          return
        }
        const status = ['12', '22']
        const result = records.some((item) => !status.includes(item.xmgbdkzt))
        if (result) {
          ElMessage.warning('项目关闭打开状态非“关闭审批通过”或“打开审批通过”，无异常，无需处理!')
          return
        }
        const type = await VXETable.modal.confirm('请确认是否进行异常处理？点击【是】', '确认', {
          status: 'warning',
          cancelButtonText: '否',
          confirmButtonText: '是'
        })
        if (type === 'confirm') {
          gridOptions.loading = true
          const ids = records.map((item) => item.xmid)
          const res = await exceptionHandling(ids)
          if (!res.success) throw new Error(res.msg)
          ElMessage.success('操作成功!')
          handleSearchPageData()
        }
      }
    } catch (error) {
      handleError(error as Error)
    } finally {
      gridOptions.loading = false
    }
  }

  return {
    processData,
    handleAbnormalDealData,
    handleViewProcess,
    handleDealHistory,
    handleProjectClose,
    handleProjectReject,
    resetSelectedData,
    setSelectedData,
    setUserInfo,
    getSelectedData
  }
}

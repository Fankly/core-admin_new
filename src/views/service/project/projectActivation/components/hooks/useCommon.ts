import { exportData, validationFj } from '@/api/service/xmgbdk'
import { reactive, Ref, ref } from 'vue'
import { VxeGridProps, VxeTable, VXETable } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { RowVO } from '@/views/service/project/projectActivation/interface'
import { submitActivity } from '@/api/workflow/xmgbdk'
import baseService from '@/service/baseService'
import { getZlxqFlag } from '@/api/service/zlxqszy'
import { getXmgbdkFlag } from '@/api/common'

interface AcceptParams {
  ids: string
  zztbs: string
}

interface RowVo {
  id: string
  uuid: string
  xmmc: string
  gwxmbm: string
  attachName: string
}

interface UserInfo {
  dwId: string
  bmId: string
  specialorgcode: string
  id: string
}

export const useCommon = (gridRef: Ref<any>, handleCloseModal: () => void) => {
  const store = useStore()
  const userInfo = ref<UserInfo>({
    dwId: '',
    bmId: '',
    specialorgcode: '',
    id: ''
  })

  const searchMethod = ref<() => void>()

  const workFlowCode = ref<string>('WF_MISXMGBSHLC')

  const setUserInfo = (user: UserInfo) => {
    userInfo.value = user
  }

  const getUserInfo = () => {
    return userInfo.value
  }
  const gridOptions = reactive<VxeGridProps<RowVo>>({
    border: true,
    showOverflow: true,
    headerAlign: 'center',
    align: 'center',
    height: '100%',
    loading: false,
    rowConfig: {
      height: 32,
      isCurrent: true
    },
    columnConfig: {
      resizable: true
    },
    columns: [
      { field: 'xmmc', title: '项目名称', align: 'left', headerAlign: 'center' },
      {
        field: 'gwxmbm',
        width: 120,
        title: '国网项目编码',
        align: 'center',
        headerAlign: 'center'
      },
      {
        field: 'attachName',
        width: 260,
        title: '附件名称',
        headerAlign: 'center',
        align: 'center',
        slots: { default: 'attachName_default' }
      }
    ]
  })

  const searchModalData = async (parameter: AcceptParams) => {
    try {
      const res = await validationFj(parameter)
      if (!res.success) throw new Error(res.msg)
      gridOptions.data = res.data
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }

  const wfParam = ref<WFParam>({
    XMID: '',
    PROTYPE: '',
    FQZZ: '',
    FQBM: ''
  })

  const handleSubmit = async (parameter: AcceptParams, selectedData: RowVO[]) => {
    try {
      // 确认提交
      const type = await VXETable.modal.confirm('确认是否进行提交？', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'confirm') {
        const ids = selectedData.map((item) => item.xmid).join(',')
        const flagData = await getXmgbdkFlag({
          dwId: userInfo.value.dwId,
          spOrgId: userInfo.value.bmId
        })
        if (!flagData.success) throw new Error(flagData.msg)
        wfParam.value.FQZZ = flagData.data.FQZZ
        wfParam.value.FQBM = userInfo.value.specialorgcode
        wfParam.value.XMID = ids
        wfParam.value.DWLX = flagData.data.DWLX
        wfParam.value.PROTYPE = selectedData[0].proTypeId
        wfParam.value.CTBM = selectedData[0].ctbm
        if (selectedData[0].ctbm === '' || selectedData[0].ctbm === null || selectedData[0].ctbm === undefined) {
          wfParam.value.CTBMFLAG = '0'
        } else {
          wfParam.value.CTBMFLAG = '1'
        }
        submitWorkflowHandle(parameter)
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    }
  }

  const submitWorkflowHandle = (parameter: AcceptParams) => {
    const wfUserInfo: WFUserInfo = {
      userId: store.getters.getUserMsg.id,
      spOrgId: userInfo.value.bmId || '',
      spRoleId: userInfo.value.id || ''
    }

    workFlowCode.value = parameter.zztbs === '01' ? 'WF_MISXMGBSHLC' : 'WF_MISXMDKSHLC'
    // 获取需要的参数
    submitWorkflow(store.getters.getUserMsg.systemCode, workFlowCode.value, '', wfUserInfo, wfParam.value, {}, submitWFCallback)
  }

  const submitWFCallback = async (nextPersonAndPath: string, wfData: any) => {
    gridOptions.loading = true
    const list: any[] = JSON.parse(wfData).WorkFlowDataList.WorkFlowData
    const obj: any = {}
    list.forEach((item) => {
      obj[item.DataCode] = item.DataValue
    })
    const spfrom = {
      userId: store.getters.getUserMsg.id,
      spOrgId: userInfo.value.bmId,
      spRoleId: userInfo.value.id,
      wfCode: workFlowCode.value,
      wfData: obj,
      nextPersonAndPath: nextPersonAndPath
    }
    const res = await submitActivity({
      ...spfrom
    })
    if (res.success) {
      ElMessage.success('提交成功!')
    } else {
      ElMessage.error('提交失败!')
    }
    gridOptions.loading = false
    handleCloseModal()
    if (searchMethod.value) searchMethod.value()
  }

  const setPageData = (searchDataMethod: () => {}) => {
    searchMethod.value = searchDataMethod
  }

  const handleError = (error: Error, message = '操作失败'): void => {
    console.error(`${message}`, error)
    ElMessage({
      message: `${error.message}`,
      type: 'error',
      duration: 5000
    })
  }

  const handleUploadFile = async (parameter: AcceptParams) => {
    try {
      const $grid = gridRef.value
      if ($grid) {
        const record: RowVo = $grid.getCurrentRecord()
        if (!record) throw new Error('请选中一条数据进行附件上传操作!')
        let haveAttachFlag = false
        if (record.uuid) {
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
        let attatchName = ''
        const ns = files[0].name.split('.')
        const type = ns[ns.length - 1].toLowerCase()
        attatchName = files[0].name
        if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
        formData.append('file', files[0])
        gridOptions.loading = true
        //   上传文件
        const res = await baseService.post(`/xmgbdk/uploadAttach?fileName=${attatchName}&gwxmbm=${record.gwxmbm}&zztbs=${parameter.zztbs}`, formData)
        if (res.success) {
          // 刷新页面,调用查询接口
          searchModalData(parameter)
        } else {
          throw new Error(res.msg)
        }
      }
    } catch (e) {
      handleError(e as Error, '')
    } finally {
      gridOptions.loading = false
    }
  }

  const handleDownloadFile = async (uuid: string, fileName: string) => {
    gridOptions.loading = true
    const res = await exportData(uuid)
    const blob: any = res
    const dom = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    dom.download = `${decodeURI(decodeURI(fileName))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    gridOptions.loading = false
  }
  return {
    gridOptions,
    setUserInfo,
    searchModalData,
    handleDownloadFile,
    handleUploadFile,
    setPageData,
    getUserInfo,
    handleSubmit
  }
}

import { getBqshFlag, saveXmInfo, submitCbxqsh, submitZLxqshNew } from '@/api/service/requirement'
import { getZlxqFlag } from '@/api/service/zlxqszy'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { getUuid } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useStore } from 'vuex'
import VXETable from 'vxe-table'

interface UserInfo {
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  spRoleId: string
  specialorgcode: string
  fqzzFlag: string
}

export function useWorkflowSubmit(){
  const store = useStore()
  const loading = ref(false)
  const uuid = ref(getUuid())
  const isEditOrAddId = ref(null)
  const notifyNumber = ref<number>(0)

  const wfParam = ref<WFParam>({
    XMIDS: '',
    FQZZ: '',
    CTBM: '',
    DWLX: '',
    FQBM: ''
  })

  const submitWFCallback = async (
    nextPersonAndPath: string,
    wfData: WFData,
    userInfo: UserInfo,
    closeHandle: () => void,
    wfCode: string
  ) => {
    loading.value = true
    const spfrom = {
      userId: store.getters.getUserMsg.id,
      spOrgId: userInfo.deptId || '',
      spRoleId: userInfo.spRoleId || '',
      wfCode: wfCode,
      wfData: wfParam.value,
      nextPersonAndPath: nextPersonAndPath
    }

    try {
      const xqshApi = submitZLxqshNew
      const res = await xqshApi(spfrom)
      if (res.success) {
        ElMessage.success('提交成功')
        closeHandle()
      } else {
        const msg = res.msg.split('|').join('<br/>')
        ElMessage.error({
          type: 'error',
          dangerouslyUseHTMLString: true,
          message: msg
        })
      }
    } catch (error) {
      ElMessage.error('提交失败')
    } finally {
      loading.value = false
    }
  }

  const submitForm = async (
    globalParams: Record<string, any>,
    userInfo: UserInfo,
    sfzl: string,
    closeHandle: () => void,
    orderParams: Record<string, any>,
  ) => {
    try {
      loading.value = true
      const res = await saveXmInfo({
        uuid: uuid.value,
        id: isEditOrAddId.value,
        sfzl: sfzl,
        deptId: userInfo.deptId,
        deptName: userInfo.deptName,
        dwId: userInfo.dwId,
        dwName: userInfo.dwName,
        datas: globalParams
      })

      if (res.success) {
        loading.value = false
        isEditOrAddId.value = res.data.id

        const type = await VXETable.modal.confirm(
          '是否提交审核？选择【是】直接提交审核，选择【否】先放入我的需求，可后续在我的需求中再批量进行提交审核。',
          '提示',
          {
            confirmButtonText: '是',
            cancelButtonText: '否',
            showClose: false
          }
        )

        if (type === 'confirm') {
          loading.value = true
          let wfCode = ''
          const getWorkflowData = getZlxqFlag
          const getDataRes = await getWorkflowData(res.data.id, userInfo.dwId || '')

          if (orderParams) {
            wfParam.value.SFZYDW = orderParams.SFZYDW // 是否主业单位
            wfParam.value.SFSGS = orderParams.SFSGS // 是否市公司
            wfParam.value.SFWZBM = orderParams.SFWZBM // 是否物资部门
            wfParam.value.SFSJCY = orderParams.SFSJCY // 是否市公司产业单位 
            wfParam.value.SFBGS = orderParams.SFBGS // 是否办公室
            wfParam.value.CITYCY = orderParams.CITYCY, // 市产业
            wfParam.value.COUNTYCY = orderParams.COUNTYCY, // 县产业
            wfParam.value.COUNTYGD = orderParams.COUNTYGD, // 县供电
            wfParam.value.CITYGD = orderParams.CITYGD, // 市供电
            wfParam.value.SGS_CYDW_AUDIT = orderParams.SGS_CYDW_AUDIT // 是否需要市级产业单位审核
            wfParam.value.XGS_GDDW_AUDIT = orderParams.XGS_GDDW_AUDIT // 是否需要县级供电单位审核
            wfParam.value.SGS_GDDW_AUDIT = orderParams.SGS_GDDW_AUDIT // 是否需要市级供电单位审核
            wfParam.value.FQBM_UNICODE = orderParams.FQBM_UNICODE // 发起部门性质
            wfParam.value.FQDWSX = orderParams.FQDWSX // 发起单位产业单位属性
            wfParam.value.FQDWID = orderParams.FQDWID // 发起单位ID
            
            // wfParam.value.PROYWBM = orderParams.PROYWBM
            wfParam.value.PROYWBM = globalParams.SDKZYBM // 省对口专业部门
            wfParam.value.CITYZYBM = globalParams.XJSPBM // 市专业部门
            wfParam.value.ZRZCLB = globalParams.ZRZCLB // 租入资产类型
            wfCode = orderParams.WFCODE
          }

          if (getDataRes.success) {
            const wfUserInfo: WFUserInfo = {
              userId: store.getters.getUserMsg.id,
              spOrgId: userInfo.deptId || '',
              spRoleId: userInfo.spRoleId || ''
            }

            if (isEditOrAddId.value) {
              wfParam.value.XMIDS = isEditOrAddId.value
            }
            wfParam.value.FQZZ = userInfo.fqzzFlag
            wfParam.value.FQBM = userInfo.specialorgcode === 'BM_CWZC' ? 'CWB' : 'YWB'
            wfParam.value.SDKZYBM = getDataRes.data.SDKZYBM || ''
            wfParam.value.SYWGKBM = getDataRes.data.SYWGKBM || ''
            wfParam.value.CTBM = getDataRes.data.CTBM || ''
            wfParam.value.DWLX = getDataRes.data.DWLX || ''
            
            // console.log('===getDataRes===', getDataRes.data)
            // console.log('===wfParam===', wfParam.value)
            // console.log('===wfCode===',  wfCode)
            submitWorkflow(
              store.getters.getUserMsg.systemCode,
              wfCode,
              '',
              wfUserInfo,
              wfParam.value,
              {},
              (nextPersonAndPath: string, wfData: WFData) =>
                submitWFCallback(nextPersonAndPath, wfData, userInfo, closeHandle, wfCode)
            )
          } else {
            loading.value = false
            ElMessage.error(getDataRes.msg)
          }
        } else {
          notifyNumber.value = res.data.num
          ElMessage.success('成功存放在我的需求中!')
          closeHandle()
        }
      } else {
        loading.value = false
        ElMessage.error(res.msg)
      }
    } catch (error) {
      loading.value = false
      ElMessage.error('表单存在未填写的数据,请检查输入')
      console.error('表单验证失败', error)
    }
  }

  const resetWorkflow = () => {
    isEditOrAddId.value = null
    uuid.value = getUuid()
    for (const key in wfParam.value) {
      wfParam.value[key] = ''
    }
  }

  return {
    loading,
    uuid,
    isEditOrAddId,
    notifyNumber,
    wfParam,
    submitWFCallback,
    submitForm,
    resetWorkflow
  }
}

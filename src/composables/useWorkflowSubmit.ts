import { getBqshFlag, getWfCodeByXmId, saveInfoData, saveXmInfo, submitCbxqsh, submitZLxqsh } from '@/api/service/requirement'
import { getZlxqFlag } from '@/api/service/zlxqszy'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { validatePreAudit } from '@/utils/preAudit'
import { getUuid } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useStore } from 'vuex'
import VXETable from 'vxe-table'

export type WfCode = 'WF_NEWCBXQSHLC' | 'WF_ZLXQSHLC'

interface UserInfo {
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  spRoleId: string
  specialorgcode: string
  fqzzFlag: string
}

export function useWorkflowSubmit(wfCode: WfCode): any {
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

  const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData, userInfo: UserInfo, closeHandle: () => void, actualWfCode?: string) => {
    loading.value = true
    const submitWfCode = actualWfCode || wfCode
    const spfrom = {
      userId: store.getters.getUserMsg.id,
      spOrgId: userInfo.deptId || '',
      spRoleId: userInfo.spRoleId || '',
      wfCode: submitWfCode,
      wfData: wfParam.value,
      nextPersonAndPath: nextPersonAndPath
    }

    try {
      const xqshApi = wfCode === 'WF_NEWCBXQSHLC' ? submitCbxqsh : submitZLxqsh
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

  const saveInfo = async (globalParams: Record<string, any>, userInfo: UserInfo, sfzl: string, closeHandle: () => void) => {
    try {
      loading.value = true
      const res = await saveInfoData({
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
        notifyNumber.value = res.data.num
        ElMessage.success('成功存放在我的需求中!')
        closeHandle()
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

  const submitForm = async (globalParams: Record<string, any>, userInfo: UserInfo, sfzl: string, closeHandle: () => void) => {
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

        // 确认是否提交审核之前做预审；level2/3 点「是」直接提交，不再二次确认
        const preAuditResult = await validatePreAudit([res.data.id])
        if (preAuditResult === false) {
          return
        }

        let shouldSubmit = preAuditResult === 'directSubmit'
        if (preAuditResult === 'pass') {
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
            shouldSubmit = true
          } else {
            notifyNumber.value = res.data.num
            ElMessage.success('成功存放在我的需求中!')
            closeHandle()
            return
          }
        }

        if (shouldSubmit) {
          loading.value = true
          const getWorkflowData = wfCode === 'WF_NEWCBXQSHLC' ? getBqshFlag : getZlxqFlag
          const getDataRes = await getWorkflowData(res.data.id, userInfo.dwId || '')
          if (getDataRes.success) {
            const wfUserInfo: WFUserInfo = {
              userId: store.getters.getUserMsg.id,
              spOrgId: userInfo.deptId || '',
              spRoleId: userInfo.spRoleId || ''
            }

            if (isEditOrAddId.value) {
              wfParam.value.XMIDS = isEditOrAddId.value || ''
            }
            wfParam.value.FQZZ = userInfo.fqzzFlag
            wfParam.value.FQBM = userInfo.specialorgcode === 'BM_CWZC' ? 'CWB' : 'YWB'
            if (wfCode === 'WF_NEWCBXQSHLC') {
              wfParam.value.AQBQSH = getDataRes.data.AQBQSH || ''
              wfParam.value.YFBQSH = getDataRes.data.YFBQSH || ''
            } else {
              wfParam.value.SDKZYBM = getDataRes.data.SDKZYBM || ''
              wfParam.value.SYWGKBM = getDataRes.data.SYWGKBM || ''
            }
            wfParam.value.CTBM = getDataRes.data.CTBM || ''
            wfParam.value.DWLX = getDataRes.data.DWLX || ''

            // 租赁流程(WF_ZLXQSHLC)沿用传入的 wfCode；其余流程动态获取工作流编码
            let actualWfCode: string = wfCode
            if (wfCode !== 'WF_ZLXQSHLC') {
              const wfCodeRes = await getWfCodeByXmId(res.data.id)
              if (!wfCodeRes.success || !wfCodeRes.data) {
                loading.value = false
                ElMessage.error(wfCodeRes.msg || '获取工作流编码失败')
                return
              }
              actualWfCode = wfCodeRes.data
            }

            submitWorkflow(
              store.getters.getUserMsg.systemCode,
              actualWfCode,
              '',
              wfUserInfo,
              wfParam.value,
              {},
              (nextPersonAndPath: string, wfData: WFData) => submitWFCallback(nextPersonAndPath, wfData, userInfo, closeHandle, actualWfCode)
            )
          } else {
            loading.value = false
            ElMessage.error(getDataRes.msg)
          }
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
    saveInfo,
    submitForm,
    resetWorkflow
  }
}

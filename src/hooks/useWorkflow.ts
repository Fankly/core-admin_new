import { ElLoading, ElMessage } from 'element-plus'
import { getNextPersionAndPathFromStart, initWfJavascript } from '@/api/workflow'
import { ref } from 'vue'

const workflowLoading = ref(false)

export const submitWorkflow = async (
  systemCode: string,
  wfCode: string,
  workItemId: string,
  wfUserInfo: WFUserInfo,
  wfParam: WFParam,
  wfNodeParam: WFParam,
  fun: (nextPersonAndPath: any, wfDefine: any) => void
): Promise<void> => {
  if (!systemCode || !wfCode || !wfUserInfo?.userId) {
    ElMessage({
      type: 'error',
      message: '参数不完整,请检查必填项'
    })
    return
  }
  workflowLoading.value = true
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '工作流处理中...',
    background: 'rgba(0,0,0,0.7)'
  })
  try {
    const res: any = await initWfJavascript(wfUserInfo.spOrgId, wfCode, workItemId)
    if (res.success) {
      try {
        loadJsStr(res.data['javascript'])
        if (workItemId == '') {
          const wfDefine = buildWFDefine(systemCode, wfCode, wfUserInfo, wfParam)
          const getDataCrAndFinFir = (): any => {
            return wfDefine
          }
          //回调函数
          const crAndFinFir = (nextPersonAndPath: string): any => {
            fun(nextPersonAndPath, wfDefine)
          }
          window.getDataCrAndFinFir = getDataCrAndFinFir
          window.crAndFinFir = crAndFinFir
          window.bfCrAndFinFir = bfCrAndFinFir
        } else {
          const wfDefine = buildWFBfFinNode(workItemId, wfUserInfo, wfParam, wfNodeParam)
          const getDataBfFinNode = (): any => {
            return wfDefine
          }
          //回调函数
          const finNode = (nextPersonAndPath: string): any => {
            fun(nextPersonAndPath, wfDefine)
          }
          window.getDataBfFinNode = getDataBfFinNode
          window.finNode = finNode
          window.bfFinNode = bfFinNode
        }
        //跳转下一步
        loadJsStr(res.data['functionName'])
      } catch (jsError) {
        console.error('JavaScript执行错误', jsError)
        ElMessage({
          type: 'error',
          message: '脚本执行失败,请联系管理员'
        })
      }
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || '工作流初始化失败'
      })
    }
  } catch (error) {
    console.error('工作流提交错误', error)
    ElMessage({
      type: 'error',
      message: '网络请求失败,请稍后再试!'
    })
  } finally {
    workflowLoading.value = false
    loadingInstance.close()
  }
}

const bfCrAndFinFir = (): any => {
  return true
}

const bfFinNode = (): any => {
  return true
}

export const buildWFDefine = (systemCode: string, wfCode: string, wfUserInfo: WFUserInfo, wfParam: WFParam): any => {
  const wfData: WFData[] = []
  for (const key in wfParam) {
    const wfObj: WFData = { DataCode: key, DataValue: wfParam[key] }
    wfData.push(wfObj)
  }
  const WFDefine = {
    WorkFlowVersion: {
      SystemCode: systemCode,
      WorkFlowCode: wfCode,
      OrgId: wfUserInfo.spOrgId,
      CheckParentOrg: true
    },
    WorkFlowStartInfo: {
      UserId: wfUserInfo.userId,
      UserSpRoleId: wfUserInfo.spRoleId
    },
    WorkFlowDataList: {
      WorkFlowData: wfData
    },
    NodeInst: {
      HandlerId: wfUserInfo.userId,
      HandlerSpRoleId: wfUserInfo.spRoleId,
      ActivityDataList: {
        WorkFlowData: []
      }
    }
  }
  return JSON.stringify(WFDefine)
}

export const buildWFBfFinNode = (workItemId: string, wfUserInfo: WFUserInfo, wfParam: WFParam, wfNodeParam: WFParam): any => {
  const wfData: WFData[] = []
  for (const key in wfParam) {
    const wfObj: WFData = { DataCode: key, DataValue: wfParam[key] }
    wfData.push(wfObj)
  }
  const wfNodeData: WFData[] = []
  for (const key in wfNodeParam) {
    const wfObj: WFData = { DataCode: key, DataValue: wfNodeParam[key] }
    wfNodeData.push(wfObj)
  }
  const WFDefine = {
    HandlerId: wfUserInfo.userId,
    WorkItemId: workItemId,
    WorkFlowDataList: {
      WorkFlowData: wfData
    },
    ActivityDataList: {
      WorkFlowData: wfNodeData
    }
  }
  return JSON.stringify(WFDefine)
}

export const loadJsStr = (jsStr: string): void => {
  try {
    if (!jsStr || typeof jsStr !== 'string') {
      throw new Error('无效的JavaScript代码')
    }
    window.eval(jsStr)
  } catch (error) {
    console.error('JavaScript执行错误', error)
    throw error
  }
}

export const useWorkflowLoading = () => {
  return {
    workflowLoading: workflowLoading.value
  }
}

export interface WFUserInfo {
  userId: string
  spOrgId: string
  spRoleId: string
}

export interface WFParam {
  [key: string]: string
}

export interface WFData {
  DataCode: string
  DataValue: string
}

// 模拟API调用，实际项目中替换为真实的API请求

import { getDwStatus } from '@/api/fy/search'
import { getAppByGroupCode } from '@/api/service/zl'

/**
 * 获取流程步骤配置
 */
export const getProcessSteps = async () => {
  // 模拟API请求延迟
  const res = await getAppByGroupCode('FYJSC')
  // 图标数组，每四个循环
  const icons = ['1', '2', '3', '4']

  return {
    code: res.success,
    data: res.data.map((step: any, index: number) => ({
      ...step,
      icon: icons[index % icons.length] // 每四个图标循环
    }))
  }
}

/**
 * 获取表格配置
 */
export const getTableConfig = async () => {
  return {
    code: true,
    data: {
      columns: [
        { key: 'dwName', label: '单位名称' },
        { key: 'yapStatus', label: '预安排' },
        { key: 'ndStatus', label: '年度' }
      ]
    }
  }
}

/**
 * 获取表格数据
 */
export const getTableData = async (params: any = {}) => {
  const res = await getDwStatus({
    dwName: params.search,
    dwId: params.userInfo.dwId
  })
  return {
    code: res.success,
    data: {
      list: res.data,
      total: res.data.length
    }
  }
}

/**
 * 处理流程步骤操作
 */
export const handleStepAction = async (actionId: any, stepId: any) => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    code: 200,
    message: '操作执行成功'
  }
}

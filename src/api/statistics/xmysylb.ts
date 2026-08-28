import { budgetApi } from '@/api/base/ServiceApi'
import type { Result } from '@/api/types'

// 项目预算执行一览表查询参数（对齐后端 XmYsylDto，前端忽略 applyCenter/bmxz/cropId/orgFlag）
export interface XmYsylData {
  nd: string // 年度
  parentId: string // 节点id（首次传年度）
  nodeType: string // 节点类型
  ydStart: string // 预算期间-开始月份
  ydEnd: string // 预算期间-结束月份
  dwId: string // 单位id
  bmId: string // 部门id
  yjdw?: string // 一级单位
  ejdw?: string // 二级单位
  proType?: string // 项目类型
  xmlxId?: string // 项目类型code
  xmxz?: string // 项目性质
  xmmc?: string // 项目名称
  xmbm?: string // 项目编码
  xmbmc?: string // 项目包编码
  xmbId?: string // 项目包id
  gwxmbm?: string // 国网络项目编码
  roleCode?: string // 角色编码
  roleId?: string // 角色id
  userId?: string // 用户id
  page?: number // 当前页
  limit?: number // 每页数据条数
}

const budget = budgetApi

// 获取数据
export const getDataList = (params: XmYsylData): Promise<Result & { data: Record<string, any>[] }> => {
  return budget.post('xmysyl/getData', params)
}

// 获取动态表头
export const getDynamicColumn = (params: XmYsylData): Promise<Result & { data: any[] }> => {
  return budget.post('xmysyl/getDynamicColumn', params)
}

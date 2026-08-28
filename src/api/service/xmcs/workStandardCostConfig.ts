import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'
import { IObject } from '@/types/interface'

export const budget = ServiceApi.budget

interface ImportData {
  excelFormData: any
  [key: string]: any
}

interface SaveOrUpdateParams {
  id?: string // 主键
  dirId: string // 所属目录
  zybm: string // 作业编码
  zymc: string // 作业名称
  zynrms: string // 作业内容描述
  dydj: string // 电压等级
  rl: string // 容量（KVA）
  sbdw: string // 设备单位
  rcjbm: string // 人材机编码
  rcjmc: string // 人材机名称
  dw: string // 单位
  dj: string // 单价(元)
  sl: string // 数量
  je: string // 金额(元)
  sortNo: string // 排序
  remark: string // 备注
  creator: string // 创建人
  updater: string // 更新人
}

interface QueryParams {
  dirId: string // 所属目录
  page: number // 页码
  limit: number // 每页条数
  dwId: string // 单位ID
  bmId: string // 部门ID
  roleId: string // 角色ID
  zybm?: string // 作业编码
  zymc?: string // 作业名称
}

// 作业标准成本体系配置-新增、编辑
export const saveOrUpdateHandler = (params: SaveOrUpdateParams[]): Promise<Result> => {
  return budget.post(`/zyDetail/saveOrUpdate`, params, {}, false)
}

// 作业标准成本体系配置-查询
export const query = (params: QueryParams): Promise<Result> => {
  return budget.post(`/zyDetail/query`, params, {}, false)
}

// 作业标准成本体系配置-根据id查询
export const queryById = (params: { id: string }): Promise<Result> => {
  return budget.post(`/zyDetail/queryById`, params, {}, false)
}

// 作业标准成本体系配置-删除
export const deleteHandler = (ids: string[]): Promise<Result> => {
  return budget.post(`/zyDetail/delete`, { ids }, {}, false)
}

// 作业标准成本体系配置-导入模板下载
export const getImportTemplate = (params: IObject): Promise<any> => {
  return budget.getExport(`/zyDetail/importTemplate`, params, {}, false)
}

// 作业标准成本体系配置-导入
export const importExcel = (params: ImportData): Promise<Result> => {
  const { excelFormData, ...rest } = params
  Object.keys(rest).forEach((key) => {
    if (rest[key] !== undefined && rest[key] !== null) {
      excelFormData.append(key, rest[key])
    }
  })
  return budget.post(`/zyDetail/importExcel`, excelFormData, {}, false)
}

// 作业标准成本体系配置-导出
export const exportExcel = (params: IObject): Promise<any> => {
  return budget.exportFile(`/zyDetail/exportExcel`, params, {}, false)
}

interface IQueryDirParams {
  id: string // 目录id
  parentId: string // 父目录id 一级目录为0
  nodeLevel: number // 节点层(1=一级 2=二级 3=三级)
  dirName: string // 目录名称
  sortNo: number // 排序
  remark: string // 备注
  updater: string // 更新人
}

interface queryByIdDirParams {
  zymc: string
}

// 作业标准分类目录-查询目录树
export const queryDir = (): Promise<Result> => {
  return budget.post(`/zyDir/queryTree`, {}, {}, false)
}

// 通过ID查询
export const queryDirById = (params: IQueryDirParams): Promise<Result> => {
  return budget.post(`/zyDir/queryById`, params, {}, false)
}

// 新增或更新
export const saveOrUpdateDir = (params: IQueryDirParams): Promise<Result> => {
  return budget.post(`/zyDir/saveOrUpdate`, params, {}, false)
}

// 删除
export const deleteDir = (ids: string[]): Promise<Result> => {
  return budget.post(`/zyDir/delete`, { ids }, {}, false)
}

interface QueryIdsByDirIdAndZybmResult {
  ids: string[]
  je: string
  zymc: string
}

// 根据目录ID和作业编码查询明细ID列表
export const queryIdsByDirIdAndZybm = (dirId: string, zybmList: string[]): Promise<Result & { data: QueryIdsByDirIdAndZybmResult }> => {
  return budget.post(`/zyDetail/queryIdsByDirIdAndZybm`, { dirId, zybmList }, {}, false)
}

// 根据作业名称查询目录路径
export const queryDirPathByName = (params: queryByIdDirParams): Promise<Result> => {
  return budget.post(`/zyDir/queryDirPathByName`, params, {}, false)
}

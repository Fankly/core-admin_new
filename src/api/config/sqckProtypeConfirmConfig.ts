import baseService from '@/service/baseService'

// 申请出库确认配置接口
interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

interface SqckProtypeConfirmConfigList {
  dataType: string
  nd: string
  protypeId: string
}

interface FormData {
  protypeId: string
  nd: string
}

interface SaveData {
  linkedPortypeIds: string[]
  nd: string
  protypeId: string
}

// 申请出库确认配置列表
export const getSqckProtypeConfirmConfigList = (params: SqckProtypeConfirmConfigList): Promise<Result> => {
  return baseService.get('/sqckProtypeConfirmConfig/getList', params)
}

// 根据xmid获取已关联的项目类别
export const getSqckProtypeConfirmChoosedData = (params: FormData) => {
  return baseService.get('/sqckProtypeConfirmConfig/getChoosedData', params)
}

// 保存修改数据
export const saveSqckProtypeConfirmData = (params: SaveData) => {
  return baseService.post('/sqckProtypeConfirmConfig/saveOrUpdate', params)
}

interface DeleteData {
  ids: string[]
  nd: string
}

// 删除
export const deleteSqckProtypeConfirmData = (params: DeleteData) => {
  return baseService.post('/sqckProtypeConfirmConfig/delete', params)
}

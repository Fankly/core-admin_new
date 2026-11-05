export interface MaterialRow {
  id: string
  bigCategoryCode: string
  bigCategoryDesc: string
  freezeMark: string
  isAssetLevelEquipment: string
  materialCode: string
  materialDesc: string
  materialGroupCode: string
  middleCategoryCode: string
  middleCategoryDesc: string
  smallCategoryCode: string
  smallCategoryDesc: string
  sourceDirDesc: string
  sourceDirRowNumber: string
}

export interface MaterialTaskRow {
  id: string
  taskId: number | string
  taskNo: string
  taskName: string
  dwName: string
  xmbm: string
  xmmc: string
  status: string
  statusName: string
  createTime: string
  createUserName: string
  startTime: string
  endTime: string
  [key: string]: any
}

export interface MaterialTaskDetailRow {
  id?: string
  pspid?: string
  post1?: string
  matnr?: string
  maktx?: string
  mjahr?: string
  [key: string]: any
}

export interface PageResult<T> {
  records: T[]
  total: number | string
}

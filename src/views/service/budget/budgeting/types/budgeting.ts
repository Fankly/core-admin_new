export interface RowVO {
  id: number
}

export interface ServiceBtn {
  name: string
  pression: string
  method: (params?: any) => void
}

export interface Tree {
  name: string
  leaf?: boolean
}

export interface SearchParams {
  ejdw: string
  gwxmbms: string
  xmStatus: string
  xmbName: string
  xmbms: string
  xmmc: string
  yjdw: string
  ysStatus: string
}

export interface Basic {
  bmId: string
  dwId: string
  limit: string
  page: string
  roleId: string
  roleCode: string
}

export type SearchPage = Basic & SearchParams

export interface UnitLevel {
  code: string
  name: string
}

export interface SearchData {
  bmId: string
  dwId: string
  limit: string | number
  page: string | number
  pspcCode: string
  pspcName: string
  roleId: string
  roleCode: string
}

export interface SaveData {
  id?: string | number
  nd: string
  lhhsSkTime: string
  lhhsOneEndTime: string
  lhhsOneStartTime: string
  lhhsTwoStartTime: string
  lhhsTwoEndTime: string
  lhhsThreeStartTime: string
  lhhsThreeEndTime: string
  lhhsFourStartTime: string
  lhhsFourEndTime: string
  pspcCode: string
  pspcType: '1' | '2'
  pspcName: string
}

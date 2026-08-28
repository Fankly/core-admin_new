interface Params {
  [key: string]: any
}

export type TabName = 'projectDevices' | 'quotaInfo' | 'quotaTeams' | 'quotaStationLines'

export interface Props {
  selectData: null | Params
  globalParams: null | Params
  opType: string
}

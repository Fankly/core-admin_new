export interface formDataVo {
  nd: string
  title: string
  fileName: string
  versionNo: string
  versionId: string
  versionName: string
  specialorgid: string
}

export interface formDataYxVo {
  nd: string
  dwId: string
  title: string
  fileName: string
  versionNo: string
  versionId: string
  versionName: string
  specialorgid: string
}

export interface formDataHdVo {
  nd: string
  dwId: string
  dwName: string
  title: string
  versionNo: string
  versionId: string
  versionName: string
  specialorgid: string
}

export interface apiVo {
  treeApi: (params: any) => Promise<any>
  checkStrictly: boolean
}

export interface pageInfoVO {
  loading: boolean
  isShowPage: boolean
}

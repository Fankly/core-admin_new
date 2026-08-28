export interface TargetValueWorkflowParams {
  [key: string]: string
  message: string
  dwId: string
  versionId: string
  code: string
  workItemId: string
  isZgs: string
  versionNo: string
  versionName: string
  nd: string
}

export interface TargetValueVersionInfo {
  nd: string
  dwId: string
  versionId: string
  versionName: string
  versionNo: string
}

export interface TargetValueParamMap {
  [key: string]: string
}

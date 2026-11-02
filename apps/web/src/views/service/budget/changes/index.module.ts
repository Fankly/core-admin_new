import { ElMessage } from 'element-plus'
export const handleError = (error: Error, message = '操作失败'): void => {
  ElMessage({
    message: `${message}:${error.message}`,
    type: 'error',
    duration: 5000
  })
}
export type ProjectChangeMode = 'create' | 'edit' | 'view'
export const PROJECT_ADJUSTMENT_TAB = '2'
export const ANNUAL_BUDGET_ADJUSTMENT_TAB = '0'
export const SCALE_PACKAGE_ADJUSTMENT_TAB = '1'
export const PROJECT_CHANGE_PERMISSION_CODES = ['CREATE_CART', 'EDIT_CART', 'VIEW_CART', 'DELETE_CART']
export const PROJECT_CHANGE_EDITABLE_COMPONENTS = ['xmbgxx']
export const PROJECT_CHANGE_STATUS_NAMES: Record<string, string> = {
  Q00: '需求草稿',
  Q01: '审批驳回',
  A01: '待联合会审',
  Q02: '会审驳回',
  A03: '会审通过',
  A10: '评审意见上传',
  '300': '批复意见上传',
  '310': '发展合规审核中',
  '301': '发展合规审核驳回',
  B99: '变更完成'
}
export const PROJECT_CHANGE_EDITABLE_STATUSES = ['Q00', 'Q01', 'Q02', '301']
export const PROJECT_CHANGE_DELETABLE_STATUSES = PROJECT_CHANGE_EDITABLE_STATUSES
export const PROJECT_CHANGE_CREATABLE_STATUSES = ['', 'B99']
export const PROJECT_CHANGE_RETURNABLE_STATUSES = ['A01']
export const getProjectChangeStatusText = (statuses: string[]) =>
  statuses.map((status) => PROJECT_CHANGE_STATUS_NAMES[status] || '空状态').join('、')
export const PROJECT_CHANGE_EDITABLE_STATUS_TEXT = getProjectChangeStatusText(PROJECT_CHANGE_EDITABLE_STATUSES)
export const PROJECT_CHANGE_CREATABLE_STATUS_TEXT = getProjectChangeStatusText(PROJECT_CHANGE_CREATABLE_STATUSES)
export const PROJECT_CHANGE_DELETABLE_STATUS_TEXT = getProjectChangeStatusText(PROJECT_CHANGE_DELETABLE_STATUSES)
export const PROJECT_CHANGE_RETURNABLE_STATUS_TEXT = getProjectChangeStatusText(PROJECT_CHANGE_RETURNABLE_STATUSES)

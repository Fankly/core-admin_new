export const DEFAULT_MATERIAL_TITLE = '物料资成本属性关系表'
export const DEFAULT_MATERIAL_JUDGMENT_RESULT_NAME = DEFAULT_MATERIAL_TITLE
export const MATERIAL_JUDGMENT_RESULT_NAME_CODE = 'MATERIAL_JUDGMENT_RESULT_NAME_COM'

interface CommonCodeItem {
  name?: string | null
}

export interface MaterialTitleConfig {
  modalTitle: string
  title: string
  exportFileName: string
}

const getCommonCodeName = (item?: CommonCodeItem): string => {
  const name = item?.name?.trim()
  return name || DEFAULT_MATERIAL_TITLE
}

export const resolveMaterialTitleConfig = (codes?: CommonCodeItem[] | null): MaterialTitleConfig => ({
  modalTitle: getCommonCodeName(codes?.[0]),
  exportFileName: getCommonCodeName(codes?.[1]),
  title: getCommonCodeName(codes?.[2])
})

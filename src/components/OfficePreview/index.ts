import OfficePreview from './index.vue'

export type {
  OfficeDocxOptions,
  OfficeExcelOptions,
  OfficeFileType,
  OfficePdfOptions,
  OfficePreviewEmits,
  OfficePreviewInstance,
  OfficePreviewProps,
  OfficePreviewSource,
  OfficeRendererType,
  OfficeToolbarOptions
} from './types'
export { getOfficeFileExtension } from './fileExtension'
export { isSpreadsheetNativeExt, isWordNativeExt, SPREADSHEET_NATIVE_EXTS, WORD_NATIVE_EXTS } from './types'

export default OfficePreview

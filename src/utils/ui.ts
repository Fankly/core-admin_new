import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  message: ElMessage,
  error: ElMessage.error,
  info: ElMessage.info,
  warning: ElMessage.warning,
  success: ElMessage.success,
  confirm: ElMessageBox.confirm
}

export const getCheckedRowClass = ({ checkedRows, rowkey = 'id' }: any) => {
  return ({ row }: any) => {
    if (!checkedRows.value) return ''
    return checkedRows.value.some((item: any) => item[rowkey] === row[rowkey]) ? 'checked-row' : ''
  }
}

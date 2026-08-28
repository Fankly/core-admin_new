import { ref, Ref } from 'vue'
import { RowVo } from '@/views/service/continueCarryOver/interface'
import { formatValue } from '@/utils/utils'
import { downloadAttach } from '@/api/service/continueCarryOver'

export function operation(tableRef: Ref<any>) {
  const tableData = ref<RowVo[]>([])
  const checkedData = ref<RowVo[]>([])
  const checkChangeHandle = ({ records }: any) => {
    checkedData.value = records
  }
  const checkChangeAllHandle = ({ records }: any) => {
    checkedData.value = records
  }

  const cellClickHandle = async ({ row, column }: any) => {
    if (column.type === 'checkbox') return
    checkedData.value = []
    await tableRef.value.clearCheckboxRow()
    await tableRef.value.setCheckboxRow(row, true)
    checkedData.value.push(row)
  }

  const cellStyle = ({ column }: any) => {
    if (column['field'] === 'bgDnys' || column['field'] === 'bgAmount') {
      return {
        borderBottom: '1px solid red',
        cursor: 'pointer'
      }
    }
  }
  const formatterHandle = ({ cellValue }: { cellValue: string }) => {
    if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
    return formatValue(cellValue, Number(6))
  }

  // 附件下载
  const downloadFile = async (uuid: string, fileName: string, loading: Ref<boolean>) => {
    loading.value = true
    const blob: any = await downloadAttach(uuid)
    const dom = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    dom.download = `${decodeURI(decodeURI(fileName))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  }

  return {
    checkChangeHandle,
    downloadFile,
    formatterHandle,
    checkChangeAllHandle,
    cellStyle,
    tableData,
    checkedData,
    cellClickHandle
  }
}

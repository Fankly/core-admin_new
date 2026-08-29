import ExcelJS from 'exceljs'
import { ElMessage, ElNotification } from 'element-plus'

/**
 * el-table 前端自定义导出
 * @param headerList 表头
 * @param dataList 表格数据 一一对应
 * @param fileName 文件名
 */
export const exportXlsx = (headerList: any, dataList: any[], fileName: any) => {
  if (dataList.length != 0) {
    ElNotification({
      title: '温馨提示',
      message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
      type: 'info',
      duration: 3000
    })
    const workbook = new ExcelJS.Workbook()
    const sheet1 = workbook.addWorksheet('sheet1')
    sheet1.addRow(headerList)
    dataList.forEach((row: any) => {
      const values = Object.values(row)
      sheet1.addRow(values)
    })
    sheet1.columns.forEach((item, index) => {
      item.alignment = { vertical: 'middle', horizontal: 'center' } //单元格居中
      item.width = 20 //宽度
    })
    sheet1.getRow(1).font = { bold: true }

    workbook.xlsx.writeBuffer().then((buffer) => {
      const file = new Blob([buffer], { type: 'application/octet-stream' })
      const dom = document.createElement('a')
      const url = window.URL.createObjectURL(file)
      dom.href = url
      dom.download = `${decodeURI(decodeURI(fileName))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
    })
  } else {
    ElMessage.warning('暂无数据，请勿重复点击！')
  }
}

interface ApiExportHandleOptions {
  useResponseFileName?: boolean
}

/**
 *  api导出
 * @param params api入参
 * @param fileName 文件名
 * @param api apiName
 * @param options 导出选项
 */
export const apiExportHandle = async (params: any, fileName: string, api: (params: any) => Promise<any>, options: ApiExportHandleOptions = {}) => {
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  const res: any = await api(params)
  const blob = res
  const dom = document.createElement('a')
  const url = window.URL.createObjectURL(blob)
  dom.href = url
  let filename = `${fileName}.xlsx` // 文件名
  if (options.useResponseFileName !== false && res.headers && res.headers['content-disposition']) {
    filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
  }
  dom.download = `${decodeURI(decodeURI(filename))}`
  document.body.appendChild(dom)
  dom.click()
  document.body.removeChild(dom)
  window.URL.revokeObjectURL(url)
}

/**
 * vxe-table 前端自定义导出
 * @param $table TableRef
 * @param fileName 文件名
 * @param data 数据
 */
export const vxeExportHandle = ($table: any, fileName: string, data: any[]) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })

      worksheet.eachRow((row: any, rowNumber: any) => {
        // 非末级当前行加粗
        if (newArr[rowNumber - 3]?.leaf) {
          row.eachCell((cell: any) => {
            cell.font = {
              ...cell.font,
              bold: true
            }
          })
        }
      })
    }
  })
}

export const vxeExportGkHandle = ($table: any, fileName: string, data: any[]) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })

      worksheet.eachRow((row: any, rowNumber: any) => {
        row.eachCell((cell: any) => {
          if (typeof cell.value === 'number') {
            cell.numFmt = '0.00'
          }
          if (typeof cell.value === 'string' && cell.value.includes('(%')) {
            cell.value = cell.value.replace(/\(/g, '\n(')
            cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle', horizontal: 'center' }
          }
          cell.border = {
            top: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            left: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            bottom: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            right: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            }
          }
        })
      })
    }
  })
}

/**
 * vxe-table 前端自定义导出(带样式)
 * @param $table TableRef
 * @param fileName 文件名
 * @param data 数据
 */
export const vxeExportStyle = ($table: any, fileName: string, data: any[]) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
          const { mbzGkjb } = newArr[cellNumber - 3]
          cell.font.color = {
            argb: mbzGkjb == '1' ? 'ff4c52' : mbzGkjb == '2' ? 'fcb900' : mbzGkjb == '3' ? '11c26d' : ''
          }
        }
      })
      worksheet.eachRow((row: any, rowNumber: any) => {
        // 非末级当前行加粗
        if (newArr[rowNumber - 3]?.leaf) {
          row.eachCell((cell: any) => {
            cell.font = {
              ...cell.font,
              bold: true
            }
          })
        }
      })
    }
  })
}

const getExportData = (newArr: any[], data: any[], cj: number, $table: any) => {
  data.forEach((item) => {
    const flag = $table.isTreeExpandByRow(item)
    newArr.push({
      name: item?.name,
      cj: cj,
      leaf: item?.leaf,
      mbzGkjb: item.mbzGkjb
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children, cj + 1, $table)
    }
  })
  return newArr
}

/**
 *  api导出(各个类型文件)
 * @param params api入参
 * @param fileName 文件名包括后缀
 * @param api apiName
 */
export const apiExporFile = async (params: any, fileName: string, api: (params: any) => Promise<any>) => {
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  const res: any = await api(params)
  const blob = res
  const dom = document.createElement('a')
  const url = window.URL.createObjectURL(blob)
  dom.href = url
  let filename = `${fileName}`
  if (res.headers && res.headers['content-disposition']) {
    filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
  }
  dom.download = `${decodeURI(decodeURI(filename))}`
  document.body.appendChild(dom)
  dom.click()
  document.body.removeChild(dom)
  window.URL.revokeObjectURL(url)
}

export const vxeExportSixHandle = ($table: any, fileName: string, data: any[]) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })

      worksheet.eachRow((row: any, rowNumber: any) => {
        row.eachCell((cell: any) => {
          if (typeof cell.value === 'number') {
            cell.numFmt = '0.000000'
          }
          if (typeof cell.value === 'string' && cell.value.includes('(%')) {
            cell.value = cell.value.replace(/\(/g, '\n(')
            cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle', horizontal: 'center' }
          }
          cell.border = {
            top: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            left: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            bottom: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            right: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            }
          }
        })
      })
    }
  })
}

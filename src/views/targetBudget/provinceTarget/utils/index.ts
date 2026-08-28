import { checkByUserDept, checkFromWf, validateMessage } from '@/api/targetBudget/provinceTarget'
import { IObject } from '@/types/interface'
import { formatNumValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { VxeGridPropTypes } from 'vxe-table'
import { TargetBudgetMaintainColumn } from '../types/provinceTarget'

interface ValidatePro {
  bmId: string
  dwId: string
  nd: string
}

// 校验信息
export const validatePro = async (params: ValidatePro, showLoading = true): Promise<null | IObject> => {
  try {
    const res = await validateMessage(params, showLoading)
    if (!res.success) throw new Error(res.msg)
    return res.data
  } catch (error) {
    ElMessage({
      type: 'error',
      duration: 1500,
      message: (error as Error).message
    })
    return null
  }
}

// 校验工作流
export const validateWorkflowMessage = async (versionId: string | number, showMessage = true): Promise<boolean> => {
  if (!versionId) {
    if (showMessage) {
      ElMessage({
        type: 'warning',
        message: '版本信息缺失!'
      })
    }
    return false
  }
  try {
    const res = await checkFromWf(versionId, '')
    if (!res.success) throw new Error(res.msg)
    return true
  } catch (error) {
    if (showMessage) {
      ElMessage({
        type: 'warning',
        duration: 2000,
        message: (error as Error).message
      })
    }
    return false
  }
}

// 字段转换
export const transformToVxeColumns = (list: TargetBudgetMaintainColumn[]): VxeGridPropTypes.Columns => {
  return list
    .filter((item) => !item.hidden)
    .map((item) => {
      const column: any = {
        field: item.columnKey,
        title: item.columnValue || item.columnKey,
        align: item.align ?? 'center',
        color: item.color,
        dataType: item.dataType,
        visible: item.visible,
        width: 180
      }
      if (item.fixed) {
        column.fixed = item.fixed === true ? 'left' : item.fixed
      }

      if (item.eidt) {
        column.editRender = {
          name: 'input',
          autofocus: '.my-input',
          autoselect: true
        }
        column.slots = {
          edit: column.field + '_edit'
        }
      }

      if (item.needSum || item.sumRow) {
        column.align = 'right'
        column.headerAlign = 'center'
        column.formatter = ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          if (cellValue === '-') return cellValue
          return formatNumValue(cellValue.toString(), 6)
        }
      } else {
        column.formatter = ({ cellValue }: { cellValue: string }) => {
          if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
          if (cellValue === '-') return cellValue
          return cellValue
        }
      }
      return column
    })
}

// 校验部门数据
export const validateDeptData = async (bmId: string, nd: string) => {
  try {
    const res = await checkByUserDept(bmId, nd)
    if (!res.success) throw new Error(res.msg)
    return res.data
  } catch (error) {
    ElMessage({
      type: 'error',
      duration: 1500,
      message: (error as Error).message
    })
    return null
  }
}

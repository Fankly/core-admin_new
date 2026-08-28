import { IObject } from '@/types/interface'

export type TableStructure = 'flat' | 'tree'
export type ColorMode = 'text' | 'background'

export interface TableCellColorMapperOptions {
  structure?: TableStructure
  colorFieldSuffix?: string
  mode?: ColorMode
}

export interface TableCellColorStyle {
  color?: string
  fontWeight?: number
  backgroundColor?: string
}

const COLOR_LIST: Record<string, string> = {
  '1': '',
  '2': '#e6a23c',
  '3': '#f56c6c'
}

export class TableCellStyle {
  private colorFieldSuffix: string
  private mode: ColorMode

  constructor(options?: TableCellColorMapperOptions) {
    this.colorFieldSuffix = options?.colorFieldSuffix ?? '_color'
    this.mode = options?.mode ?? 'text'
  }

  public getCellStyle(row: IObject, field?: string): TableCellColorStyle | undefined {
    if (!row || !field) return undefined
    const baseField = this.extractBaseField(field)
    const colorFieldKey = `${baseField}${this.colorFieldSuffix}`
    const colorValue = row[`${colorFieldKey}`]
    return this.createStyle(colorValue)
  }

  private extractBaseField(field: string): string {
    return field.replace(/_.*$/, '')
  }

  private createStyle(code: string | number | undefined): TableCellColorStyle | undefined {
    if (code === null || code === undefined || code === '') return undefined
    const color = COLOR_LIST[String(code)]
    if (!color) return undefined
    if (this.mode === 'background') {
      return {
        backgroundColor: color,
        fontWeight: 600
      }
    }
    return {
      color,
      fontWeight: 600
    }
  }
}

// 市级联合会审评审专业公共代码
export const CITY_PSZY_PUBLIC_CODE = 'CITY_LHHS_PSZY'

export interface PszyCodeItem {
  code: string
  name: string
  // 1：创建时默认选中且不可取消；0：可选
  note?: string | number | null
  [key: string]: any
}

// 会议上的评审专业：major 为编码、majorName 为名称，均逗号拼接且按位置一一对应
export interface MeetingMajor {
  major?: string | string[]
  majorName?: string | string[]
}

export const isLockedPszy = (item: PszyCodeItem) => String(item?.note ?? '') === '1'

export const pickMeetingMajor = (row: Partial<any> = {}): MeetingMajor => ({
  major: row?.major ?? '',
  majorName: row?.majorName ?? ''
})

// 列表行为逗号拼接字符串，编辑弹窗内 major 为数组
const toList = (value: unknown): string[] => (Array.isArray(value) ? value : String(value ?? '').split(',')).map((item) => String(item ?? '').trim())

// 按会议 major 取评审专业，major 有几个就返回几个
// 名称优先取同位置的 majorName（老会议编码与现公共代码对不上时以它为准），其次取公共代码，最后以编码兜底
export const resolveMajorPszyList = ({ major, majorName }: MeetingMajor, codeList: PszyCodeItem[] = []): PszyCodeItem[] => {
  const codes = toList(major)
  const names = toList(majorName)
  const result: PszyCodeItem[] = []
  codes.forEach((code, index) => {
    if (!code || result.some((item) => item.code === code)) return
    const codeItem = codeList.find((item) => item.code === code)
    result.push({ ...codeItem, code, name: names[index] || codeItem?.name || code })
  })
  return result
}

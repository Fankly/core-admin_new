export interface Process42YssxOption {
  value: string
  label: string
}

export interface Process42ZdtxOption {
  value: string
  label: string
}

export const mapProcess42YssxOptions = (list: any[] = []): Process42YssxOption[] => {
  return list.map((item) => ({
    value: String(item.id ?? item.yssxId ?? item.code ?? ''),
    label: item.name ?? item.zyssxmc ?? item.yssxmc ?? item.label ?? ''
  }))
}

export const mapProcess42ZdtxOptions = (list: any[] = []): Process42ZdtxOption[] => {
  return list.map((item) => ({
    value: String(item.id ?? item.code ?? ''),
    label: item.ctmc ?? item.name ?? item.label ?? ''
  }))
}

export const buildProcess42MatterParams = (searchData: { YSSX_NEW_ID?: string[]; ZDTX_ID?: string }): { YSSX_NEW_ID: string[]; ZDTX_ID: string } => {
  return {
    YSSX_NEW_ID: searchData.YSSX_NEW_ID || [],
    ZDTX_ID: searchData.ZDTX_ID || ''
  }
}

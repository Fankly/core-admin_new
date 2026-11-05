// 标记行只展示接口值，不生成公式，也不作为其他行纵向汇总的输入。
export const isStaticExportRow = (row?: Record<string, unknown>): boolean => row?.isZbLine === 1 || row?.isZbLine === '1'

import { computed } from 'vue'

interface SequenceRow {
  id?: string | number
  subName?: unknown
  children?: SequenceRow[]
}

interface CellSpan {
  rowspan: number
  colspan: number
}

interface SequenceTable {
  isTreeExpandByRow: (row: SequenceRow) => boolean
}

const HIDDEN_CELL: CellSpan = { rowspan: 0, colspan: 0 }

const sequenceKey = (value: unknown) => {
  if (value === null || value === undefined) return ''
  const key = String(value).trim()
  // 空值及后端返回的“-”占位符不能当成同一个序号。
  return key === '-' ? '' : key
}

// 按树表实际可见顺序单次遍历，隐藏的子节点不参与合并；迭代遍历避免深树递归溢出。
export const buildSequenceSpans = (rows: SequenceRow[], isExpanded: (row: SequenceRow) => boolean) => {
  const spans = new WeakMap<SequenceRow, CellSpan>()
  const stack = [{ rows, index: 0 }]
  let previousKey = ''
  let firstSpan: CellSpan | undefined

  while (stack.length) {
    const frame = stack[stack.length - 1]
    if (frame.index >= frame.rows.length) {
      stack.pop()
      continue
    }
    const row = frame.rows[frame.index++]
    const key = sequenceKey(row.subName)
    if (key && key === previousKey && firstSpan) {
      firstSpan.rowspan += 1
      spans.set(row, HIDDEN_CELL)
    } else {
      firstSpan = { rowspan: 1, colspan: 1 }
      spans.set(row, firstSpan)
    }
    previousKey = key

    if (row.children?.length && isExpanded(row)) {
      stack.push({ rows: row.children, index: 0 })
    }
  }
  return spans
}

// 适用于主表及同比环比弹窗的非 transform 懒加载树。VXE 的 mergeCells 不支持这种树表。
// computed 跟踪数据、序号及 isTreeExpandByRow 读取的展开状态，查询/展开/收起后才重算。
// 每次重算 O(可见行数)，渲染只查 WeakMap；金额变化、横向滚动和固定列重绘不重扫数据。
export const useSequenceSpan = (getRows: () => SequenceRow[], getTable: () => SequenceTable | undefined) => {
  const spans = computed(() => {
    const table = getTable()
    return buildSequenceSpans(getRows(), (row) => !!table?.isTreeExpandByRow(row))
  })

  return ({ row, column }: { row: SequenceRow; column: { field?: string } }) => {
    if (column.field !== 'subName') return
    return spans.value.get(row)
  }
}

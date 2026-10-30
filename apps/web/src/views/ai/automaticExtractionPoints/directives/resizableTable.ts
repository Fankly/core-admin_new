import type { Directive } from 'vue'

/**
 * 表格列宽拖拽（本页面本地指令，作用于 .aep-table）
 *
 * 用法：`<table class="aep-table" v-resizable-table>` —— 在表头单元格右缘注入拖拽手柄，
 * 按住左右拖动即调整列宽；加了 `data-resize-skip` 的表头不注入（如需要固定偏移的列）。
 */

/** 最小列宽（px） */
const MIN_WIDTH = 60
/** 拖拽手柄宽度（px） */
const HANDLE_WIDTH = 8

const bindResize = (th: HTMLTableCellElement): void => {
  if (th.querySelector('.aep-col-resize')) return
  // 仅静态定位的表头补 relative（sticky 表头本身已是定位元素，不能覆盖）
  if (getComputedStyle(th).position === 'static') th.style.position = 'relative'

  const handle = document.createElement('span')
  handle.className = 'aep-col-resize'
  handle.title = '拖动调整列宽'
  handle.style.width = `${HANDLE_WIDTH}px`

  let startX = 0
  let startWidth = 0

  const onMove = (event: MouseEvent): void => {
    const next = Math.max(MIN_WIDTH, Math.round(startWidth + (event.clientX - startX)))
    th.style.width = `${next}px`
    th.style.minWidth = `${next}px`
    th.style.maxWidth = `${next}px`
  }

  const onUp = (): void => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.classList.remove('is-col-resizing')
  }

  handle.addEventListener('mousedown', (event) => {
    event.preventDefault()
    event.stopPropagation()
    startX = event.clientX
    startWidth = th.getBoundingClientRect().width
    document.body.classList.add('is-col-resizing')
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  th.appendChild(handle)
}

const buildHandles = (table: HTMLTableElement): void => {
  const ths = Array.from(table.querySelectorAll('thead th')) as HTMLTableCellElement[]
  ths.forEach((th) => {
    if (th.hasAttribute('data-resize-skip')) return
    bindResize(th)
  })
}

export const vResizableTable: Directive<HTMLTableElement> = {
  mounted(table) {
    buildHandles(table)
  },
  updated(table) {
    buildHandles(table)
  }
}

export default vResizableTable

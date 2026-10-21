import type { Directive } from 'vue'

const observers = new WeakMap<HTMLElement, MutationObserver>()

const updateElementTable = (root: HTMLElement) => {
  root.querySelectorAll('.el-table__row').forEach((row) => {
    const checkbox = row.querySelector('.el-checkbox__input')
    if (!checkbox) return
    row.classList.toggle('row-selected', checkbox.classList.contains('is-checked'))
  })
}

const updateVxeTable = (root: HTMLElement) => {
  root.querySelectorAll('.vxe-body--row').forEach((row) => {
    const checkbox = row.querySelector('.vxe-cell--checkbox')
    if (!checkbox) return
    row.classList.toggle('row-selected', checkbox.classList.contains('is--checked'))
  })
}

const bindCheckboxClick = (root: HTMLElement, selector: string, update: (root: HTMLElement) => void) => {
  root.querySelectorAll(selector).forEach((checkbox) => {
    checkbox.addEventListener('click', () => {
      // 等组件完成选中态渲染后再同步行样式
      setTimeout(() => update(root), 0)
    })
  })
  update(root)
}

/**
 * 表格行选中高亮。
 * 同时兼容 el-table 与 vxe-table；MutationObserver 负责分页/异步数据后的重新绑定。
 */
export const tableRowSelectDirective: Directive<HTMLElement> = {
  mounted(el) {
    const refresh = () => {
      bindCheckboxClick(el, '.el-checkbox__input', updateElementTable)
      bindCheckboxClick(el, '.vxe-cell--checkbox', updateVxeTable)
    }
    refresh()
    const observer = new MutationObserver(refresh)
    observer.observe(el, { childList: true, subtree: true })
    observers.set(el, observer)
  },
  unmounted(el) {
    observers.get(el)?.disconnect()
    observers.delete(el)
  }
}

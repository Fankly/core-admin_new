import type { Directive } from 'vue'

/** 千分位 + 两位小数展示。 */
export const comdifyDirective: Directive<HTMLElement, number> = {
  mounted(el, binding) {
    el.innerText = (binding.value || 0).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
  }
}

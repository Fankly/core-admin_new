import type { Directive, DirectiveBinding } from 'vue'

interface NumberInputOptions {
  maxInteger: number
  /** 小数位上限；number-input 允许通过指令值覆盖 */
  maxDecimal: number | ((binding: DirectiveBinding<number | undefined>) => number)
}

interface NumberInputListeners {
  compositionstart: () => void
  compositionend: () => void
  input: () => void
}

const listeners = new WeakMap<HTMLInputElement, NumberInputListeners>()

const sanitize = (input: string, maxInteger: number, maxDecimal: number): string => {
  let value = input.replace(/[^0-9.-]/g, '')
  if (value.indexOf('-') > 0) value = value.replace(/-/g, '')
  if ((value.match(/\./g) ?? []).length > 1) value = value.replace(/\.+$/, '')

  const decimalIndex = value.indexOf('.')
  if (decimalIndex === -1) return value.slice(0, maxInteger)

  const integerPart = value.slice(0, decimalIndex).slice(0, maxInteger)
  const decimalPart = value.slice(decimalIndex + 1).slice(0, maxDecimal)
  return `${integerPart}.${decimalPart}`
}

/**
 * 数字输入约束：只允许数字、一个小数点、开头负号。
 * 三个历史指令（limit-number / limit-input / number-input）共用同一套输入法处理，
 * 差异只是整数位与小数位上限。
 */
const createNumberInputDirective = (options: NumberInputOptions): Directive<HTMLInputElement, number | undefined> => ({
  beforeMount(el, binding) {
    let composing = false
    const maxDecimal = typeof options.maxDecimal === 'function' ? options.maxDecimal(binding) : options.maxDecimal

    const validate = () => {
      const next = sanitize(el.value, options.maxInteger, maxDecimal)
      if (el.value === next) return
      el.value = next
      el.dispatchEvent(new Event('input'))
    }

    const handlers: NumberInputListeners = {
      compositionstart: () => {
        composing = true
      },
      compositionend: () => {
        composing = false
        validate()
      },
      input: () => {
        if (!composing) validate()
      }
    }

    listeners.set(el, handlers)
    el.addEventListener('compositionstart', handlers.compositionstart)
    el.addEventListener('compositionend', handlers.compositionend)
    el.addEventListener('input', handlers.input)
  },
  unmounted(el) {
    const handlers = listeners.get(el)
    if (handlers) {
      el.removeEventListener('compositionstart', handlers.compositionstart)
      el.removeEventListener('compositionend', handlers.compositionend)
      el.removeEventListener('input', handlers.input)
    }
    listeners.delete(el)
  }
})

export const limitNumberDirective = createNumberInputDirective({ maxInteger: 12, maxDecimal: 6 })
export const limitInputDirective = createNumberInputDirective({ maxInteger: 10, maxDecimal: 4 })
export const numberInputDirective = createNumberInputDirective({
  maxInteger: 12,
  maxDecimal: (binding) => (binding.value && binding.value > 0 ? binding.value : 2)
})

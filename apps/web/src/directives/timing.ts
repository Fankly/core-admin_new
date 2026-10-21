import type { Directive } from 'vue'

type TimingBinding = [handler: () => void, event?: string, time?: number]

interface TimingState {
  event: string
  listener: EventListener
  timer?: ReturnType<typeof setTimeout>
}

const states = new WeakMap<HTMLElement, TimingState>()

const register = (el: HTMLElement, binding: { value: TimingBinding }, createListener: (handler: () => void, time: number) => EventListener) => {
  const [handler, event = 'click', time = 300] = binding.value
  const state: TimingState = { event, listener: createListener(handler, time) }
  states.set(el, state)
  el.addEventListener(event, state.listener)
}

const unregister = (el: HTMLElement) => {
  const state = states.get(el)
  if (!state) return
  if (state.timer) clearTimeout(state.timer)
  el.removeEventListener(state.event, state.listener)
  states.delete(el)
}

/** 防抖：单位时间内只触发最后一次。 */
export const debounceDirective: Directive<HTMLElement, TimingBinding> = {
  created(el, binding) {
    register(el, binding, (handler, time) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      return () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(handler, time)
      }
    })
  },
  unmounted: unregister
}

/** 节流：第一次立即触发，之后每个窗口最多一次，尾调用保留。 */
export const throttleDirective: Directive<HTMLElement, TimingBinding> = {
  created(el, binding) {
    register(el, binding, (handler, time) => {
      let running = false
      let tail: ReturnType<typeof setTimeout> | undefined
      return () => {
        if (running) {
          if (tail) clearTimeout(tail)
          tail = setTimeout(handler, time)
          return
        }
        handler()
        running = true
        tail = setTimeout(() => {
          running = false
        }, time)
      }
    })
  },
  unmounted: unregister
}

const clickTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

/** 连点保护：点击后禁用元素一段时间。 */
export const dbClickDirective: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const handler = () => {
      const duration = binding.value ?? 2000
      el.setAttribute('disabled', 'disabled')
      el.style.cursor = 'pointer'
      const previous = clickTimers.get(el)
      if (previous) clearTimeout(previous)
      const timer = setTimeout(() => {
        el.removeAttribute('disabled')
        clickTimers.delete(el)
      }, duration)
      clickTimers.set(el, timer)
    }
    el.addEventListener('click', handler)
    states.set(el, { event: 'click', listener: handler })
  },
  unmounted: unregister
}

import { watch, type Directive } from 'vue'
import { useSessionStore } from '@/store'
import { checkPermission } from '@/utils/utils'

interface PermissionState {
  value: string
  allowed: boolean
  originalDisplay: string
  originalPointerEvents: string
  blockEvent: (event: Event) => void
}

const states = new WeakMap<HTMLElement, PermissionState>()
const elements = new Set<HTMLElement>()

const applyPermission = (el: HTMLElement, state: PermissionState, permissions: string[]) => {
  state.allowed = checkPermission(permissions, state.value)
  el.style.display = state.allowed ? state.originalDisplay : 'none'
  el.style.pointerEvents = state.allowed ? state.originalPointerEvents : 'none'
  if (state.allowed) el.removeAttribute('aria-hidden')
  else el.setAttribute('aria-hidden', 'true')
}

/**
 * 按钮级权限指令。
 *
 * 权限会随菜单/角色切换变化，因此必须订阅 session.permissions 重新求值；
 * 缓存页里后挂载的弹窗、v-if 分支也能拿到当前页权限。无权限时同时阻断捕获阶段点击，
 * 避免元素仅被视觉隐藏却仍可被程序触发。
 */
export const permissionDirective: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    if (!binding.value) throw new Error('v-permission 需要指定权限标识')
    const session = useSessionStore()
    const state: PermissionState = {
      value: binding.value,
      allowed: true,
      originalDisplay: el.style.display,
      originalPointerEvents: el.style.pointerEvents,
      blockEvent: (event) => {
        if (states.get(el)?.allowed) return
        event.stopImmediatePropagation()
        event.preventDefault()
      }
    }
    states.set(el, state)
    elements.add(el)
    el.addEventListener('click', state.blockEvent, true)
    applyPermission(el, state, session.permissions)
  },
  updated(el, binding) {
    if (!binding.value) throw new Error('v-permission 需要指定权限标识')
    const state = states.get(el)
    const session = useSessionStore()
    if (!state) return
    state.value = binding.value
    applyPermission(el, state, session.permissions)
  },
  unmounted(el) {
    const state = states.get(el)
    if (state) el.removeEventListener('click', state.blockEvent, true)
    states.delete(el)
    elements.delete(el)
  }
}

/** 在应用启动时注册一次全局权限订阅。 */
export function installPermissionWatcher() {
  const session = useSessionStore()
  watch(
    () => session.permissions,
    (permissions) => {
      elements.forEach((el) => {
        const state = states.get(el)
        if (state) applyPermission(el, state, permissions)
      })
    }
  )
}

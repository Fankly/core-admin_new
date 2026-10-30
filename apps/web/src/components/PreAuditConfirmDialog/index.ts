import { createApp, h, ref } from 'vue'
import PreAuditConfirmDialog from './index.vue'

export { PreAuditConfirmDialog }
export default PreAuditConfirmDialog

export interface PreAuditConfirmOptions {
  /** 多条提示使用换行分隔，兼容历史 | 分隔 */
  msg?: string
  title?: string
  confirmButtonText?: string
  cancelButtonText?: string
  width?: string
}

/**
 * 以组件方式弹出预审提示确认框（替代 ElMessageBox.confirm）
 * 返回 true 表示用户确认继续提交
 */
export const showPreAuditConfirm = (options: PreAuditConfirmOptions = {}): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const visible = ref(false)
    let settled = false

    const destroy = (confirmed: boolean) => {
      if (settled) return
      settled = true
      app.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
      resolve(confirmed)
    }

    const app = createApp({
      render() {
        return h(PreAuditConfirmDialog, {
          ...options,
          modelValue: visible.value,
          'onUpdate:modelValue': (val: boolean) => {
            visible.value = val
          },
          // 等关闭动画结束后再卸载，拿到的 confirmed 即用户选择结果
          onClosed: (confirmed: boolean) => destroy(confirmed)
        })
      }
    })

    app.mount(container)
    // 挂载完成后再置为 true，保证有打开动画
    visible.value = true
  })
}

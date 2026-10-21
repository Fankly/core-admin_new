import type { ElMessageBoxShortcutMethod, Message } from 'element-plus'
import type baseService from '@/service/baseService'
import type * as utils from '@/utils'

declare module 'vue' {
  interface ComponentCustomProperties {
    /** element-plus 消息 */
    $message: Message
    /** element-plus 确认框 */
    $confirm: ElMessageBoxShortcutMethod
    /** element-plus 提示框 */
    $alert: ElMessageBoxShortcutMethod
    /** 旧业务页仍在使用的请求实例 */
    $baseService: typeof baseService
    /** utils 命名空间（installDirectives 注入） */
    $utils: typeof utils
  }
}

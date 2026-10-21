import type { App } from 'vue'
import * as utils from '@/utils'
import { comdifyDirective } from './comdify'
import { limitInputDirective, limitNumberDirective, numberInputDirective } from './number-input'
import { installPermissionWatcher, permissionDirective } from './permission'
import { tableRowSelectDirective } from './table-row-select'
import { dbClickDirective, debounceDirective, throttleDirective } from './timing'

/**
 * 全局指令安装入口。
 *
 * 每个指令一个文件，副作用（事件监听、MutationObserver、store 订阅）都在
 * unmounted / 安装阶段成对处理，避免历史实现里 removeEventListener 传新函数导致泄漏。
 */
export function installDirectives(app: App) {
  app.config.globalProperties.$utils = utils

  app.directive('debounce', debounceDirective)
  app.directive('throttle', throttleDirective)
  app.directive('dbClick', dbClickDirective)
  app.directive('permission', permissionDirective)
  app.directive('tableRowSelect', tableRowSelectDirective)
  app.directive('comdify', comdifyDirective)
  app.directive('limit-number', limitNumberDirective)
  app.directive('limit-input', limitInputDirective)
  app.directive('number-input', numberInputDirective)

  installPermissionWatcher()
}

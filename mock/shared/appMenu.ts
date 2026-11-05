/**
 * sys/appMenu/list 共享分发器
 *
 * 该接口是 POST，判别值 appNo 在 body 里，无法像 GET 那样写进正则收窄。
 * mockjs 命中即拦截、不能透传，若各模块各自 Mock.mock 同一正则，
 * 只有最先注册的那个生效，后注册模块的菜单永远拿不到数据。
 *
 * 因此这里只注册一次正则，按 appNo 分发到各模块登记的 handler：
 * 各模块 import 本文件并调用 registerAppMenu(appNo, handler) 即可，注册顺序无关。
 * 未登记的 appNo 返回空数组（保证调用方不因 undefined 崩溃）。
 */
import Mock from 'mockjs'
import { parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

/** label: '1' 操作类菜单，'2' 查询类菜单 */
export type AppMenuHandler = (label: string, body: Record<string, any>) => any[]

const handlers: Record<string, AppMenuHandler> = {}

let registered = false

const registerOnce = () => {
  if (registered) return
  registered = true
  Mock.mock(/sys\/appMenu\/list(\?.*)?$/, 'post', (options: MockOptions) => {
    const body = parseBody(options)
    const appNo = String(body.appNo || '')
    const handler = handlers[appNo]
    if (!handler) {
      // 未登记的 appNo：返回空数组而非 undefined，避免调用方渲染报错
      return success([])
    }
    return success(handler(String(body.label || '1'), body))
  })
}

export const registerAppMenu = (appNo: string, handler: AppMenuHandler) => {
  handlers[appNo] = handler
  registerOnce()
}

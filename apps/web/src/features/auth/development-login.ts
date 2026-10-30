import { Base64 } from 'js-base64'
import baseService from '@/service/baseService'
import { getUuid } from '@/utils/utils'

/** 仅由开发模式登录页动态加载，生产构建不得包含此模块或其中的联调凭据。 */
export function loginForDevelopment() {
  if (!import.meta.env.DEV) throw new Error('生产环境不提供联调登录')

  return baseService.post<Record<string, unknown> | null>('/login', {
    a: Base64.encode(import.meta.env.VITE_APP_LOGIN_USER ?? 'admin'),
    b: Base64.encode(import.meta.env.VITE_APP_LOGIN_PASSWORD ?? 'admin'),
    captcha: Base64.encode(import.meta.env.VITE_APP_LOGIN_CAPTCHA ?? 'HE_YUE_11_22_33'),
    u: Base64.encode(getUuid())
  })
}

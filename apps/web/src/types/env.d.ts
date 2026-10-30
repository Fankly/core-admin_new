interface ImportMetaEnv {
  /** api 接口环境 */
  VITE_APP_API: string
  /** 仅开发模式使用的联调账号；生产环境由外部统一认证提供身份 */
  VITE_APP_LOGIN_USER?: string
  /** 仅开发模式使用的联调密码，禁止配置真实生产口令 */
  VITE_APP_LOGIN_PASSWORD?: string
  /** 仅开发模式使用的联调验证码 */
  VITE_APP_LOGIN_CAPTCHA?: string
}

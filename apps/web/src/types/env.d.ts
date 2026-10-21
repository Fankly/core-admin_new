interface ImportMetaEnv {
  /** api 接口环境 */
  VITE_APP_API: string
  /** 自动登录账号；未配置时回退到本地联调默认值 */
  VITE_APP_LOGIN_USER?: string
  /** 自动登录密码 */
  VITE_APP_LOGIN_PASSWORD?: string
  /** 自动登录验证码 */
  VITE_APP_LOGIN_CAPTCHA?: string
}

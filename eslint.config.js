import baseConfig from '@repo/eslint-config'

/**
 * 根 config 只负责 workspace 根上的散装 JS 与 packages/* 下的共享包。
 * apps/web 有自己的 eslint.config.js（Vue 规则集），互不干扰。
 */
export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'apps/**', '.codegraph/**']
  },
  ...baseConfig
]

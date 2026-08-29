import vueConfig from '@repo/eslint-config/vue'

/**
 * ignores 相对 eslint 进程 cwd（也就是 apps/web）解析，所以留在这里而不是共享包里。
 * 条目自原根 eslint.config.js 原样迁移。
 */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'mock/**', 'src/views/service/xmcs/css/univer.css', '**/*.d.ts']
  },
  ...vueConfig
]

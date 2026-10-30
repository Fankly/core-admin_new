import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'
import { defineConfig, normalizePath } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng'

// "type": "module" 下没有 __dirname，用 import.meta.dirname（Node >= 20.11）
const root = import.meta.dirname

const require = createRequire(import.meta.url)

/**
 * 解析依赖包内的具体文件。
 *
 * 不能写死 `<root>/node_modules/<pkg>/...`：pnpm workspace 下依赖可能被链接到
 * apps/web/node_modules，也可能提升到 workspace 根 node_modules，路径不固定。
 * 这里从包自己的 package.json 反推包根目录，
 * 无论哪种布局都能命中。
 */
const pkgFile = (pkg: string, file: string) => resolve(dirname(require.resolve(`${pkg}/package.json`)), file)

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'dev-mock',
      apply: (_config, { command, mode }) => command === 'serve' && mode === 'mock',
      enforce: 'pre',
      transform(code, id) {
        if (id.split('?')[0] !== normalizePath(resolve(root, 'src/main.ts'))) return
        // 仅 pnpm mock 在转换入口时注入，先注册拦截器再执行应用模块。
        // main.ts 源文件保持不变，pnpm dev、生产构建和 preview 不加载 mock。
        return { code: `import '@mock/index'\n${code}`, map: null }
      }
    },
    vue(),
    vueJsx(),
    tailwindcss(),
    // 原 vite-plugin-svg-icons 已停止维护，换成 -ng 分支，虚拟模块名变成 virtual:svg-icons/register
    createSvgIconsPlugin({
      iconDirs: [resolve(root, 'src/assets/icons/svg')],
      symbolId: 'icon-[dir]-[name]'
    })
  ],
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        // rolldown（vite 8）只支持函数形式的 manualChunks，对象形式已被移除
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return
          if (id.includes('element-plus')) return 'elmplus'
          if (id.includes('lodash')) return 'lodash'
          if (/[\\/]node_modules[\\/](sortablejs|vxe-table|xe-utils)[\\/]/.test(id)) return 'lib'
          if (/[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/.test(id)) return 'vlib'
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@import "@/styles/variables.less";\n',
        javascriptEnabled: true
      }
    }
  },
  resolve: {
    // vite 8 内置 tsconfig paths 解析，替代原 vite-tsconfig-paths 插件。
    // 下方 alias 优先级更高：@file-viewer/* 的类型桩必须被覆盖到 node_modules 真包。
    tsconfigPaths: true,
    alias: {
      // 配置别名
      '@': resolve(root, './src'),
      // 接口 mock 目录（与 src 同级，仅 pnpm mock 加载）
      '@mock': resolve(root, './mock'),
      vue: 'vue/dist/vue.esm-bundler.js',
      // 覆盖 tsconfig paths 的类型桩：运行时必须解析到 node_modules 真包
      // （官方 d.ts 需 TS≥4.5，类型侧见 src/types/file-viewer/*）
      '@file-viewer/core/browser': pkgFile('@file-viewer/core', 'dist/browser.js'),
      '@file-viewer/renderer-word': pkgFile('@file-viewer/renderer-word', 'dist/index.js'),
      '@file-viewer/renderer-spreadsheet': pkgFile('@file-viewer/renderer-spreadsheet', 'dist/index.js')
    }
  },
  // 预构建 file-viewer，避免 dev 首次发现新依赖时反复 Optimized dependencies changed 整页刷新
  // 注：@file-viewer/docx 与 /doc 是 renderer-word 的间接依赖，src 从未直接 import，
  // 但这里要预构建，所以在 package.json 里显式声明成直接依赖——pnpm 严格隔离下
  // 不声明就解析不到。升级 renderer-word 时记得同步这两个版本。
  optimizeDeps: {
    include: [
      '@file-viewer/core',
      '@file-viewer/core/browser',
      '@file-viewer/renderer-word',
      '@file-viewer/renderer-spreadsheet',
      '@file-viewer/docx',
      '@file-viewer/doc'
    ]
  },
  server: {
    open: false,
    host: '0.0.0.0', // localhost
    port: 8001, // 端口号
    https: undefined,
    proxy: {
      '/api': {
        target: 'http://localhost:10027/budget-process',
        ws: true,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng'
import tsconfigPaths from 'vite-tsconfig-paths'

// "type": "module" 下没有 __dirname，用 import.meta.dirname（Node >= 20.11）
const root = import.meta.dirname

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueJsx(),
    tailwindcss(),
    tsconfigPaths(),
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
        manualChunks: {
          elmplus: ['element-plus'],
          lodash: ['lodash'],
          lib: ['sortablejs', 'vxe-table', 'xe-utils'],
          vlib: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@import "@/assets/style/variables.less";\n',
        javascriptEnabled: true
      }
    }
  },
  resolve: {
    alias: {
      // 配置别名
      '@': resolve(root, './src'),
      // 接口 mock 目录（与 src 同级，仅开发环境按需 import）
      '@mock': resolve(root, './mock'),
      vue: 'vue/dist/vue.esm-bundler.js',
      // 覆盖 tsconfig paths 的类型桩：运行时必须解析到 node_modules 真包
      // （官方 d.ts 需 TS≥4.5，类型侧见 src/types/file-viewer/*）
      '@file-viewer/core/browser': resolve(root, 'node_modules/@file-viewer/core/browser.js'),
      '@file-viewer/renderer-word': resolve(root, 'node_modules/@file-viewer/renderer-word/dist/index.js'),
      '@file-viewer/renderer-spreadsheet': resolve(root, 'node_modules/@file-viewer/renderer-spreadsheet/dist/index.js')
    }
  },
  // 预构建 file-viewer，避免 dev 首次发现新依赖时反复 Optimized dependencies changed 整页刷新
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
    open: true, // 自动启动浏览器
    host: '0.0.0.0', // localhost
    port: 8001, // 端口号
    https: undefined,
    proxy: {
      '/api': {
        target: 'http://localhost:10027/budget-process',
        // target: 'http://192.168.9.37:10027/budget-process',
        // target: 'http://192.168.9.253:10027/budget-process',
        // target: 'http://192.168.9.13:10027/budget-process',
        // target: 'http://192.168.9.203:10027/budget-process',
        // target: 'http://192.168.9.33:10027/budget-process',
        // target: 'http://192.168.9.36:10027/budget-process',
        // target: 'http://192.168.9.34:10027/budget-process',
        // target: 'http://192.168.9.41:8001/budget-process',
        // target: 'http://192.168.10.193:10027/budget-process',
        ws: true,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

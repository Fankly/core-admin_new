import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'
import prettierConfig from '@vue/eslint-config-prettier'
import globals from 'globals'

/**
 * Vue 3 应用的共享 flat config。
 *
 * 类型检查策略：strictTypeChecked + projectService——lint 时共享 vue-tsc 同一个
 * TS program，启用 no-floating-promises 等类型感知规则。历史遗留的批量 `0`（off）
 * 豁免规则已全部清除，个别确需豁免的用法用行内 eslint-disable 注释就地标注。
 * 新增规则须与 frontend-guide 同步。
 *
 * ignores 不在这里声明：flat config 的 ignores 是相对 eslint 进程 cwd 解析的，
 * 放到各 app 自己的 eslint.config.js 里才不会错位。
 */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...pluginVue.configs['flat/essential'],
  prettierConfig,

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true
      },
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    }
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        ecmaFeatures: { jsx: true },
        extraFileExtensions: ['.vue']
      }
    }
  },

  {
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // tseslint 的 eslint-recommended 只对 *.ts/*.tsx 关闭 no-undef，*.vue 里的
      // 编译器宏（defineProps 等）会被误报，这里对 Vue 应用整体关闭。
      'no-undef': 0
    }
  }
)

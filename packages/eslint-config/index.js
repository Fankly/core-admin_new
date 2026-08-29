import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from '@vue/eslint-config-prettier'
import globals from 'globals'

/**
 * 基础 flat config：JS + TS + prettier，不含 Vue。
 * 供 packages/* 下的纯 TS/JS 包使用；Vue 应用用 `@repo/eslint-config/vue`。
 */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    }
  },

  {
    rules: {
      'prettier/prettier': 'error'
    }
  }
)

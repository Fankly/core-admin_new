import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'
import prettierConfig from '@vue/eslint-config-prettier'
import globals from 'globals'

/**
 * Vue 3 应用的共享 flat config。
 *
 * 迁移说明（自原 eslint.config.js 整体搬移，规则集未做任何增删）：
 * - 原有的一整批 `0`（off）规则原样保留。ESLint 9+ 起，把不存在的规则设为 off 不再报错，
 *   所以 typescript-eslint v8 已移除的 `ban-types` / `no-var-requires` / `ban-ts-ignore`
 *   这类条目可以安全留着，避免丢失历史意图。
 * - `vue/script-setup-uses-vars` 在 eslint-plugin-vue v10 中已移除，其能力由
 *   vue-eslint-parser 内建，因此不在此列。
 *
 * ignores 不在这里声明：flat config 的 ignores 是相对 eslint 进程 cwd 解析的，
 * 放到各 app 自己的 eslint.config.js 里才不会错位。
 */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  prettierConfig,

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
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
        ecmaFeatures: { jsx: true },
        extraFileExtensions: ['.vue']
      }
    }
  },

  {
    rules: {
      'prettier/prettier': 'error',
      'no-useless-escape': 0,
      'no-undef': 0,
      '@typescript-eslint/no-unused-expressions': 0,
      '@typescript-eslint/no-unsafe-function-type': 0,
      'vue/no-multiple-template-root': 0,
      'vue/no-setup-props-destructure': 0,
      'vue/no-reserved-component-names': 0,
      '@typescript-eslint/ban-ts-ignore': 0,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/no-require-imports': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-empty-object-type': 0,
      'vue/custom-event-name-casing': 0,
      'no-use-before-define': 0,
      '@typescript-eslint/no-use-before-define': 0,
      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/ban-types': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-unused-vars': 0,
      'no-unused-vars': 0,
      'space-before-function-paren': 0,
      'vue/attributes-order': 0,
      'vue/one-component-per-file': 0,
      'vue/max-attributes-per-line': 0,
      'vue/html-closing-bracket-newline': 0,
      'vue/multiline-html-element-content-newline': 0,
      'vue/singleline-html-element-content-newline': 0,
      'vue/attribute-hyphenation': 0,
      'vue/require-default-prop': 0,
      'vue/require-explicit-emits': 0,
      'vue/html-self-closing': 0,
      'vue/multi-word-component-names': 0,
      'vue/no-v-html': 0,
      'vue/require-toggle-inside-transition': 0,
      'vue/no-v-for-template-key': 'off'
    }
  }
)

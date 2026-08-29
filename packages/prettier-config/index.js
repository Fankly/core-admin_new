/**
 * 共享 Prettier 配置。原 prettier.config.js 原样迁移，未改动任何取值——
 * printWidth 150 / 无分号 / 单引号 / 无尾逗号是既有代码风格，
 * 改动会导致全仓 diff 爆炸。
 *
 * @type {import('prettier').Config}
 */
export default {
  printWidth: 150,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  vueIndentScriptAndStyle: false,
  singleQuote: true,
  quoteProps: 'as-needed',
  bracketSpacing: true,
  trailingComma: 'none',
  jsxSingleQuote: false,
  arrowParens: 'always',
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'never',
  htmlWhitespaceSensitivity: 'strict',
  endOfLine: 'auto',
  rangeStart: 0
}

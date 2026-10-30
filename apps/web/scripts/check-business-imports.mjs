import { readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { parse } from 'vue/compiler-sfc'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(directory, entry.name)
  return entry.isDirectory() ? walk(path) : [path]
})
const paths = walk(root)
const files = new Set(paths)
files.add(resolve(root, '../package.json'))
const extensions = ['', '.ts', '.tsx', '.js', '.vue', '.json', '.d.ts', '/index.ts', '/index.tsx', '/index.js', '/index.vue', '/index.d.ts']
const problems = []
let imports = 0

for (const path of paths) {
  if (!['.vue', '.ts', '.tsx', '.js'].includes(extname(path))) continue
  const source = readFileSync(path, 'utf8')
  let script = source
  if (path.endsWith('.vue')) {
    const { descriptor, errors } = parse(source, { filename: path })
    for (const error of errors) problems.push(`${relative(root, path)}: ${String(error.message ?? error)}`)
    script = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n')
  }
  const ast = ts.createSourceFile(path, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue
    const specifier = node.moduleSpecifier?.text
    if (!specifier) continue
    if (specifier === 'vuex') problems.push(`${relative(root, path)}: 仍依赖 Vuex，请使用 Pinia 领域 store`)
    const target = specifier.startsWith('@/') ? resolve(root, specifier.slice(2))
      : specifier.startsWith('.') ? resolve(dirname(path), specifier) : null
    if (!target) continue
    imports++
    // 用文件清单做精确匹配，macOS 上也能发现 Linux 会报错的大小写差异。
    if (!extensions.some((extension) => files.has(target + extension))) {
      problems.push(`${relative(root, path)}: 找不到 ${specifier}（请同时检查路径大小写）`)
    }
  }
  if (/(?:provide|inject)[^\n]*?\(\s*['"]currentUserRole['"]/.test(script)) {
    problems.push(`${relative(root, path)}: 请使用 CurrentUserRoleInjectionKey`)
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exitCode = 1
} else {
  console.log(`业务导入检查通过：${paths.filter((path) => path.endsWith('.vue')).length} 个 Vue 文件，${imports} 个本地导入/导出引用。`)
}

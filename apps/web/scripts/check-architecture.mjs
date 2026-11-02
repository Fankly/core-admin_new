import { readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectImports } from './source-imports.mjs'
import { architectureViolation } from './architecture-rules.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
const problems = []
let count = 0
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      walk(path)
      continue
    }
    if (!['.vue', '.ts', '.tsx', '.js'].includes(extname(path))) continue
    const name = relative(root, path).replaceAll('\\', '/')
    const { imports, errors } = collectImports(readFileSync(path, 'utf8'), path)
    for (const error of errors) problems.push(`${name}: ${error}`)
    for (const dependency of imports) {
      count += 1
      const violation = architectureViolation(name, dependency)
      if (violation) problems.push(`${name}:${dependency.line} ${dependency.specifier}: ${violation}`)
    }
  }
}
walk(root)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exitCode = 1
} else {
  console.log(`架构边界检查通过：${count} 个导入/导出引用，无反向依赖。`)
}

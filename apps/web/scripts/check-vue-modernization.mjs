import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileScript, compileTemplate, parse } from 'vue/compiler-sfc'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
const errors = []
let count = 0
for (const file of readdirSync(root, { recursive: true }).filter((file) => file.endsWith('.vue'))) {
  const filename = resolve(root, file)
  const source = readFileSync(filename, 'utf8')
  count += 1
  try {
    const parsed = parse(source, { filename })
    if (parsed.errors.length) throw parsed.errors[0]
    const { descriptor } = parsed
    // Shared module state and chart registration live in sibling modules.
    // Empty template placeholders need no runtime script.
    if (descriptor.script) {
      throw new Error('组件只保留一个 <script setup>；共享状态与模块初始化移到相邻模块')
    }
    const script = descriptor.script || descriptor.scriptSetup ? compileScript(descriptor, { id: file }) : undefined
    if (descriptor.template) {
      const template = compileTemplate({
        source: descriptor.template.content,
        filename,
        id: file,
        compilerOptions: { bindingMetadata: script?.bindings, expressionPlugins: ['typescript'] }
      })
      if (template.errors.length) throw template.errors[0]
    }
    if (descriptor.styles.some((style) => /::v-deep|\/deep\//u.test(style.content))) {
      throw new Error('样式穿透请使用 :deep(...)')
    }
  } catch (error) {
    errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Vue 现代语法检查通过：${count} 个组件，脚本与模板编译成功。`)
}

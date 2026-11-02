import ts from 'typescript'
import { parse } from 'vue/compiler-sfc'

/** 静态导入、再导出、类型导入和字面量动态导入使用同一个 AST 检查入口。 */
export function collectImports(source, filename) {
  let script = source
  const errors = []
  if (filename.endsWith('.vue')) {
    const parsed = parse(source, { filename })
    errors.push(...parsed.errors.map((error) => String(error.message ?? error)))
    script = [parsed.descriptor.script?.content, parsed.descriptor.scriptSetup?.content].filter(Boolean).join('\n')
  }
  const ast = ts.createSourceFile(filename, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const imports = []
  const add = (node, specifier, typeOnly = false) => {
    if (specifier && ts.isStringLiteralLike(specifier)) {
      imports.push({ specifier: specifier.text, typeOnly, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 })
    }
  }
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause
      const bindings = clause?.namedBindings
      const namedTypesOnly =
        !clause?.name &&
        bindings &&
        ts.isNamedImports(bindings) &&
        bindings.elements.length > 0 &&
        bindings.elements.every((element) => element.isTypeOnly)
      add(node, node.moduleSpecifier, Boolean(clause?.isTypeOnly || namedTypesOnly))
    } else if (ts.isExportDeclaration(node)) {
      const namedTypesOnly =
        node.exportClause &&
        ts.isNamedExports(node.exportClause) &&
        node.exportClause.elements.length > 0 &&
        node.exportClause.elements.every((element) => element.isTypeOnly)
      add(node, node.moduleSpecifier, Boolean(node.isTypeOnly || namedTypesOnly))
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      add(node, node.arguments[0])
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      add(node, node.argument.literal, true)
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return { imports, errors, script }
}

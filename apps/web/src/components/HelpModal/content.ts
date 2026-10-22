/** 保留基础排版标签；移除可执行标签、事件属性与外部样式。 */
export const formatHelpText = (text: string): string => {
  const formatted = text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
  const document = new DOMParser().parseFromString(formatted, 'text/html')
  const allowed = new Set([
    'BR',
    'STRONG',
    'EM',
    'B',
    'I',
    'U',
    'P',
    'DIV',
    'SPAN',
    'UL',
    'OL',
    'LI',
    'H1',
    'H2',
    'H3',
    'H4',
    'TABLE',
    'THEAD',
    'TBODY',
    'TR',
    'TH',
    'TD',
    'PRE',
    'CODE',
    'A'
  ])
  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH'].includes(element.tagName)) {
      element.remove()
      continue
    }
    if (!allowed.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      continue
    }
    const href = element.getAttribute('href')
    for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name)
    if (element.tagName === 'A' && href && /^(https?:|mailto:|\/|#)/i.test(href.trim())) element.setAttribute('href', href)
  }
  return document.body.innerHTML
}
export const getFileExtension = (filename: string): string => filename.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ?? 'FILE'

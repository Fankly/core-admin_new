/** 从文件名末尾读取扩展名；文件名主体允许包含 #。找不到时返回 undefined。 */
export const getOfficeFileExtension = (fileName: unknown): string | undefined => {
  const name = String(fileName ?? '')
    .trim()
    .split('?')[0]
  const direct = name.match(/\.([^.\/\\?#]+)$/)?.[1]
  if (direct) return direct.toLowerCase()
  return name
    .split('#')[0]
    .match(/\.([^.\/\\]+)$/)?.[1]
    ?.toLowerCase()
}

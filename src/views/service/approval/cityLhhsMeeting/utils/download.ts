type ExportBlob = Blob & {
  headers?: Record<string, string>
}

const parseContentDispositionFilename = (contentDisposition?: string) => {
  if (!contentDisposition) return ''
  const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^;"]+)"?/i)
  const rawFileName = fileNameMatch?.[1] || fileNameMatch?.[2] || ''
  if (!rawFileName) return ''
  try {
    return decodeURIComponent(rawFileName)
  } catch {
    return rawFileName
  }
}

export const downloadExportBlob = (blob: ExportBlob, defaultFilename: string) => {
  const contentDisposition = blob?.headers?.['content-disposition'] || blob?.headers?.['Content-Disposition']
  const filename = parseContentDispositionFilename(contentDisposition) || defaultFilename
  const link = document.createElement('a')
  const url = window.URL.createObjectURL(blob)

  link.href = url
  link.download = decodeURIComponent(filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

import { ElMessage } from 'element-plus'

export const handleError = (error: unknown, message = '操作失败'): void => {
  const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  console.error(`${message}`, error)
  ElMessage({
    message: detail ? `${message}:${detail}` : message,
    type: 'error',
    duration: 5000
  })
}

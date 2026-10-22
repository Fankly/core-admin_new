import baseService from '@/service/baseService'

export interface SystemInfo {
  osName?: string
  javaVersion?: string
  userTimezone?: string
  processors?: number
  systemCpuLoad?: number
  memoryRate?: number
}

export const getSystemInfo = () => baseService.get<SystemInfo | null>('/sys/info')
export const getHomeConfiguration = () => baseService.get<{ url?: string } | null>('/sys/menu/getMenuByUrl', { url: '/home' })

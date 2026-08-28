import { getConfigInfo } from '@/api/menu/menuConfig'
import { ElMessageBox } from 'element-plus'

export const showHelpMsg = async (url: string, msg?: string) => {
  let message = msg ? msg : ''
  const res = await getConfigInfo(url)
  if (res.success && res.data) message = res.data.helpInfo
  ElMessageBox.alert(`${message}`, `帮助信息`, {
    confirmButtonText: '确定',
    dangerouslyUseHTMLString: true
  })
}

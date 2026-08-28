import { getValueByKeys } from '@/utils/utils'
import appPack from '../../package.json'

/**
 * app系统配置
 */
export default {
  /**
   * 系统版本号，自动读取package.json中的version字段
   */
  version: appPack.version,

  /**
   * 系统默认语言
   */
  defaultLang: 'zh-CN',

  /**
   * api请求地址，这里读取env环境变量中的VITE_APP_API，优先使用全局变量window.SITE_CONFIG.apiURL钩子，支持在index.html中配置
   */
  api: getValueByKeys(window, 'SITE_CONFIG.apiURL') || import.meta.env.VITE_APP_API,

  /**
   * 启用logo图标，logo尺寸32*32，存放路径@/assets/images/logo.png
   */
  enabledLogo: false,

  /**
   * 开启页面缓存
   */
  enabledKeepAlive: true,

  /**
   * 网络请求超时时间，单位毫秒
   */
  requestTimeout: 30000,

  /**
   * 全屏渲染的页面
   */
  fullscreenPages: [
    '/login',
    '/workflow/deal',
    '/workflow/targetValue/targetValueDb',
    '/workflow/workflowDb',
    '/workflow/fy/deal',
    '/workflow/xm/deal',
    '/workflow/xm/dealNew',
    '/workflow/ysbg/deal',
    '/workflow/zl/deal',
    '/workflow/lslx/dealYs',
    '/workflow/lslx/dealEs',
    '/workflow/lslx/dealZgkbmYs',
    '/workflow/fy/view',
    '/workflow/xm/view',
    '/workflow/ysbg/view',
    '/workflow/view',
    '/workflow/zl/view',
    '/workflow/lslx/viewYs',
    '/workflow/lslx/viewEs',
    '/workflow/lslx/viewZgkbmYs',
    '/workflow/xmgbdk/deal',
    '/workflow/xmgbdk/view',
    '/workflow/xjjz/deal',
    '/workflow/xjjz/view',
    '/workflow/syqzcydtx/view',
    '/workflow/cityTarget/view',
    '/workflow/cityTarget/deal',
    '/workflow/targetBudget/provinceTarget/deal',
    '/workflow/targetBudget/provinceTarget/view',
    '/workflow/xm/newDeal',
    '/workflow/xm/newView',
    '/workflow/deptData/workflowDeal',
    '/workflow/suzhou/materialTask',
    '/workflow/sfhs/workflowDeal',
    '/workflow/suzhou/taskMaterial',
    '/workflow/cqyj/workflowDeal'
  ]
}

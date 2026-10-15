import { CacheTheme } from '@/constants/cacheKey'
import { themeSetting } from '@/constants/config'
import { EThemeSetting } from '@/constants/enum'
import { IObject } from '@/types/interface'
import { getCache, setCache } from './cache'

/**
 * 取主题设置缓存
 * @returns
 */
export const getThemeConfigCache = (): IObject => {
  const cache = getCache(CacheTheme, {}, {})
  return { ...themeSetting, ...cache }
}

/**
 * 取主题设置缓存
 * @param key
 * @param config
 * @returns
 */
export const getThemeConfigCacheByKey = (key: EThemeSetting, config?: IObject): string | boolean | number => {
  config = config || getCache(CacheTheme, {}, {})
  return config ? (config[key] ?? themeSetting[key]) : themeSetting[key]
}

/**
 * 生成主题设置样式名称
 * @param config
 * @returns
 */
export const getThemeConfigToClass = (config: IObject = {}): IObject<string> => {
  const cl: IObject<string> = {}
  // themeSetting 里混了 '//' 这类仅用于“拷贝设置”的注释键,只认 EThemeSetting 里的合法设置项,
  // 否则会拼出 `ui-//-xxx` 这种无意义 class(还会渲染到 DOM 上)。
  const validKeys = Object.values(EThemeSetting) as string[]
  Object.keys(config).forEach((x) => {
    if (!validKeys.includes(x)) return
    cl[x] = `ui-${x}-${config[x]}`
  })
  return cl
}

/**
 * 主题设置到缓存
 * @param key
 * @param value
 */
export const setThemeConfigToCache = (key: EThemeSetting, value: string | boolean | number): void => {
  const theme = getCache(CacheTheme, {}, {})
  setCache(CacheTheme, { ...theme, [key]: value })
}

/**
 * 设置主题色。
 *
 * element-plus 2.x 的标准换肤做法是运行时覆盖 --el-color-primary 及其 light-N、dark-N
 * 派生 CSS 变量（组件样式全部通过变量取色），不再需要旧 element-ui 时代
 * “整包样式文本做字符串替换”的方案。这里同步维护项目自定义的 --color-primary(-light)。
 * @param key 主色变量名（EThemeColor.ThemeColor = '--color-primary'）
 * @param value 主题色，如 '#409eff'
 */
export const setThemeColor = (key: string, value: string): void => {
  const elm = window.document.querySelector('body')
  if (!elm) return

  const hexToRgb = (hex: string): number[] => {
    let c = hex.replace('#', '')
    if (c.length === 3)
      c = c
        .split('')
        .map((x) => x + x)
        .join('')
    return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16))
  }
  const rgbToHex = (rgb: number[]): string => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
  // 与 element-plus 主题派生算法一致：light-N 掺入 N0% 白，dark-N 掺入 N0% 黑
  const mixWhite = (rgb: number[], ratio: number): number[] => rgb.map((v) => v + (255 - v) * ratio)
  const mixBlack = (rgb: number[], ratio: number): number[] => rgb.map((v) => v * (1 - ratio))

  const setPrimaryFamily = (name: string, hex: string): void => {
    const rgb = hexToRgb(hex)
    elm.style.setProperty(name, hex)
    for (let i = 1; i <= 9; i++) {
      elm.style.setProperty(`${name}-light-${i}`, rgbToHex(mixWhite(rgb, i / 10)))
    }
    elm.style.setProperty(`${name}-dark-2`, rgbToHex(mixBlack(rgb, 0.2)))
  }

  // element-plus 组件的主色族
  setPrimaryFamily('--el-color-primary', value)
  // 项目自有变量（base.less 定义、业务样式引用）
  setPrimaryFamily(key, value)
  // 项目自有的半透明底色变量，保持原有 #RRGGBBAA 拼接格式
  elm.style.setProperty(`${key}-light`, `${value}14`)
}

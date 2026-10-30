import type { Component } from 'vue'
import { FileText, Folder, Layers } from '@lucide/vue'

/**
 * 层级图标：L1 层叠 · L2 文件夹 · L3 文件 · L4 及更深圆点。
 *
 * 侧栏（NavMenuTree）和头像下拉（UserMenuNode）共用这一份，保证同一层级
 * 在任何入口下都是同一个图形；尺寸与配色在 `shell/navigation.less` 的
 * `--nav-icon-*` 变量里，两边共用同一套 token。
 */
export const NAV_LEVEL_ICONS: readonly Component[] = [Layers, Folder, FileText]

/** 从第 4 层开始，图标退化为圆点 */
export const NAV_DOT_LEVEL = 4

/** 取某一层的图标；到圆点层返回 undefined，由调用方渲染 `.ds-*-dot` */
export const navLevelIcon = (level: number): Component | undefined => (level >= NAV_DOT_LEVEL ? undefined : NAV_LEVEL_ICONS[level - 1])

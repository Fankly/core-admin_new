import { RouteRecordRaw } from 'vue-router'

/**
 * 免菜单直达路由（穿透页、详情页等）
 *
 * 业务路由已清空。新增页面时按 { path, name, component, meta } 追加，
 * component 用动态 import 懒加载对应的 views 文件。
 */
export const whiteList: Array<RouteRecordRaw> = []

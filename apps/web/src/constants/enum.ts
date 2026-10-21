/**
 * 页面渲染布局
 */
export enum EPageLayoutEnum {
  page,
  fullscreen
}

/**
 * 导航模式
 */
export enum ESidebarLayoutEnum {
  /**
   * 左侧导航
   */
  Left = 'left',
  /**
   * 顶部导航
   */
  Top = 'top',
  /**
   * 混合导航
   */
  Mix = 'mix'
}

/**
 * 主题设置
 */
export enum EThemeSetting {
  /**
   * 侧边栏风格
   */
  Sidebar = 'sidebar',
  /**
   * 顶部风格
   */
  TopHeader = 'topHeader',
  /**
   * 主题色
   */
  ThemeColor = 'themeColor',
  //---
  /**
   * 布局模式
   */
  NavLayout = 'navLayout',
  /**
   * 内容是否铺满
   */
  ContentFull = 'contentFull',
  //---
  /**
   * logo宽度自动
   */
  LogoAuto = 'logoAuto',
  /**
   * 多彩图标
   */
  ColorIcon = 'colorIcon',
  /**
   * 侧边栏排他展开
   */
  SidebarUniOpened = 'sidebarUniOpened',
  /**
   * 开启tab标签页
   */
  OpenTabsPage = 'openTabsPage',
  /**
   * tab标签风格
   */
  TabStyle = 'tabStyle',
  //---
  /**
   * 侧边栏展开收起
   */
  SidebarCollapse = 'sidebarCollapse'
}

/**
 * 主题是key
 */
export enum EThemeColor {
  /**
   * 主题色
   */
  ThemeColor = '--color-primary'
}

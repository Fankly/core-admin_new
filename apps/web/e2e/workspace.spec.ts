import { expect, test, type Locator, type Page } from '@playwright/test'

const dashboardHeading = (page: Page) => page.getByRole('heading', { name: /项目过程管控平台/ })

const openDashboard = async (page: Page) => {
  await page.goto('/#/home')
  await expect(dashboardHeading(page)).toBeVisible()
}

/**
 * 本地工作台挂在隐藏路由 /baseHome 上。直接深链会先被登录守卫拦下，
 * 所以先进入 /home 完成自动登录，再跳到工作台。
 */
const openWorkbench = async (page: Page) => {
  await openDashboard(page)
  await page.goto('/#/baseHome')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
}

const favoriteMenu = {
  favoriteId: 'fav-embed',
  menuId: 'embed',
  name: '项目查询',
  sort: 1,
  url: 'https://example.com/project',
  createTime: ''
}

test.beforeEach(async ({ page }) => {
  await page.route('https://example.com/project', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>项目页面</h1>' }))
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (!pathname.startsWith('/api/')) {
      await route.continue()
      return
    }
    const path = pathname.replace(/^\/api/, '')
    const data: Record<string, unknown> = {
      '/login': { token: 'local-e2e-token' },
      '/sysMenu/hasPermission': true,
      '/sys/getUserInfo': { id: 'e2e', name: '测试用户', fullName: '测试用户' },
      '/sys/menu/nav': [
        {
          id: 'platform',
          name: '业务平台',
          url: '/platform',
          children: [
            { id: 'embed', name: '项目查询', url: 'https://example.com/project' },
            { id: 'missing', name: '缺少页面的模块', url: '/missing-view' }
          ]
        }
      ],
      '/sys/menu/getMenuByUrl': { url: '/baseHome' },
      '/sys/info': { osName: '测试环境', processors: 8, systemCpuLoad: 0.25, memoryRate: 0.4, userTimezone: 'Asia/Shanghai' },
      '/param/getParamValueMulti': {}
    }
    await route.fulfill({ json: { code: 0, success: true, msg: '', data: data[path] ?? {} } })
  })
})

test('workbench filters unavailable menus and keeps its title visible', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('Failed to resolve component')) errors.push(message.text())
  })
  await openWorkbench(page)
  const title = page.getByRole('heading', { name: '工作台', exact: true })
  await expect(title).toBeVisible()
  await expect(title).toBeInViewport()
  await expect(page.getByRole('link', { name: /项目查询/ })).toHaveCount(1)
  await expect(page.getByText('缺少页面的模块')).toHaveCount(0)
  await page.getByRole('textbox', { name: '搜索业务模块' }).fill('不存在')
  await expect(page.getByRole('heading', { name: '没有找到匹配的模块' })).toBeVisible()
  await page.getByRole('button', { name: '清除筛选' }).click()
  await expect(page.getByRole('link', { name: /项目查询/ })).toBeVisible()
  await page.getByRole('link', { name: /项目查询/ }).click()
  await expect(page.frameLocator('iframe').getByRole('heading', { name: '项目页面' })).toBeVisible()
  await page.getByRole('tab', { name: '主页', exact: true }).click()
  await expect(dashboardHeading(page)).toBeVisible()
  await page.getByRole('tab', { name: '工作台', exact: true }).click()
  await expect(title).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('home dashboard renders its cards and favourite-driven quick entries', async ({ page }) => {
  let favorited = false
  await page.route('**/api/sys/menu/favorite/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/toggle')) {
      favorited = true
      await route.fulfill({ json: { code: 0, success: true, msg: '', data: true } })
      return
    }
    await route.fulfill({ json: { code: 0, success: true, msg: '', data: favorited ? [{ ...favoriteMenu }] : [] } })
  })

  await openDashboard(page)
  await expect(page.getByRole('region', { name: '快捷入口' }).getByText('暂无收藏菜单')).toBeVisible()
  await expect(page.getByRole('region', { name: '用户手册' }).getByText('暂无用户手册')).toBeVisible()
  await expect(page.getByRole('region', { name: '系统公告' }).getByText('暂无系统公告')).toBeVisible()
  await expect(page.getByRole('region', { name: '待办事项' }).getByRole('status')).toContainText('暂无待办事项')

  const nav = page.getByRole('complementary', { name: '侧边导航' })
  // 叶子菜单在业务平台目录下，先展开父级；星标用键盘触发，避免展开动画期间的指针命中竞争
  await nav.getByRole('menuitem', { name: '业务平台', exact: true }).click()
  const star = nav.getByRole('button', { name: '收藏菜单：项目查询' })
  await expect(star).toBeVisible()
  await star.focus()
  await star.press('Enter')
  await expect(nav.getByRole('button', { name: '取消收藏：项目查询' })).toHaveAttribute('aria-pressed', 'true')
  const quick = page.getByRole('region', { name: '快捷入口' })
  await expect(quick.getByRole('button', { name: /项目查询/ })).toBeVisible()
  await quick.getByRole('button', { name: /项目查询/ }).click()
  await expect(page.frameLocator('iframe').getByRole('heading', { name: '项目页面' })).toBeVisible()
})

test('system management lives in the avatar dropdown instead of the main navigation', async ({ page }) => {
  const menus = [
    {
      id: 'platform',
      name: '业务平台',
      url: '/platform',
      children: [{ id: 'embed', name: '项目查询', url: 'https://example.com/project' }]
    },
    {
      id: 'system',
      name: '系统管理',
      url: '/system',
      children: [
        { id: 'sys-user', name: '用户管理', url: 'https://example.com/project' },
        {
          id: 'sys-org',
          name: '组织架构',
          url: '/system/org',
          children: [
            {
              id: 'sys-dept',
              name: '部门管理',
              url: '/system/org/dept',
              children: [{ id: 'sys-dept-detail', name: '部门详情', url: 'https://example.com/project' }]
            }
          ]
        }
      ]
    }
  ]
  await page.route('**/api/sys/menu/nav**', (route) => route.fulfill({ json: { code: 0, success: true, data: menus } }))
  await page.route('**/api/sys/getUserInfo**', (route) =>
    route.fulfill({ json: { code: 0, success: true, data: { id: 'e2e', name: '测试用户', fullName: '完整姓名', domainName: '总部' } } })
  )
  await openDashboard(page)

  const rail = page.getByRole('complementary', { name: '侧边导航' })
  await expect(rail.getByRole('menuitem', { name: '系统管理', exact: true })).toHaveCount(0)
  await expect(rail.getByRole('menuitem', { name: '业务平台', exact: true })).toBeVisible()

  // 头像旁显示 user.name；fullName 只作为次要信息，不进顶部标签。
  const trigger = page.getByRole('button', { name: '测试用户，系统管理' })
  await expect(trigger).toBeVisible()
  await expect(trigger).not.toContainText('完整姓名')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await trigger.click()
  const panel = page.getByRole('navigation', { name: '系统管理' })
  await expect(panel).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')

  // 图标与侧栏同一套层级规则：L2 文件夹 · L3 文件 · L4 及更深圆点，同层同框。
  const orgRow = panel.locator('.ds-user-menu__node[data-nav-level="2"]').filter({ hasText: '组织架构' })
  await expect(orgRow.locator('.ds-user-menu__icon')).toHaveCSS('width', '24px')
  await expect(orgRow.locator('.ds-user-menu__icon svg')).toHaveCount(1)
  await expect(orgRow.locator('.ds-user-menu__dot')).toHaveCount(0)

  await panel.getByRole('button', { name: '组织架构', exact: true }).click()
  const deptRow = panel.locator('.ds-user-menu__node[data-nav-level="3"]').filter({ hasText: '部门管理' })
  await expect(deptRow.locator('.ds-user-menu__icon')).toHaveCSS('width', '22px')
  await expect(deptRow.locator('.ds-user-menu__icon svg')).toHaveCount(1)

  await panel.getByRole('button', { name: '部门管理', exact: true }).click()
  const detailRow = panel.locator('.ds-user-menu__node[data-nav-level="4"]').filter({ hasText: '部门详情' })
  await expect(detailRow.locator('.ds-user-menu__icon')).toHaveCSS('width', '18px')
  await expect(detailRow.locator('.ds-user-menu__dot')).toHaveCount(1)
  await expect(detailRow.locator('.ds-user-menu__icon svg')).toHaveCount(0)

  await panel.getByRole('link', { name: '部门详情', exact: true }).click()
  await expect(panel).toBeHidden()
  await expect(page.frameLocator('iframe').getByRole('heading', { name: '项目页面' })).toBeVisible()

  // 当前页所在分组自动展开，叶子带选中态。
  await trigger.click()
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('link', { name: '部门详情', exact: true })).toHaveClass(/is-active/)
  await expect(panel.getByRole('button', { name: '组织架构', exact: true })).toHaveAttribute('aria-expanded', 'true')

  // Esc 收起并把焦点还给触发按钮。
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(trigger).toBeFocused()

  // 点击面板以外的区域同样收起。
  await trigger.click()
  await expect(panel).toBeVisible()
  await page.locator('.ds-header__leading').click()
  await expect(panel).toBeHidden()
})

test('platform status loads on demand and can be closed', async ({ page }) => {
  let statusRequests = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/sys/info') statusRequests += 1
  })
  await openWorkbench(page)
  expect(statusRequests).toBe(0)
  await page.getByRole('button', { name: '平台状态', exact: true }).click()
  await expect(page.getByRole('heading', { name: '平台运行状态' })).toBeVisible()
  await expect(page.getByText('测试环境', { exact: true })).toBeVisible()
  expect(statusRequests).toBe(1)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: '平台运行状态' })).toBeHidden()
})

test('navigation layouts and sidebar resizing remain usable', async ({ page }) => {
  await openDashboard(page)
  const resizer = page.getByRole('separator', { name: '调整导航栏宽度' })
  await resizer.focus()
  await resizer.press('ArrowRight')
  await expect(resizer).toHaveAttribute('aria-valuenow', '258')
  await resizer.dblclick()
  await expect(resizer).toHaveAttribute('aria-valuenow', '248')
  await page.setViewportSize({ width: 900, height: 900 })
  await expect(page.getByRole('complementary', { name: '侧边导航' })).toBeVisible()
  await expect(page.getByRole('button', { name: '收起侧边导航' })).toBeVisible()
  await expect(resizer).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: '打开界面设置' }).click()
  await page.getByRole('button', { name: '顶部导航', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('complementary', { name: '侧边导航' })).toHaveCount(0)
  await page.getByRole('button', { name: '打开界面设置' }).click()
  await page.getByRole('button', { name: '混合导航', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('complementary', { name: '侧边导航' })).toBeVisible()
})

test('mixed navigation switches modules and keeps top labels visible when the rail is collapsed', async ({ page }) => {
  const menus = [
    { id: 'a', name: '模块甲', url: '/module-a', children: [{ id: 'a-page', name: '甲页面', url: 'https://example.com/project' }] },
    { id: 'b', name: '模块乙', url: '/module-b', children: [{ id: 'b-page', name: '乙页面', url: 'https://example.com/project' }] }
  ]
  await page.route('**/api/sys/menu/nav**', (route) => route.fulfill({ json: { code: 0, success: true, data: menus } }))
  await openDashboard(page)
  await page.getByRole('button', { name: '打开界面设置' }).click()
  await page.getByRole('button', { name: '顶部导航', exact: true }).click()
  await page.getByRole('button', { name: '混合导航', exact: true }).click()
  await page.keyboard.press('Escape')
  const top = page.getByRole('navigation', { name: '主导航' })
  const rail = page.getByRole('complementary', { name: '侧边导航' })
  // 侧栏不再有模块标题：只列当前模块的页面，模块本身由顶栏选中项表达。
  await expect(rail).not.toContainText('工作区导航')
  await expect(rail.getByRole('menuitem', { name: '甲页面', exact: true })).toBeVisible()
  await top.getByRole('menuitem', { name: '模块乙', exact: true }).click()
  await expect(rail.getByRole('menuitem', { name: '乙页面', exact: true })).toBeVisible()
  await expect(rail.getByRole('menuitem', { name: '甲页面', exact: true })).toHaveCount(0)
  await expect(top.getByRole('menuitem', { name: '模块乙', exact: true })).toHaveClass(/is-active/)
  await rail.getByRole('menuitem', { name: '乙页面', exact: true }).click()
  await expect(page.frameLocator('iframe').getByRole('heading', { name: '项目页面' })).toBeVisible()
  await page.reload()
  await expect(rail.getByRole('menuitem', { name: '乙页面', exact: true })).toBeVisible()
  await expect(top.getByRole('menuitem', { name: '模块乙', exact: true })).toHaveClass(/is-active/)
  await page.setViewportSize({ width: 900, height: 900 })
  await top.getByRole('menuitem', { name: '更多', exact: true }).hover()
  await page.getByRole('menuitem', { name: '模块甲', exact: true }).click()
  await expect(rail.getByRole('menuitem', { name: '甲页面', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: '收起侧边导航' }).click()
  await expect(top.getByRole('menuitem', { name: '模块甲', exact: true })).toBeVisible()
  await expect(top.getByRole('menuitem', { name: '模块甲', exact: true }).locator('.rr-sidebar-menu-entry__label')).toBeVisible()
  await top.getByRole('menuitem', { name: '模块乙', exact: true }).click()
  await page.getByRole('button', { name: '展开侧边导航' }).click()
  await expect(rail.getByRole('menuitem', { name: '乙页面', exact: true })).toBeVisible()
  await expect(top.getByRole('menuitem', { name: '模块乙', exact: true })).toHaveClass(/is-active/)
})

test('settings reflect the layout, persist appearance and disable styles when tabs are off', async ({ page }) => {
  await openDashboard(page)
  await page.getByRole('button', { name: '打开界面设置' }).click()
  const settings = page.getByRole('dialog', { name: '界面设置' })
  await expect(settings.getByRole('button', { name: '左侧导航', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await settings.getByRole('button', { name: '顶部导航', exact: true }).click()
  await expect(settings.getByRole('button', { name: '顶部导航', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(settings.getByRole('button', { name: '浅色导航', exact: true })).toHaveCount(0)
  await settings.getByRole('button', { name: '混合导航', exact: true }).click()
  await expect(settings.getByText('顶部选择业务模块，左侧显示该模块菜单。', { exact: true })).toBeVisible()
  await settings.getByRole('button', { name: '浅色导航', exact: true }).click()
  await settings.getByRole('button', { name: '深色', exact: true }).click()
  await settings.getByRole('button', { name: '靛蓝', exact: true }).click()
  await settings.getByRole('switch', { name: '启用标签页' }).focus()
  await settings.getByRole('switch', { name: '启用标签页' }).press('Space')
  await expect(settings.getByRole('combobox', { name: '标签页样式' })).toBeDisabled()
  await expect(page.getByRole('tab', { name: '主页', exact: true })).toHaveCount(0)
  await expect(settings.getByRole('button', { name: '恢复默认' })).toBeInViewport()
  await page.keyboard.press('Escape')
  await page.reload()
  await expect(dashboardHeading(page)).toBeVisible()
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-navLayout-mix/)
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-sidebar-light/)
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-topHeader-dark/)
  await expect(page.getByRole('tab', { name: '主页', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '打开界面设置' }).click()
  await settings.getByRole('button', { name: '恢复默认' }).click()
  await expect(settings.getByRole('button', { name: '左侧导航', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(settings.getByRole('switch', { name: '启用标签页' })).toBeChecked()
  await expect(settings.getByRole('combobox', { name: '标签页样式' })).toBeEnabled()
  // 默认外观对齐参考实现：浅色侧边栏 + 品牌色顶栏。
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-sidebar-light/)
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-topHeader-primary/)
})

test('nested navigation uses level icons, fixed 14px steps and a compact collapsed rail', async ({ page }) => {
  const leaf = (level: number, icon = '') => ({
    id: `leaf-${level}-${icon || 'plain'}`,
    name: `${icon ? '图标页面' : '页面'} ${level}`,
    url: 'https://example.com/project',
    icon
  })
  let menus: unknown[] = [leaf(7), leaf(7, 'appstore')]
  for (let level = 6; level >= 1; level--) {
    menus = [
      leaf(level),
      leaf(level, 'appstore'),
      { id: `group-${level}`, name: `目录 ${level}`, url: `/group-${level}`, icon: level % 2 ? 'appstore' : '', children: menus }
    ]
  }
  await page.route('**/api/sys/menu/nav**', (route) => route.fulfill({ json: { code: 0, success: true, data: menus } }))
  await openDashboard(page)

  const nav = page.locator('.ds-nav--vertical:visible')
  const label = (name: string) => nav.locator('.rr-sidebar-menu-entry__label').filter({ hasText: new RegExp(`^${name}$`) })
  // 每级 14px 缩进、行内左边距 10px；服务端图标在纵向侧栏被层级图标取代，标签起点不再因有无图标而不同。
  const iconBox = [30, 24, 22, 18]
  for (let level = 1; level <= 7; level++) {
    await expect(label(`页面 ${level}`)).toBeVisible()
    const plainBox = await label(`页面 ${level}`).boundingBox()
    const iconBoxPosition = await label(`图标页面 ${level}`).boundingBox()
    expect(plainBox).not.toBeNull()
    expect(iconBoxPosition).not.toBeNull()
    // 同一层里，服务端是否配置图标都不影响布局。
    expect(iconBoxPosition!.x).toBeCloseTo(plainBox!.x, 1)

    const row = nav.getByRole('menuitem', { name: `页面 ${level}`, exact: true })
    const expectedLeft = 10 + (level - 1) * 14
    await expect(row).toHaveCSS('padding-left', `${expectedLeft}px`)
    const well = row.locator('.rr-sidebar-menu-entry__icon')
    // 每一行都有图标位：L1-L3 是层级图标，L4 及更深是圆点。
    await expect(well).toHaveCount(1)
    await expect(well).toHaveCSS('width', `${iconBox[Math.min(level, 4) - 1]}px`)
    await expect(well.locator('.rr-sidebar-menu-entry__dot')).toHaveCount(level >= 4 ? 1 : 0)
    await expect(well.locator('svg')).toHaveCount(level >= 4 ? 0 : 1)

    if (level <= 6) await nav.getByRole('menuitem', { name: `目录 ${level}`, exact: true }).click()
  }

  await page.getByRole('button', { name: '收起侧边导航' }).click()
  const rootTitle = nav.locator('.ds-nav__menu > .el-sub-menu > .el-sub-menu__title')
  await expect(rootTitle).toHaveCSS('padding-left', '0px')
  // 收起态：顶层行改为「图标 + 名称前两字」的纵向排列，方形入口高 61px（63 × 63 卡片）。
  await expect(rootTitle).toHaveCSS('height', '61px')
  // 图标必须保持 30px 的层级图标底框，不能被 Element Plus collapse 的 24px 固定宽度压扁。
  await expect(rootTitle.locator('.rr-sidebar-menu-entry__icon')).toHaveCSS('width', '30px')
  await expect(rootTitle.locator('.rr-sidebar-menu-entry__icon')).toHaveCSS('height', '30px')
  const collapsed = await rootTitle.evaluate((el) => {
    const title = el.getBoundingClientRect()
    const icon = el.querySelector('.rr-sidebar-menu-entry__icon')!.getBoundingClientRect()
    const short = el.querySelector<HTMLElement>('.rr-sidebar-menu-entry__short')!
    const shortRect = short.getBoundingClientRect()
    return {
      titleCenter: title.x + title.width / 2,
      iconCenter: icon.x + icon.width / 2,
      shortCenter: shortRect.x + shortRect.width / 2,
      shortText: short.textContent?.trim() ?? '',
      shortVisible: getComputedStyle(short).display !== 'none',
      labelHidden: getComputedStyle(el.querySelector<HTMLElement>('.rr-sidebar-menu-entry__label')!).display === 'none'
    }
  })
  expect(collapsed.iconCenter).toBeCloseTo(collapsed.titleCenter, 1)
  expect(collapsed.shortCenter).toBeCloseTo(collapsed.titleCenter, 1)
  expect(collapsed.shortVisible).toBe(true)
  expect(collapsed.labelHidden).toBe(true)
  expect(collapsed.shortText).toBe('目录')
})

test('collapsed rail hover menu reuses the expanded rows pixel for pixel', async ({ page }) => {
  const leaf = (id: string, name: string) => ({ id, name, url: 'https://example.com/project' })
  const menus = [
    {
      id: 'group',
      name: '目录组',
      url: '/hover-group',
      children: [
        {
          id: 'sub',
          name: '子目录',
          url: '/hover-sub',
          children: [leaf('deep', '深层页面'), { id: 'sub2', name: '子目录二', url: '/hover-sub-2', children: [leaf('deeper', '更深的页面')] }]
        }
      ]
    }
  ]
  await page.route('**/api/sys/menu/nav**', (route) => route.fulfill({ json: { code: 0, success: true, data: menus } }))
  await openDashboard(page)

  /** 一行菜单的图标框尺寸 / 字形尺寸 / 行高 / 缩进，用来判断两个入口是否同一套几何。 */
  const rowMetrics = (row: Locator) =>
    row.evaluate((el) => {
      const well = el.querySelector('.rr-sidebar-menu-entry__icon')!
      const rect = el.getBoundingClientRect()
      const box = well.getBoundingClientRect()
      const glyph = well.querySelector('svg') ?? well.querySelector('.rr-sidebar-menu-entry__dot')
      return {
        box: `${String(Math.round(box.width))}x${String(Math.round(box.height))}`,
        glyph: glyph ? Math.round(glyph.getBoundingClientRect().width) : 0,
        rowHeight: Math.round(rect.height),
        paddingLeft: getComputedStyle(el).paddingLeft,
        iconBackground: getComputedStyle(well).backgroundColor,
        iconRadius: getComputedStyle(well).borderRadius
      }
    })

  const nav = page.locator('.ds-nav--vertical:visible')
  await nav.getByRole('menuitem', { name: '目录组', exact: true }).click()
  await nav.getByRole('menuitem', { name: '子目录', exact: true }).locator('> .el-sub-menu__title').click()
  const declaredRow = nav.getByRole('menuitem', { name: '深层页面', exact: true })
  await expect(declaredRow).toBeVisible()
  const declared = await rowMetrics(declaredRow)

  await page.getByRole('button', { name: '收起侧边导航' }).click()
  await nav.locator('.ds-nav__menu > .el-sub-menu > .el-sub-menu__title').first().hover()
  const popup = page.locator('.el-popper.ds-nav-pop-rail:visible').first()
  await expect(popup).toBeVisible()
  const subRow = popup.getByRole('menuitem', { name: '子目录', exact: true })
  await subRow.locator('> .el-sub-menu__title').click()
  const hoveredRow = popup.getByRole('menuitem', { name: '深层页面', exact: true })
  // 弹出层带 zoom 入场动画，几何在动画期间是缩放过的；等它稳定到声明值再量。
  await expect.poll(async () => (await rowMetrics(hoveredRow)).rowHeight).toBe(declared.rowHeight)
  expect(await rowMetrics(hoveredRow)).toEqual(declared)

  // 更深的层级同样沿用层级规则，而不是在弹出层里退回服务端图标。
  await popup.getByRole('menuitem', { name: '子目录二', exact: true }).locator('> .el-sub-menu__title').click()
  const deeperRow = popup.getByRole('menuitem', { name: '更深的页面', exact: true })
  await expect.poll(async () => (await rowMetrics(deeperRow)).rowHeight).toBe(38)
  const deeper = await rowMetrics(deeperRow)
  expect(deeper.box).toBe('18x18')
  expect(deeper.paddingLeft).toBe('52px')
  expect(deeper.glyph).toBe(5)
})

test('navigation accordion closes sibling branches and preserves expanded ancestors', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('v1@CacheTheme', JSON.stringify({ sidebarUniOpened: false }))
  })
  const leaf = (id: string, name: string) => ({ id, name, url: 'https://example.com/project' })
  const menus = [
    {
      id: 'a',
      name: '目录甲',
      url: '/accordion-a',
      children: [
        {
          id: 'a1',
          name: '甲子目录一',
          url: '/accordion-a1',
          children: [{ id: 'a11', name: '甲孙目录', url: '/accordion-a11', children: [leaf('a-leaf', '甲页面一')] }]
        },
        { id: 'a2', name: '甲子目录二', url: '/accordion-a2', children: [leaf('a2-leaf', '甲页面二')] }
      ]
    },
    { id: 'b', name: '目录乙', url: '/accordion-b', children: [leaf('b-leaf', '乙页面')] }
  ]
  await page.route('**/api/sys/menu/nav**', (route) => route.fulfill({ json: { code: 0, success: true, data: menus } }))
  await openDashboard(page)
  const nav = page.getByRole('complementary', { name: '侧边导航' })
  const group = (name: string) => nav.getByRole('menuitem', { name, exact: true })
  // 展开后 li 的高度包含子级，点 li 中心可能落到叶子行；目录一律点自己的标题行。
  const toggle = async (name: string) => {
    await group(name).locator('.el-sub-menu__title').first().click()
  }
  // 逐级等待展开完成再点下一层：折叠动画期间坐标仍在移动，连续点击会落到相邻行
  await toggle('目录甲')
  await expect(group('目录甲')).toHaveAttribute('aria-expanded', 'true')
  await toggle('甲子目录一')
  await expect(group('甲子目录一')).toHaveAttribute('aria-expanded', 'true')
  await toggle('甲孙目录')
  await expect(group('甲孙目录')).toHaveAttribute('aria-expanded', 'true')
  await expect(group('甲页面一')).toBeVisible()
  await toggle('甲子目录二')
  await expect(group('甲子目录一')).toHaveAttribute('aria-expanded', 'false')
  await expect(group('甲页面一')).toBeHidden()
  await expect(group('甲页面二')).toBeVisible()
  await expect(group('目录甲')).toHaveAttribute('aria-expanded', 'true')
  await toggle('目录乙')
  await expect(group('目录甲')).toHaveAttribute('aria-expanded', 'false')
  await expect(group('甲页面二')).toBeHidden()
  await expect(group('乙页面')).toBeVisible()
  await toggle('目录乙')
  await expect(group('目录乙')).toHaveAttribute('aria-expanded', 'false')
  await expect(group('乙页面')).toBeHidden()
  await page.getByRole('button', { name: '打开界面设置' }).click()
  await expect(page.getByText('导航排他展开', { exact: true })).toHaveCount(0)
})

test('rail tools filter by keyword and favourites, then restore the expanded trail', async ({ page }) => {
  const menus = [
    {
      id: 'platform',
      name: '业务平台',
      url: '/platform',
      children: [
        { id: 'embed', name: '项目查询', url: 'https://example.com/project' },
        {
          id: 'budget',
          name: '预算管理',
          url: '/platform/budget',
          children: [
            { id: 'budget-plan', name: '预算编制', url: '/baseHome' },
            { id: 'budget-adjust', name: '预算调整', url: 'https://example.com/project' }
          ]
        }
      ]
    },
    { id: 'office', name: '协同办公', url: '/office', children: [{ id: 'doc', name: '公文流转', url: 'https://example.com/project' }] }
  ]
  await page.route('**/api/sys/menu/nav**', (route) => route.fulfill({ json: { code: 0, success: true, data: menus } }))
  // 收藏以服务端列表为准：菜单下发的 isFavorite 只在列表未加载时兜底
  await page.route('**/api/sys/menu/favorite/**', (route) =>
    route.fulfill({
      json: {
        code: 0,
        success: true,
        data: [{ favoriteId: 'fav-1', menuId: 'budget-plan', name: '预算编制', sort: 1, url: '/baseHome', createTime: '' }]
      }
    })
  )
  await openDashboard(page)

  const rail = page.getByRole('complementary', { name: '侧边导航' })
  const search = rail.getByRole('searchbox', { name: '搜索菜单' })
  const group = (name: string) => rail.getByRole('menuitem', { name, exact: true })
  const openedGroups = () =>
    page.evaluate(() => [...document.querySelectorAll('.ds-nav__menu .el-sub-menu.is-opened')].map((item) => item.getAttribute('data-nav-path')))

  // 先展开「协同办公」留一份展开快照，搜索结束后应回到这份快照而不是整棵树的路径。
  await group('协同办公').locator('.el-sub-menu__title').first().click()
  await expect(group('协同办公')).toHaveAttribute('aria-expanded', 'true')

  // 关键词只留命中项与祖先，祖先自动展开
  await search.fill('预算')
  await expect(group('预算管理')).toBeVisible()
  await expect(rail.getByRole('menuitem', { name: '项目查询', exact: true })).toHaveCount(0)
  await expect(rail.getByRole('menuitem', { name: '公文流转', exact: true })).toHaveCount(0)
  await expect(rail.getByRole('menuitem', { name: '预算编制', exact: true })).toBeVisible()
  await expect(group('业务平台')).toHaveAttribute('aria-expanded', 'true')

  // 无结果给出提示，Esc 清空并还原展开状态
  await search.fill('不存在的模块')
  await expect(rail.getByText('未找到相关菜单', { exact: true })).toBeVisible()
  await expect(rail.getByText('请更换关键词，或按 Esc 清空', { exact: true })).toBeVisible()
  await expect(rail.getByRole('menuitem')).toHaveCount(0)
  await search.press('Escape')
  await expect(search).toHaveValue('')
  await expect(group('业务平台')).toBeVisible()
  expect(await openedGroups()).toEqual(['/office'])

  // 只看收藏：仅保留收藏叶子及其路径
  const favorite = rail.getByRole('button', { name: '只看收藏' })
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')
  await expect(rail.getByRole('menuitem', { name: '预算编制', exact: true })).toBeVisible()
  await expect(rail.getByRole('menuitem', { name: '预算调整', exact: true })).toHaveCount(0)
  await expect(rail.getByRole('menuitem', { name: '项目查询', exact: true })).toHaveCount(0)
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await expect(rail.getByRole('menuitem', { name: '项目查询', exact: true })).toBeVisible()
  // 退出收藏模式后回到进入前的展开快照（此时只剩「协同办公」）
  await expect(group('协同办公')).toHaveAttribute('aria-expanded', 'true')
  await expect(group('业务平台')).toHaveAttribute('aria-expanded', 'false')

  // 收起全部：把所有已展开分组关掉
  await group('业务平台').locator('.el-sub-menu__title').first().click()
  await expect(group('业务平台')).toHaveAttribute('aria-expanded', 'true')
  await rail.getByRole('button', { name: '收起全部菜单' }).click()
  await expect(group('业务平台')).toHaveAttribute('aria-expanded', 'false')
  await expect(group('协同办公')).toHaveAttribute('aria-expanded', 'false')

  // 「/」把焦点送进侧栏搜索框，但不抢页面里已有焦点的输入框
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('/')
  await expect(search).toBeFocused()
  await expect(search).toHaveValue('')
  await search.press('Escape')
})

test('login permission and workspace failures offer recovery', async ({ page }) => {
  await page.route('**/api/sysMenu/hasPermission**', (route) => route.fulfill({ json: { code: 0, success: true, data: false } }))
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '暂无系统访问权限' })).toBeVisible()
  await page.unroute('**/api/sysMenu/hasPermission**')
  await page.route('**/api/sys/menu/nav**', (route) => route.fulfill({ json: { code: 503, success: false, msg: '测试失败', data: null } }))
  await page.getByRole('button', { name: '重新验证权限' }).click()
  await expect(page.getByRole('heading', { name: '工作区暂时无法加载' })).toBeVisible()
  await page.unroute('**/api/sys/menu/nav**')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(dashboardHeading(page)).toBeVisible()
})

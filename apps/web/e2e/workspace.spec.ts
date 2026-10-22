import { expect, test } from '@playwright/test'

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
  await page.goto('/#/home')
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
  await expect(title).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('menu search supports keyboard selection and Escape', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '搜索菜单', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '搜索菜单' })
  const input = dialog.getByRole('textbox', { name: '搜索菜单名称' })
  await expect(input).toBeFocused()
  await input.fill('项目')
  await input.press('ArrowDown')
  await expect(dialog.getByRole('link', { name: /项目查询/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.keyboard.press('Control+k')
  await expect(input).toBeFocused()
  await input.fill('项目')
  await input.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(page.frameLocator('iframe').getByRole('heading', { name: '项目页面' })).toBeVisible()
})

test('platform status loads on demand and can be closed', async ({ page }) => {
  let statusRequests = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/sys/info') statusRequests += 1
  })
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
  expect(statusRequests).toBe(0)
  await page.getByRole('button', { name: '平台状态', exact: true }).click()
  await expect(page.getByRole('heading', { name: '平台运行状态' })).toBeVisible()
  await expect(page.getByText('测试环境', { exact: true })).toBeVisible()
  expect(statusRequests).toBe(1)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: '平台运行状态' })).toBeHidden()
})

test('navigation layouts and sidebar resizing remain usable', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
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
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '打开界面设置' }).click()
  await page.getByRole('button', { name: '顶部导航', exact: true }).click()
  await page.getByRole('button', { name: '混合导航', exact: true }).click()
  await page.keyboard.press('Escape')
  const top = page.getByRole('navigation', { name: '主导航' })
  const rail = page.getByRole('complementary', { name: '侧边导航' })
  await expect(rail.getByText('模块甲', { exact: true })).toBeVisible()
  await expect(rail.getByRole('menuitem', { name: '甲页面', exact: true })).toBeVisible()
  await top.getByRole('menuitem', { name: '模块乙', exact: true }).click()
  await expect(rail.getByText('模块乙', { exact: true })).toBeVisible()
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
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
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
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-navLayout-mix/)
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-sidebar-light/)
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-topHeader-dark/)
  await expect(page.getByRole('tab', { name: '主页', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '打开界面设置' }).click()
  await settings.getByRole('button', { name: '恢复默认' }).click()
  await expect(settings.getByRole('button', { name: '左侧导航', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(settings.getByRole('switch', { name: '启用标签页' })).toBeChecked()
  await expect(settings.getByRole('combobox', { name: '标签页样式' })).toBeEnabled()
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-sidebar-dark/)
  await expect(page.locator('.ds-admin')).toHaveClass(/ui-topHeader-light/)
})

test('nested navigation indents children past their parent with and without icons', async ({ page }) => {
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
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()

  const nav = page.locator('.ds-nav--vertical:visible')
  const label = (name: string) => nav.locator('.rr-sidebar-menu-entry__label').filter({ hasText: new RegExp(`^${name}$`) })
  let parentLeft: number | undefined
  for (let level = 1; level <= 7; level++) {
    await expect(label(`页面 ${level}`)).toBeVisible()
    const plainBox = await label(`页面 ${level}`).boundingBox()
    const iconBox = await label(`图标页面 ${level}`).boundingBox()
    expect(plainBox).not.toBeNull()
    expect(iconBox).not.toBeNull()
    expect(iconBox!.x - plainBox!.x).toBeCloseTo(28, 1)
    await expect(label(`页面 ${level}`).locator('..').locator('.rr-sidebar-menu-entry__icon')).toHaveCount(0)
    if (parentLeft !== undefined) expect(plainBox!.x - parentLeft).toBeCloseTo(18, 1)
    if (level <= 6) {
      const groupBox = await label(`目录 ${level}`).boundingBox()
      expect(groupBox).not.toBeNull()
      expect(groupBox!.x - plainBox!.x).toBeCloseTo(level % 2 ? 28 : 0, 1)
      parentLeft = groupBox!.x
      await nav.getByRole('menuitem', { name: `目录 ${level}`, exact: true }).click()
    }
  }

  await page.getByRole('button', { name: '收起侧边导航' }).click()
  const rootTitle = nav.locator('.ds-nav__menu > .el-sub-menu > .el-sub-menu__title')
  await expect(rootTitle).toHaveCSS('padding-left', '0px')
  const titleBox = await rootTitle.boundingBox()
  const iconBox = await rootTitle.locator('.rr-sidebar-menu-entry__icon').boundingBox()
  expect(titleBox).not.toBeNull()
  expect(iconBox).not.toBeNull()
  expect(iconBox!.x + iconBox!.width / 2).toBeCloseTo(titleBox!.x + titleBox!.width / 2, 1)
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
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
  const nav = page.getByRole('complementary', { name: '侧边导航' })
  const group = (name: string) => nav.getByRole('menuitem', { name, exact: true })
  await group('目录甲').click()
  await group('甲子目录一').click()
  await group('甲孙目录').click()
  await expect(group('目录甲')).toHaveAttribute('aria-expanded', 'true')
  await expect(group('甲子目录一')).toHaveAttribute('aria-expanded', 'true')
  await expect(group('甲页面一')).toBeVisible()
  await group('甲子目录二').click()
  await expect(group('甲子目录一')).toHaveAttribute('aria-expanded', 'false')
  await expect(group('甲页面一')).toBeHidden()
  await expect(group('甲页面二')).toBeVisible()
  await expect(group('目录甲')).toHaveAttribute('aria-expanded', 'true')
  await group('目录乙').click()
  await expect(group('目录甲')).toHaveAttribute('aria-expanded', 'false')
  await expect(group('甲页面二')).toBeHidden()
  await expect(group('乙页面')).toBeVisible()
  await group('目录乙').click()
  await expect(group('目录乙')).toHaveAttribute('aria-expanded', 'false')
  await expect(group('乙页面')).toBeHidden()
  await page.getByRole('button', { name: '打开界面设置' }).click()
  await expect(page.getByText('导航排他展开', { exact: true })).toHaveCount(0)
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
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
})

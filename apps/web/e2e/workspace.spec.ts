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
})

test('platform status loads on demand and can be closed', async ({ page }) => {
  await page.goto('/#/home')
  await page.getByRole('button', { name: '平台状态', exact: true }).click()
  await expect(page.getByRole('heading', { name: '平台运行状态' })).toBeVisible()
  await expect(page.getByText('测试环境', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: '平台运行状态' })).toBeHidden()
})

test('navigation layouts and sidebar resizing remain usable', async ({ page }, testInfo) => {
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
  if (testInfo.project.name === 'desktop') {
    const resizer = page.getByRole('separator', { name: '调整导航栏宽度' })
    await resizer.focus()
    await resizer.press('ArrowRight')
    await expect(resizer).toHaveAttribute('aria-valuenow', '258')
    await resizer.dblclick()
    await expect(resizer).toHaveAttribute('aria-valuenow', '248')
    await page.getByRole('button', { name: '打开界面设置' }).click()
    await page.getByRole('button', { name: '顶部导航', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('complementary', { name: '侧边导航' })).toHaveCount(0)
    await page.getByRole('button', { name: '打开界面设置' }).click()
    await page.getByRole('button', { name: '混合导航', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('complementary', { name: '侧边导航' })).toBeVisible()
  } else {
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    await expect(page.getByRole('heading', { name: '导航菜单' })).toBeVisible()
    await page.keyboard.press('Escape')
  }
})

test('login permission and workspace failures offer recovery', async ({ page }) => {
  await page.route('**/api/sysMenu/hasPermission**', (route) => route.fulfill({ json: { code: 0, success: true, data: false } }))
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: '暂无系统访问权限' })).toBeVisible()
  await page.unroute('**/api/sysMenu/hasPermission**')
  await page.route('**/api/sys/menu/nav**', (route) => route.fulfill({ json: { code: 503, success: false, msg: '测试失败', data: null } }))
  await page.getByRole('button', { name: '重新登录' }).click()
  await expect(page.getByRole('heading', { name: '工作区暂时无法加载' })).toBeVisible()
  await page.unroute('**/api/sys/menu/nav**')
  await page.getByRole('button', { name: '重新加载' }).click()
  await page.getByRole('button', { name: '返回工作台', exact: true }).click()
  await expect(page.getByRole('heading', { name: '工作台', exact: true })).toBeVisible()
})

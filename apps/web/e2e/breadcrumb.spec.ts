import { expect, test, type Page } from '@playwright/test'

const leaf = (id: string, name: string) => ({ id, name, url: 'https://example.com/project' })

const menus = [
  {
    id: 'platform',
    name: '业务平台',
    url: '/platform',
    children: [
      {
        id: 'pm',
        name: '项目管理',
        url: '/platform/pm',
        children: [
          {
            id: 'track',
            name: '进度跟踪与里程碑管理',
            url: '/platform/pm/track',
            children: [leaf('milestone', '里程碑计划编制与审批'), leaf('weekly', '项目周报')]
          },
          { id: 'cost', name: '成本控制', url: '/platform/pm/cost', children: [leaf('cost-plan', '成本计划'), leaf('cost-alarm', '成本预警')] },
          leaf('portfolio', '项目组合')
        ]
      },
      leaf('embed', '项目查询')
    ]
  }
]

const crumbs = (page: Page) => page.getByRole('navigation', { name: '面包屑' })

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
      '/sys/getUserInfo': { id: 'e2e', name: '测试用户' },
      '/sys/menu/nav': menus,
      '/sys/menu/getMenuByUrl': { url: '/baseHome' },
      '/param/getParamValueMulti': {}
    }
    await route.fulfill({ json: { code: 0, success: true, msg: '', data: data[path] ?? {} } })
  })
})

test('breadcrumb groups open their level instead of linking to an empty group page', async ({ page }) => {
  await page.goto('/#/home')
  await expect(crumbs(page).locator('[aria-current="page"]')).toHaveText('主页')

  await page.goto('/#/iframe/milestone')
  await expect(page.frameLocator('iframe').getByRole('heading', { name: '项目页面' })).toBeVisible()
  const trail = crumbs(page)
  await expect(trail.locator('.ds-breadcrumb__list [aria-current="page"]')).toHaveText('里程碑计划编制与审批')
  // 分组没有视图：祖先是展开按钮，不是链接
  await expect(trail.getByRole('link', { name: '项目管理' })).toHaveCount(0)

  const group = trail.getByRole('button', { name: '项目管理', exact: true })
  await group.click()
  await expect(group).toHaveAttribute('aria-expanded', 'true')
  const panel = page.getByRole('navigation', { name: '项目管理', exact: true })
  await expect(panel).toBeVisible()
  // 打开后焦点落在当前页所在的分支上
  await expect(panel.getByRole('button', { name: '进度跟踪与里程碑管理' })).toBeFocused()

  // 子分组在面板内逐层点开，返回时焦点回到来处
  await panel.getByRole('button', { name: '成本控制' }).click()
  await expect(panel.getByRole('link', { name: '成本计划' })).toBeFocused()
  await panel.getByRole('button', { name: '返回项目管理' }).click()
  await expect(panel.getByRole('button', { name: '成本控制' })).toBeFocused()

  // Esc 收起并把焦点还给分段
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(group).toBeFocused()

  await group.press('Enter')
  await panel.getByRole('link', { name: '项目组合' }).click()
  await expect(panel).toBeHidden()
  await expect(trail.locator('.ds-breadcrumb__list [aria-current="page"]')).toHaveText('项目组合')
  await expect(page.getByRole('tab', { name: '项目组合', exact: true })).toBeVisible()
})

test('long paths fold into "…" before the current page is truncated', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 })
  // 冷启动深链会先被登录守卫带回 /home，先完成自动登录
  await page.goto('/#/home')
  await expect(crumbs(page).locator('[aria-current="page"]')).toHaveText('主页')
  await page.goto('/#/iframe/milestone')
  await expect(page.frameLocator('iframe').getByRole('heading', { name: '项目页面' })).toBeVisible()
  const trail = crumbs(page)
  const current = trail.locator('.ds-breadcrumb__list [aria-current="page"]')
  await expect(current).toBeInViewport()
  const more = trail.getByRole('button', { name: '展开已折叠的路径' })
  await expect(more).toBeVisible()
  await more.click()
  const panel = page.getByRole('navigation', { name: '页面路径' })
  await expect(panel.getByRole('button', { name: '业务平台' })).toBeVisible()
  await panel.getByRole('button', { name: '业务平台' }).click()
  await panel.getByRole('link', { name: '项目查询' }).click()
  await expect(current).toHaveText('项目查询')

  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto('/#/iframe/milestone')
  await expect(trail.getByRole('button', { name: '展开已折叠的路径' })).toHaveCount(0)
  await expect(trail.getByRole('button', { name: '进度跟踪与里程碑管理', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

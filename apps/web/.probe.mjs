// 临时探查脚本：点击面包屑祖先，看落到什么页面。用完删除。
import { chromium } from '@playwright/test'

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
        children: [{ id: 'milestone', name: '里程碑计划编制与审批', url: 'https://example.com/project' }]
      }
    ]
  }
]
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.route('https://example.com/project', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>项目页面</h1>' }))
await page.route('**/api/**', async (route) => {
  const pathname = new URL(route.request().url()).pathname
  if (!pathname.startsWith('/api/')) return route.continue()
  const path = pathname.replace(/^\/api/, '')
  const data = {
    '/login': { token: 't' },
    '/sysMenu/hasPermission': true,
    '/sys/getUserInfo': { id: 'e2e', name: '王晓明', domainName: '总部计划运营部' },
    '/sys/menu/nav': menus,
    '/sys/menu/getMenuByUrl': { url: '/baseHome' }
  }
  await route.fulfill({ json: { code: 0, success: true, msg: '', data: data[path] ?? {} } })
})
await page.goto('http://127.0.0.1:8001/#/iframe/milestone')
await page.waitForTimeout(1200)
console.log('user chip:', await page.locator('.ds-user').innerText())
console.log('crumbs:', await page.locator('.ds-breadcrumb').innerText()); await page.locator('.ds-breadcrumb a', { hasText: '项目管理' }).click({ timeout: 5000 })
await page.waitForTimeout(1000)
console.log('after click url:', page.url())
console.log('tabs:', await page.locator('[role=tab]').allInnerTexts())
console.log('viewport text:', (await page.locator('.ds-view__router').innerText().catch(() => '<none>')).slice(0, 80))
await browser.close()

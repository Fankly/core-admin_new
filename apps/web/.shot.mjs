// 临时走查脚本：用受控接口渲染外壳并截取顶栏。用完删除。
import { chromium } from '@playwright/test'

const out = process.argv[2] || '/tmp/header'
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
            children: [
              { id: 'milestone', name: '里程碑计划编制与审批', url: 'https://example.com/project' },
              { id: 'weekly', name: '项目周报', url: 'https://example.com/project' },
              { id: 'risk', name: '风险登记册', url: 'https://example.com/project' }
            ]
          },
          { id: 'portfolio', name: '项目组合', url: 'https://example.com/project' }
        ]
      },
      { id: 'embed', name: '项目查询', url: 'https://example.com/project' }
    ]
  },
  {
    id: 'budget',
    name: '预算管理',
    url: '/budget',
    children: [{ id: 'budget-exec', name: '预算执行', url: 'https://example.com/project' }]
  },
  {
    id: 'system',
    name: '系统管理',
    url: '/system',
    children: [{ id: 'sys-user', name: '用户管理', url: 'https://example.com/project' }]
  }
]

const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: Number(process.argv[3] || 1440), height: 900 }, deviceScaleFactor: 2 })
const page = await context.newPage()
await page.route('https://example.com/project', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>项目页面</h1>' }))
await page.route('**/api/**', async (route) => {
  const pathname = new URL(route.request().url()).pathname
  if (!pathname.startsWith('/api/')) return route.continue()
  const path = pathname.replace(/^\/api/, '')
  const data = {
    '/login': { token: 'local-e2e-token' },
    '/sysMenu/hasPermission': true,
    '/sys/getUserInfo': { id: 'e2e', name: '王晓明', fullName: '王晓明', domainName: '总部计划运营部', namecode: 'wangxm' },
    '/sys/menu/nav': menus,
    '/sys/menu/getMenuByUrl': { url: '/baseHome' },
    '/param/getParamValueMulti': { SYS_TEL: '400-000-0000', SYS_MAIL: 'support@example.com' }
  }
  await route.fulfill({ json: { code: 0, success: true, msg: '', data: data[path] ?? {} } })
})

const theme = process.argv[4]
if (theme) {
  await page.addInitScript((value) => {
    try {
      const key = Object.keys(localStorage).find((k) => k.includes('preferences'))
      void key
    } catch {}
    window.__shotTheme = value
  }, theme)
}

await page.goto('http://127.0.0.1:8001/#/home')
await page.waitForSelector('.ds-header')
await page.waitForTimeout(800)
await page.screenshot({ path: `${out}-home.png`, clip: { x: 0, y: 0, width: page.viewportSize().width, height: 140 } })

await page.goto('http://127.0.0.1:8001/#/iframe/milestone')
await page.waitForTimeout(1200)
await page.screenshot({ path: `${out}-deep.png`, clip: { x: 0, y: 0, width: page.viewportSize().width, height: 140 } })
await page.screenshot({ path: `${out}-full.png` })

const more = page.locator('.ds-breadcrumb__more, .ds-breadcrumb__menu').first()
if (await more.count()) {
  await more.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}-open.png`, clip: { x: 0, y: 0, width: page.viewportSize().width, height: 420 } })
}

await browser.close()
console.log('ok')

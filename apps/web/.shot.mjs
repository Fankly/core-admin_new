// 临时走查脚本：用受控接口渲染外壳并截取顶栏。用完删除。
import { chromium } from '@playwright/test'

const out = process.argv[2] || '/tmp/hdr'
const width = Number(process.argv[3] || 1440)
const page_ = (id, name) => ({ id, name, url: 'https://example.com/project' })
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
            children: [page_('milestone', '里程碑计划编制与审批'), page_('weekly', '项目周报'), page_('risk', '风险登记册')]
          },
          { id: 'cost', name: '成本控制', url: '/platform/pm/cost', children: [page_('cost-plan', '成本计划'), page_('cost-alarm', '成本预警')] },
          page_('portfolio', '项目组合')
        ]
      },
      page_('embed', '项目查询'),
      { id: 'ext', name: '外部填报平台', url: 'https://example.com/project', openStyle: 1 }
    ]
  },
  { id: 'budget', name: '预算管理', url: '/budget', children: [page_('budget-exec', '预算执行')] }
]

const browser = await chromium.launch({ channel: 'chrome' })
const context = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 2 })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.route('https://example.com/project', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>项目页面</h1>' }))
await page.route('**/api/**', async (route) => {
  const pathname = new URL(route.request().url()).pathname
  if (!pathname.startsWith('/api/')) return route.continue()
  const path = pathname.replace(/^\/api/, '')
  const data = {
    '/login': { token: 'local-e2e-token' },
    '/sysMenu/hasPermission': true,
    '/sys/menu/nav': menus,
    '/sys/menu/getMenuByUrl': { url: '/baseHome' },
    '/param/getParamValueMulti': {}
  }
  await route.fulfill({ json: { code: 0, success: true, msg: '', data: data[path] ?? {} } })
})

const head = (name, h = 132) => page.screenshot({ path: `${out}-${name}.png`, clip: { x: 0, y: 0, width, height: h } })
const theme = (cls) =>
  page.evaluate((value) => {
    const el = document.querySelector('.ds-admin')
    el.classList.remove('ui-topHeader-primary', 'ui-topHeader-light', 'ui-topHeader-dark')
    el.classList.add(value)
  }, cls)

await page.goto('http://127.0.0.1:8001/#/home')
await page.waitForSelector('.ds-header')
await page.waitForTimeout(600)
await head('home')

await page.goto('http://127.0.0.1:8001/#/iframe/milestone')
await page.waitForTimeout(1000)
await head('deep')
console.log('crumb text:', JSON.stringify(await page.locator('.ds-breadcrumb__list').innerText()))

// 对比度：祖先分段文字 vs 顶栏底色
console.log(
  'colors:',
  await page.evaluate(() => {
    const seg = document.querySelector('.ds-breadcrumb__segment')
    const header = document.querySelector('.ds-header')
    return { seg: seg && getComputedStyle(seg).color, bg: getComputedStyle(header).backgroundColor }
  })
)

await page.getByRole('button', { name: '项目管理', exact: true }).click()
await page.waitForTimeout(350)
console.log('focused:', await page.evaluate(() => document.activeElement?.textContent?.trim()))
console.log('trigger aria:', await page.getByRole('button', { name: '项目管理', exact: true }).evaluate((b) => [b.getAttribute('aria-expanded'), b.getAttribute('aria-haspopup'), b.getAttribute('aria-controls')]))
await head('open', 420)
await page.keyboard.press('ArrowDown')
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(300)
console.log('after drill focused:', await page.evaluate(() => document.activeElement?.textContent?.trim()))
await head('drill', 420)
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
console.log('after esc focused:', await page.evaluate(() => document.activeElement?.textContent?.trim()))

await theme('ui-topHeader-light')
await page.waitForTimeout(200)
await head('light')
await theme('ui-topHeader-dark')
await page.waitForTimeout(200)
await head('dark')
await theme('ui-topHeader-primary')

for (const w of [1280, 1100, 960]) {
  await page.setViewportSize({ width: w, height: 800 })
  await page.waitForTimeout(400)
  console.log(`crumb @${w}:`, JSON.stringify(await page.locator('.ds-breadcrumb__list').innerText()))
  await page.screenshot({ path: `${out}-w${w}.png`, clip: { x: 0, y: 0, width: w, height: 132 } })
}
const more = page.getByRole('button', { name: '展开已折叠的路径' })
if (await more.count()) {
  await more.click()
  await page.waitForTimeout(350)
  await page.screenshot({ path: `${out}-more.png`, clip: { x: 0, y: 0, width: 960, height: 420 } })
  await page.keyboard.press('Escape')
}
console.log('docScroll ok:', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
console.log('errors:', errors)
await browser.close()

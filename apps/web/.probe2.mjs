import { chromium } from '@playwright/test'
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('request', (r) => { if (r.url().includes('/api/')) console.log('REQ', r.url()) })
await page.route('**/api/**', async (route) => {
  const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
  const data = { '/login': { token: 't' }, '/sysMenu/hasPermission': true, '/sys/getUserInfo': { id: 'e2e', name: '王晓明', domainName: '总部计划运营部' }, '/sys/menu/nav': [{ id: 'a', name: '业务平台', url: '/platform', children: [{ id: 'm', name: '页面', url: 'https://example.com/project' }] }] }
  await route.fulfill({ json: { code: 0, success: true, msg: '', data: data[path] ?? {} } })
})
await page.goto('http://127.0.0.1:8001/#/home')
await page.waitForTimeout(4000); console.log("URL", page.url()); console.log((await page.content()).slice(0, 600))
console.log(await page.locator('.ds-user').evaluate((el) => el.outerHTML))
await browser.close()

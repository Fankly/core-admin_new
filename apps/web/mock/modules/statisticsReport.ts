/**
 * 预算执行分析（分析报告）mock
 *
 * 覆盖会打开 FxbgModal 的「查看分析报告」接口，正文取自 fixtures/statistics/fxbgReport：
 *   POST yszxfx/getFxbg      —— 预算执行统计报表（yszxfx.vue）
 *   POST yszxfxtb/getFxbg    —— 同比分析报告（TbhbModal）
 *   POST yszxfxhb/getFxbg    —— 环比分析报告（TbhbModal）
 *   GET  yszxfxbg/getFxbg    —— 预算执行一览（yszxylb.vue 等）
 *   GET  yszxfxbg/getYapFxbg —— 预安排分析报告
 *
 * 场景切换：请求参数带 scene=short|long|extreme|empty 即可（POST 走 body，GET 走 query），
 * 方便不重新打包就切换文案验证长短文本下的排版。缺省返回 long。
 */
import Mock from 'mockjs'
import { getQueryValue, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'
import { getFxbgReportText } from '../fixtures/statistics/fxbgReport'

const pickScene = (options: MockOptions) => {
  const body = parseBody(options)
  return body.scene || getQueryValue(options.url, 'scene') || ''
}

const report = (options: MockOptions) => success(getFxbgReportText(pickScene(options)))

// 注意：yszxfx / yszxfxtb / yszxfxhb 三个前缀都含 getFxbg，需分别收窄，避免相互抢匹配
Mock.mock(/yszxfxtb\/getFxbg(\?.*)?$/, 'post', report)
Mock.mock(/yszxfxhb\/getFxbg(\?.*)?$/, 'post', report)
Mock.mock(/yszxfxbg\/getYapFxbg(\?.*)?$/, 'get', report)
Mock.mock(/yszxfxbg\/getFxbg(\?.*)?$/, 'get', report)
Mock.mock(/yszxfx\/getFxbg(\?.*)?$/, 'post', report)

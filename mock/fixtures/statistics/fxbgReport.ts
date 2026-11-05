/**
 * 分析报告（FxbgModal）mock 文案。
 *
 * FxbgModal 的正文来自后端返回的纯文本，历史上用 word-break: break-all + 弹窗无高度约束，
 * 文本一多就会把弹窗撑出屏幕、并且把正常的中文/英文单词从中间硬拆开。
 * 这里准备多组极端文案，方便直接打开弹窗验证排版：
 *   short    —— 两三行，验证短文本时弹窗高度贴合内容
 *   long     —— 常规分析报告（多段落、空行，默认场景）
 *   extreme  —— 超长 URL / 超长无空格串 / 超长连续数字 / 中英混排，验证换行与横向不溢出
 *   empty    —— 空报告，验证 el-empty 空态
 */

export type FxbgScene = 'short' | 'long' | 'extreme' | 'empty'

export interface FxbgSceneOption {
  label: string
  desc: string
  text: string
}

const SHORT_REPORT = `本期预算执行情况总体平稳。

截至 9 月末，累计完成投资 12,845.60 万元，预算完成率 78.32%，较上年同期提高 4.15 个百分点。`

const LONG_REPORT = `一、总体执行情况

截至2025年9月末，公司预算执行总体平稳有序。累计下达预算指标186,420.00万元，累计发生支出146,382.75万元，预算完成率78.52%，较上年同期提高3.86个百分点，较序时进度低0.48个百分点，基本符合年度执行节奏。

二、分单位执行情况

从各单位执行情况看，18家基层单位中有12家完成率高于序时进度，其中调度中心、检修分公司、信息通信分公司完成率分别为88.42%、86.15%、85.73%，执行进度较快，主要原因是重点项目集中开工、物资采购集中结算。有6家单位完成率低于序时进度，其中某供电分公司完成率为62.18%，低于序时进度12.82个百分点，主要受市政道路迁改、征地拆迁等外部因素影响，项目开工延迟。

三、分专业执行情况

电网基建专业累计支出68,452.30万元，完成率76.18%；生产技改专业累计支出32,168.45万元，完成率81.24%；营销投入专业累计支出15,632.80万元，完成率84.06%；数字化专业累计支出8,452.60万元，完成率72.35%；安全环保专业累计支出6,842.15万元，完成率79.68%；其他专业累计支出14,834.45万元，完成率77.92%。

四、存在的主要问题

一是部分项目前期工作不扎实。部分单位项目储备深度不足，可研编制质量不高，初步设计批复滞后，导致项目无法按期开工，资金沉淀在账面上。二是采购周期偏长。物资招标、合同签订、到货验收等环节衔接不够顺畅，部分设备类物资到货周期超过90天，影响项目结算进度。三是跨部门协同有待加强。项目管理部门与财务部门在计划下达、资金拨付、结算审核等环节的信息共享不够及时，存在计划与资金不同步的情况。

五、下一步工作建议

（一）强化项目前期管理。督促各单位加快可研编制和初步设计批复，建立项目储备动态调整机制，对不具备实施条件的项目及时调出储备库，避免资金闲置。

（二）优化采购流程。对常用物资推行框架协议采购，压缩招标周期；建立物资到货预警机制，对超期未到货物资实行清单化管理。

（三）加强执行过程监控。按月通报各单位预算执行进度，对完成率低于序时进度且排名靠后的单位开展专项督导，分析原因、制定措施、限期整改。

（四）完善协同机制。推动项目、财务、物资等系统数据贯通，实现计划下达、合同签订、资金支付、项目结算的全流程在线跟踪，提升管理效率。`

const EXTREME_REPORT = `一、极端文本排版验证

本章节用于验证弹窗在超长内容下的表现：正文区域应出现纵向滚动条，标题栏与关闭/缩放按钮始终可见，弹窗不超出可视区域，横向不出现溢出。

二、超长连续英文（无空格，需按字符断行）

SupercalifragilisticexpialidociousPneumonoultramicroscopicsilicovolcanoconiosisFloccinaucinihilipilificationAntidisestablishmentarianismHonorificabilitudinitatibus

三、超长 URL（需整段可断，不撑破容器）

https://example.com/budget-process/statistics/yszxfx/report?dwId=1234567890abcdefghijklmnopqrstuvwxyz&ysqj=2025-09&month=9&busiType=YSZXFX&endDate=2025-09-30&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U

四、超长数字串（金额、指标编码）

本期累计下达预算指标 123,456,789,012,345.6789 万元，累计支出 98,765,432,109,876.5432 万元；指标编码 123456789012345678901234567890123456789012345678901234567890。

五、中英文与符号混排

Attached please refer to the Q3 budget execution analysis report (编号：YSZX-2025-Q3-0912) for details; 详见附件《2025年三季度预算执行分析报告（修订版 V2.3.1）》，其中 Table 3-2 "按专业执行情况" 需重点核对。

六、连续空行与缩进

    第一段前有四个空格缩进，用于验证 white-space: pre-wrap 是否保留首行缩进。



    上面是三个连续空行，正常情况下应保留为段落间距，而不是被压缩成一行。
    缩进与换行都应原样呈现，不能被 CSS 合并掉。

七、结束语

以上内容均为 mock 数据，仅用于样式验证。若正文区域滚动流畅、无横向滚动条、标题栏固定，则说明样式优化生效。`

export const FXBG_SCENES: Record<FxbgScene, FxbgSceneOption> = {
  short: {
    label: '短文本',
    desc: '两三行，弹窗高度贴合内容',
    text: SHORT_REPORT
  },
  long: {
    label: '常规长报告',
    desc: '多段落 + 空行，默认场景',
    text: LONG_REPORT
  },
  extreme: {
    label: '极端长文本',
    desc: '超长 URL / 无空格串 / 连续数字',
    text: EXTREME_REPORT
  },
  empty: {
    label: '空报告',
    desc: '返回空字符串，展示空态',
    text: ''
  }
}

export const DEFAULT_FXBG_SCENE: FxbgScene = 'long'

export const isFxbgScene = (value: unknown): value is FxbgScene =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(FXBG_SCENES, value)

/** 按场景取报告文案；未知场景回落到 long，避免 mock 因参数拼错而返回空 */
export const getFxbgReportText = (scene?: unknown): string => {
  return FXBG_SCENES[isFxbgScene(scene) ? scene : DEFAULT_FXBG_SCENE].text
}

/** 供预览页展示场景切换按钮 */
export const getFxbgSceneList = () =>
  (Object.keys(FXBG_SCENES) as FxbgScene[]).map((key) => ({
    key,
    ...FXBG_SCENES[key]
  }))

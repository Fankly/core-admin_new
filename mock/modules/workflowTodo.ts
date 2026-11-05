// 工作流待办消息（queryWorkItemsByEmployee）—— 供首页待办卡片、待办事宜页（todoTasks）联调使用。
// 注意：该接口是 POST、且被多个页面共用，mockjs 只能按 URL 匹配、无法按 workFlowCode 收窄，
// dev 下联合会审入口页的催办徽标也会拿到这份 mock 待办（仅徽标数字受影响，不影响页面主流程）。
import Mock from 'mockjs'
import { parseBody, pageResult, success } from '../helpers'
import type { MockOptions } from '../helpers'

const WORKFLOW_NAMES = [
  '项目储备库入库审核',
  '预算调整审批',
  '联合会审审批',
  '资金计划审核',
  '合同会签审批',
  '采购计划审批',
  '项目验收申请',
  '用款计划审批'
]
const ACTIVITY_NAMES = ['部门审核', '处长审批', '分管领导审批', '财务复核', '归档确认']
const SENDERS = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊', '孙敏']
const PROJECT_PREFIX = ['2026年度农田水利', '智慧农业示范', '高标准农田建设', '灌区改造提升', '水闸除险加固', '节水灌溉示范']

const total = 45
const all = Array.from({ length: total }, (_, i) => {
  // 部分业务名称带红色超期标记，贴合真实数据中的 HTML 高亮片段
  const overdue = i % 9 === 4
  const bizName = `${PROJECT_PREFIX[i % PROJECT_PREFIX.length]}项目${String(i + 1).padStart(2, '0')}号${
    overdue ? '<span style="color:#f56c6c">（临近超期）</span>' : ''
  }`
  return {
    id: `mock-work-item-${i + 1}`,
    workflowName: WORKFLOW_NAMES[i % WORKFLOW_NAMES.length],
    bizName,
    activityDefName: ACTIVITY_NAMES[i % ACTIVITY_NAMES.length],
    senderName: SENDERS[i % SENDERS.length],
    startTime: `2026-10-${String((i % 27) + 1).padStart(2, '0')} ${String(8 + (i % 9)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`,
    urgency: String((i % 3) + 1),
    wfInstId: `mock-inst-${i + 1}`,
    workflowCode: 'MOCK_WF',
    systemName: '项目过程管控平台',
    // mock 无真实业务处理页，处理弹窗会提示"暂无可用的处理地址"，属预期
    url: ''
  }
})

Mock.mock(/workflow\/queryWorkItemsByEmployee(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(all, body.page || 1, body.limit || 20))
})

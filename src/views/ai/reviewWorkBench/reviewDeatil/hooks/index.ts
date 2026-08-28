import { reactive, ref, watch } from 'vue'
import { Sparkles, ClipboardList, MessageSquareText, Users, Calculator, FileText } from 'lucide-vue-next'

export const reviewDetailVo = () => {
  const xmInfoContern = reactive<any[]>([
    {
      label: '项目编码',
      props: 'xmbm',
      type: 'text'
    },
    {
      label: '预算事项名称',
      props: 'yssxmc',
      type: 'text'
    },
    {
      label: '计划实施年度',
      props: 'jhssnd',
      type: 'text'
    },
    {
      label: '申报金额(含税)',
      props: 'all_invest_tax',
      type: 'text'
    },
    {
      label: '申报金额(不含税)',
      props: 'amount',
      type: 'text'
    },
    {
      label: '项目实施内容',
      props: 'ssnr',
      type: 'textarea'
    },
    {
      label: '项目必要性',
      props: 'byx',
      type: 'textarea'
    }
  ])
  /** 固定工具；AI审核意见由页面按权限动态插入，样式与其它工具一致 */
  const tools = [
    {
      id: 'ai-review',
      name: 'AI智能评审',
      icon: Sparkles,
      color: 'tw-text-blue-400',
      bgColor: 'tw-bg-blue-500/10'
    },
    {
      id: 'ai-audit-opinion',
      name: 'AI审核意见',
      icon: ClipboardList,
      color: 'tw-text-blue-400',
      bgColor: 'tw-bg-blue-500/10'
    },
    {
      id: 'smart-query',
      name: '智能问数',
      icon: MessageSquareText,
      color: 'tw-text-green-400',
      bgColor: 'tw-bg-green-500/10'
    },
    {
      id: 'resource-lib',
      name: '定额标准库',
      icon: Users,
      color: 'tw-text-orange-400',
      bgColor: 'tw-bg-orange-500/10'
    },
    {
      id: 'quota-calc',
      name: '定额测算',
      icon: Calculator,
      color: 'tw-text-purple-400',
      bgColor: 'tw-bg-purple-500/10'
    },
    {
      id: 'doc-406',
      name: '406号文测算',
      icon: FileText,
      color: 'tw-text-pink-400',
      bgColor: 'tw-bg-pink-500/10'
    }
  ]
  return { xmInfoContern, tools }
}

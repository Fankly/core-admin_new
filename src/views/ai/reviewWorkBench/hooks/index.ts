import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
export const meetingParam = () => {
  const store = useStore()
  const route = useRoute()
  const router = useRouter()
  const page = reactive({
    page: 1,
    limit: 100,
    total: 0 as number | string
  })
  const statItems = reactive<any[]>([
    {
      label: '参与会议数',
      code: 'cyhy',
      value: 1,
      suffix: '场',
      color: 'tw-text-blue-600',
      bgColor: 'tw-bg-blue-50'
    },
    {
      label: '已结束会议',
      code: 'yjshy',
      value: 2,
      suffix: '场',
      color: 'tw-text-emerald-600',
      bgColor: 'tw-bg-emerald-50'
    },
    {
      label: '评审中会议',
      code: 'pszhy',
      value: 3,
      suffix: '场',
      color: 'tw-text-indigo-600',
      bgColor: 'tw-bg-indigo-50'
    },
    {
      label: '即将开始会议',
      code: 'jjkshy',
      value: 4,
      suffix: '个',
      color: 'tw-text-amber-500',
      bgColor: 'tw-bg-amber-50'
    }
    // ,
    // {
    //   label: '平均评审时长',
    //   value: 5,
    //   suffix: '小时',
    //   color: 'tw-text-cyan-600',
    //   bgColor: 'tw-bg-cyan-50'
    // },
    // {
    //   label: '报告出具时长',
    //   value: 6,
    //   suffix: '小时',
    //   color: 'tw-text-purple-600',
    //   bgColor: 'tw-bg-purple-50'
    // }
  ])
  const menuList = ref<any[]>([
    {
      name: '创建会议',
      code: 'LHHS_CJHY',
      canClick: false,
      iconColor: '#3E8EF7',
      backgroundColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      tab: [],
      status: [
        {
          code: 0,
          name: '全部',
          num: 0
        },
        {
          code: 1,
          name: '待开始',
          num: 0
        },
        {
          code: 2,
          name: '评审中',
          num: 0
        },
        {
          code: 3,
          name: '已结束',
          num: 0
        }
      ],
      btn: [
        {
          code: 0,
          name: '全部',
          num: 0
        },
        {
          code: 2,
          name: '市级联合会审会议',
          num: 0
        },
        {
          code: 1,
          name: '省级联合会审会议',
          num: 0
        }
      ],
      listTitle: '我创建的会议',
      dataTitle: '项目统计',
      percentTitle: '项目通过率',
      percent: 0,
      total: 0,
      content1: '已评审',
      content2: '项目',
      placeholder: '请输入会议名称、会议编码'
    },
    {
      name: '评审会议',
      code: 'LHHS_PSHY',
      canClick: true,
      iconColor: '#059669',
      backgroundColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      tab: [],
      status: [
        {
          code: '',
          name: '全部',
          num: 0
        },
        {
          code: '00',
          name: '即将开始',
          num: 0
        },
        {
          code: '01',
          name: '评审中',
          num: 0
        },
        {
          code: '02',
          name: '已结束',
          num: 0
        }
      ],
      btn: [
        {
          code: '',
          name: '全部',
          num: 0
        },
        {
          code: '2',
          name: '市级联合会审会议',
          num: 0
        },
        {
          code: '1',
          name: '省级联合会审会议',
          num: 0
        }
      ],
      listTitle: '我评审的会议',
      dataTitle: '评审统计',
      percentTitle: '会议完成率',
      percent: 70,
      total: 0,
      content1: '参与',
      content2: '场会议',
      placeholder: '请输入会议名称、会议编码'
    },
    {
      name: '报告管理',
      code: 'LHHS_BGGL',
      canClick: false,
      iconColor: '#D97706',
      backgroundColor: '#FFFBEB',
      borderColor: '#FDE68A',
      tab: [],
      status: [
        {
          code: 0,
          name: '全部',
          num: 0
        },
        {
          code: 1,
          name: '待开始',
          num: 0
        },
        {
          code: 2,
          name: '评审中',
          num: 0
        },
        {
          code: 3,
          name: '已结束',
          num: 0
        }
      ],
      btn: [
        {
          code: 0,
          name: '全部',
          num: 0
        },
        {
          code: 1,
          name: '市级联合会审会议',
          num: 0
        },
        {
          code: 2,
          name: '省级联合会审会议',
          num: 0
        }
      ],
      listTitle: '全部会议',
      dataTitle: '综合统计',
      percentTitle: '整体通过率',
      percent: 0,
      total: 0,
      content1: '共',
      content2: '场会议',
      placeholder: '请输入会议名称、会议编码'
    }
  ])
  return { statItems, menuList, page, store, route, router }
}

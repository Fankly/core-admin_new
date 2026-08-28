import { ref } from 'vue'
export const STAGES_DATA = ref<any[]>([])
export const LIANYUNGANG_DISTRICTS = ref<any[]>([
  {
    id: 'bengbu',
    name: '本部',
    code: '320703',
    txCount: 2310,
    yjCount: 54000,
    jgCount: 22900,
    center: [119.18, 34.58]
  },
  {
    id: 'ganyu',
    name: '赣榆区',
    code: '320707',
    txCount: 950,
    yjCount: 18000,
    jgCount: 7020,
    center: [119.11, 34.83]
  },
  {
    id: 'guanyun',
    name: '灌云县',
    code: '320723',
    txCount: 610,
    yjCount: 11000,
    jgCount: 4180,
    center: [119.23, 34.28]
  },
  {
    id: 'guannan',
    name: '灌南县',
    code: '320724',
    txCount: 520,
    yjCount: 9000,
    jgCount: 3330,
    center: [119.35, 34.09]
  },
  {
    id: 'donghai',
    name: '东海县',
    code: '320722',
    txCount: 486,
    yjCount: 8000,
    jgCount: 2570,
    center: [118.75, 34.52]
  }
])
export const deptsData = ref<any[]>([])
export const XMDL_TYPES = ref<any[]>([])
export const PROJECT_TYPES = ref<any[]>([])
export const MUNICIPAL_DEPTS = ref<any[]>([])
export const IMPLEMENTATION_DEPTS = ref<any[]>([])
export const projectList = ref<any[]>([])

export const STAGE_RULES = ref<any[]>([
  {
    type: 1,
    title: '项目立项',
    text1: '项目出库后超过',
    text2: '天未完成立项',
    yjsjzqTx: '',
    yjsjzqYj: '',
    yjsjzq: ''
  },
  {
    type: 1,
    title: '计划提报',
    text1: '项目立项后超过',
    text2: '天未进行计划提报',
    yjsjzqTx: '',
    yjsjzqYj: '',
    yjsjzq: ''
  },
  {
    type: 1,
    title: '合同签订',
    text1: '项目中标后超过',
    text2: '天未完成合同签订',
    yjsjzqTx: '',
    yjsjzqYj: '',
    yjsjzq: ''
  },
  {
    type: 1,
    title: '结算送审',
    text1: '应送审项目，在项目竣工后超过',
    text2: '天未进行结算送审',
    yjsjzqTx: '',
    yjsjzqYj: '',
    yjsjzq: ''
  },
  {
    type: 1,
    title: '结算审定',
    text1: '应送审项目，在项目竣工后超过',
    text2: '天未进行结算审定',
    yjsjzqTx: '',
    yjsjzqYj: '',
    yjsjzq: ''
  },
  {
    type: 2,
    title: '项目结算',
    tx: {
      label: '季度未结算',
      condition: '结算类型为季度结算项目在第一季度结算进度不足20%，第二季度结算进度不足40%，第三季度结算进度不足60%，第四季度结算进度不足85%'
    },
    yj: { label: '结算进度为零', condition: '已开工项目未产生任何物资领用、服务入账' },
    jg: { label: '纯物资领用项目', condition: '已结算项目物资领用金额占项目累计结算金额的比列大于99%。' }
  },
  {
    type: 3,
    title: '项目关闭',
    tx: [],
    yj: [],
    jg: []
  }
])

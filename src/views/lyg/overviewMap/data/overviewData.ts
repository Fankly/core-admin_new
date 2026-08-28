import { ref, reactive } from 'vue'
import { CityCompletion, DistrictInfo, ProjectItem, StageInfo } from './types'

export const INITIAL_METRICS = reactive<any>({
  dspm: 0,
  mbz: 0,
  wcz: 0,
  wcl: 0,
  sgspjwcl: 0,
  sndtqwcl: 0,
  sndtqsgspjwcl: 0,
  gsjlcmbz: 0
})

export const STAGES_DATA = ref<any[]>([
  {
    key: '出库',
    title: '已出库',
    shortTitle: '已出库',
    color: '#38BDF8',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已出库项目数',
    nowStatus: '1',
    allStatus: '1,2,3,4,5,6,9,7,8'
  },
  {
    key: '立项',
    title: '已立项',
    shortTitle: '已立项',
    color: '#60A5FA',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已立项项目数',
    nowStatus: '2',
    allStatus: '2,3,4,5,6,9,7,8'
  },
  {
    key: '报招',
    title: '已报招',
    shortTitle: '已报招',
    color: '#A78BFA',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已报招项目数',
    nowStatus: '3',
    allStatus: '3,4,5,6,9,7,8'
  },
  {
    key: '中标',
    title: '已中标',
    shortTitle: '已中标',
    color: '#C084FC',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已中标项目数',
    nowStatus: '4',
    allStatus: '4,5,6,9,7,8'
  },
  {
    key: '签订合同',
    title: '已签订合同',
    shortTitle: '已签订合同',
    color: '#FB7185',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已签订合同项目数',
    nowStatus: '5',
    allStatus: '5,6,9,7,8'
  },
  {
    key: '实施中',
    title: '实施中',
    shortTitle: '实施中',
    color: '#2DD4BF',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已开始实施项目数',
    nowStatus: '6',
    allStatus: '6,9,7,8'
  },
  {
    key: '送审',
    title: '已送审',
    shortTitle: '已送审',
    color: '#FBBF24',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已送审项目数',
    nowStatus: '9',
    allStatus: '9,7,8'
  },
  {
    key: '结算',
    title: '已结算',
    shortTitle: '已结算',
    color: '#34D399',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已结算项目数',
    nowStatus: '7',
    allStatus: '7,8'
  },
  {
    key: '关闭',
    title: '已关闭',
    shortTitle: '已关闭',
    color: '#64748B',
    currentCount: 0,
    cumulativeCount: 0,
    cumulativeLabel: '已关闭项目数',
    nowStatus: '8',
    allStatus: '8'
  }
])

export const TOP_CITIES_COMPLETION = ref<any[]>([])

export const MUNICIPAL_DEPTS_COMPLETION = ref<any[]>([])

export const LIANYUNGANG_DISTRICTS = ref<any[]>([
  {
    id: 'bengbu',
    name: '本部',
    code: '320706',
    mbz: 0,
    wcl: 0,
    center: [119.18, 34.58]
  },
  {
    id: 'ganyu',
    name: '赣榆区',
    code: '320707',
    mbz: 0,
    wcl: 0,
    center: [119.11, 34.84]
  },
  {
    id: 'guanyun',
    name: '灌云县',
    code: '320723',
    mbz: 0,
    wcl: 0,
    center: [119.25, 34.3]
  },
  {
    id: 'guannan',
    name: '灌南县',
    code: '320724',
    mbz: 0,
    wcl: 0,
    center: [119.35, 34.09]
  },
  {
    id: 'donghai',
    name: '东海县',
    code: '320722',
    mbz: 0,
    wcl: 0,
    center: [118.76, 34.52]
  }
])
export const XMDL_TYPES = ref<any[]>([])
export const PROJECT_TYPES = ref<any[]>([])
export const MUNICIPAL_DEPTS = ref<any[]>([])
export const IMPLEMENTATION_DEPTS = ref<any[]>([])

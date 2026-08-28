import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { getPublicData } from '@/api/common'

export function univerParam() {
  const route = useRoute()
  const router = useRouter()
  const store = useStore()
  const userInfo = ref({})
  const importRef = ref()
  const isEidt = ref(false)
  const isView = ref(false)
  const xmInfo = ref({})
  const isInput = ref()
  const ZW_CHARS = ['\u200B', '\u200C', '\u200D', '\u2060']
  const isNum = ref<string>('2')
  const pageTitle = ref('')

  // 公式提示浮层是否可见
  const headerFormulaTipVisible = ref(false)
  // 公式提示标题
  const headerFormulaTipTitle = ref('')
  // 公式提示内容
  const headerFormulaTipBody = ref('')
  // 当前公式提示的唯一标识（用于避免重复显示）
  const currentHeaderFormulaTipKey = ref('')
  // ==================== 表格列标题定义 ====================
  // 定义表格的10个列标题，从左到右依次为：
  // 类型、名称、数量、工日、工作量、单价、人工/台班单价、价格来源、数量来源、备注
  const headerLabels = ['类型', '名称', '数量', '工日', '工作量', '单价(元)', '人工/台班单价', '价格来源', '数量来源', '备注']

  // ==================== 工作簿和Sheet标识常量 ====================
  // 查找Sheet的ID，用于存储下拉选择的数据源
  const lookupSheetId = 'lookup-template-sheet'
  // 主Sheet的显示名称
  const lookupSheetName = '_价格下拉源'
  // 查找Sheet的ID，用于存储下拉选择的数据源
  const sourceSheetId = 'source-template-sheet'
  // 主Sheet的显示名称
  const sourceSheetName = '_数量来源下拉源'
  // ==================== 样式常量定义 ====================
  // 边框样式：细边框
  const THIN_BORDER = 1
  // 水平对齐：左对齐
  const ALIGN_LEFT = 1
  // 水平对齐：居中对齐
  const ALIGN_CENTER = 2
  // 垂直对齐：居中对齐
  const ALIGN_MIDDLE = 2
  // 自动换行模式
  const WRAP = 3
  // 明细行的最小行数，确保表格有足够的空白行
  const MIN_DETAIL_ROWS = 5
  // 可编辑列的索引：数量、工日、工作量、数量来源、备注
  const EDITABLE_COLUMN_INDEXES = [2, 3, 4, 8, 9]

  // ==================== 列索引常量定义 ====================
  // 名称列的索引（第2列，索引从0开始）
  const NAME_COLUMN_INDEX = 1
  // 单价列的索引（第6列）
  const UNIT_PRICE_COLUMN_INDEX = 5
  // 价格来源列的索引（第8列）
  const PRICE_SOURCE_COLUMN_INDEX = 7
  const DATA_SOURCE__COLUMN_INDEX = 8

  // ==================== DOM元素引用 ====================
  // 使用ref获取DOM元素的引用
  const appRef = ref(null) // 电子表格容器
  const headerFormulaTipRef = ref(null) // 公式提示浮层

  // ==================== 边框样式函数 ====================
  /**
   * 创建单元格边框样式对象
   * @param {string} color - 边框颜色（十六进制）
   * @returns {Object} 边框样式对象，包含上、下、左、右四个边
   */
  const createBorder = (color: any) => {
    return {
      t: { s: THIN_BORDER, cl: { rgb: color } }, // 上边框
      b: { s: THIN_BORDER, cl: { rgb: color } }, // 下边框
      l: { s: THIN_BORDER, cl: { rgb: color } }, // 左边框
      r: { s: THIN_BORDER, cl: { rgb: color } } // 右边框
    }
  }

  // 基础边框样式（灰色）
  const baseBorder = createBorder('#5f5f5f')

  // ==================== 单元格样式定义 ====================
  // 定义表格中使用的所有样式
  const styles = {
    // 表头样式：深灰色背景，白色文字，居中对齐
    header: {
      ff: 'Microsoft YaHei', // 字体
      fs: 12, // 字号
      bl: 1, // 加粗
      cl: { rgb: '#ffffff' }, // 文字颜色：白色
      bg: { rgb: '#767171' }, // 背景颜色：深灰色
      bd: baseBorder, // 边框
      ht: ALIGN_CENTER, // 水平居中
      vt: ALIGN_MIDDLE, // 垂直居中
      tb: WRAP // 自动换行
    },
    // 橙色居中样式：用于人工分区
    orangeCenter: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#ffc000' }, // 橙色背景
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP
    },
    // 橙色左对齐样式：用于人工分区的长文本列
    orangeLeft: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#ffc000' },
      bd: baseBorder,
      ht: ALIGN_LEFT, // 左对齐
      vt: ALIGN_MIDDLE,
      tb: WRAP
    },
    // 橙色数字样式：用于人工分区的数值列
    orangeNumber: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#ffc000' },
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP,
      n: { pattern: '0.00' } // 数字格式：保留两位小数
    },
    orangeNumber3: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#ffc000' },
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP,
      n: { pattern: '0.000' } // 数字格式：保留三位小数
    },
    // 橙色比率样式：用于人工分区的比率列
    orangeRate: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#ffc000' },
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP,
      n: { pattern: '0.0#####' } // 数字格式：最多六位小数
    },
    // 绿色居中样式：用于机械分区
    greenCenter: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#92d050' }, // 绿色背景
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP
    },
    // 绿色左对齐样式：用于机械分区的长文本列
    greenLeft: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#92d050' },
      bd: baseBorder,
      ht: ALIGN_LEFT,
      vt: ALIGN_MIDDLE,
      tb: WRAP
    },
    // 绿色数字样式：用于机械分区的数值列
    greenNumber: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#92d050' },
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP,
      n: { pattern: '0.00' }
    },
    greenNumber3: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#92d050' },
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP,
      n: { pattern: '0.000' }
    },
    // 绿色比率样式：用于机械分区的比率列
    greenRate: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#92d050' },
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP,
      n: { pattern: '0.0#####' }
    },
    // 橙色计算列样式：用于人工分区的计算结果列
    calcOrange: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#ffc000' },
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP,
      n: { pattern: '0.00' }
    },
    // 绿色计算列样式：用于机械分区的计算结果列
    calcGreen: {
      ff: 'Microsoft YaHei',
      fs: 11,
      bg: { rgb: '#92d050' },
      bd: baseBorder,
      ht: ALIGN_CENTER,
      vt: ALIGN_MIDDLE,
      tb: WRAP,
      n: { pattern: '0.00' }
    }
  }

  const getPbulicCode = async (detp: any) => {
    const res: any = await getPublicData('ZXCSBM_COM')
    const sort: any = res.data.filter((item: any) => item.code == detp)
    return sort[0].note || ''
  }

  return {
    route,
    router,
    userInfo,
    importRef,
    isEidt,
    isView,
    xmInfo,
    headerLabels,
    lookupSheetId,
    lookupSheetName,
    THIN_BORDER,
    ALIGN_LEFT,
    ALIGN_CENTER,
    ALIGN_MIDDLE,
    WRAP,
    MIN_DETAIL_ROWS,
    NAME_COLUMN_INDEX,
    UNIT_PRICE_COLUMN_INDEX,
    PRICE_SOURCE_COLUMN_INDEX,
    styles,
    isInput,
    store,
    sourceSheetId,
    sourceSheetName,
    DATA_SOURCE__COLUMN_INDEX,
    headerFormulaTipVisible,
    headerFormulaTipTitle,
    headerFormulaTipBody,
    currentHeaderFormulaTipKey,
    EDITABLE_COLUMN_INDEXES,
    appRef,
    headerFormulaTipRef,
    ZW_CHARS,
    getPbulicCode,
    isNum,
    pageTitle
  }
}

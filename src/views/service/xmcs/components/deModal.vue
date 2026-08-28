<!--定额测算电子表格组件-->

<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      fullscreen
      v-model="isShowModal"
      destroy-on-close
      title="定额测算"
      :width="1200"
      @close="reset"
      :loading="isLoadingData"
    >
      <div class="page">
        <div class="toolbar">
          <el-button size="mini" v-debounce="[handleExport, `click`, 300]" type="primary">导 出</el-button>
          <div class="highlight" style="margin-left: auto">{{ `项目名称：${userInfo?.xmmc}` }}</div>
        </div>
        <div id="univer_modal" ref="appRefModal"></div>
        <!-- 表头公式提示浮层-->
        <div v-show="headerFormulaTipVisible" ref="headerFormulaTipRef" class="header-formula-tip" :class="{ 'is-visible': headerFormulaTipVisible }">
          <div class="header-formula-tip-title">
            {{ headerFormulaTipTitle }}
          </div>
          <div class="header-formula-tip-body">
            {{ headerFormulaTipBody }}
          </div>
        </div>
      </div>
    </vxe-modal>
  </div>
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
// createUniver: 创建Univer实例的核心函数；LocaleType: 语言类型枚举；mergeLocales: 合并多语言配置
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
// UniverSheetsCorePreset: 电子表格核心预设，包含基础功能
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
// 中文语言包
import UniverPresetSheetsCoreZhCN from '@univerjs/presets/preset-sheets-core/locales/zh-CN'
// 数据验证预设，用于下拉选择等功能
import { UniverSheetsDataValidationPreset } from '@univerjs/preset-sheets-data-validation'
// 数据验证中文语言包
import UniverPresetSheetsDataValidationZhCN from '@univerjs/preset-sheets-data-validation/locales/zh-CN'
// Univer自定义样式文件
import '@/views/service/xmcs/css/univer.css'
import { ElMessage } from 'element-plus'
import { univerParam } from '@/views/service/xmcs/hooks/xscs'
import { univerFun } from '@/views/service/xmcs/hooks/publicFun'
import { exportExcel } from '@/views/service/xmcs/hooks/export'
import { initApi } from '@/views/service/xmcs/hooks/initApi'

const {
  userInfo,
  headerLabels,
  lookupSheetId: baseLookupSheetId,
  ALIGN_LEFT,
  ALIGN_CENTER,
  ALIGN_MIDDLE,
  WRAP,
  MIN_DETAIL_ROWS,
  NAME_COLUMN_INDEX,
  UNIT_PRICE_COLUMN_INDEX,
  PRICE_SOURCE_COLUMN_INDEX,
  styles,
  sourceSheetId: baseSourceSheetId,
  headerFormulaTipVisible,
  headerFormulaTipTitle,
  headerFormulaTipBody,
  currentHeaderFormulaTipKey,
  EDITABLE_COLUMN_INDEXES,
  headerFormulaTipRef
} = univerParam()
const appRefModal = ref()
// // ==================== 工作簿和Sheet标识常量 ====================
const createRuntimeUnitId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
// 工作簿名称
const primarySheetName = '定额测算'
// 工作簿ID
const workbookId = createRuntimeUnitId('406-template-workbook')
const isShowModal = ref(false)
const {
  normalizeNumber,
  detailFormula,
  subtotalFormula,
  createTextCell,
  createNumberCell,
  createValueCell,
  getPaletteStyles,
  createFormulaCell,
  buildCellReference,
  createSectionLayout,
  getCellRawValue,
  getCellTextValue,
  setCell
} = univerFun(MIN_DETAIL_ROWS)

// ==================== 列索引常量定义 ====================
// 分区顺序：先人工后机械
const SECTION_ORDER = ['quotaLabor', 'quotaMachine', 'nonQuotaLabor', 'nonQuotaMachine']

// ==================== 分区配置对象 ====================
// 定义人工和机械两个分区的详细配置
// 包括类型名称、颜色方案、Excel识别关键字、列标题匹配等
const sectionConfigs = {
  // 定额人工分区配置
  quotaLabor: {
    type: '定额人工', // 类型名称
    palette: 'orange' // 颜色方案：橙色
  },
  // 定额机械分区配置
  quotaMachine: {
    type: '定额机械', // 类型名称
    palette: 'green' // 颜色方案：绿色
  },
  // 非定额人工分区配置
  nonQuotaLabor: {
    type: '非定额人工', // 类型名称
    palette: 'orange' // 颜色方案：橙色
  },
  // 非定额机械分区配置
  nonQuotaMachine: {
    type: '非定额机械', // 类型名称
    palette: 'green' // 颜色方案：绿色
  }
}

// ==================== 表头公式提示文本 ====================
// 每个列对应的公式说明，鼠标悬停时显示
const primaryHeaderFormulaTips = [
  '固定分类列，无自动计算公式。', // 类型列
  '名称列支持下拉选择名称，切换后会联动刷新单价和价格来源。', // 名称列
  '手工填写列，无自动计算公式。', // 数量列
  '手工填写列，无自动计算公式。', // 工日列
  '手工填写列，无自动计算公式。', // 工作量列
  '根据当前名称自动匹配导入单价，保存后手动修改。', // 单价列
  ['明细行按"数量 × 工日 × 单价 / 工作量"自动计算。', '=IFERROR(C行号*D行号*F行号/E行号,"")'].join('\n'),
  '根据当前名称自动匹配价格来源，保存后手动修改。', // 价格来源列
  '手工填写数量来源说明，无自动计算公式。', // 数量来源列
  '手工填写备注说明，无自动计算公式。' // 备注列
]

// ==================== 响应式状态变量 ====================
// 当前加载的明细数据（人工和机械），包含完整的字段信息
const currentImportedData = ref([])
// 当前价格库数据（用于下拉选择）
const currentCatalogData = reactive({ quotaLabor: [], quotaMachine: [], nonQuotaLabor: [], nonQuotaMachine: [] })
// 当前数量来源数据（用于下拉选择）
const currentSourceData = ref([])
// 是否正在加载数据
const isLoadingData = ref(false)

// ==================== 非响应式全局变量 ====================
// Univer API实例，用于操作电子表格
let univerAPI = null
// Univer上下文，用于管理Univer实例
let univerContext = null

// ==================== 数据处理工具函数 ====================
function createEmptyImportedZBData() {
  return [
    {
      sheetid: createRuntimeUnitId('quota-template-sheet'),
      sheetname: primarySheetName,
      datalist: {
        quotaLabor: [],
        quotaMachine: [],
        nonQuotaLabor: [],
        nonQuotaMachine: []
      }
    }
  ]
}

/**
 * 深度克隆主表明细数据
 * @param {Object} importedData - 要克隆的数据
 * @returns {Object} 克隆后的新数据对象
 */
function cloneImportedZBData(importedData) {
  const nextImportedData = importedData || createEmptyImportedZBData()
  const cloneData = Array.isArray(nextImportedData) ? nextImportedData.map((record) => ({ ...record })) : []
  return {
    cloneData
  }
}

/**
 * 设置当前明细数据
 * @param {Object} importedData - 要设置的明细数据
 */
function setImportedData(importedData) {
  const cloned = cloneImportedZBData(importedData)
  currentImportedData.value = cloned.cloneData
}

// ==================== 数据应用函数 ====================

/**
 * 应用明细数据
 * @param {Object} detailData - 明细数据
 */
async function applyDetailData(detailData) {
  // 保存当前状态用于回滚
  try {
    setImportedData(detailData)
    await renderWorkbook(detailData)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '类型获取失败，请稍后重试。')
  }
}

// ==================== 监听相关函数 ====================

/**
 * 显示表头公式提示
 * @param {Object} payload - 提示内容对象
 */
function showHeaderFormulaTip(payload) {
  if (!payload) return

  const tipKey = `${payload.sheetName}-${payload.headerLabel}-${payload.description}`
  // 避免重复显示相同的提示
  if (tipKey === currentHeaderFormulaTipKey.value && headerFormulaTipVisible.value) return

  currentHeaderFormulaTipKey.value = tipKey
  headerFormulaTipTitle.value = `${payload.sheetName} · ${payload.headerLabel}`
  headerFormulaTipBody.value = payload.description
  headerFormulaTipVisible.value = true
}

/**
 * 隐藏表头公式提示
 */
function hideHeaderFormulaTip() {
  currentHeaderFormulaTipKey.value = ''
  headerFormulaTipVisible.value = false
}

/**
 * 获取表头公式提示内容
 * @param {Object} worksheet - 工作表对象
 * @param {number} row - 行号
 * @param {number} column - 列号
 * @returns {Object|null} 提示内容对象，不在表头区域返回null
 */
function getHeaderFormulaTipPayload(worksheet, row, column) {
  if (!worksheet || typeof row !== 'number' || typeof column !== 'number') return null
  if (column < 0 || column >= headerLabels.length) return null

  const sheetHeaderRows = new Set([0])
  if (!sheetHeaderRows || !sheetHeaderRows.has(row)) return null

  const description = primaryHeaderFormulaTips[column]
  if (!description) return null

  return {
    sheetName: getWorksheetName(worksheet),
    headerLabel: headerLabels[column],
    description
  }
}

/**
 * 绑定表头公式悬停事件
 * 监听鼠标移动，在表头区域显示公式提示
 */
function bindHeaderFormulaHoverEvents() {
  if (!univerAPI || typeof univerAPI.addEvent !== 'function' || !univerAPI.Event) return

  const handleCellPointerMove = (params) => {
    const payload = getHeaderFormulaTipPayload(params && params.worksheet, params && params.row, params && params.column)
    if (!payload) {
      hideHeaderFormulaTip()
      return
    }
    showHeaderFormulaTip(payload)
  }

  // 绑定单元格移动事件
  if (univerAPI.Event.CellPointerMove) {
    univerAPI.addEvent(univerAPI.Event.CellPointerMove, handleCellPointerMove)
  } else if (univerAPI.Event.CellHover) {
    univerAPI.addEvent(univerAPI.Event.CellHover, handleCellPointerMove)
  }

  // 鼠标离开表格区域时隐藏提示
  if (appRefModal.value) {
    appRefModal.value.addEventListener('mouseleave', hideHeaderFormulaTip)
  }
}

// ==================== 布局计算函数 ====================

/**
 * 创建主表布局
 * 计算人工、机械分区和汇总行的布局
 * @param {Object} importedData - 导入数据
 * @returns {Object} 布局信息对象
 */
function createPrimarySheetLayout(importedData) {
  // 定额人工分区布局
  const sections = {
    quotaLabor: createSectionLayout(1, importedData.quotaLabor, MIN_DETAIL_ROWS),
    quotaMachine: null,
    nonQuotaLabor: null,
    nonQuotaMachine: null
  }
  // 定额机械分区布局（紧接定额人工分区）
  sections.quotaMachine = createSectionLayout(sections.quotaLabor.sectionEndRowIndex + 1, importedData.quotaMachine, MIN_DETAIL_ROWS)

  // 获取定额机械最后一行的index
  const quotaStartRowIndex = sections.quotaMachine.sectionEndRowIndex + 1
  //插入行
  const quotaSummaryRows = {
    base: {
      rowIndex: quotaStartRowIndex,
      label: '单价(元)',
      subLabel: '定额基价',
      palette: 'orange'
    },
    laborSubtotal: {
      rowIndex: quotaStartRowIndex + 1,
      label: '',
      subLabel: '其中：人工',
      palette: 'orange'
    },
    machineSubtotal: {
      rowIndex: quotaStartRowIndex + 2,
      label: '',
      subLabel: '其中：机械',
      palette: 'orange'
    },
    tooling: {
      rowIndex: quotaStartRowIndex + 3,
      label: '措施费',
      subLabel: '施工工具用具使用费',
      palette: 'green'
    },
    safety: {
      rowIndex: quotaStartRowIndex + 4,
      label: '',
      subLabel: '安全文明施工费',
      palette: 'green'
    },
    socialInsurance: {
      rowIndex: quotaStartRowIndex + 5,
      label: '间接费',
      subLabel: '社会保险费',
      palette: 'orange'
    },
    housingFund: {
      rowIndex: quotaStartRowIndex + 6,
      label: '',
      subLabel: '住房公积金',
      palette: 'orange'
    },
    enterpriseManage: {
      rowIndex: quotaStartRowIndex + 7,
      label: '',
      subLabel: '企业管理费',
      palette: 'orange'
    },
    profit: {
      rowIndex: quotaStartRowIndex + 8,
      label: '利润',
      subLabel: '',
      palette: 'green'
    },
    laborDiff: {
      rowIndex: quotaStartRowIndex + 9,
      label: '编制基准期价差',
      subLabel: '人工价差',
      palette: 'orange'
    },
    machineDiff: {
      rowIndex: quotaStartRowIndex + 10,
      label: '',
      subLabel: '机械价差',
      palette: 'orange'
    },
    total: {
      rowIndex: quotaStartRowIndex + 11,
      label: '合计',
      subLabel: '',
      palette: 'orange'
    }
  }
  // 获取定额数据最后一行的index
  const nonQuotaHeaderRowIndex = quotaSummaryRows.total.rowIndex + 1
  sections.nonQuotaLabor = createSectionLayout(nonQuotaHeaderRowIndex + 1, importedData.nonQuotaLabor, MIN_DETAIL_ROWS)
  sections.nonQuotaMachine = createSectionLayout(sections.nonQuotaLabor.sectionEndRowIndex + 1, importedData.nonQuotaMachine, MIN_DETAIL_ROWS)

  const nonQuotaSummaryStartRowIndex = sections.nonQuotaMachine.sectionEndRowIndex + 1
  const nonQuotaSummaryRows = {
    laborSubtotal: {
      rowIndex: nonQuotaSummaryStartRowIndex,
      label: '合计',
      subLabel: '其中：人工',
      palette: 'orange'
    },
    machineSubtotal: {
      rowIndex: nonQuotaSummaryStartRowIndex + 1,
      label: '',
      subLabel: '其中：机械',
      palette: 'orange'
    },
    total: {
      rowIndex: nonQuotaSummaryStartRowIndex + 2,
      label: '',
      subLabel: '合计',
      palette: 'orange'
    }
  }

  return {
    importedData,
    sections,
    quotaSummaryRows,
    nonQuotaHeaderRowIndex,
    nonQuotaSummaryRows,
    grandTotalRowIndex: nonQuotaSummaryRows.total.rowIndex + 1
  }
}

/**
 * 创建默认列宽配置
 * @returns {Object} 列宽配置对象
 */
function createDefaultColumnData() {
  return {
    0: { w: 72 }, // 类型
    1: { w: 184 }, // 名称
    2: { w: 150 }, // 数量
    3: { w: 72 }, // 工日
    4: { w: 72 }, // 工作量
    5: { w: 214 }, // 单价
    6: { w: 150 }, // 人工/台班单价
    7: { w: 150 }, // 价格来源
    8: { w: 150 }, // 数量来源
    9: { w: 384 } // 备注
  }
}
/**
 * 创建Sheet模型
 * @param {Object} options - Sheet配置选项
 * @returns {Object} Sheet模型对象
 */
function createSheetModel({ id, name, rowCount, rowData, mergeData, columnCount = 10, hidden = 0, freeze, columnData }) {
  return {
    id,
    name,
    tabColor: '',
    hidden,
    rowCount,
    columnCount,
    zoomRatio: 1,
    scrollTop: 0,
    scrollLeft: 0,
    // 冻结配置：冻结前2列和第1行
    freeze:
      freeze === undefined
        ? {
            xSplit: 2,
            ySplit: 1,
            startRow: 1,
            startColumn: 2
          }
        : freeze,
    rowData,
    columnData: columnData || createDefaultColumnData(),
    mergeData,
    cellData: {}
  }
}

// ==================== 工作簿数据构建函数 ====================

/**
 * 创建工作簿数据
 * 这是核心函数，构建整个电子表格的数据结构
 * @param {Object} importedData - 导入的数据
 * @param {Object} catalogData - 价格库数据
 * @returns {Object} 工作簿数据对象
 */
function createWorkbookData(importedData, catalogData, dataSource) {
  const sheetOrder = []
  const sheets = {}
  importedData.forEach((item) => {
    // 计算布局
    const sheetId = item.sheetid
    const primaryLayout = createPrimarySheetLayout(item.datalist)
    const quotaSections = primaryLayout.sections
    const quotaSummaryRows = primaryLayout.quotaSummaryRows
    const nonQuotaSummaryRows = primaryLayout.nonQuotaSummaryRows
    sheetOrder.push(sheetId)

    // 创建主Sheet
    const primarySheet = createSheetModel({
      id: sheetId,
      name: item.sheetname,
      rowCount: Math.max(42, primaryLayout.grandTotalRowIndex + 3),
      rowData: { 0: { h: 34 } }, // 表头行高
      mergeData: [
        {
          startRow: quotaSections.quotaLabor.sectionStartRowIndex,
          endRow: quotaSections.quotaLabor.sectionEndRowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: quotaSections.quotaMachine.sectionStartRowIndex,
          endRow: quotaSections.quotaMachine.sectionEndRowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: quotaSummaryRows.base.rowIndex,
          endRow: quotaSummaryRows.machineSubtotal.rowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: quotaSummaryRows.tooling.rowIndex,
          endRow: quotaSummaryRows.safety.rowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: quotaSummaryRows.socialInsurance.rowIndex,
          endRow: quotaSummaryRows.enterpriseManage.rowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: quotaSummaryRows.laborDiff.rowIndex,
          endRow: quotaSummaryRows.machineDiff.rowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: quotaSections.nonQuotaLabor.sectionStartRowIndex,
          endRow: quotaSections.nonQuotaLabor.sectionEndRowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: quotaSections.nonQuotaMachine.sectionStartRowIndex,
          endRow: quotaSections.nonQuotaMachine.sectionEndRowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: nonQuotaSummaryRows.laborSubtotal.rowIndex,
          endRow: nonQuotaSummaryRows.total.rowIndex,
          startColumn: 0,
          endColumn: 0
        },
        {
          startRow: primaryLayout.grandTotalRowIndex,
          endRow: primaryLayout.grandTotalRowIndex,
          startColumn: 0,
          endColumn: 1
        }
      ]
    })
    // 设置行高
    ;[
      quotaSummaryRows.base.rowIndex,
      quotaSummaryRows.laborSubtotal.rowIndex,
      quotaSummaryRows.machineSubtotal.rowIndex,
      quotaSummaryRows.tooling.rowIndex,
      quotaSummaryRows.safety.rowIndex,
      quotaSummaryRows.socialInsurance.rowIndex,
      quotaSummaryRows.housingFund.rowIndex,
      quotaSummaryRows.enterpriseManage.rowIndex,
      quotaSummaryRows.profit.rowIndex,
      quotaSummaryRows.laborDiff.rowIndex,
      quotaSummaryRows.machineDiff.rowIndex,
      quotaSummaryRows.total.rowIndex,
      nonQuotaSummaryRows.laborSubtotal.rowIndex,
      nonQuotaSummaryRows.machineSubtotal.rowIndex,
      nonQuotaSummaryRows.total.rowIndex,
      primaryLayout.grandTotalRowIndex
    ].forEach((rowIndex) => {
      primarySheet.rowData[rowIndex] = { h: 30 }
    })

    // 获取单元格数据引用
    const primaryCellData = primarySheet.cellData

    // 主表和查找表的单元格设置函数
    const setPrimaryCell = (rowIndex, columnIndex, payload) => setCell(primaryCellData, rowIndex, columnIndex, payload)

    /**
     * 填充表头行
     * @param {Function} setSheetCell - 设置单元格函数
     * @param {number} rowIndex - 行索引
     */
    function fillHeaderRow(setSheetCell, rowIndex) {
      headerLabels.forEach((label, columnIndex) => {
        setSheetCell(rowIndex, columnIndex, createTextCell(label, 'header'))
      })
    }

    /**
     * 填充主表明细行
     * @param {number} startRowIndex - 起始行索引
     * @param {number} endRowIndex - 结束行索引
     * @param {Object} config - 分区配置
     * @param {string} sectionKey - 分区键
     * @param {Array} records - 数据记录
     */
    function fillPrimaryDetailRows(startRowIndex, endRowIndex, config, sectionKey, records) {
      const paletteStyles = getPaletteStyles(config.palette)
      for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
        const record = records[rowIndex - startRowIndex]
        for (let columnIndex = 0; columnIndex <= 9; columnIndex += 1) {
          // 第7列是计算列
          if (columnIndex === 6) {
            setPrimaryCell(rowIndex, columnIndex, createFormulaCell(detailFormula(rowIndex + 1), paletteStyles.calc))
            continue
          }
          const styleName = columnIndex >= 7 ? paletteStyles.left : paletteStyles.center
          // 根据列索引填充不同的数据
          if (columnIndex === 1) {
            // 名称列
            setPrimaryCell(rowIndex, columnIndex, createTextCell((record && record.xmmc) || '', paletteStyles.center))
          } else if (columnIndex === 2) {
            // 数量列
            setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.xmnum, paletteStyles.number))
          } else if (columnIndex === 3) {
            // 工日列
            setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.workday, paletteStyles.number))
          } else if (columnIndex === 4) {
            // 工作量列
            setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.workload, paletteStyles.number))
          } else if (columnIndex === UNIT_PRICE_COLUMN_INDEX) {
            // 单价列
            setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.unitprice, paletteStyles.number))
          } else if (columnIndex === PRICE_SOURCE_COLUMN_INDEX) {
            // 价格来源列
            setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.unitprice, paletteStyles.number))
          } else if (columnIndex === 8) {
            // 数量来源列
            setPrimaryCell(rowIndex, columnIndex, createTextCell((record && record.numsource) || '', paletteStyles.center))
          } else if (columnIndex === 9) {
            // 备注列
            setPrimaryCell(rowIndex, columnIndex, createTextCell((record && record.bz) || '', paletteStyles.left))
          } else {
            // 其他列（类型列）：空单元格
            setPrimaryCell(rowIndex, columnIndex, createTextCell('', styleName))
          }
        }
      }
    }
    /**
     * 填充合并的类型单元格
     * @param {Function} setSheetCell - 设置单元格函数
     * @param {Object} layout - 布局信息
     * @param {string} label - 类型标签
     * @param {string} palette - 调色板
     */
    function fillMergedTypeCell(setSheetCell, layout, label, palette) {
      const paletteStyles = getPaletteStyles(palette)
      setSheetCell(layout.sectionStartRowIndex, 0, createTextCell(label, paletteStyles.center))
    }
    /**
     * 填充汇总行
     * 汇总行包含标签、子标签、计算公式和可能的额外数据
     * @param {Function} setSheetCell - 设置单元格函数
     * @param {number} rowIndex - 行索引
     * @param {string} palette - 调色板名称
     * @param {string} label - 主标签（如"单价"、"措施费"等）
     * @param {string} subLabel - 子标签（如"定额基价"、"其中：人工"等）
     * @param {string} formula - 计算公式
     * @param {Object} extraCells - 额外单元格数据（列索引 -> 值）
     */
    function fillSummaryRow(setSheetCell, rowIndex, palette, label, subLabel, formula, extraCells = {}) {
      // 根据调色板获取样式
      const paletteStyles = getPaletteStyles(palette)

      // 遍历所有10列，为每列设置内容
      for (let columnIndex = 0; columnIndex <= 9; columnIndex += 1) {
        if (columnIndex === 0) {
          // 第0列：主标签（如"单价"、"措施费"等）
          setSheetCell(rowIndex, columnIndex, createTextCell(label, paletteStyles.center))
        } else if (columnIndex === 1) {
          // 第1列：子标签（如"定额基价"、"其中：人工"等）
          setSheetCell(rowIndex, columnIndex, createTextCell(subLabel, paletteStyles.center))
        } else if (columnIndex === 6) {
          // 第6列：计算公式（人工/台班单价列）
          setSheetCell(rowIndex, columnIndex, createFormulaCell(formula, paletteStyles.calc))
        } else if (Object.prototype.hasOwnProperty.call(extraCells, columnIndex)) {
          // 如果该列有额外数据，根据数据类型设置
          const value = extraCells[columnIndex]
          if (typeof value === 'number') {
            // 数字类型：使用数字单元格样式（如费率）
            setSheetCell(rowIndex, columnIndex, createNumberCell(value, paletteStyles.rate))
          } else {
            // 文本类型：使用文本单元格样式
            setSheetCell(rowIndex, columnIndex, createTextCell(value, columnIndex >= 7 ? paletteStyles.left : paletteStyles.center))
          }
        } else {
          // 其他列：空单元格
          setSheetCell(rowIndex, columnIndex, createTextCell('', columnIndex >= 7 ? paletteStyles.left : paletteStyles.center))
        }
      }
    }

    // ==================== 填充主表数据 ====================
    // 填充表头
    fillHeaderRow(setPrimaryCell, 0)
    // 填充人工分区
    fillPrimaryDetailRows(
      quotaSections.quotaLabor.detailStartRowIndex,
      quotaSections.quotaLabor.detailEndRowIndex,
      sectionConfigs.quotaLabor,
      'quotaLabor',
      item.datalist.quotaLabor
    )
    fillMergedTypeCell(setPrimaryCell, quotaSections.quotaLabor, sectionConfigs.quotaLabor.type, sectionConfigs.quotaLabor.palette)

    // 填充机械分区
    fillPrimaryDetailRows(
      quotaSections.quotaMachine.detailStartRowIndex,
      quotaSections.quotaMachine.detailEndRowIndex,
      sectionConfigs.quotaMachine,
      'quotaMachine',
      item.datalist.quotaMachine
    )
    fillMergedTypeCell(setPrimaryCell, quotaSections.quotaMachine, sectionConfigs.quotaMachine.type, sectionConfigs.quotaMachine.palette)

    // 填充非人工分区
    fillPrimaryDetailRows(
      quotaSections.nonQuotaLabor.detailStartRowIndex,
      quotaSections.nonQuotaLabor.detailEndRowIndex,
      sectionConfigs.nonQuotaLabor,
      'nonQuotaLabor',
      item.datalist.nonQuotaLabor
    )
    fillMergedTypeCell(setPrimaryCell, quotaSections.nonQuotaLabor, sectionConfigs.nonQuotaLabor.type, sectionConfigs.nonQuotaLabor.palette)

    // 填充非机械分区
    fillPrimaryDetailRows(
      quotaSections.nonQuotaMachine.detailStartRowIndex,
      quotaSections.nonQuotaMachine.detailEndRowIndex,
      sectionConfigs.nonQuotaMachine,
      'nonQuotaMachine',
      item.datalist.nonQuotaMachine
    )
    fillMergedTypeCell(setPrimaryCell, quotaSections.nonQuotaMachine, sectionConfigs.nonQuotaMachine.type, sectionConfigs.nonQuotaMachine.palette)
    // 简化变量引用
    const q = quotaSummaryRows // 定额汇总行配置
    const n = nonQuotaSummaryRows // 非定额汇总行配置
    // 定义定额部分所有汇总行的配置
    const quotaSummaryConfigs = [
      {
        // 定额基价行：计算人工小计和机械小计之和
        row: q.base,
        formula: `=IF(COUNT(G${q.laborSubtotal.rowIndex + 1}:G${q.machineSubtotal.rowIndex + 1})=0,"",SUM(G${q.laborSubtotal.rowIndex + 1}:G${
          q.machineSubtotal.rowIndex + 1
        }))`
      },
      {
        // 人工小计行：计算定额人工分区金额合计
        row: q.laborSubtotal,
        formula: subtotalFormula(quotaSections.quotaLabor.detailStartRowIndex + 1, quotaSections.quotaLabor.detailEndRowIndex + 1)
      },
      {
        // 机械小计行：计算定额机械分区金额合计
        row: q.machineSubtotal,
        formula: subtotalFormula(quotaSections.quotaMachine.detailStartRowIndex + 1, quotaSections.quotaMachine.detailEndRowIndex + 1)
      },
      {
        // 施工工具用具使用费：定额基价 × 费率3.76%
        row: q.tooling,
        formula: `=IF(G${q.base.rowIndex + 1}="","",G${q.base.rowIndex + 1}*C${q.tooling.rowIndex + 1})`,
        extraCells: { 2: 0.0376 } // 第2列（数量列）填充费率
      },
      {
        // 安全文明施工费：定额基价 × 费率12.09%
        row: q.safety,
        formula: `=IF(G${q.base.rowIndex + 1}="","",G${q.base.rowIndex + 1}*C${q.safety.rowIndex + 1})`,
        extraCells: { 2: 0.1209 }
      },
      {
        // 社会保险费：人工小计 × 费率27.3% × 调整系数1.15
        row: q.socialInsurance,
        formula: `=IF(G${q.laborSubtotal.rowIndex + 1}="","",G${q.laborSubtotal.rowIndex + 1}*C${q.socialInsurance.rowIndex + 1}*D${
          q.socialInsurance.rowIndex + 1
        })`,
        extraCells: { 2: 0.273, 3: 1.15 } // 第2列费率，第3列调整系数
      },
      {
        // 住房公积金：人工小计 × 费率12% × 调整系数1.15
        row: q.housingFund,
        formula: `=IF(G${q.laborSubtotal.rowIndex + 1}="","",G${q.laborSubtotal.rowIndex + 1}*C${q.housingFund.rowIndex + 1}*D${
          q.housingFund.rowIndex + 1
        })`,
        extraCells: { 2: 0.12, 3: 1.15 }
      },
      {
        // 企业管理费：定额基价 × 费率27.31%
        row: q.enterpriseManage,
        formula: `=IF(G${q.base.rowIndex + 1}="","",G${q.base.rowIndex + 1}*C${q.enterpriseManage.rowIndex + 1})`,
        extraCells: { 2: 0.2731 }
      },
      {
        // 利润：定额基价 × 费率8.99%
        row: q.profit,
        formula: `=IF(G${q.base.rowIndex + 1}="","",G${q.base.rowIndex + 1}*C${q.profit.rowIndex + 1})`,
        extraCells: { 2: 0.0899 }
      },
      {
        // 人工费价差：人工小计 × 费率13.23%
        row: q.laborDiff,
        formula: `=IF(G${q.laborSubtotal.rowIndex + 1}="","",G${q.laborSubtotal.rowIndex + 1}*C${q.laborDiff.rowIndex + 1})`,
        extraCells: { 2: 0.1323 }
      },
      {
        // 机械费价差：机械小计 × 费率7.79%
        row: q.machineDiff,
        formula: `=IF(G${q.machineSubtotal.rowIndex + 1}="","",G${q.machineSubtotal.rowIndex + 1}*C${q.machineDiff.rowIndex + 1})`,
        extraCells: { 2: 0.0779 }
      },
      {
        // 定额合计：计算人工小计到机械费价差所有金额之和
        row: q.total,
        formula: `=IF(COUNT(G${q.laborSubtotal.rowIndex + 1}:G${q.machineDiff.rowIndex + 1})=0,"",SUM(G${q.laborSubtotal.rowIndex + 1}:G${
          q.machineDiff.rowIndex + 1
        }))`
      }
    ]

    // 遍历配置，填充定额部分所有汇总行
    quotaSummaryConfigs.forEach(({ row, formula, extraCells }) => {
      fillSummaryRow(setPrimaryCell, row.rowIndex, row.palette, row.label, row.subLabel, formula, extraCells)
    })

    // ==================== 第九步：填充非定额部分 ====================
    // 填充非定额部分表头
    fillHeaderRow(setPrimaryCell, primaryLayout.nonQuotaHeaderRowIndex)

    // 填充非定额人工小计行
    fillSummaryRow(
      setPrimaryCell,
      n.laborSubtotal.rowIndex,
      n.laborSubtotal.palette,
      n.laborSubtotal.label,
      n.laborSubtotal.subLabel,
      subtotalFormula(quotaSections.nonQuotaLabor.detailStartRowIndex + 1, quotaSections.nonQuotaLabor.detailEndRowIndex + 1)
    )

    // 填充非定额机械小计行
    fillSummaryRow(
      setPrimaryCell,
      n.machineSubtotal.rowIndex,
      n.machineSubtotal.palette,
      n.machineSubtotal.label,
      n.machineSubtotal.subLabel,
      subtotalFormula(quotaSections.nonQuotaMachine.detailStartRowIndex + 1, quotaSections.nonQuotaMachine.detailEndRowIndex + 1)
    )

    // 填充非定额合计行：人工小计 + 机械小计
    fillSummaryRow(
      setPrimaryCell,
      n.total.rowIndex,
      n.total.palette,
      n.total.label,
      n.total.subLabel,
      `=IF(COUNT(G${n.laborSubtotal.rowIndex + 1}:G${n.machineSubtotal.rowIndex + 1})=0,"",SUM(G${n.laborSubtotal.rowIndex + 1}:G${
        n.machineSubtotal.rowIndex + 1
      }))`
    )

    // ==================== 第十步：填充总合计行 ====================
    // 总合计 = 定额合计 + 非定额合计
    fillSummaryRow(
      setPrimaryCell,
      primaryLayout.grandTotalRowIndex,
      'green', // 使用绿色样式
      '总合计', // 主标签
      '', // 无子标签
      `=IF(COUNT(G${q.total.rowIndex + 1},G${n.total.rowIndex + 1})=0,"",SUM(G${q.total.rowIndex + 1},G${n.total.rowIndex + 1}))`
    )
    sheets[sheetId] = primarySheet
  })

  // 创建工作簿数据对象
  const workbookData = {
    id: workbookId,
    name: primarySheetName,
    locale: LocaleType.ZH_CN,
    styles,
    sheetOrder: [...sheetOrder],
    sheets: { ...sheets }
  }
  return workbookData
}

// ==================== 工作表操作函数 ====================

/**
 * 获取对象的方法返回值
 * 尝试多个可能的方法名
 * @param {Object} target - 目标对象
 * @param {Array} methodNames - 方法名数组
 * @returns {*} 方法返回值
 */
function getMethodValue(target, methodNames) {
  for (const methodName of methodNames) {
    if (target && typeof target[methodName] === 'function') {
      const value = target[methodName]()
      if (value !== undefined && value !== null && value !== '') return value
    }
  }
  return ''
}

/**
 * 获取当前活动工作簿
 * @returns {Object|null} 工作簿对象
 */
function getActiveWorkbook() {
  return typeof univerAPI.getActiveWorkbook === 'function' ? univerAPI.getActiveWorkbook() : null
}

/**
 * 获取工作表名称
 * @param {Object} worksheet - 工作表对象
 * @returns {string} 工作表名称
 */
function getWorksheetName(worksheet) {
  return String(getMethodValue(worksheet, ['getName', 'getSheetName', 'getWorksheetName']) || '')
}

/**
 * 从主表获取导入数据
 * 读取当前表格中的数据并转换为数据对象
 * @returns {Object} 导入数据对象
 */
function getPrimarySheetImportedData() {
  const workbook = getActiveWorkbook()
  const sheets = workbook.getSheets()
  sheets.forEach((sheet) => {
    sheet.newid = sheet.getSheet().getSnapshot()?.id
    sheet.newname = sheet.getSheet().getSnapshot()?.name
  })
  const tableData = []
  currentImportedData.value.forEach((item, index) => {
    const workSheet = sheets.filter((recod) => recod.newid == item.sheetid)
    const layout = createPrimarySheetLayout(item.datalist)
    const snapshot = createEmptyImportedZBData()
    snapshot[0].sheetid = item.sheetid
    snapshot[0].sheetname = item.sheetname
    // 遍历人工和机械分区
    SECTION_ORDER.forEach((sectionKey) => {
      const sectionLayout = layout.sections[sectionKey]
      for (let rowIndex = sectionLayout.detailStartRowIndex; rowIndex <= sectionLayout.detailEndRowIndex; rowIndex += 1) {
        // 收集单元格数据
        snapshot[0].datalist[sectionKey].push({
          lx: sectionKey == 'labor' ? '人工' : '机械',
          sheeid: item.sheetid,
          sheetname: item.sheetname,
          xmid: userInfo.value.xmid,
          xmmc: getCellTextValue(workSheet[0], rowIndex, NAME_COLUMN_INDEX),
          unitprice: normalizeNumber(getCellRawValue(workSheet[0], rowIndex, UNIT_PRICE_COLUMN_INDEX)),
          pricesource: getCellTextValue(workSheet[0], rowIndex, PRICE_SOURCE_COLUMN_INDEX),
          rgtbunitprice: normalizeNumber(getCellRawValue(workSheet[0], rowIndex, 6)),
          xmnum: normalizeNumber(getCellRawValue(workSheet[0], rowIndex, EDITABLE_COLUMN_INDEXES[0])),
          workday: normalizeNumber(getCellRawValue(workSheet[0], rowIndex, EDITABLE_COLUMN_INDEXES[1])),
          workload: normalizeNumber(getCellRawValue(workSheet[0], rowIndex, EDITABLE_COLUMN_INDEXES[2])),
          numsource: getCellTextValue(workSheet[0], rowIndex, EDITABLE_COLUMN_INDEXES[3]),
          bz: getCellTextValue(workSheet[0], rowIndex, EDITABLE_COLUMN_INDEXES[4])
        })
      }
    })
    tableData.push(snapshot)
  })
  return tableData
}

/**
 * 获取当前表格导入数据
 * @returns {Object} 当前表格数据
 */
function getCurrentSheetImportedData() {
  return getPrimarySheetImportedData()
}

// ==================== 渲染函数 ====================

/**
 * 渲染工作簿
 * 销毁旧工作簿并创建新工作簿
 * @param {Object} importedData - 导入数据
 */
async function renderWorkbook(importedData) {
  hideHeaderFormulaTip()
  // 获取并销毁旧工作簿
  const activeWorkbook = typeof univerAPI.getActiveWorkbook === 'function' ? univerAPI.getActiveWorkbook() : null
  const activeWorkbookId = activeWorkbook && typeof activeWorkbook.getId === 'function' ? activeWorkbook.getId() : ''
  if (activeWorkbookId && typeof univerAPI.disposeUnit === 'function') {
    univerAPI.disposeUnit(activeWorkbookId)
  }
  // 创建新工作簿
  univerAPI.createWorkbook(createWorkbookData(importedData, currentCatalogData, currentSourceData.value))
}

// ==================== 事件处理函数 ====================

/**
 * 处理从API加载明细数据
 */

const { fetchDetailQuota } = initApi()

async function handleLoadDataFromApi() {
  try {
    isLoadingData.value = true

    // 同时获取明细数据
    const [detailResult] = await Promise.all([fetchDetailQuota(userInfo.value.xmid)])
    const detailData = detailResult.importedData
    // 设置明细数据
    await applyDetailData(detailData)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '类型获取失败，请稍后重试。')
  } finally {
    isLoadingData.value = false
  }
}

// ==================== Univer初始化函数 ====================

/**
 * 初始化Univer电子表格
 */
function initUniver() {
  // 检查依赖是否加载
  if (!createUniver || !LocaleType || !UniverSheetsCorePreset) {
    console.error('Univer libraries not loaded')
    return
  }

  // 创建Univer实例
  univerContext = createUniver({
    locale: LocaleType.ZH_CN,
    locales: {
      [LocaleType.ZH_CN]: mergeLocales(UniverPresetSheetsCoreZhCN, UniverPresetSheetsDataValidationZhCN)
    },
    presets: [
      UniverSheetsCorePreset({
        container: appRefModal.value,
        menu: {
          //隐藏表格按钮
          'sheet.contextMenu.permission': { hidden: true },
          'sheet.command.set-range-protection-from-context-menu': { hidden: true },
          'sheet.menu.cell-insert': { hidden: true },
          'sheet.menu.delete': { hidden: true },
          'sheet.command.set-worksheet-permission-from-context-menu': { hidden: true },
          'sheet.command.view-range-protection': { hidden: true },
          'sheet.command.view-worksheet-permission': { hidden: true }
        },
        sheets: { protectedRangeShadow: false }
        // formula: { initialFormulaComputing: 0 }
      }),
      // 数据验证预设（用于下拉选择）
      UniverSheetsDataValidationPreset({ showEditOnDropdown: false })
    ]
  })

  univerAPI = univerContext.univerAPI

  // 绑定事件
  bindHeaderFormulaHoverEvents()
}

const { handleExport } = exportExcel(
  primarySheetName,
  getCurrentSheetImportedData,
  createWorkbookData,
  buildCellReference,
  currentCatalogData,
  currentSourceData,
  ALIGN_LEFT,
  ALIGN_CENTER,
  ALIGN_MIDDLE,
  WRAP
)

const reset = () => {
  if (univerContext && typeof univerContext.univerAPI.dispose === 'function') {
    univerContext.univerAPI.dispose()
    isShowModal.value = false
  }
}

const openModal = async () => {
  initUniver()
  if (univerAPI) {
    await handleLoadDataFromApi()
  }
}

const acceptParams = (params) => {
  isShowModal.value = true
  userInfo.value = { ...params }
  nextTick(async () => {
    await openModal()
  })
}
defineExpose({
  acceptParams
})
</script>
<style scoped>
@import url(./css/univerapp.css);
</style>

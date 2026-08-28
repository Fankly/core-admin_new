<!--406号文测算电子表格组件-->

<template>
  <div class="page">
    <div class="toolbar">
      <el-button size="mini" v-if="isEidt" v-debounce="[handleImport, `click`, 300]" type="primary"> 导 入</el-button>
      <el-button size="mini" v-if="isEidt" v-debounce="[handleSave, `click`, 300]" type="primary"> 保 存 </el-button>
      <el-button size="mini" v-if="isEidt" v-debounce="[handleSubmit, `click`, 300]" type="primary"> 提 交 </el-button>
      <el-button size="mini" v-if="isEidt" v-debounce="[handleInsertRow, `click`, 300]" type="primary">新增行</el-button>
      <el-button size="mini" v-if="isEidt" v-debounce="[handleDeleteSelectedRows, `click`, 300]" type="primary">删除行</el-button>
      <el-button size="mini" v-debounce="[handleExport, `click`, 300]" type="primary">导 出</el-button>
      <!-- <el-button size="mini" v-debounce="[handleShowcs, `click`, 300]" type="primary"> 查看定额测算</el-button> -->
      <el-button size="mini" v-if="!isView" v-debounce="[handleReturn, `click`, 300]" type="primary">回 退</el-button>
      <div class="highlight" style="margin-left: auto">{{ `项目名称：${xmInfo?.xmmc}` }}</div>
    </div>
    <div id="univer_app" ref="appRef" v-loading="isLoadingData"></div>

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
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
  <!-- 展示定额测算 -->
  <deModal ref="deModalRef" />
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, readonly } from 'vue'
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
import { submitHandler, saveOrUpdateHandler, getImportTemplate, importExcel, goback } from '@/api/service/xmcs/fourZeroSix'
import { ElMessage } from 'element-plus'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { decrypt, encrypt } from '@/utils/crypto'
import { VXETable } from 'vxe-table'
import { univerParam } from '@/views/service/xmcs/hooks/xscs'
import { univerFun } from '@/views/service/xmcs/hooks/publicFun'
import { exportExcel } from '@/views/service/xmcs/hooks/export'
import { initApi } from '@/views/service/xmcs/hooks/initApi'
import deModal from '@/views/service/xmcs/components/deModal.vue' //定额

const {
  route,
  router,
  userInfo,
  importRef,
  isEidt,
  isView,
  xmInfo,
  headerLabels,
  lookupSheetId: baseLookupSheetId,
  lookupSheetName,
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
  isNum
} = univerParam()
// // ==================== 工作簿和Sheet标识常量 ====================
const createRuntimeUnitId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
// 工作簿名称
const primarySheetName = '406号文测算'
// 工作簿ID
const workbookId = '406-template-workbook'
// 单价工作簿
const lookupSheetId = createRuntimeUnitId(baseLookupSheetId)
// 数量来源工作簿
const sourceSheetId = createRuntimeUnitId(baseSourceSheetId)
const {
  normalizeNumber,
  safeGetWindowProperty,
  detailFormula,
  subtotalFormula,
  createTextCell,
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
const SECTION_ORDER = ['labor', 'machine']

// ==================== 分区配置对象 ====================
// 定义人工和机械两个分区的详细配置
// 包括类型名称、颜色方案、Excel识别关键字、列标题匹配等
const sectionConfigs = {
  // 人工分区配置
  labor: {
    type: '人工', // 类型名称
    palette: 'orange' // 颜色方案：橙色
  },
  // 机械分区配置
  machine: {
    type: '机械', // 类型名称
    palette: 'green' // 颜色方案：绿色
  }
}

// ==================== 表头公式提示文本 ====================
// 每个列对应的公式说明，鼠标悬停时显示
const primaryHeaderFormulaTips = [
  '固定分类列，无自动计算公式。', // 类型列
  '名称列支持下拉选择名称。', // 名称列
  '只读列，数据来源于定额测算表。', // 数量列
  '只读列，数据来源于定额测算表。', // 工日列
  '只读列，数据来源于定额测算表。', // 工作量列
  '根据当前名称自动匹配导入单价。', // 单价列
  ['明细行按"数量 × 工日 × 单价 / 工作量"自动计算。', '=IFERROR(C行号*D行号*F行号/E行号,"")'].join('\n'),
  '根据当前名称自动匹配价格来源。', // 价格来源列
  '只读列，数据来源于定额测算表。', // 数量来源列
  '手工填写备注说明，无自动计算公式。' // 备注列
]

// ==================== 响应式状态变量 ====================
// 当前加载的明细数据（人工和机械），包含完整的字段信息
const currentImportedData = ref([])
// 当前价格库数据（用于下拉选择）
const currentCatalogData = reactive({ labor: [], machine: [] })
// 当前数量来源数据（用于下拉选择）
const currentSourceData = ref([])
// 是否正在加载数据
const isLoadingData = ref(false)
const deModalRef = ref()

// ==================== 非响应式全局变量 ====================
// Univer API实例，用于操作电子表格
let univerAPI = null
// Univer上下文，用于管理Univer实例
let univerContext = null
let updating = false
let rollbackStep = '此操作将会清空406号文已经填写的内容，是否回退至定额测算?'
let rollbackToDraft = '确定取消提交?'

// ==================== 数据处理工具函数 ====================
function createEmptyImportedZBData() {
  return [
    {
      sheetid: createRuntimeUnitId('406-template-sheet'),
      sheetname: primarySheetName,
      datalist: {
        labor: [],
        machine: []
      }
    }
  ]
}

/**
 * 深度克隆价格库数据
 * @param {Object} importedData - 要克隆的数据
 * @returns {Object} 克隆后的新数据对象
 */
function cloneImportedData(importedData) {
  const nextImportedData = importedData
  return {
    // 克隆人工数据，每条记录创建新对象
    labor: Array.isArray(nextImportedData.labor) ? nextImportedData.labor.map((record) => ({ ...record })) : [],
    // 克隆机械数据，每条记录创建新对象
    machine: Array.isArray(nextImportedData.machine) ? nextImportedData.machine.map((record) => ({ ...record })) : []
  }
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
 * 深度克隆数量来源数据
 * @param {Object} importedData - 要克隆的数据
 * @returns {Object} 克隆后的新数据对象
 */
function cloneImportedSJLYData(importedData) {
  const nextImportedData = importedData
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

/**
 * 设置价格库数据
 * @param {Object} importedData - 价格库数据
 */
function setCatalogData(importedData) {
  const cloned = cloneImportedData(importedData)
  currentCatalogData.labor = cloned.labor
  currentCatalogData.machine = cloned.machine
}

/**
 * 设置数量来源数据
 * @param {Object} importedData - 数量来源数据
 */
function setDataSource(importedData) {
  const cloned = cloneImportedSJLYData(importedData)
  currentSourceData.value = cloned.cloneData
}

/**
 * 获取数据验证的渲染模式
 * 用于下拉选择框的显示样式
 * @param {string} modeName - 模式名称
 * @returns {string} 渲染模式值
 */
const getDataValidationRenderMode = (modeName) => {
  return (
    safeGetWindowProperty(univerAPI, `Enum.DataValidationRenderMode.${modeName}`) ||
    safeGetWindowProperty(window, `UniverSheetsDataValidation.DataValidationRenderMode.${modeName}`) ||
    safeGetWindowProperty(window, `UniverSheetsDataValidation.Enum.DataValidationRenderMode.${modeName}`) ||
    ''
  )
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
  if (appRef.value) {
    appRef.value.addEventListener('mouseleave', hideHeaderFormulaTip)
  }
}

// 下拉事件监听
function bindCellValueChangedEvents() {
  if (!univerAPI || typeof univerAPI.addEvent !== 'function' || !univerAPI.Event) return
  if (univerAPI.Event.BeforeCommandExecute) {
    univerAPI.addEvent(univerAPI.Event.BeforeCommandExecute, (command) => {
      if (updating || command.id !== 'sheet.command.set-range-values') return
      const { range, value } = command.params
      if ([2, 3, 4, 8].includes(range.startColumn)) {
        ElMessage.warning('数量、工日、工作量、数量来源定额测算表中定额测算部分及非定额测算部分的对应字段，不允许人工调整')
        return (command.cancel = true)
      }
      if (range.startColumn != 1 || value.v == '') return
      updating = true
      const row = range.startRow
      const col = range.startColumn
      const worksheet = getActiveWorksheet()
      const cellValue = value.v
      const threeNum = cellValue.split('--')
      setTimeout(() => {
        worksheet.getRange(row, col).setValue(threeNum[0])
        worksheet.getRange(row, col + 4).setValue(threeNum[2])
        worksheet.getRange(row, col + 6).setValue(threeNum[1])
        updating = false
      })
    })
  }
}

//监听新增sheet页面
function bindSheetValueChangedEvents() {
  if (!univerAPI || typeof univerAPI.addEvent !== 'function' || !univerAPI.Event) return
  if (univerAPI.Event.CommandExecuted) {
    univerAPI.addEvent(univerAPI.Event.CommandExecuted, (params) => {
      if (['sheet.command.copy-sheet', 'sheet.command.insert-sheet'].includes(params.id)) {
        const { sheetid, sheetname } = getActiveWorksheetIdName()
        currentImportedData.value.push({
          sheetid: sheetid,
          sheetname: sheetname,
          datalist: {
            labor: [],
            machine: []
          }
        })
      }
    })
  }
}

/**
 * 获取选中的行范围
 * @returns {Object|null} 包含startRow和endRow的对象
 */
function getSelectedRowRange() {
  const worksheet = getActiveWorksheet()
  if (!worksheet || typeof worksheet.getActiveRange !== 'function') return null

  const activeRange = worksheet.getActiveRange()
  if (!activeRange) return null

  return {
    startRow: activeRange.getRow(),
    endRow: activeRange.getLastRow()
  }
}

//新增、删除
const handleChangeRow = (val) => {
  const workbook = getActiveWorkbook()
  const selectedRowRange = getSelectedRowRange()
  // 守卫 1：无选中行
  if (!selectedRowRange) return ElMessage.warning('请先选择要操作的行！')
  const { startRow } = selectedRowRange
  const text = val == 'ADD' ? '请选择新增区域！' : '请选择要删除的行！'
  // 守卫 2：表头行
  if (startRow == 0) return ElMessage.warning(`${text}`)

  let targetSection = null
  let insertIndex = -1
  const { sheetid, sheetname } = getActiveWorksheetIdName()
  const latestImportedData = getCurrentSheetImportedData()

  let targetSheet = null
  for (const item of latestImportedData) {
    const sheet = item[0]
    if (sheet.sheetid == sheetid && sheet.sheetname == sheetname) {
      targetSheet = sheet
      const layout = createPrimarySheetLayout(sheet.datalist)
      const laborSection = layout.sections.labor
      if (startRow >= laborSection.detailStartRowIndex && startRow <= laborSection.detailEndRowIndex) {
        targetSection = 'labor'
        insertIndex = startRow - laborSection.detailStartRowIndex + 1
      }
      const machineSection = layout.sections.machine
      if (startRow >= machineSection.detailStartRowIndex && startRow <= machineSection.detailEndRowIndex) {
        targetSection = 'machine'
        insertIndex = startRow - machineSection.detailStartRowIndex + 1
      }
      break
    }
  }

  // 守卫 3：未找到匹配 sheet 或选中行不在任何明细分区
  if (!targetSheet || !targetSection) return ElMessage.warning('请在人工或机械明细区域内选择行！')

  if (val == 'ADD') {
    const emptyRecord = {
      lx: '',
      xmmc: '',
      xmnum: '',
      workday: '',
      workload: '',
      unitprice: '',
      pricesource: '',
      numsource: '',
      bz: ''
    }
    targetSheet.datalist[targetSection].splice(insertIndex, 0, emptyRecord)
  } else {
    // 守卫 4：删除索引超出实际记录数（空白行）
    if (insertIndex - 1 >= targetSheet.datalist[targetSection].length) {
      return ElMessage.warning('该行为空白行，无需删除！')
    }
    targetSheet.datalist[targetSection].splice(insertIndex - 1, 1)
  }

  const detailData = []
  latestImportedData.forEach((item) => {
    detailData.push(item[0])
  })
  applyDetailData(detailData)
  workbook.setActiveSheet(sheetid)
}

//新增行
const handleInsertRow = () => {
  handleChangeRow('ADD')
}

//删除行
const handleDeleteSelectedRows = () => {
  handleChangeRow('DELETE')
}

/**
 * 绑定纯文本粘贴事件
 * 粘贴时只保留文本内容，去除格式
 */
function bindValueOnlyPasteEvents() {
  if (!univerAPI || typeof univerAPI.addEvent !== 'function' || !univerAPI.Event || !univerAPI.Event.BeforeClipboardPaste) return

  univerAPI.addEvent(univerAPI.Event.BeforeClipboardPaste, (params) => {
    if (!params || !params.html || typeof params.text !== 'string' || !params.text) return

    // 删除HTML格式，只保留纯文本
    try {
      delete params.html
    } catch (error) {
      params.html = ''
    }
  })
}

// ==================== 布局计算函数 ====================

/**
 * 创建主表布局
 * 计算人工、机械分区和汇总行的布局
 * @param {Object} importedData - 导入数据
 * @returns {Object} 布局信息对象
 */
function createPrimarySheetLayout(importedData) {
  // 人工分区布局
  const sections = {
    labor: createSectionLayout(1, importedData.labor, MIN_DETAIL_ROWS),
    machine: null
  }
  // 机械分区布局（紧接人工分区）
  sections.machine = createSectionLayout(sections.labor.sectionEndRowIndex + 1, importedData.machine, MIN_DETAIL_ROWS)

  // 汇总行布局
  const totalStartRowIndex = sections.machine.sectionEndRowIndex + 1
  const totalRows = [
    {
      rowIndex: totalStartRowIndex,
      label: '总计',
      subLabel: '其中：人工',
      formula: subtotalFormula(sections.labor.sectionStartRowIndex + 1, sections.labor.detailEndRowIndex + 1)
    },
    {
      rowIndex: totalStartRowIndex + 1,
      label: '',
      subLabel: '其中：机械',
      formula: subtotalFormula(sections.machine.sectionStartRowIndex + 1, sections.machine.detailEndRowIndex + 1)
    },
    {
      rowIndex: totalStartRowIndex + 2,
      label: '',
      subLabel: '合计',
      formula: `=IF(COUNT(G${totalStartRowIndex + 1}:G${totalStartRowIndex + 2})=0,"",SUM(G${totalStartRowIndex + 1}:G${totalStartRowIndex + 2}))`
    }
  ]

  return { sections, totalRows }
}

/**
 * 创建查找表布局
 * 用于存储下拉选择的数据源
 * @param {Object} catalogData - 价格库数据
 * @returns {Object} 布局信息对象
 */
function createLookupSheetLayout(catalogData) {
  const maxRecordCount = Math.max(catalogData.labor.length, catalogData.machine.length)
  return {
    rowCount: Math.max(2, maxRecordCount + 1),
    sections: {
      labor: {
        records: catalogData.labor,
        startColumnIndex: 0, // 人工数据从第1列开始
        dataStartRowIndex: 1,
        dataEndRowIndex: Math.max(1, catalogData.labor.length)
      },
      machine: {
        records: catalogData.machine,
        startColumnIndex: 4, // 机械数据从第5列开始
        dataStartRowIndex: 1,
        dataEndRowIndex: Math.max(1, catalogData.machine.length)
      }
    }
  }
}

/**
 * 创建数量来源表布局
 * 用于存储下拉选择的数据源
 * @param {Object} dataSource - 价格库数据
 * @returns {Object} 布局信息对象
 */
function createLookupSheetLayoutSource(dataSource) {
  const maxRecordCount = dataSource.length
  return {
    rowCount: Math.max(2, maxRecordCount + 1),
    sections: {
      slly: {
        records: dataSource,
        startColumnIndex: 0, // 人工数据从第1列开始
        dataStartRowIndex: 1,
        dataEndRowIndex: Math.max(1, dataSource.length)
      }
    }
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
 * 创建查找表列宽配置
 * @returns {Object} 列宽配置对象
 */
function createLookupColumnData() {
  return {
    0: { w: 184 }, // 人工名称
    1: { w: 132 }, // 人工单价
    2: { w: 240 }, // 人工价格来源
    4: { w: 184 }, // 机械名称
    5: { w: 132 }, // 机械单价
    6: { w: 240 } // 机械价格来源
  }
}

/**
 * 创建数量来源表列宽配置
 * @returns {Object} 列宽配置对象
 */
function createLookupColumnSource() {
  return {
    0: { w: 184 }, // 数量来源名称
    1: { w: 132 } // 数量来源单价
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
  const lookupLayout = createLookupSheetLayout(catalogData)
  const lookupSource = createLookupSheetLayoutSource(dataSource)
  importedData.forEach((item) => {
    // 计算布局
    const sheetId = item.sheetid
    const primaryLayout = createPrimarySheetLayout(item.datalist)
    const laborLayout = primaryLayout.sections.labor
    const machineLayout = primaryLayout.sections.machine
    const { totalRows } = primaryLayout
    sheetOrder.push(sheetId)

    // 创建主Sheet
    const primarySheet = createSheetModel({
      id: sheetId,
      name: item.sheetname,
      rowCount: Math.max(30, totalRows[2].rowIndex + 8),
      rowData: { 0: { h: 34 } }, // 表头行高
      mergeData: [
        // 人工类型列合并
        {
          startRow: laborLayout.sectionStartRowIndex,
          endRow: laborLayout.detailEndRowIndex,
          startColumn: 0,
          endColumn: 0
        },
        // 机械类型列合并
        {
          startRow: machineLayout.sectionStartRowIndex,
          endRow: machineLayout.detailEndRowIndex,
          startColumn: 0,
          endColumn: 0
        },
        // 汇总类型列合并
        {
          startRow: totalRows[0].rowIndex,
          endRow: totalRows[2].rowIndex,
          startColumn: 0,
          endColumn: 0
        }
      ]
    })

    // 设置汇总行行高
    totalRows.forEach(({ rowIndex }) => {
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
            setPrimaryCell(
              rowIndex,
              columnIndex,
              createValueCell(record && record.workday, isNum.value == '3' ? paletteStyles.number3 : paletteStyles.number)
            )
          } else if (columnIndex === 4) {
            // 工作量列
            setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.workload, paletteStyles.number))
          } else if (columnIndex === UNIT_PRICE_COLUMN_INDEX) {
            // 单价列
            setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.unitprice, paletteStyles.number))
          } else if (columnIndex === PRICE_SOURCE_COLUMN_INDEX) {
            // 价格来源列
            setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.pricesource, paletteStyles.center))
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
     * @param {Function} setSheetCell - 设置单元格函数
     * @param {number} rowIndex - 行索引
     * @param {string} palette - 调色板
     * @param {string} label - 标签
     * @param {string} subLabel - 子标签
     * @param {string} formula - 公式
     */
    function fillSummaryRow(setSheetCell, rowIndex, palette, label, subLabel, formula) {
      const paletteStyles = getPaletteStyles(palette)

      for (let columnIndex = 0; columnIndex <= 9; columnIndex += 1) {
        if (columnIndex === 0) {
          setSheetCell(rowIndex, columnIndex, createTextCell(label, paletteStyles.center))
        } else if (columnIndex === 1) {
          setSheetCell(rowIndex, columnIndex, createTextCell(subLabel, paletteStyles.center))
        } else if (columnIndex === 6) {
          setSheetCell(rowIndex, columnIndex, createFormulaCell(formula, paletteStyles.calc))
        } else {
          setSheetCell(rowIndex, columnIndex, createTextCell('', columnIndex >= 7 ? paletteStyles.left : paletteStyles.center))
        }
      }
    }

    // ==================== 填充主表数据 ====================

    // 填充表头
    fillHeaderRow(setPrimaryCell, 0)
    // 填充人工分区
    fillPrimaryDetailRows(laborLayout.detailStartRowIndex, laborLayout.detailEndRowIndex, sectionConfigs.labor, 'labor', item.datalist.labor)
    fillMergedTypeCell(setPrimaryCell, laborLayout, sectionConfigs.labor.type, sectionConfigs.labor.palette)

    // 填充机械分区
    fillPrimaryDetailRows(
      machineLayout.detailStartRowIndex,
      machineLayout.detailEndRowIndex,
      sectionConfigs.machine,
      'machine',
      item.datalist.machine
    )
    fillMergedTypeCell(setPrimaryCell, machineLayout, sectionConfigs.machine.type, sectionConfigs.machine.palette)

    // 填充汇总行
    totalRows.forEach(({ rowIndex, label, subLabel, formula }) => {
      fillSummaryRow(setPrimaryCell, rowIndex, 'orange', label, subLabel, formula)
    })
    sheets[sheetId] = primarySheet
  })

  // 创建查找Sheet（隐藏）
  const lookupSheet = createSheetModel({
    id: lookupSheetId,
    name: lookupSheetName,
    rowCount: lookupLayout.rowCount,
    rowData: { 0: { h: 28 } },
    mergeData: [],
    columnCount: 7,
    hidden: 1, // 隐藏
    freeze: null,
    columnData: createLookupColumnData()
  })
  const lookupCellData = lookupSheet.cellData
  const setLookupCell = (rowIndex, columnIndex, payload) => setCell(lookupCellData, rowIndex, columnIndex, payload)

  // 创建查找数据来源（隐藏）
  const sourceSheet = createSheetModel({
    id: sourceSheetId,
    name: sourceSheetName,
    rowCount: lookupSource.rowCount,
    rowData: { 0: { h: 28 } },
    mergeData: [],
    columnCount: 2,
    hidden: 1, // 隐藏
    freeze: null,
    columnData: createLookupColumnSource()
  })
  const lookupSourceData = sourceSheet.cellData
  const setLookupCellSource = (rowIndex, columnIndex, payload) => setCell(lookupSourceData, rowIndex, columnIndex, payload)

  // ==================== 填充查找表数据 ====================

  // 填充人工和机械的价格数据
  ;[
    { sectionKey: 'labor', headerLabel: '人工名称' },
    { sectionKey: 'machine', headerLabel: '机械名称' }
  ].forEach(({ sectionKey, headerLabel }) => {
    const lookupSection = lookupLayout.sections[sectionKey]
    const recordsUp = lookupSection.records
    const startColumnIndex = lookupSection.startColumnIndex

    // 设置表头
    setLookupCell(0, startColumnIndex, createTextCell(headerLabel, 'header'))
    setLookupCell(0, startColumnIndex + 1, createTextCell('单价(元)', 'header'))
    setLookupCell(0, startColumnIndex + 2, createTextCell('价格来源', 'header'))
    // 填充数据行
    recordsUp.forEach((recordUp, index) => {
      const rowIndex = lookupSection.dataStartRowIndex + index
      // const zw = ZW_CHARS[index % ZW_CHARS.length]
      setLookupCell(rowIndex, startColumnIndex, createTextCell(`${recordUp.xmmc}--${recordUp.pricesource}--${recordUp.unitprice}`, 'orangeLeft'))
      setLookupCell(rowIndex, startColumnIndex + 1, createValueCell(`${recordUp.unitprice}`, 'orangeNumber'))
      setLookupCell(rowIndex, startColumnIndex + 2, createTextCell(`${recordUp.pricesource}`, 'orangeLeft'))
    })
  })

  // 填充人工和机械的数量来源数据
  ;[
    { sectionKey: 'labor', headerLabel: '人工名称' },
    { sectionKey: 'machine', headerLabel: '机械名称' }
  ].forEach(({ sectionKey, headerLabel }) => {
    const lookupSection = lookupSource.sections['slly']
    const recordsUp = lookupSection.records
    const startColumnIndex = lookupSection.startColumnIndex

    // 设置表头
    setLookupCellSource(0, startColumnIndex, createTextCell('来源名称', 'header'))
    setLookupCellSource(0, startColumnIndex + 1, createTextCell('来源编码', 'header'))

    // 填充数据行
    recordsUp.forEach((recordUp, index) => {
      const rowIndex = lookupSection.dataStartRowIndex + index
      setLookupCellSource(rowIndex, startColumnIndex, createTextCell(recordUp.name || '', 'orangeLeft'))
      setLookupCellSource(rowIndex, startColumnIndex + 1, createValueCell(recordUp.code, 'orangeNumber'))
    })
  })

  // 创建工作簿数据对象
  const workbookData = {
    id: createRuntimeUnitId(workbookId),
    name: primarySheetName,
    locale: LocaleType.ZH_CN,
    styles,
    sheetOrder: [...sheetOrder, lookupSheetId, sourceSheetId],
    sheets: {
      ...sheets,
      [lookupSheetId]: lookupSheet,
      [sourceSheetId]: sourceSheet
    }
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
 * 获取当前活动工作表
 * @returns {Object|null} 工作表对象
 */
function getActiveWorksheet() {
  const activeWorkbook = getActiveWorkbook()
  return activeWorkbook && typeof activeWorkbook.getActiveSheet === 'function' ? activeWorkbook.getActiveSheet() : null
}

/**
 * 获取当前活动工作表的id、名称
 * @returns {Object|null} 工作表对象
 */
function getActiveWorksheetIdName() {
  const worksheet = getActiveWorksheet()
  if (!worksheet || typeof worksheet.getSheet !== 'function') return null

  const activeSheet = worksheet.getSheet()
  if (!activeSheet) return null
  return {
    sheetid: activeSheet.getSnapshot()?.id,
    sheetname: activeSheet.getSnapshot()?.name
  }
}

/**
 * 获取工作表ID
 * @param {Object} worksheet - 工作表对象
 * @returns {string} 工作表ID
 */
function getWorksheetId(worksheet) {
  return String(getMethodValue(worksheet, ['getSheetId', 'getId']) || '')
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
 * 检查工作表是否匹配
 * @param {Object} worksheet - 工作表对象
 * @param {string} targetId - 目标ID
 * @param {string} targetName - 目标名称
 * @returns {boolean} 是否匹配
 */
function isWorksheetMatched(worksheet, targetId, targetName) {
  if (!worksheet) return false
  return getWorksheetId(worksheet) === targetId || getWorksheetName(worksheet) === targetName
}

/**
 * 获取工作簿中的所有工作表
 * @returns {Array} 工作表数组
 */
function getWorkbookWorksheets() {
  const activeWorkbook = getActiveWorkbook()
  if (!activeWorkbook) return []

  const candidates = ['getSheets', 'getAllSheets', 'getWorksheets']
  for (const methodName of candidates) {
    if (typeof activeWorkbook[methodName] !== 'function') continue
    const result = activeWorkbook[methodName]()
    if (Array.isArray(result)) return result
    if (result && typeof result[Symbol.iterator] === 'function') return Array.from(result)
  }

  const activeWorksheet = getActiveWorksheet()
  return activeWorksheet ? [activeWorksheet] : []
}

/**
 * 通过ID或名称获取工作表
 * @param {string} sheetId - 工作表ID
 * @param {string} sheetName - 工作表名称
 * @returns {Object|null} 工作表对象
 */
function getWorksheetByIdentity(sheetId, sheetName) {
  const activeWorkbook = getActiveWorkbook()
  if (!activeWorkbook) return null

  const lookupStrategies = [
    ['getSheetBySheetId', sheetId],
    ['getWorksheetBySheetId', sheetId],
    ['getSheetById', sheetId],
    ['getSheetByName', sheetName],
    ['getWorksheetByName', sheetName]
  ]

  for (const [methodName, value] of lookupStrategies) {
    if (typeof activeWorkbook[methodName] !== 'function') continue
    const worksheet = activeWorkbook[methodName](value)
    if (worksheet) return worksheet
  }

  return getWorkbookWorksheets().find((worksheet) => isWorksheetMatched(worksheet, sheetId, sheetName)) || null
}

// ==================== 下拉选择相关函数 ====================

/**
 * 应用主表名称下拉选择
 * 为名称列设置数据验证，实现下拉选择功能
 * @param {Object} importedData - 导入数据
 * @param {Object} catalogData - 价格库数据
 */
function applyPrimaryNameDropdowns(importedData, catalogData) {
  if (!univerAPI || typeof univerAPI.newDataValidation !== 'function') return
  importedData.forEach(async (item) => {
    const primaryWorksheet = getWorksheetByIdentity(item.sheetid, item.sheetname)
    const lookupWorksheet = getWorksheetByIdentity(lookupSheetId, lookupSheetName)
    if (!primaryWorksheet || !lookupWorksheet || typeof primaryWorksheet.getRange !== 'function') return

    const primaryLayout = createPrimarySheetLayout(item.datalist)
    const lookupLayout = createLookupSheetLayout(catalogData)
    const dropdownRenderMode = getDataValidationRenderMode('ARROW')

    // 为人工和机械分区分别设置下拉
    for (const sectionKey of SECTION_ORDER) {
      const catalogRecords = catalogData[sectionKey]
      if (!catalogRecords.length) continue

      const primarySection = primaryLayout.sections[sectionKey]
      const lookupSection = lookupLayout.sections[sectionKey]

      // 获取数据源范围（查找表中的名称列）
      const sourceRange = lookupWorksheet.getRange(
        lookupSection.dataStartRowIndex,
        lookupSection.startColumnIndex,
        catalogRecords.length,
        1 //获取下拉菜单显示的内容列
      )
      // 获取目标范围（主表中的名称列）
      const targetRange = primaryWorksheet.getRange(
        primarySection.detailStartRowIndex,
        NAME_COLUMN_INDEX,
        primarySection.detailEndRowIndex - primarySection.detailStartRowIndex + 1,
        1
      )
      // 设置数据验证选项
      const validationOptions = {
        showErrorMessage: false,
        error: `请从下拉列表中选择${sectionConfigs[sectionKey].type}名称。`
      }

      if (dropdownRenderMode) {
        validationOptions.renderMode = dropdownRenderMode
      }

      // 创建并应用数据验证规则
      const validationRule = univerAPI
        .newDataValidation()
        .requireValueInRange(sourceRange)
        .setAllowBlank(true)
        .setAllowInvalid(true)
        .setOptions(validationOptions)
        .build()
      const applyResult = targetRange.setDataValidation(validationRule)
      if (applyResult && typeof applyResult.then === 'function') {
        await applyResult
      }
    }
  })
}
// 数量来源下拉框
function applyPrimarySourceDropdowns(importedData, currentSourceData) {
  if (!univerAPI || typeof univerAPI.newDataValidation !== 'function') return
  importedData.forEach(async (item) => {
    const primaryWorksheet = getWorksheetByIdentity(item.sheetid, item.sheetname)
    const lookupSourcsheet = getWorksheetByIdentity(sourceSheetId, sourceSheetName)
    if (!primaryWorksheet || !lookupSourcsheet || typeof primaryWorksheet.getRange !== 'function') return

    const primaryLayout = createPrimarySheetLayout(item.datalist)
    const lookupLayout = createLookupSheetLayoutSource(currentSourceData)
    const dropdownRenderMode = getDataValidationRenderMode('ARROW')

    // 为人工和机械分区分别设置下拉
    for (const sectionKey of SECTION_ORDER) {
      const catalogRecords = currentSourceData
      if (!catalogRecords.length) continue

      const primarySection = primaryLayout.sections[sectionKey]
      const lookupSection = lookupLayout.sections['slly']

      // 获取数据源范围（查找表中的数量来源列）
      const sourceRange = lookupSourcsheet.getRange(lookupSection.dataStartRowIndex, lookupSection.startColumnIndex, catalogRecords.length, 1)

      // 获取目标范围（主表中的数量来源列）
      const targetRange = primaryWorksheet.getRange(
        primarySection.detailStartRowIndex,
        DATA_SOURCE__COLUMN_INDEX,
        primarySection.detailEndRowIndex - primarySection.detailStartRowIndex + 1,
        1 //获取下拉菜单显示的内容列
      )
      // 设置数据验证选项
      const validationOptions = {
        showErrorMessage: true,
        error: `请从下拉列表中选择数量来源。`
      }

      if (dropdownRenderMode) {
        validationOptions.renderMode = dropdownRenderMode
      }

      // 创建并应用数据验证规则
      const validationRule = univerAPI
        .newDataValidation()
        .requireValueInRange(sourceRange)
        .setAllowBlank(true)
        .setAllowInvalid(false)
        .setOptions(validationOptions)
        .build()
      const applyResult = targetRange.setDataValidation(validationRule)
      if (applyResult && typeof applyResult.then === 'function') {
        await applyResult
      }
    }
  })
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
    const workSheet = sheets.filter((recod) => item.sheetid == recod.newid)
    if (workSheet.length == 0) {
      item.isDEl = true
    } else {
      item.isDEl = false
      const layout = createPrimarySheetLayout(item.datalist)
      const snapshot = createEmptyImportedZBData()
      snapshot[0].sheetid = workSheet[0].newid
      snapshot[0].sheetname = workSheet[0].newname
      // 遍历人工和机械分区
      SECTION_ORDER.forEach((sectionKey) => {
        const sectionLayout = layout.sections[sectionKey]
        for (let rowIndex = sectionLayout.detailStartRowIndex; rowIndex <= sectionLayout.detailEndRowIndex; rowIndex += 1) {
          // 收集单元格数据
          snapshot[0].datalist[sectionKey].push({
            lx: sectionKey == 'labor' ? '人工' : '机械',
            sheeid: workSheet[0].newid,
            sheetname: workSheet[0].newname,
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
    }
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
  applyPrimaryNameDropdowns(importedData, currentCatalogData)
  applyPrimarySourceDropdowns(importedData, currentSourceData.value)
}

// ==================== 事件处理函数 ====================

/**
 * 处理从API加载明细数据
 */

const { fetchDetailfourZeroSix, fetchCatalogfourZeroSix, fetchSourcefourZeroSix, queryInfoById } = initApi()

async function handleLoadDataFromApi() {
  try {
    isLoadingData.value = true

    // 同时获取明细数据和价格库数据
    const [detailResult, catalogResult, dataResult] = await Promise.all([
      fetchDetailfourZeroSix(userInfo.value.xmid),
      fetchCatalogfourZeroSix(),
      fetchSourcefourZeroSix()
    ])
    const detailData = detailResult.importedData
    const catalogData = catalogResult.importedData
    const dataSource = dataResult.importedData
    // 设置价格库数据
    setCatalogData(catalogData)
    // 设置数量来源数据
    setDataSource(dataSource)
    // 设置明细数据
    await applyDetailData(detailData)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '类型获取失败，请稍后重试。')
  } finally {
    isLoadingData.value = false
  }
}

async function getSave() {
  // 保存强制失去焦点
  const indexActive = getActiveWorkbook()
  indexActive.endEditingAsync(true)
  const datalist = []
  // 获取最新数据并创建保存载荷
  const latestImportedData = getCurrentSheetImportedData()
  latestImportedData.forEach((tabledata) => {
    if (!tabledata.isDEL) {
      datalist.push(...tabledata[0].datalist.labor, ...tabledata[0].datalist.machine)
    }
  })
  // 排除名称为空的数据
  // const filterNoName = datalist.filter((item) => item.xmmc != '')
  const filterNoName = datalist.filter((item) => item.xmmc != '' || (item.workday != '' && item.workload != ''))
  let res = await saveOrUpdateHandler([...filterNoName])
  return res
}

/**
 * 处理保存
 */
async function handleSave() {
  const saveReturn = await getSave()
  if (!saveReturn.success) return ElMessage.error(saveReturn.msg)
  ElMessage.success('保存成功！')
  await importAfter()
}

/**
 * 处理提交
 */
async function handleSubmit() {
  const saveReturn = await getSave()
  if (!saveReturn.success) return ElMessage.error(saveReturn.msg)
  const type = await VXETable.modal.confirm('提交后无法修改，是否提交？', '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  let submit = await submitHandler([userInfo.value.xmid])
  if (!submit.success) return ElMessage.error(submit.msg)
  if (submit.success) {
    ElMessage.success('提交成功')
    await queryInfo()
    await importAfter()
  }
  return
}

// 刷新表格
const importAfter = async () => {
  try {
    if (univerContext && typeof univerContext.univerAPI.dispose === 'function') {
      univerContext.univerAPI.dispose()
      initUniver()
      if (univerAPI) {
        await handleLoadDataFromApi()
      }
    }
  } catch {}
}

// 导入
const handleImport = () => {
  let newParmas = { xmid: userInfo.value.xmid }
  importRef.value.fromData = { ...newParmas }
  let tempApi = getImportTemplate
  let importApi = importExcel
  if (!tempApi && !importApi) return
  let params = {
    tempApi: (importParams) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: '406号文测算清单',
    specialorgid: userInfo.value.deptId,
    getTableList: importAfter
  }
  if (importRef.value) importRef.value.acceptParams(params)
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
        container: appRef.value,
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
  bindValueOnlyPasteEvents()
  bindSheetValueChangedEvents()
  bindCellValueChangedEvents()
}

// 查询项目信息
const queryInfo = async () => {
  let xmDeatil = await queryInfoById(userInfo.value.xmid, userInfo.value.creatorAccount)
  xmInfo.value = xmDeatil
  isEidt.value = ((xmInfo.value.editFlag == '1' && xmInfo.value.zxcsstatus == '1') || userInfo.value.isAdministrator) && !userInfo.value.handler
  isView.value = userInfo.value.handler
  isNum.value = await getPbulicCode(xmDeatil.dept)
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

// 查看406号文
const handleShowcs = () => {
  let param = { ...userInfo.value, ...xmInfo.value }
  deModalRef.value.acceptParams(param)
}

// 回退
const handleReturn = async () => {
  let text = xmInfo.value.zxcsstatus == '1' ? rollbackStep : rollbackToDraft
  const type = await VXETable.modal.confirm(text, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const res = await goback([userInfo.value.xmid])
  if (!res.success) return ElMessage.error(res.msg)
  if (xmInfo.value.zxcsstatus == '1') {
    const str = encrypt(
      JSON.stringify({
        xmid: userInfo.value.xmid,
        creatorAccount: userInfo.value.creatorAccount,
        deptId: userInfo.value.deptId,
        dwId: userInfo.value.dwId,
        spRoleId: userInfo.value.spRoleId
      })
    )
    router.push({
      name: '/service/xmcs/decs',
      query: {
        xmcsParams: str
      }
    })
  } else {
    await queryInfo()
  }
}

onMounted(async () => {
  userInfo.value = JSON.parse(decrypt(route.query.xmcsParams))
  initUniver()
  if (univerAPI) {
    await queryInfo()
    await handleLoadDataFromApi()
  }
})

onUnmounted(() => {
  if (univerContext && typeof univerContext.univerAPI.dispose === 'function') {
    univerContext.univerAPI.dispose()
  }
})
</script>

<style scoped>
@import url(./css/univerapp.css);
</style>

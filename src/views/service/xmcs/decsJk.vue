<!--定额测算电子表格组件架空-->
<template>
  <div class="page">
    <div class="toolbar">
      <el-button size="mini" v-if="isEidt" v-debounce="[handleImport, `click`, 300]" type="primary"> 导 入</el-button>
      <el-button size="mini" v-if="isEidt" v-debounce="[handleSave, `click`, 300]" type="primary"> 保 存 </el-button>
      <el-button size="mini" v-if="isEidt" v-debounce="[handleSubmit, `click`, 300]" type="primary"> 提 交 </el-button>
      <el-button size="mini" v-if="isEidt" v-debounce="[handleInsertRow, `click`, 300]" type="primary">新增行</el-button>
      <el-button size="mini" v-if="isEidt" v-debounce="[handleDeleteSelectedRows, `click`, 300]" type="primary"> 删除选中行</el-button>
      <el-button size="mini" v-debounce="[handleExport, `click`, 300]" type="primary">导 出</el-button>
      <el-button size="mini" v-if="!isEidt" v-debounce="[handleDE, `click`, 300]" type="primary">406号文测算</el-button>
      <!-- <el-button size="mini" v-debounce="[handleShowcs, `click`, 300]" type="primary"> 查看406号文测算</el-button> -->
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
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
import { submitHandler, updateDyDe, saveOrUpdateHandler, getImportTemplate, importExcel, queryByMcAndXmid } from '@/api/service/xmcs/quota'
import { ElMessage } from 'element-plus'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { decrypt, encrypt } from '@/utils/crypto'
import { VXETable } from 'vxe-table'
import { univerParam } from '@/views/service/xmcs/hooks/xscs'
import { univerFun } from '@/views/service/xmcs/hooks/publicFun'
import { exportExcel } from '@/views/service/xmcs/hooks/export'
import { initApi } from '@/views/service/xmcs/hooks/initApi'

const {
  route,
  router,
  userInfo,
  importRef,
  isEidt,
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
  getPbulicCode,
  isNum
} = univerParam()
// // ==================== 工作簿和Sheet标识常量 ====================
const createRuntimeUnitId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
// 工作簿名称
const primarySheetName = ''
// 工作簿ID
const workbookId = 'quota-template-workbook'
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
  createNumberCell,
  createValueCell,
  getPaletteStyles,
  createFormulaCell,
  buildCellReference,
  buildSheetRangeReference,
  buildLookupFormula,
  createSectionLayout,
  getCellRawValue,
  getCellTextValue,
  setCell
} = univerFun(MIN_DETAIL_ROWS)

// ==================== 列索引常量定义 ====================
// 分区顺序：先人工后机械
const SECTION_ORDER = ['quotaLabor', 'quotaMachine', 'nonQuotaLabor', 'nonQuotaMachine']
const workbookTotal = ref([])
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
 * 深度克隆价格库数据
 * @param {Object} importedData - 要克隆的数据
 * @returns {Object} 克隆后的新数据对象
 */
function cloneImportedData(importedData) {
  const nextImportedData = importedData
  return {
    // 克隆定额人工数据，每条记录创建新对象
    quotaLabor: Array.isArray(nextImportedData.quotaLabor) ? nextImportedData.quotaLabor.map((record) => ({ ...record })) : [],
    // 克隆定额机械数据，每条记录创建新对象
    quotaMachine: Array.isArray(nextImportedData.quotaMachine) ? nextImportedData.quotaMachine.map((record) => ({ ...record })) : [],
    // 克隆非定额人工数据，每条记录创建新对象
    nonQuotaLabor: Array.isArray(nextImportedData.nonQuotaLabor) ? nextImportedData.nonQuotaLabor.map((record) => ({ ...record })) : [],
    // 克隆非定额机械数据，每条记录创建新对象
    nonQuotaMachine: Array.isArray(nextImportedData.nonQuotaMachine) ? nextImportedData.nonQuotaMachine.map((record) => ({ ...record })) : []
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
  currentCatalogData.quotaLabor = cloned.quotaLabor
  currentCatalogData.quotaMachine = cloned.quotaMachine
  currentCatalogData.nonQuotaLabor = cloned.nonQuotaLabor
  currentCatalogData.nonQuotaMachine = cloned.nonQuotaMachine
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
            quotaLabor: [],
            quotaMachine: [],
            nonQuotaLabor: [],
            nonQuotaMachine: []
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
const handleChangeRow = async (val) => {
  const workbook = getActiveWorkbook()
  const selectedRowRange = getSelectedRowRange()
  if (!selectedRowRange) return ElMessage.warning('请先选择要操作的行！')

  const { startRow, endRow } = selectedRowRange
  const text = val == 'ADD' ? '请选择新增区域！' : '请选择要删除的行！'
  if (startRow === 0) return ElMessage.warning(`${text}`)

  const { sheetid } = getActiveWorksheetIdName()
  const latestImportedData = getCurrentSheetImportedData()

  let targetSection = null
  let insertIndex = -1
  let matchedSheet = null

  for (const item of latestImportedData) {
    const sheet = item[0]
    if (sheet.sheetid !== sheetid) continue
    matchedSheet = sheet
    const layout = createPrimarySheetLayout(sheet.datalist)

    const sectionChecks = [
      { key: 'quotaLabor', section: layout.sections.quotaLabor },
      { key: 'quotaMachine', section: layout.sections.quotaMachine },
      { key: 'nonQuotaLabor', section: layout.sections.nonQuotaLabor },
      { key: 'nonQuotaMachine', section: layout.sections.nonQuotaMachine }
    ]

    for (const { key, section } of sectionChecks) {
      if (startRow >= section.detailStartRowIndex && startRow <= section.detailEndRowIndex) {
        targetSection = key
        if (val === 'ADD') {
          insertIndex = startRow - section.detailStartRowIndex + 1
        } else {
          insertIndex = startRow - section.detailStartRowIndex
        }
        break
      }
    }
    break
  }

  if (!targetSection) return ElMessage.warning('请选择明细数据区域内的行！')
  if (!matchedSheet) return ElMessage.warning('未找到当前工作表数据！')

  if (val === 'ADD') {
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
    matchedSheet.datalist[targetSection].splice(insertIndex, 0, emptyRecord)
  } else {
    const deleteCount = endRow - startRow + 1
    matchedSheet.datalist[targetSection].splice(insertIndex, deleteCount)
  }

  const detailData = []
  latestImportedData.forEach((item) => {
    detailData.push(item[0])
  })
  await applyDetailData(detailData)
  console.log(sheetid, 'sheetid')
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
 * 创建查找表布局
 * 用于存储下拉选择的数据源
 * @param {Object} catalogData - 价格库数据
 * @returns {Object} 布局信息对象
 */
function createLookupSheetLayout(catalogData) {
  const maxRecordCount = Math.max(
    catalogData.quotaLabor.length,
    catalogData.quotaMachine.length,
    catalogData.nonQuotaLabor.length,
    catalogData.nonQuotaMachine.length
  )
  return {
    rowCount: Math.max(2, maxRecordCount + 1),
    sections: {
      quotaLabor: {
        records: catalogData.quotaLabor,
        startColumnIndex: 0, // 定额人工数据从第1列开始
        dataStartRowIndex: 1,
        dataEndRowIndex: Math.max(1, catalogData.quotaLabor.length)
      },
      quotaMachine: {
        records: catalogData.quotaMachine,
        startColumnIndex: 4, // 定额机械数据从第4列开始
        dataStartRowIndex: 1,
        dataEndRowIndex: Math.max(1, catalogData.quotaMachine.length)
      },
      nonQuotaLabor: {
        records: catalogData.nonQuotaLabor,
        startColumnIndex: 8, // 非定额人工数据从第8列开始
        dataStartRowIndex: 1,
        dataEndRowIndex: Math.max(1, catalogData.nonQuotaLabor.length)
      },
      nonQuotaMachine: {
        records: catalogData.nonQuotaMachine,
        startColumnIndex: 12, // 非定额机械数据从第12列开始
        dataStartRowIndex: 1,
        dataEndRowIndex: Math.max(1, catalogData.nonQuotaMachine.length)
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
    // 0: { w: 184 }, // 定额人工名称
    // 1: { w: 132 }, // 定额人工数量
    // 2: { w: 132 }, // 定额人工工日
    // 3: { w: 132 }, // 定额人工工作量
    // 4: { w: 132 }, // 定额人工单价
    // 5: { w: 240 }, // 定额人工价格来源
    // 6: { w: 240 }, // 定额人工数量来源
    // 8: { w: 184 }, // 定额机械名称
    // 9: { w: 132 }, // 定额机械数量
    // 10: { w: 132 }, // 定额机械工日
    // 11: { w: 132 }, // 定额机械工作量
    // 12: { w: 132 }, // 定额机械单价
    // 13: { w: 240 }, // 定额机械价格来源
    // 14: { w: 240 }, // 定额机械数量来源
    // 16: { w: 184 }, // 非定额人工名称
    // 17: { w: 132 }, // 非定额人工数量
    // 18: { w: 132 }, // 非定额人工工日
    // 19: { w: 132 }, // 非定额人工工作量
    // 20: { w: 132 }, // 非定额人工单价
    // 21: { w: 240 }, // 非定额人工价格来源
    // 22: { w: 240 }, // 非定额人工数量来源
    // 24: { w: 184 }, // 非定额机械名称
    // 25: { w: 132 }, // 非定额机械数量
    // 26: { w: 132 }, // 非定额机械工日
    // 27: { w: 132 }, // 非定额机械工作量
    // 28: { w: 132 }, // 非定额机械单价
    // 29: { w: 240 }, // 非定额机械价格来源
    // 30: { w: 240 } // 非定额机械数量来源

    0: { w: 184 }, // 定额人工名称
    1: { w: 132 }, // 定额人工单价
    2: { w: 240 }, // 定额人工价格来源
    4: { w: 184 }, // 定额机械名称
    5: { w: 132 }, // 定额机械单价
    6: { w: 240 }, // 定额机械价格来源
    8: { w: 184 }, // 非定额人工名称
    9: { w: 132 }, // 非定额人工单价
    10: { w: 240 }, // 非定额人工价格来源
    12: { w: 184 }, // 非定额机械名称
    13: { w: 132 }, // 非定额机械单价
    14: { w: 240 } // 非定额机械价格来源
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
     * 构建主表查找公式
     * 用于从查找表获取单价和价格来源
     * @param {string} sectionKey - 分区键
     * @param {number} rowNumber - 行号
     * @param {number} returnColumnIndex - 返回列索引
     * @returns {string} VLOOKUP公式
     */
    function buildPrimaryLookupCellFormula(sectionKey, rowNumber, returnColumnIndex) {
      const lookupSection = lookupLayout.sections[sectionKey]
      const tableRangeReference = buildSheetRangeReference(
        lookupSheetName,
        lookupSection.dataStartRowIndex + 1,
        lookupSection.startColumnIndex,
        lookupSection.dataEndRowIndex + 1,
        lookupSection.startColumnIndex + 2
      )
      return buildLookupFormula(buildCellReference(rowNumber, NAME_COLUMN_INDEX), tableRangeReference, returnColumnIndex)
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
            // setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.unitprice, paletteStyles.number))
            // 价格来源列：没值时使用VLOOKUP公式从查找表获取，有值手动填写
            if (record && record.unitprice && record.unitprice !== '' && record.unitprice !== null && record.unitprice !== undefined) {
              setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.unitprice, paletteStyles.number))
            } else {
              setPrimaryCell(
                rowIndex,
                columnIndex,
                createFormulaCell(buildPrimaryLookupCellFormula(sectionKey, rowIndex + 1, 2), paletteStyles.number)
              )
            }
          } else if (columnIndex === PRICE_SOURCE_COLUMN_INDEX) {
            // setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.unitprice, paletteStyles.number))
            // 价格来源列：没值时使用VLOOKUP公式从查找表获取，有值手动填写
            if (record && record.pricesource !== '' && record.pricesource !== null && record.pricesource !== undefined) {
              setPrimaryCell(rowIndex, columnIndex, createValueCell(record && record.pricesource, paletteStyles.center))
            } else {
              setPrimaryCell(
                rowIndex,
                columnIndex,
                createFormulaCell(buildPrimaryLookupCellFormula(sectionKey, rowIndex + 1, 3), paletteStyles.center)
              )
            }
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
        // 施工工具用具使用费：定额基价 × 费率1.88%
        row: q.tooling,
        formula: `=IF(G${q.base.rowIndex + 1}="","",G${q.base.rowIndex + 1}*C${q.tooling.rowIndex + 1})`,
        extraCells: { 2: 0.0188} // 第2列（数量列）填充费率
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
        extraCells: { 2: 0.273, 3: 1.05 } // 第2列费率，第3列调整系数
      },
      {
        // 住房公积金：人工小计 × 费率12% × 调整系数1.15
        row: q.housingFund,
        formula: `=IF(G${q.laborSubtotal.rowIndex + 1}="","",G${q.laborSubtotal.rowIndex + 1}*C${q.housingFund.rowIndex + 1}*D${
          q.housingFund.rowIndex + 1
        })`,
        extraCells: { 2: 0.12, 3: 1.05 }
      },
      {
        // 企业管理费：定额基价 × 费率24.69%
        row: q.enterpriseManage,
        formula: `=IF(G${q.base.rowIndex + 1}="","",G${q.base.rowIndex + 1}*C${q.enterpriseManage.rowIndex + 1})`,
        extraCells: { 2: 0.2469 }
      },
      {
        // 利润：定额基价 × 费率3.52%
        row: q.profit,
        formula: `=IF(G${q.base.rowIndex + 1}="","",G${q.base.rowIndex + 1}*C${q.profit.rowIndex + 1})`,
        extraCells: { 2: 0.0352 }
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

  // 创建查找Sheet（隐藏）
  const lookupSheet = createSheetModel({
    id: lookupSheetId,
    name: lookupSheetName,
    rowCount: lookupLayout.rowCount,
    rowData: { 0: { h: 28 } },
    mergeData: [],
    columnCount: 17,
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

  // 填充定额人工、定额机械、非定额人工名称、非定额机械名称的价格数据
  ;[
    { sectionKey: 'quotaLabor', headerLabel: '定额人工名称' },
    { sectionKey: 'quotaMachine', headerLabel: '定额机械名称' },
    { sectionKey: 'nonQuotaLabor', headerLabel: '非定额人工名称' },
    { sectionKey: 'nonQuotaMachine', headerLabel: '非定额机械名称' }
  ].forEach(({ sectionKey, headerLabel }) => {
    const lookupSection = lookupLayout.sections[sectionKey]
    const records = lookupSection.records
    const startColumnIndex = lookupSection.startColumnIndex

    // 设置表头
    setLookupCell(0, startColumnIndex, createTextCell(headerLabel, 'header'))
    // setLookupCell(0, startColumnIndex + 1, createTextCell('数量', 'header'))
    // setLookupCell(0, startColumnIndex + 2, createTextCell('工日', 'header'))
    // setLookupCell(0, startColumnIndex + 3, createTextCell('工作量', 'header'))
    setLookupCell(0, startColumnIndex + 1, createTextCell('单价(元)', 'header'))
    setLookupCell(0, startColumnIndex + 2, createTextCell('价格来源', 'header'))
    // setLookupCell(0, startColumnIndex + 6, createTextCell('数量来源', 'header'))

    // 填充数据行
    records.forEach((record, index) => {
      const rowIndex = lookupSection.dataStartRowIndex + index
      setLookupCell(rowIndex, startColumnIndex, createTextCell(record.xmmc || '', 'orangeLeft'))
      // setLookupCell(rowIndex, startColumnIndex, createTextCell(record.xmmc, 'orangeLeft'))
      // setLookupCell(rowIndex, startColumnIndex + 1, createValueCell(record.xmnum, 'orangeNumber'))
      // setLookupCell(rowIndex, startColumnIndex + 2, createTextCell(record.workday, 'orangeNumber'))
      // setLookupCell(rowIndex, startColumnIndex + 3, createValueCell(record.workload, 'orangeNumber'))
      setLookupCell(rowIndex, startColumnIndex + 1, createTextCell(record.unitprice, 'orangeNumber'))
      setLookupCell(rowIndex, startColumnIndex + 2, createValueCell(record.pricesource, 'orangeLeft'))
      // setLookupCell(rowIndex, startColumnIndex + 6, createTextCell(record.numsource, 'orangeLeft'))
    })
  })

  // 填充定额人工、定额机械、非定额人工名称、非定额机械名称的的数量来源数据
  ;[
    { sectionKey: 'quotaLabor', headerLabel: '定额人工名称' },
    { sectionKey: 'quotaMachine', headerLabel: '定额机械名称' },
    { sectionKey: 'nonQuotaLabor', headerLabel: '非定额人工名称' },
    { sectionKey: 'nonQuotaMachine', headerLabel: '非定额机械名称' }
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

    // 为定额人工、定额机械、非定额人工、非定额机械分区分别设置下拉
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

    // 为定额人工、定额机械、非定额人工、非定额机械分区分别设置下拉
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
  workbookTotal.value.length = 0
  const workbook = getActiveWorkbook()
  const sheets = workbook.getSheets()
  sheets.forEach((sheet) => {
    const sheetSnapshot = sheet.getSheet().getSnapshot()
    sheet.newid = sheetSnapshot?.id
    sheet.newname = sheetSnapshot?.name
    const cellData = sheetSnapshot.cellData || {}
    const lastValue = Object.values(cellData).pop()
    const decsjg = lastValue?.[6]
    sheet.decsjg = decsjg ? decsjg?.v : '0'
  })
  const tableData = []
  currentImportedData.value.forEach((item, index) => {
    const workSheet = sheets.filter((recod) => item.sheetid == recod.newid)
    if (workSheet.length == 0) {
      item.isDEl = true
    } else {
      const layout = createPrimarySheetLayout(item.datalist)
      const snapshot = createEmptyImportedZBData()
      snapshot[0].sheetid = workSheet[0].newid
      snapshot[0].sheetname = workSheet[0].newname
      workbookTotal.value.push({
        xmid: userInfo.value.xmid,
        sheetid: workSheet[0].newid,
        sheetname: workSheet[0].newname,
        decsjg: workSheet[0].decsjg
      })
      // 遍历人工和机械分区
      SECTION_ORDER.forEach((sectionKey) => {
        const sectionLayout = layout.sections[sectionKey]
        for (let rowIndex = sectionLayout.detailStartRowIndex; rowIndex <= sectionLayout.detailEndRowIndex; rowIndex += 1) {
          // 收集单元格数据
          snapshot[0].datalist[sectionKey].push({
            lx:
              sectionKey == 'quotaLabor'
                ? '定额人工'
                : sectionKey == 'quotaMachine'
                ? '定额机械'
                : sectionKey == 'nonQuotaLabor'
                ? '非定额人工'
                : '非定额机械',
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

const { fetchDetailQuota, fetchCatalogQuota, fetchSourcefourZeroSix, queryInfoById } = initApi()

async function handleLoadDataFromApi() {
  try {
    isLoadingData.value = true

    // 同时获取明细数据和价格库数据
    const [detailResult, catalogResult, dataResult] = await Promise.all([
      fetchDetailQuota(userInfo.value.xmid),
      fetchCatalogQuota(),
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
      datalist.push(
        ...tabledata[0].datalist.quotaLabor,
        ...tabledata[0].datalist.quotaMachine,
        ...tabledata[0].datalist.nonQuotaLabor,
        ...tabledata[0].datalist.nonQuotaMachine
      )
    }
  })
  // 排除名称为空的数据
  const filterNoName = datalist.filter((item) => item.xmmc != '')
  if (filterNoName.length == 0) return ElMessage.warning('请维护定额测算后提交！')

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
  updateDyDe([...workbookTotal.value])
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
    updateDyDe([...workbookTotal.value])
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
    title: '定额测算清单',
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
}

// 查询项目信息
const queryInfo = async () => {
  let xmDeatil = await queryInfoById(userInfo.value.xmid, userInfo.value.creatorAccount)
  xmInfo.value = xmDeatil
  isEidt.value = ((xmInfo.value.editFlag == '1' && xmInfo.value.zxcsstatus == '0') || userInfo.value.isAdministrator) && !userInfo.value.handler
  isNum.value = await getPbulicCode(xmDeatil.dept)
}

const handleDE = () => {
  const str = encrypt(
    JSON.stringify({
      xmid: userInfo.value.xmid,
      creatorAccount: userInfo.value.creatorAccount,
      deptId: userInfo.value.deptId,
      dwId: userInfo.value.dwId,
      spRoleId: userInfo.value.spRoleId,
      handler: userInfo.value.handler
    })
  )
  router.push({
    name: '/service/xmcs/xscs',
    query: {
      xmcsParams: str
    }
  })
}

//导出
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

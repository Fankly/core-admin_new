<template>
  <div class="container" v-if="pageInfo.isShowPage">
    <div class="operation">
      <div class="left">
        <el-button :loading="gridOptions.loading" v-permission="'EXPORT'" size="small" plain type="primary" @click="exportDataHandle"
          >导 出
        </el-button>
        <el-button :loading="gridOptions.loading" v-permission="'TIMER'" size="small" plain type="primary" @click="timerHandle"
          >执行定时任务
        </el-button>
        <el-button v-if="canViewDetail" :loading="gridOptions.loading" size="small" plain type="primary" @click="viewDetailHandle()"
          >查看明细
        </el-button>
        <el-button v-if="canBackOverview" :loading="gridOptions.loading" size="small" plain type="primary" @click="backOverviewHandle">
          返 回
        </el-button>
        <el-button v-permission="'TB'" :loading="gridOptions.loading" size="small" plain type="primary" @click="handleTb">同 比 </el-button>
        <el-button v-permission="'HB'" :loading="gridOptions.loading" size="small" plain type="primary" @click="handleHb">环 比 </el-button>
        <el-button v-permission="'VIEWREPORT'" :loading="gridOptions.loading" size="small" plain type="primary" @click="viewReportHandle">
          查看分析报告
        </el-button>
      </div>
      <div class="right">
        <div class="year">
          <span class="unit-wanyuan">单位：万元</span>
          <span class="xsws-label">小数位数：</span>
          <el-select @change="handleChangeXswsData" v-model="formData.xsws" style="width: 60px">
            <el-option v-for="item in formList.XSWS" :key="item.code" :value="item.code" :label="item.name"></el-option>
          </el-select>
        </div>
        <div class="help">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="table-main">
      <div class="form">
        <el-form label-position="right" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="预算期间：">
                <el-date-picker
                  :disabled-date="disabledTime"
                  style="width: 100%"
                  @change="changeMonthHandle"
                  value-format="YYYY-MM"
                  :clearable="false"
                  v-model="formData.ysqj"
                  type="month"
                  placeholder="请选择日期"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级单位：">
                <el-select
                  :disabled="yjdwDisabled"
                  style="width: 100%"
                  v-model="formData.yjdw"
                  clearable
                  placeholder="请选择"
                  @change="changeYjdwDataHandle"
                >
                  <el-option v-for="item in formList.yjdwList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="二级单位：">
                <el-select
                  :disabled="ejdwDisabled"
                  style="width: 100%"
                  v-model="formData.ejdw"
                  clearable
                  placeholder="请选择"
                  @change="changeEjdwDataHandle"
                >
                  <el-option v-for="item in formList.ejdwList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门：">
                <el-select
                  :disabled="gkbmDisabled"
                  style="width: 100%"
                  v-model="formData.gkbm"
                  clearable
                  placeholder="请选择"
                  @change="changeGkbmDataHandle"
                >
                  <el-option v-for="item in formList.gkbmList" :key="item.deptCode" :label="item.deptName" :value="item.deptCode"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="指标项：">
                <el-select multiple collapse-tags clearable v-model="formData.sjx" style="width: 100%">
                  <el-option :key="item.value" v-for="item in sjxOptions" :label="item.label" :value="item.value"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <div class="search">
                <el-button :loading="gridOptions.loading" size="small" plain type="primary" @click="getDataHandle">查 询 </el-button>
                <el-button :loading="gridOptions.loading" size="small" plain type="primary" @click="resetDataHandle">重 置 </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="table">
        <vxe-grid ref="gridRef" class="mytable-style" :rowClassName="rowClassName" v-bind="gridOptions" @cell-click="cellClickHandle"></vxe-grid>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
  <TbhbModal ref="tbhbModalRef" />
  <FxbgModal ref="fxbgModalRef" />
</template>

<script lang="ts">
export default {
  name: '/statistics/yszxfx'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import { getDeptList, getDynamicColumn, getInitData, updateTimer, ztqk } from '@/api/statistics/yszxfx'
import { computed, h, onMounted, reactive, ref } from 'vue'
import { VxeGridProps, VxeTableDefines, VxeGridPropTypes, VxeTablePropTypes } from 'vxe-table'
import Decimal from 'decimal.js'
import { formatNumValue } from '@/utils/utils'
import { ElMessage, ElTooltip } from 'element-plus'
import { getEjdwList, getYjdwList } from '@/api/matter'
import { getPublicCodeList } from '@/api/common'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import TbhbModal from './components/TbhbModal/index.vue'
import FxbgModal from './components/FxbgModal/index.vue'
import { vxeExportFormulaHandle } from '@/utils/export'
import type { FormulaConfig, SumFormulaConfig, SumRangeSpec, InlineSumConfig, InlineSumOptions, RankFormulaConfig, RankSpec } from '@/utils/export'

type otherColumn = {
  id: string
  isleaf: number
  needFormat: boolean
  parentId: string
  isNeedTotal: number
}

type OrgInfo = {
  attrCode: string
  cropId: string
  deptId: string
  dwName: string
  isZsdw: string
  orgFlag: string
  dwInfos: string[]
}

type Column = VxeTableDefines.ColumnOptions & otherColumn
type Columns = VxeGridPropTypes.Columns & otherColumn[]

interface RowVo {
  [key: string]: any
}

interface ListValue {
  code: string
  name: string
}

interface GkbmValue {
  deptCode: string
  deptName: string
}

interface List {
  yjdwList: ListValue[]
  ejdwList: ListValue[]
  XSWS: ListValue[]
  gkbmList: GkbmValue[]
}

const orgInfo = ref<OrgInfo>({
  attrCode: '',
  cropId: '',
  deptId: '',
  dwName: '',
  isZsdw: '',
  orgFlag: '',
  dwInfos: []
})
const userDialogRef = ref()
const helpModalRef = ref()
const gridRef = ref()
const tbhbModalRef = ref()
const fxbgModalRef = ref()
const userInfo = ref<any>()
const pageInfo = reactive({
  isShowPage: false
})

const yjdwDisabled = computed(() => orgInfo.value.attrCode !== 'BM_CWZC' || orgInfo.value.orgFlag !== 'PROVINCE')
const ejdwDisabled = computed(() => orgInfo.value.attrCode !== 'BM_CWZC' || orgInfo.value.orgFlag === 'COUNTY')
const gkbmDisabled = computed(() => orgInfo.value.attrCode !== 'BM_CWZC')
const isDetailMode = ref(false)
const isCityOrCounty = computed(() => ['CITY', 'COUNTY'].includes(orgInfo.value.orgFlag))
const canViewDetail = computed(() => isCityOrCounty.value && !isDetailMode.value)
const canBackOverview = computed(() => isCityOrCounty.value && isDetailMode.value)
const isCityOrCountyOverview = computed(() => isCityOrCounty.value && !isDetailMode.value)

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const handleChangeXswsData = () => {
  getDataHandle()
}

const formList = reactive<List>({
  yjdwList: [],
  ejdwList: [],
  XSWS: [],
  gkbmList: []
})

// 指标项选项（硬编码，非公共码）：目标值/完成值/立项值/完成率/立项率
const sjxOptions = [
  { label: '目标值', value: 'MBZ' },
  { label: '完成值', value: 'WCZ' },
  { label: '立项值', value: 'LXZ' },
  { label: '完成率', value: 'WCL' },
  { label: '立项率', value: 'LXL' }
]

const formData = reactive<any>({
  month: '',
  year: '',
  ysqj: '',
  cxjb: '',
  yjdw: '',
  ejdw: '',
  xsws: '',
  gkbm: '',
  sjx: ['MBZ', 'WCZ', 'WCL']
})

const diabledDate = ref('')
const dwType = ref<ListValue[]>([])

const footerValue = ref<RowVo[]>([])

const flatColumns = reactive<Columns>([])

const getExportLeafColumns = (columns: any[] = []): any[] => {
  return columns.reduce((acc: any[], column: any) => {
    if (!column) return acc
    if (Array.isArray(column.children) && column.children.length !== 0) {
      acc.push(...getExportLeafColumns(column.children))
    } else {
      acc.push(column)
    }
    return acc
  }, [])
}

// 比率列后缀 → 分子字段后缀；分母统一为目标值 Mbz（与 caclWclSum 的 RATE_SUFFIX_MAP 对齐）
const RATE_NUMERATOR_SUFFIX: Record<string, string> = {
  Wcl: 'Wcz', // 完成率 = 完成值 / 目标值
  Lxl: 'Lxz' // 立项率 = 立项值 / 目标值
}

// 根据当前动态列构造导出公式配置：对每个以 Wcl 结尾的完成率叶子列，
// 推导兄弟列 {base}Wcz / {base}Mbz，按 exact 模式写入 IFERROR(Wcz/Mbz*100,"-")。
// 列字段为 camelCase 且不含 `_`，suffix 模式无法匹配，故必须用 exact。
const buildFormulaConfig = (columns: any[]): FormulaConfig | undefined => {
  const leaves = getExportLeafColumns(columns)
  const cfg: FormulaConfig = {}
  leaves.forEach((col: any) => {
    const field = String(col?.field || '')
    if (!field) return
    for (const suffix in RATE_NUMERATOR_SUFFIX) {
      if (field.endsWith(suffix)) {
        const base = field.slice(0, -suffix.length)
        if (!base) break
        cfg[field] = {
          type: 'ratio',
          valueField: `${base}${RATE_NUMERATOR_SUFFIX[suffix]}`,
          targetField: `${base}Mbz`,
          skipField: `${base}Mbz`,
          matchMode: 'exact'
        }
        break
      }
    }
  })
  return Object.keys(cfg).length > 0 ? cfg : undefined
}

// 构造导出 SUM 公式配置：分组小计行 = 本组明细区间求和；合计行 = 全部明细 + 待分解 多区间求和。
// 仅对 needFormat && isNeedTotal===1 的值列（目标值/完成值/立项值等）写 SUM；比率列走 IFERROR 公式。
// 行判定：dwType === '-1' 标记小计/合计/待分解；dwName '合计' / '待分解' 区分最后两行。
// gridOptions.data 形如：[小计_1, 明细_1a, 明细_1b, ..., 小计_2, 明细_2a, ..., 待分解?, 合计]
const buildSumConfig = (columns: any[], data: RowVo[]): SumFormulaConfig | undefined => {
  if (!data || data.length === 0) return undefined
  const leaves = getExportLeafColumns(columns)
  const fields = leaves
    .filter((col: any) => col?.needFormat && Number(col?.isNeedTotal) === 1)
    .map((col: any) => String(col.field || ''))
    .filter(Boolean)
  if (fields.length === 0) return undefined

  // 行分类：detail=普通明细行（dwType !== '-1'）；subtotal=分组小计（dwType='-1' 且非 合计/待分解）；
  // dfj=待分解（dwName='待分解'）；total=合计（dwName='合计'）
  const isTotal = (r: RowVo) => r?.dwType === '-1' && String(r?.dwName || '') === '合计'
  const isDfj = (r: RowVo) => r?.dwType === '-1' && String(r?.dwName || '') === '待分解'
  const isSubtotal = (r: RowVo) => r?.dwType === '-1' && !isTotal(r) && !isDfj(r)
  const isDetail = (r: RowVo) => r?.dwType !== '-1'

  const items: SumRangeSpec[] = []

  // 分组小计：小计行 i 的明细区间为紧随其后直到下一个 '-1' 行之前的连续 detail 行
  for (let i = 0; i < data.length; i++) {
    if (!isSubtotal(data[i])) continue
    let j = i + 1
    while (j < data.length && isDetail(data[j])) j++
    if (j - 1 >= i + 1) {
      items.push({ rowIndex: i, detailRanges: [[i + 1, j - 1]] })
    }
  }

  // 合计行：明细 + 待分解 多区间相加（跨过中间小计行避免双重计数）
  const totalIdx = data.findIndex(isTotal)
  if (totalIdx >= 0) {
    const ranges: [number, number][] = []
    // 1) 连续 detail 段
    let k = 0
    while (k < totalIdx) {
      if (!isDetail(data[k])) {
        k++
        continue
      }
      let m = k
      while (m < totalIdx && isDetail(data[m])) m++
      ranges.push([k, m - 1])
      k = m
    }
    // 2) 待分解单点行（dwType 被改成 '-1'，需按 dwName 单独识别）
    for (let p = 0; p < totalIdx; p++) {
      if (isDfj(data[p])) ranges.push([p, p])
    }
    if (ranges.length > 0) {
      items.push({ rowIndex: totalIdx, detailRanges: ranges })
    }
  }

  return items.length > 0 ? { fields, items } : undefined
}

// 构造导出「成本小计」与「各类型合计」横向求和公式配置（依据动态列树结构）：
// 1) 各类型合计 {typePrefix}Hj{suffix}（如 jxywcbHjMbz）：该类型组下、所有非 Hj 子组中
//    以同 suffix 结尾的叶子列求和（即省级统筹/基层自主等子项）。
// 2) 成本小计 subtotal{suffix}：所有"类型组的非 Hj 子组"中以同 suffix 结尾的叶子列求和
//    （等价于各类型子项之和，不含 Hj 合计列本身，避免双计）。
// 依据树结构而非字段名硬匹配，自动跳过 zbx* / total* 等独立顶层列组（它们不是类型组、
//    没有 Hj 子组），不会被误纳入 subtotal 源。
// 列名后端定，动态跟随；后端没返回对应汇总列时返回 undefined（安全 no-op）。
// rowFilter 跳过分组/合计/待分解等聚合行（dwType === '-1'）：这些行的汇总值
// 由后端给出，不应被横向求和公式覆盖。
const SUBTOTAL_PREFIX = 'subtotal'
const HJ_MARKER = 'Hj' // 类型合计字段中的标识段，如 jxywcbHjMbz 中的 Hj
const INLINE_SUM_SUFFIXES = ['Mbz', 'Wcz', 'Lxz']

// 判断字段是否为「某类型合计 Hj 列」：形如 {typePrefix}Hj{suffix}，typePrefix 非空且不含 Hj
const isTypeHjField = (field: string, suffix: string): boolean => {
  if (!field || !suffix) return false
  const marker = `${HJ_MARKER}${suffix}`
  if (!field.endsWith(marker)) return false
  const prefix = field.slice(0, -marker.length)
  return !!prefix && !prefix.includes(HJ_MARKER)
}

// 遍历列树，找出所有「成本类型组」：顶层列组下含以 Mbz/Wcz/Lxz 结尾的求和叶子列。
// 两类纳入：
// 1) 有 Hj 子组的常规类型组（如「本月应完成成本」含 jxywcbHjMbz）：typePrefix 由 Hj 字段反推，subLeafFields = 该组所有非 Hj 子组叶子。
// 2) 无 Hj 子组的顶层成本组（如「研究开发成本」无合计子组）：typePrefix 留空，subLeafFields = 该组全部直接子组叶子。
//    step 1) 各类型合计因 hasTarget 防护对空 typePrefix 自动 no-op；step 2) 成本小计 subtotal 照常多收其叶子，
//    否则会漏算该类型组（用户反馈「研究开发成本下没有合计，但成本小计没把它算进去」即此情形）。
// guard：要求至少一片「以 Mbz/Wcz/Lxz 结尾且非 Hj 列」的叶子，避免 zbx/total/subtotal 等顶层组被误纳入。
const collectTypeGroups = (columns: any[]): { typePrefix: string; subLeafFields: string[] }[] => {
  const groups: { typePrefix: string; subLeafFields: string[] }[] = []
  if (!Array.isArray(columns)) return groups
  columns.forEach((col: any) => {
    if (!col || !Array.isArray(col.children) || col.children.length === 0) return
    // 该类型组的 Hj 子组（含 Hj 叶子字段）；无 Hj 子组时为 null
    let typePrefix = ''
    let hjSubGroup: any = null
    const nonHjSubGroups: any[] = []
    col.children.forEach((sub: any) => {
      if (!sub) return
      const subLeaves = getExportLeafColumns([sub])
      const hasHj = subLeaves.some((leaf: any) => {
        const f = String(leaf?.field || '')
        return INLINE_SUM_SUFFIXES.some((suffix) => isTypeHjField(f, suffix))
      })
      if (hasHj && !hjSubGroup) {
        hjSubGroup = sub
        // 反推 typePrefix：取首个 Hj 字段截掉 Hj+suffix 部分
        for (const suffix of INLINE_SUM_SUFFIXES) {
          const hjField = subLeaves.find((leaf: any) => isTypeHjField(String(leaf?.field || ''), suffix))
          if (hjField) {
            typePrefix = String(hjField.field).slice(0, -`${HJ_MARKER}${suffix}`.length)
            break
          }
        }
      } else {
        nonHjSubGroups.push(sub)
      }
    })
    const subLeafFields = nonHjSubGroups
      .flatMap((sub) => getExportLeafColumns([sub]))
      .map((leaf: any) => String(leaf?.field || ''))
      .filter(Boolean)
      // 排除成本小计 subtotal* 自身：它是 buildInlineSumConfig 的求和目标，不是求和源，
      // 若纳入会导致 subtotalMbz = SUM(...,subtotalMbz,...) 自引用 → Excel 循环引用报错
      .filter((f) => !f.startsWith(SUBTOTAL_PREFIX))
    // guard：该组至少有一片「以 Mbz/Wcz/Lxz 结尾且非 Hj 列」的叶子，才视为成本类型组
    const hasSumLeaf = subLeafFields.some(
      (f) => INLINE_SUM_SUFFIXES.some((suffix) => f.endsWith(suffix)) && !INLINE_SUM_SUFFIXES.some((suffix) => isTypeHjField(f, suffix))
    )
    if (!hasSumLeaf) return // 既无 Hj 子组也无求和叶子 → 非成本组（zbx/total/subtotal 等），跳过
    groups.push({ typePrefix, subLeafFields })
  })
  return groups
}

const buildInlineSumConfig = (columns: any[]): InlineSumOptions | undefined => {
  const leaves = getExportLeafColumns(columns)
  const typeGroups = collectTypeGroups(columns)
  const specs: InlineSumConfig = []

  // 1) 各类型合计 Hj 列：对每个类型组的 Hj 叶子列，源 = 该类型组非 Hj 子组的同 suffix 叶子列
  typeGroups.forEach(({ typePrefix, subLeafFields }) => {
    INLINE_SUM_SUFFIXES.forEach((suffix) => {
      const targetField = `${typePrefix}${HJ_MARKER}${suffix}` // 如 jxywcbHjMbz
      const hasTarget = leaves.some((c: any) => c?.field === targetField)
      if (!hasTarget) return
      const sourceFields = subLeafFields.filter((f) => f.endsWith(suffix) && !isTypeHjField(f, suffix))
      if (sourceFields.length === 0) return
      specs.push({ targetField, sourceFields })
    })
  })

  // 2) 成本小计 subtotal：源 = 所有类型组的非 Hj 子组中以同 suffix 结尾的叶子列（即各类型子项之和，
  //    不含 Hj 合计列本身，避免双计；不含 zbx/total 等独立顶层组的叶子）
  const allSubLeafFields = typeGroups.flatMap((g) => g.subLeafFields)
  INLINE_SUM_SUFFIXES.forEach((suffix) => {
    const targetField = `${SUBTOTAL_PREFIX}${suffix}` // subtotalMbz / subtotalWcz / subtotalLxz
    const hasTarget = leaves.some((c: any) => c?.field === targetField)
    if (!hasTarget) return
    const sourceFields = allSubLeafFields.filter((f) => f.endsWith(suffix) && !isTypeHjField(f, suffix) && f !== targetField)
    if (sourceFields.length === 0) return
    specs.push({ targetField, sourceFields })
  })

  if (specs.length === 0) return undefined
  return {
    config: specs,
    // 仅明细行（dwType !== '-1'）写横向求和公式；分组小计/合计/待分解保持原值
    rowFilter: (row: any) => row?.dwType !== '-1'
  }
}

// 排名列识别：成本小计组下的叶子列
//   省排名 = cbxSpm（field 以 'Spm' 结尾且不以 'Gdgspm' 结尾）
//   分组排名 = cbxGdgspm（field 以 'Gdgspm' 结尾）
// 完成率列固定为 'subtotalWcl'（成本小计完成率，本身已是 IFERROR(subtotalWcz/subtotalMbz*100,"-") 公式）。
// 省排名只对 dwType==='1' 的明细行赋名次（用户明确要求）；分组排名对所有明细行赋本组段名次。
// 后端没返回排名列时返回 undefined（安全 no-op）。
const PROVINCE_RANK_SUFFIX = 'Spm'
const GROUP_RANK_SUFFIX = 'Gdgspm'
const RANK_RATE_FIELD = 'subtotalWcl'

const buildRankFormulaConfig = (columns: any[]): RankFormulaConfig | undefined => {
  const leaves = getExportLeafColumns(columns)
  let spmField = ''
  let gdgspmField = ''
  leaves.forEach((col: any) => {
    const f = String(col?.field || '')
    if (!f) return
    if (f.endsWith(GROUP_RANK_SUFFIX)) gdgspmField = f
    else if (f.endsWith(PROVINCE_RANK_SUFFIX)) spmField = f
  })
  // 完成率列必须存在
  const hasRate = leaves.some((c: any) => c?.field === RANK_RATE_FIELD)
  if (!hasRate || (!spmField && !gdgspmField)) return undefined
  // 省排名完成率现算：subtotalWcl 是导出公式列，row 无 JS 值，故从各类型组子项叶子
  // 求和现算（= 所有成本子项完成值之和 / 目标值之和 * 100，与 subtotalWcl 公式同源）
  const typeGroups = collectTypeGroups(columns)
  const sumLeaf = (row: any, suffix: string): number => {
    const fields = typeGroups.flatMap((g) => g.subLeafFields).filter((f) => f.endsWith(suffix) && !f.startsWith(SUBTOTAL_PREFIX))
    return fields.reduce((acc, f) => {
      const n = Number(row?.[f])
      return Number.isFinite(n) ? acc + n : acc
    }, 0)
  }
  const rateCalc = (row: any): number | null => {
    const wcz = sumLeaf(row, 'Wcz')
    const mbz = sumLeaf(row, 'Mbz')
    if (!mbz) return null
    return Number(Decimal.div(wcz, mbz).mul(100).toFixed(2))
  }
  const specs: RankSpec[] = []
  if (spmField) specs.push({ field: spmField, rateField: RANK_RATE_FIELD, scope: 'global', rankFieldHasValue: true, rateCalc })
  if (gdgspmField) specs.push({ field: gdgspmField, rateField: RANK_RATE_FIELD, scope: 'segment' })
  return specs.length > 0 ? { specs } : undefined
}

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  columnConfig: {
    resizable: true
  },
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  size: 'mini'
})

const rowClassName: VxeTablePropTypes.RowClassName<RowVo> = ({ row }: { row: RowVo }) => {
  const classNames: string[] = []
  if (row.dwType === '-1') {
    classNames.push('col-font')
  }

  if (canViewDetail.value && isValidDetailRow(row)) {
    classNames.push('row-clickable')
  }

  return classNames.length ? classNames.join(' ') : null
}

// 公式提示表头：标题 + 问号图标，hover 弹出公式（el-tooltip 的 popper 默认 append 到 body，不受弹窗 overflow 裁剪）
const renderFormulaHeader = (title: string, formula: string) => {
  return () =>
    h(
      ElTooltip,
      { effect: 'dark', placement: 'top', content: formula },
      {
        default: () => h('span', { style: 'display: inline-flex; align-items: center; gap: 2px' }, [title])
      }
    )
}

const getDynamicHeader = async () => {
  gridOptions.loading = true
  if (gridOptions.columns) gridOptions.columns.length = 0
  let params: any = {
    dwId: userInfo.value.org_id,
    ...getRequestFormData()
  }
  let res = await getDynamicColumn(params)
  if (res.success) {
    try {
      await editDynamicColumnData(res.data)
    } catch (error) {
      console.error('发生错误', error)
    } finally {
      // 表头公式提示：仅对带 tipContent 的叶子列挂表头 tooltip
      getExportLeafColumns(res.data).forEach((col: any) => {
        const tip = col?.tipContent
        if (tip) {
          col.slots = col.slots || {}
          col.slots.header = renderFormulaHeader(col.title, String(tip))
        }
      })
      gridOptions.columns = getDisplayColumns(res.data) as any
      gridOptions.loading = false
    }
  } else {
    ElMessage.error(res.msg)
  }
}

const getDynamicData = async () => {
  gridOptions.loading = true
  footerValue.value.length = 0
  if (gridOptions.data && gridOptions.data.length !== 0) gridOptions.data.length = 0
  const requestFormData = getRequestFormData()
  const { ysqj, month, ...rest } = requestFormData
  let newMonth = Number(month).toString()
  let params: any = {
    dwId: userInfo.value.org_id,
    ...rest,
    month: newMonth
  }
  let res = await ztqk(params)
  if (res.success) {
    operationData(getCurrentOrgOverviewData(res.data))
    gridOptions.loading = false
  } else {
    gridOptions.loading = false
    ElMessage.error(res.msg)
  }
}

const getRequestFormData = () => {
  if (!isCityOrCountyOverview.value) return { ...formData }
  return {
    ...formData,
    indicators: formData.sjx.join(','),
    cxjb: '0',
    yjdw: '',
    ejdw: '',
    gkbm: ''
  }
}

const getDisplayColumns = (columns: Columns) => {
  if (!isCityOrCountyOverview.value) return columns
  return columns.filter((item: Column) => item.field !== 'rownumber') as Columns
}

const getCurrentOrgOverviewData = (data: RowVo[] = []) => {
  if (!isCityOrCountyOverview.value || data.length === 0) return data
  const footerRows = data.filter((item) => item.dwName === '待分解')
  const currentRows = data.filter((item) => item.dwName !== '待分解' && isCurrentOrgRow(item))
  if (currentRows.length !== 0) {
    return currentRows //.concat(footerRows)
  }
  return []
}

const getOrgDwInfos = () => {
  return Array.isArray(orgInfo.value.dwInfos) ? orgInfo.value.dwInfos : []
}

const isCurrentOrgRow = (row: RowVo) => {
  const currentIds = [userInfo.value?.org_id, userInfo.value?.specialorgid, orgInfo.value.cropId, ...getOrgDwInfos()]
    .filter(Boolean)
    .map((item) => item.toString())
  const currentNames = [userInfo.value?.org_name, userInfo.value?.specialorgname, userInfo.value?.name, orgInfo.value.dwName]
    .filter(Boolean)
    .map((item) => item.toString())
  const rowCode = (row.dwCode || row.dwId || row.orgId || row.id || '').toString()
  const rowName = row.dwName ? row.dwName.toString() : ''
  return currentIds.includes(rowCode) || currentNames.some((name) => rowName.includes(name) || name.includes(rowName))
}

const isValidDetailRow = (row?: RowVo) => {
  if (!row) return false
  if (row.dwType === '-1') return false
  return !['合计', '待分解'].includes(row.dwName)
}

const getFirstValidDetailRow = () => {
  return gridOptions.data?.find((row: RowVo) => isValidDetailRow(row))
}

const operationData = (data: RowVo[]) => {
  let columnsItems: Column[] = []
  let columnsItemsFields: string[] = []
  let wclColumnsItems: Column[] = []
  let wclColumnsItemsFields: string[] = []
  flatColumns.forEach((column: Column) => {
    if (column.needFormat) {
      columnsItems.push(column)
      columnsItemsFields.push(column.field as string)
    }
    if (column.needFormat && Number(column.isNeedTotal) === 0) {
      wclColumnsItems.push(column)
      wclColumnsItemsFields.push(column.field as string)
    }
  })
  if (data && data.length !== 0) {
    footerValue.value = data.slice(data.length - 1).filter((item) => item.dwName === '待分解')
    let allData = Object.values(addDataMergeData(data, columnsItemsFields)).flat()
    if (!formData.yjdw || isCityOrCountyOverview.value) gridOptions.data = allData
    else
      gridOptions.data = Object.values(addDataMergeData(data, columnsItemsFields))
        .flat()
        .filter((item) => item.dwType !== '-1')
    let calcValueArr = allData.filter((item: RowVo) => item.dwType === '-1')
    let sumValueArr = allData.filter((item: RowVo) => item.dwType === '-1')
    let dfjValue = footerValue.value.find((item) => item.dwName === '待分解')
    if (dfjValue) sumValueArr.push(dfjValue as RowVo)
    caclWclSum(calcValueArr, wclColumnsItems)
    let sum = clearObjectOptimized(sumValueArr[0], 'dwName', '合计')
    sumValueArr.reduce((acc: Record<string, RowVo[]>, item) => {
      // 小计
      for (const key in item) {
        if (columnsItemsFields.includes(key)) {
          sum[key] = calcTotalSum(sum, item, key)
        }
      }
      return acc
    }, {})
    caclWclSum(sum, wclColumnsItems)
    footerValue.value.push(sum)
    footerValue.value.forEach((item) => {
      let needFormatArr = flatColumns.filter((item: Column) => item.needFormat)
      let fields = needFormatArr.map((item: Column) => item.field)
      // 比率列（完成率 Wcl/立项率 Lxl）固定两位小数，其余按用户选择的小数位数
      const upperFields = fields.map((f) => (f || '').toUpperCase())
      for (const key in item) {
        if (key === 'dwName') continue
        if (key === 'dwType') {
          item[key] = '-1'
        } else {
          const isRate =
            upperFields.includes((key || '').toUpperCase()) &&
            ((key || '').toUpperCase().endsWith('WCL') || (key || '').toUpperCase().endsWith('LXL'))
          item[key] = fields.includes(key) ? formatNumValue(item[key] + '', isRate ? 2 : Number(formData.xsws.split('_')[1])) : ''
        }
      }
    })
    footerValue.value.forEach((item) => {
      gridOptions.data?.push(item)
    })
  }
}

// 动态列修改
const editDynamicColumnData = async <T extends VxeGridPropTypes.Columns & otherColumn[]>(data: T) => {
  for (const item of data as Column[]) {
    flatColumns.push(item)
    if (item.children && item.children.length !== 0) {
      await editDynamicColumnData(item.children as Columns)
    }
    if (item.field === 'rownumber' || item.field === 'dwName') {
      item.fixed = 'left'
    }
    if (item.field !== 'rownumber' && item.field !== 'dwName' && !item.needFormat) {
      item.formatter = ({ cellValue }: any) => {
        if (cellValue === 0) return '-'
        return cellValue
      }
    } else if (item.field && (item.field.toUpperCase().includes('WCL') || item.field.toUpperCase().includes('LXL')) && item.needFormat) {
      item.align = 'center'
      item.headerAlign = 'center'
      item.formatter = ({ cellValue }: any) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '0.00'
        return formatNumValue(cellValue.toString(), 2)
      }
    } else if (item.needFormat) {
      item.align = 'right'
      item.headerAlign = 'center'
      item.formatter = ({ cellValue }: any) => {
        if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '')
          return formatNumValue('0', Number(formData.xsws.split('_')[1]))
        return formatNumValue(cellValue.toString(), Number(formData.xsws.split('_')[1]))
      }
    }
  }
}

// 数据操作
const addDataMergeData = (data: RowVo[] = [], columnsItemsFields: string[]) => {
  const getInitalData = (item: RowVo): RowVo => {
    if (dwType.value.length > 0) {
      const matchedItem = dwType.value.find((data) => data.code === item.dwType)
      if (matchedItem) {
        return {
          dwName: matchedItem.name,
          dwType: '-1'
        } as RowVo
      }
    }
    return {
      dwName: '其他',
      dwType: '-1'
    } as RowVo
  }
  return data.reduce((acc: Record<string, RowVo[]>, item) => {
    if (item.dwType) {
      acc[item.dwType] = acc[item.dwType] || []
      if (acc[item.dwType].length === 0) {
        acc[item.dwType].push(getInitalData(item))
      }
      // 小计
      const totalItem = acc[item.dwType][0]
      for (const key in item) {
        if (columnsItemsFields.includes(key)) totalItem[key] = calcTotalSum(totalItem, item, key)
      }
      acc[item.dwType].push(item)
    }
    return acc
  }, {})
}

// 自动计算合计
const calcTotalSum = <T extends keyof RowVo>(totalItem: RowVo, item: RowVo, columnKey: T) => {
  let itemDec = new Decimal(item[columnKey]).toFixed(Number(formData.xsws.split('_')[1]))
  let totalItemDec = new Decimal(totalItem[columnKey] ? totalItem[columnKey] : '0')
  totalItemDec = totalItemDec.add(itemDec)
  return totalItemDec.toString()
}

//自动计算完成率
const caclWclSum = (calcValueArr: RowVo[] | RowVo, wclColumnItems: Column[]) => {
  // 比率列后缀 → 对应的分子字段后缀；分母统一为目标值 Mbz
  const RATE_SUFFIX_MAP: Record<string, string> = {
    Wcl: 'Wcz', // 完成率 = 完成值 / 目标值
    Lxl: 'Lxz' // 立项率 = 立项值 / 目标值
  }
  const setWclValue = (row: RowVo) => {
    wclColumnItems.forEach((wclCol) => {
      const field = wclCol.field as string
      let baseField: string | null = null
      let numeratorField: string | null = null
      for (const suffix in RATE_SUFFIX_MAP) {
        if (field.endsWith(suffix)) {
          baseField = field.slice(0, -suffix.length)
          numeratorField = baseField + RATE_SUFFIX_MAP[suffix]
          break
        }
      }
      if (!baseField || !numeratorField) return
      const mbzField = baseField + 'Mbz'
      if (Number(row[numeratorField]) && Number(row[mbzField])) {
        row[field] = Decimal.div(row[numeratorField], row[mbzField]).mul(100).toFixed(2)
      } else {
        row[field] = '0.00'
      }
    })
  }
  if (Array.isArray(calcValueArr)) {
    calcValueArr.forEach((row) => {
      setWclValue(row)
    })
  } else {
    setWclValue(calcValueArr)
  }
}

/**
 * 清空对象,为某个值设置默认值
 * @param obj 操作对象
 * @param keyStr 设置值的key
 * @param value 需要设置的默认值
 */
const clearObjectOptimized = (obj: RowVo, keyStr: string, value: string) => {
  const newObj = { ...obj }
  Object.keys(newObj).forEach((key) => {
    if (key === keyStr) newObj[key] = value
    else newObj[key] = ''
  })
  return newObj
}

// 获取预算期间
const changeMonthHandle = (val: string) => {
  if (val) {
    const dateArr = val.split('-')
    formData.year = dateArr[0]
    formData.month = dateArr[dateArr.length - 1]
  }
}

// 获取一级单位数据
const getYjdwDataList = async (specialorgid: string) => {
  let res = await getYjdwList(specialorgid)
  if (res.success) {
    formList.yjdwList = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

// 获取二级单位数据
const getEjdwDataList = async (ejdw: string) => {
  let res = await getEjdwList({
    parentId: ejdw,
    specialorgid: userInfo.value.specialorgid
  })
  if (res.success) {
    formList.ejdwList = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

// 获取归口部门数据
const getGkbmDataList = async (ejdw: string) => {
  let res = await getDeptList(ejdw)
  if (res.success) {
    formList.gkbmList = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

// 设置日期
const disabledTime = (time: Date) => {
  return time.getFullYear() <= 2024
  // return false;
}

const changeYjdwDataHandle = async (yjdw: string) => {
  if (!yjdw) {
    formData.cxjb = '0'
    formData.ejdw = ''
    formList.ejdwList.length = 0
    formData.gkbm = ''
    formList.gkbmList.length = 0
    return
  }
  formData.cxjb = '1'
  await getEjdwDataList(yjdw)
}

const changeEjdwDataHandle = async (ejdw: string) => {
  if (!ejdw) {
    formData.cxjb = '1'
    formData.gkbm = ''
    formList.gkbmList.length = 0
    return
  }
  formData.cxjb = '2'
  await getGkbmDataList(ejdw)
}

const changeGkbmDataHandle = async (ejdw: string) => {
  if (!ejdw) {
    formData.cxjb = '2'
    return
  }
  formData.cxjb = '3'
}

const clearOrgFilterData = () => {
  formData.yjdw = ''
  formData.ejdw = ''
  formData.gkbm = ''
  formData.cxjb = '0'
  formList.ejdwList.length = 0
  formList.gkbmList.length = 0
}

const setRoleDefaultFilterData = async () => {
  clearOrgFilterData()
  if (yjdwDisabled.value && orgInfo.value.orgFlag !== 'COUNTY') formData.yjdw = orgInfo.value.cropId
  if (yjdwDisabled.value && orgInfo.value.orgFlag === 'COUNTY') {
    let yjdwValue = getOrgDwInfos().slice(-1)
    if (yjdwValue.length === 1) {
      formData.yjdw = yjdwValue.join(',')
    } else {
      formData.yjdw = formList.yjdwList.slice(-1).join(',')
    }
  }
  if (formData.yjdw) {
    await changeYjdwDataHandle(formData.yjdw)
  }
  if (ejdwDisabled.value && (orgInfo.value.orgFlag === 'COUNTY' || orgInfo.value.orgFlag === 'PROVINCE')) formData.ejdw = orgInfo.value.cropId
  if (ejdwDisabled.value && orgInfo.value.orgFlag === 'CITY') formData.ejdw = userInfo.value.org_id

  if (formData.ejdw) {
    await changeEjdwDataHandle(formData.ejdw)
    if (gkbmDisabled.value) getNameFindCode(userInfo.value.specialorgname)
  }
}

const applyRoleDetailFilterData = async () => {
  await setRoleDefaultFilterData()
}

const viewDetailHandle = async (row?: RowVo) => {
  if (!canViewDetail.value || gridOptions.loading) return
  const targetRow = row || getFirstValidDetailRow()
  if (!isValidDetailRow(targetRow)) {
    ElMessage.warning('暂无可查看明细的数据')
    return
  }
  isDetailMode.value = true
  await applyRoleDetailFilterData()
  await getDataHandle()
}

const cellClickHandle = async ({ row }: VxeTableDefines.CellClickParams) => {
  await viewDetailHandle(row as any)
}

const backOverviewHandle = async () => {
  if (!canBackOverview.value || gridOptions.loading) return
  isDetailMode.value = false
  await setRoleDefaultFilterData()
  await getDataHandle()
}

// 导出数据
const exportDataHandle = () => {
  const $table = gridRef.value
  const xsws = Number(formData.xsws.split('_')[1])
  const formulaConfig = buildFormulaConfig(gridOptions.columns)
  const sumConfig = buildSumConfig(gridOptions.columns, gridOptions.data)
  const inlineSumOptions = buildInlineSumConfig(gridOptions.columns)
  const rankFormulaConfig = buildRankFormulaConfig(gridOptions.columns)
  vxeExportFormulaHandle(
    $table,
    `预算执行分析(按单位)`,
    gridOptions.data,
    xsws,
    formulaConfig,
    { tbhbMode: true },
    sumConfig,
    inlineSumOptions,
    rankFormulaConfig
  )
}

// 执行定时任务
const timerHandle = async () => {
  let res = await updateTimer()
  if (res.success) {
    ElMessage.success('执行成功!')
  } else {
    ElMessage.error(res.msg)
  }
}

// 同比/环比弹窗
const openTbhbModal = (type: 'tb' | 'hb') => {
  if (gridOptions.loading) return
  tbhbModalRef.value?.open({
    type,
    formData: { ...getRequestFormData() },
    dwId: userInfo.value?.org_id,
    xsws: formData.xsws
  })
}

const handleTb = () => openTbhbModal('tb')
const handleHb = () => openTbhbModal('hb')

// 查看分析报告
const viewReportHandle = () => {
  if (gridOptions.loading) return
  const requestFormData = getRequestFormData()
  const { ysqj, month, ...rest } = requestFormData
  const newMonth = Number(month).toString()
  fxbgModalRef.value?.open({
    dwId: userInfo.value?.org_id,
    ...rest,
    month: newMonth
  })
}

// 查询
const getDataHandle = async () => {
  try {
    gridOptions.loading = true
    await getDynamicHeader()
    await getDynamicData()
  } finally {
    gridOptions.loading = false
  }
}

// 重置
const resetDataHandle = async () => {
  let date = new Date()
  if (date.getFullYear() <= 2024) {
    formData.year = (date.getFullYear() + 1).toString()
  } else {
    formData.year = date.getFullYear().toString()
  }
  if (isCityOrCounty.value) {
    isDetailMode.value = false
    await setRoleDefaultFilterData()
  } else {
    formData.cxjb = '3'
    if (!gkbmDisabled.value) {
      formData.gkbm = ''
      formData.cxjb = '2'
    }
    if (!ejdwDisabled.value) {
      formData.ejdw = ''
      formData.cxjb = '1'
    }
    if (!yjdwDisabled.value) {
      formData.yjdw = ''
      formData.cxjb = '0'
    }
  }
  formData.month = (date.getMonth() + 1).toString()
  formData.sjx = ['MBZ', 'WCZ', 'WCL']
  formData.ysqj = formData.year + '-' + formData.month.padStart(2, '0')
  await getDataHandle()
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  if (isQuery) {
    initParams(userInfo.value.specialorgid, userInfo.value.org_id)
    pageInfo.isShowPage = true
  }
}

const getInitDataInfo = async (specialorgid: string, spOrgId: string) => {
  formData.cxjb = '0'
  let res = await getInitData(specialorgid, spOrgId)
  orgInfo.value = { ...res.data } as OrgInfo
  isDetailMode.value = false
  if (isCityOrCounty.value) {
    await setRoleDefaultFilterData()
  } else {
    await applyRoleDetailFilterData()
  }
}

const getPublicCodeData = async () => {
  const codes = ['YSZTZXQK_YSQJ_COM', 'YSZXFXDWLX', 'XSWS']
  let res = await getPublicCodeList({
    codes: codes
  })
  if (res.success && res.data.length !== 0) {
    diabledDate.value = res.data[codes[0]]
    formList.XSWS = res.data['XSWS']
    if (res.data && res.data[codes[1]] && res.data[codes[1]].length !== 0) {
      dwType.value = res.data[codes[1]]
    } else {
      dwType.value = [
        {
          code: '1',
          name: '供电公司'
        },
        {
          code: '2',
          name: '直属单位'
        },
        {
          code: '3',
          name: '机关本部'
        },
        {
          code: '4',
          name: '子公司'
        }
      ]
    }
  }
  if (!diabledDate.value) {
    diabledDate.value = '2025'
  }
}

const initParams = async (specialorgid: string, spOrgId: string) => {
  let date = new Date()
  if (date.getFullYear() <= 2024) {
    formData.year = (date.getFullYear() + 1).toString()
  } else {
    formData.year = date.getFullYear().toString()
  }
  formData.month = (date.getMonth() + 1).toString()
  formData.ysqj = formData.year + '-' + formData.month.padStart(2, '0')
  formData.xsws = 'XSWS_2'
  await getPublicCodeData()
  await getYjdwDataList(specialorgid)
  await getInitDataInfo(specialorgid, spOrgId)
  getDataHandle()
}

const getNameFindCode = (name: string) => {
  if (formList.gkbmList.length !== 0) {
    let res = formList.gkbmList.find((item: any) => item.deptName.includes(name))
    if (res) {
      formData.gkbm = res.deptCode
    }
  }
}

onMounted(() => {
  userDialogRef.value.getUser()
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;

  .operation {
    font-size: 16px;
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    min-height: 0;
    min-width: 0;
    height: 37px;
    margin-bottom: 10px;
    overflow: hidden;

    .left {
      height: 100%;
      flex: 1;
    }

    .right {
      width: 260px;
      line-height: 40px;
      height: 100%;
      min-width: 0;
      min-height: 0;
      text-align: right;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .year {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      white-space: nowrap;
    }

    .unit-wanyuan {
      background: var(--color-primary, #00706b);
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      line-height: 20px;
    }

    .xsws-label {
      font-size: 12px;
      color: #606266;
    }
  }

  .table-main {
    width: 100%;
    height: calc(100% - 28px);
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;

    .form {
      min-width: 0;
      min-height: 0;
      width: 100%;

      :deep(.el-row) {
        height: 40px;
        line-height: 30px;
      }

      .search {
        text-align: right;
      }
    }

    .table {
      padding-bottom: 10px;
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
}

:deep(.mytable-style .col-font) {
  font-weight: bold;
}

:deep(.mytable-style .row-clickable) {
  cursor: pointer;
}

:deep(.vxe-loading--text) {
  font-size: 14px;
}

:deep(.vxe-cell) {
  font-size: 14px;
}

:deep(.vxe-table--footer) {
  .vxe-cell {
    font-weight: bold;
  }
}

.el-form--inline {
  height: 100%;
  overflow: hidden;

  :deep(.el-form-item) {
    margin-right: 0;
    overflow: hidden;
  }
}

.el-form-item {
  margin-bottom: 10px;
}

// 公式提示图标：让用户一眼看出该表头可悬浮查看公式
:deep(.vxe-formula-icon) {
  margin-left: 2px;
  color: var(--color-primary, #00706b);
  font-size: 14px;
  cursor: pointer;
  vertical-align: middle;
  transition: color 0.2s ease, transform 0.2s ease;
  &:hover {
    color: #005f5b;
    transform: scale(1.15);
  }
}
</style>

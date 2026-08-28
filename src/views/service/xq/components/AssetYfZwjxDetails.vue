<template>
  <div class="container" ref="containerRef">
    <el-collapse v-model="activeNames">
      <el-collapse-item name="hardware" title="大修项目关联设备表">
        <template #title>
          <div><i class="el-icon-s-grid elIconFile"></i>大修项目关联设备表</div>
        </template>
        <div class="amount">金额单位:元</div>
        <div class="table" :style="{ height: itemHeight + 'px' }">
          <vxe-table
            :loading="loading"
            :data="glsbLists"
            stripe
            :column-config="{
              resizable: true
            }"
            :row-config="{ height: 32 }"
            show-header-overflow
            show-overflow
            border
            align="center"
            header-align="center"
            height="100%"
          >
            <vxe-column width="60" type="seq" title="序号"></vxe-column>
            <vxe-column width="200" field="stationlinename" title="站线名称"></vxe-column>
            <vxe-column width="200" field="equipcode" title="设备编码"></vxe-column>
            <vxe-column width="200" field="equipname" title="设备名称"></vxe-column>
            <vxe-column width="200" field="astnum" title="资产编号"></vxe-column>
            <vxe-column
              width="200"
              header-align="center"
              align="right"
              field="originalequipvalue"
              :formatter="formatterData"
              :title="glsbListTitle.originalequipvalue"
            ></vxe-column>
            <vxe-column
              width="200"
              header-align="center"
              field="netastvalue"
              align="right"
              :formatter="formatterData"
              :title="glsbListTitle.netastvalue"
            ></vxe-column>
            <vxe-column width="200" field="equiptype" title="设备类型">
              <template #default="{ row }">
                {{ getFormattedValue(row['equiptype'], 'EQUIPTYPE_COM') }}
              </template>
            </vxe-column>
            <vxe-column width="200" field="voltagelevel" title="电压等级">
              <template #default="{ row }">
                {{ getFormattedValue(row['voltagelevel'], 'VOLTAGELEVEL_COM') }}
              </template>
            </vxe-column>
            <vxe-column width="200" field="stationlinevoltlevel" title="站线电压等级">
              <template #default="{ row }">
                {{ getFormattedValue(row['stationlinevoltlevel'], 'VOLTAGELEVEL_COM') }}
              </template>
            </vxe-column>
            <vxe-column width="200" field="runcode" title="运行编码"></vxe-column>
            <vxe-column width="200" field="equipfactory" title="设备厂家"></vxe-column>
            <vxe-column width="200" field="equipmodel" title="设备型号"></vxe-column>
            <vxe-column width="200" field="factorycode" title="出厂编号"></vxe-column>
            <vxe-column width="200" field="factorydate" title="出厂日期"></vxe-column>
            <vxe-column width="200" field="operatedate" title="投运日期"></vxe-column>
            <vxe-column width="120" field="equipvolume" title="设备容量"></vxe-column>
            <vxe-column width="120" field="equipstatus" title="设备状态">
              <template #default="{ row }">
                {{ getFormattedValue(row['equipstatus'], 'EQUIPSTATUS_COM') }}
              </template>
            </vxe-column>
            <vxe-column width="120" field="stationlinetype" title="站线类型">
              <template #default="{ row }">
                {{ getFormattedValue(row['stationlinetype'], 'EQUIPTYPE_COM') }}
              </template>
            </vxe-column>
            <vxe-column width="200" field="bayname" title="间隔单元名称"></vxe-column>
            <vxe-column width="120" field="isoutage" title="是否停电">
              <template #default="{ row }">
                {{ getFormattedValue(row['isoutage'], 'PMS_SF_COM') }}
              </template>
            </vxe-column>
            <vxe-column width="200" field="oamorgname" title="运维单位名称"></vxe-column>
            <vxe-column width="120" field="defectquantity" title="缺陷数量"></vxe-column>
            <vxe-column width="200" field="astequiptype" title="江苏个性化-资产级设备类型">
              <template #default="{ row }">
                {{ getFormattedValue(row['astequiptype'], 'EQUIPTYPE_COM') }}
              </template>
            </vxe-column>
            <vxe-column width="200" field="astequippsrid" title="江苏个性化-资产级设备资源ID"></vxe-column>
            <vxe-column width="200" field="equipastid" title="江苏个性化-资产级设备资产ID"></vxe-column>
            <vxe-column width="200" field="astequipcode" title="江苏个性化-所属资产级设备编码"></vxe-column>
            <vxe-column width="200" field="astequipname" title="江苏个性化-资产级设备名称"></vxe-column>
          </vxe-table>
        </div>
      </el-collapse-item>
      <el-collapse-item name="information" title="估算书中资产级设备成本归集表">
        <template #title>
          <div><i class="el-icon-s-grid elIconFile"></i>估算书中资产级设备成本归集表</div>
        </template>
        <div class="amount">金额单位:元</div>
        <div class="table" :style="{ height: itemHeight + 'px' }">
          <vxe-table
            :data="cbgjLists"
            :loading="loading"
            stripe
            :column-config="{
              resizable: true
            }"
            :row-config="{ height: 32 }"
            show-header-overflow
            show-overflow
            border
            align="center"
            header-align="center"
            height="100%"
          >
            <vxe-column width="60" type="seq" title="序号"></vxe-column>
            <vxe-column width="200" field="stationlinename" title="站线名称"></vxe-column>
            <vxe-column width="200" field="equipcode" title="设备编码"></vxe-column>
            <vxe-column width="200" field="equipname" title="设备名称"></vxe-column>
            <vxe-column width="200" field="astnum" title="资产编号"></vxe-column>
            <vxe-column width="200" field="workcontent" title="作业内容"></vxe-column>
            <vxe-column
              width="200"
              :formatter="formatterData"
              header-align="center"
              align="right"
              field="totalcost"
              :title="cbgjListTitle.totalcost"
            ></vxe-column>
            <vxe-colgroup title="施工费用">
              <vxe-column
                header-align="center"
                align="right"
                width="200"
                field="constructcostsubtotal"
                :formatter="formatterData"
                :title="cbgjListTitle.constructcostsubtotal"
              ></vxe-column>
              <vxe-column
                width="200"
                :formatter="formatterData"
                header-align="center"
                align="right"
                field="constructcostlabor"
                :title="cbgjListTitle.constructcostlabor"
              ></vxe-column>
              <vxe-column
                width="200"
                :formatter="formatterData"
                header-align="center"
                align="right"
                field="constructcostmaterial"
                :title="cbgjListTitle.constructcostmaterial"
              ></vxe-column>
              <vxe-column
                width="200"
                :formatter="formatterData"
                header-align="center"
                align="right"
                field="constructcostmechanical"
                :title="cbgjListTitle.constructcostmechanical"
              ></vxe-column>
            </vxe-colgroup>
            <!-- <vxe-colgroup title="乙供配件费">
              <vxe-column
                width="200"
                :formatter="formatterData"
                header-align="center"
                align="right"
                field="bfittingcostsubtotal"
                :title="cbgjListTitle.bfittingcostsubtotal"
              ></vxe-column>
              <vxe-column
                width="200"
                :formatter="formatterData"
                header-align="center"
                align="right"
                field="bfittingcostsubtotalaequip"
                :title="cbgjListTitle.bfittingcostsubtotalaequip"
              ></vxe-column>
              <vxe-column
                :formatter="formatterData"
                width="200"
                header-align="center"
                align="right"
                field="bfittingcostsubtotalamaterial"
                :title="cbgjListTitle.bfittingcostsubtotalamaterial"
              ></vxe-column>
            </vxe-colgroup> -->
            <vxe-colgroup title="甲供配件费">
              <vxe-column
                :formatter="formatterData"
                width="200"
                header-align="center"
                align="right"
                field="afittingcostsubtotal"
                :title="cbgjListTitle.afittingcostsubtotal"
              ></vxe-column>
              <vxe-column
                :formatter="formatterData"
                width="200"
                header-align="center"
                align="right"
                field="afittingcostsubtotalaequip"
                :title="cbgjListTitle.afittingcostsubtotalaequip"
              ></vxe-column>
              <vxe-column
                :formatter="formatterData"
                width="200"
                header-align="center"
                align="right"
                field="afittingcostsubtotalamaterial"
                :title="cbgjListTitle.afittingcostsubtotalamaterial"
              ></vxe-column>
            </vxe-colgroup>
            <vxe-colgroup title="其他费用">
              <vxe-column
                width="200"
                :formatter="formatterData"
                header-align="center"
                align="right"
                field="othercostsubtotal"
                :title="cbgjListTitle.othercostsubtotal"
              ></vxe-column>
              <vxe-column
                width="200"
                :formatter="formatterData"
                header-align="center"
                align="right"
                field="othercostcleanup"
                :title="cbgjListTitle.othercostcleanup"
              ></vxe-column>
              <vxe-column
                width="200"
                :formatter="formatterData"
                header-align="center"
                align="right"
                field="othercosttechnicalservice"
                :title="cbgjListTitle.othercosttechnicalservice"
              ></vxe-column>
            </vxe-colgroup>
          </vxe-table>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts" name="AssetYfZwjxDetails">
import { onMounted, ref, nextTick, watch, onUnmounted, reactive } from 'vue'
import { getRepairByXmid } from '@/api/service/requirement'
import { ElMessage } from 'element-plus'
import { formatSingleValue, getPublicCodeMap } from '@/utils/tableFormatter'
import { calclateTableSum, formatValueOrDefault } from '@/utils/utils'
import { IObject } from '@/types/interface'

interface Props {
  selectData: any
  globalParams: any
  opType: string
}

type Names = 'hardware' | 'information'
const loading = ref(false)
const cbgjLists = ref([])
const glsbLists = ref([])
const glsbListCaclColumns = reactive(['originalequipvalue', 'netastvalue'])
const cbgjListCaclColumns = reactive([
  'totalcost',
  'constructcostsubtotal',
  'constructcostlabor',
  'constructcostmaterial',
  'constructcostmechanical',
  'bfittingcostsubtotal',
  'bfittingcostsubtotalaequip',
  'bfittingcostsubtotalamaterial',
  'afittingcostsubtotal',
  'afittingcostsubtotalaequip',
  'afittingcostsubtotalamaterial',
  'othercostsubtotal',
  'othercostcleanup',
  'othercosttechnicalservice'
])

const glsbListTitle = ref({
  originalequipvalue: '设备原值',
  netastvalue: '资产净值'
})

const cbgjListTitle = ref({
  totalcost: '合计',
  constructcostsubtotal: '小计',
  constructcostlabor: '其中：人工费',
  constructcostmaterial: '其中：材料费',
  constructcostmechanical: '其中：机械费',
  bfittingcostsubtotal: '小计',
  bfittingcostsubtotalaequip: '其中：乙供设备',
  bfittingcostsubtotalamaterial: '其中：乙供主材',
  afittingcostsubtotal: '小计',
  afittingcostsubtotalaequip: '其中：甲供设备',
  afittingcostsubtotalamaterial: '其中：甲供主材',
  othercostsubtotal: '小计',
  othercostcleanup: '其中：建设场地租用及清理费',
  othercosttechnicalservice: '其中：技术服务费'
})

const containerRef = ref<any>()
const containerHeight = ref(800)
const fourceUpdateKey = ref(0)
const itemHeight = ref(240)

const activeNames = ref<Names[]>(['hardware', 'information'])

// 默认值
const props = withDefaults(defineProps<Props>(), {
  selectData: null,
  globalParams: null,
  opType: 'EDIT'
})

// 调用接口
const getTableData = async () => {
  loading.value = true
  try {
    if (props.globalParams) {
      await getPublicCodeMap([
        'PMS_SF_COM',
        'PROCLASSIFICATION_COM',
        'EQUIPTYPE_COM',
        'VOLTAGELEVEL_COM',
        'PRJLIBRARY_COM',
        'ASTEQUIPTYPE_COM',
        'EQUIPSTATUS_COM'
      ])
      const res = await getRepairByXmid(props.globalParams.ID)
      if (res.success) {
        if (res.data) {
          cbgjLists.value = res.data['cbgjLists'] || []
          glsbLists.value = res.data['glsbLists'] || []
          const cbgjCalculateSumResult = calculateSum(cbgjLists.value, cbgjListCaclColumns)
          setColumnsName(cbgjListTitle.value, cbgjCalculateSumResult)
          const glsbCalculateSumResult = calculateSum(glsbLists.value, glsbListCaclColumns)
          setColumnsName(glsbListTitle.value, glsbCalculateSumResult)
        }
      } else {
        throw new Error(res.msg)
      }
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

// 设置字段名称
const setColumnsName = (columnsTitle: IObject, calclateColumnsSum: IObject) => {
  for (const key in columnsTitle) {
    const calclateColumnSum = calclateColumnsSum[key]
    columnsTitle[key] = `${columnsTitle[key]}\n(${calclateColumnSum})`
  }
}

// 计算合计
const calculateSum = (data: IObject[], columns: string[]) => {
  return calclateTableSum(data, columns)
}

// 格式
const formatterData = ({ cellValue }: { cellValue: string }) => {
  return formatValueOrDefault(cellValue)
}

// 计算高度
const calculateItemHeight = () => {
  const totalExpandedItems = activeNames.value.length
  if (totalExpandedItems === 0) {
    itemHeight.value = 0
    return
  }

  if (containerRef.value) {
    const actualHeight = containerRef.value.clientHeight - 50
    containerHeight.value = actualHeight
  }

  const headerHeight = 2 * 50
  const availableHeight = containerHeight.value - headerHeight
  itemHeight.value = availableHeight / totalExpandedItems
}

const getFormattedValue = (value: any, codeKey: string, defaultValue = '') => {
  return formatSingleValue(value, codeKey, defaultValue)
}

// 监听activeNames变化,重新计算高度
watch(
  activeNames,
  () => {
    nextTick(() => {
      calculateItemHeight()
      fourceUpdateKey.value++
    })
  },
  {
    deep: true
  }
)

const initData = () => {
  getTableData()
}

onMounted(() => {
  initData()
  calculateItemHeight()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  nextTick(() => {
    calculateItemHeight()
  })
}
// 自定义组件标识
const ISCUSTOMCOPONENT = true
// 获取表格中数据-自定义组件必须实现方法
const getFormData = () => {
  return {
    assetYfZwjxInfos: []
  }
}

defineExpose({
  getFormData,
  ISCUSTOMCOPONENT
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  :deep(.el-collapse-item) {
    position: relative;
  }
  :deep(.el-collapse-item__header) {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-primary, #409eff);
  }

  :deep(.amount) {
    color: var(--color-primary, #409eff);
    font-weight: 600;
    position: absolute;
    right: 50px;
    top: 12px;
  }

  :deep(.vxe-header--column .vxe-cell--title) {
    white-space: pre-line;
  }
}
.elIconFile {
  color: var(--color-primary, #00857c);
  font-size: 16px;
  margin-right: 8px;
}
</style>

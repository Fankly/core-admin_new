<template>
  <div class="container" ref="containerRef">
    <el-tabs type="border-card" v-model="tabName">
      <el-tab-pane name="hardware" :label="tabLabel.hardware">
        <vxe-table
          :data="yjLists"
          stripe
          resize
          :row-config="{ height: 32 }"
          show-header-overflow
          show-overflow
          border
          align="center"
          header-align="center"
          height="100%"
        >
          <vxe-column width="200" field="zylx" title="资源类型"></vxe-column>
          <vxe-column width="200" field="bzqc" title="标准全称"></vxe-column>
          <vxe-column width="200" field="ccxlh" title="出厂序列号"></vxe-column>
          <vxe-column width="200" field="sctyrq" title="首次投运日期"></vxe-column>
          <vxe-column width="200" field="sbzt" title="设备状态"></vxe-column>
          <vxe-column width="200" field="erpzcbm" title="ERP资产编码"></vxe-column>
          <vxe-column width="200" field="erpsbtzbm" title="ERP设备台账编码"></vxe-column>
          <vxe-column width="200" field="ywdw" title="运维单位"></vxe-column>
          <vxe-column width="200" field="azdd" title="安装地点"></vxe-column>
        </vxe-table>
      </el-tab-pane>
      <el-tab-pane name="engine" :label="tabLabel.engine">
        <vxe-table
          :data="jfLists"
          stripe
          resize
          :row-config="{ height: 32 }"
          show-header-overflow
          show-overflow
          border
          align="center"
          header-align="center"
          height="100%"
        >
          <vxe-column width="200" field="jfqc" title="标准全称"></vxe-column>
          <vxe-column width="200" field="jfwz" title="机房位置"></vxe-column>
        </vxe-table>
      </el-tab-pane>
      <el-tab-pane name="information" :label="tabLabel.information">
        <vxe-table
          :data="xxxtLists"
          stripe
          resize
          :row-config="{ height: 32 }"
          show-header-overflow
          show-overflow
          border
          align="center"
          header-align="center"
          height="100%"
        >
          <vxe-column width="200" field="zylx" title="资源类型"></vxe-column>
          <vxe-column width="200" field="bzqc" title="标准全称"></vxe-column>
          <vxe-column width="200" field="ywdw" title="业务单位"></vxe-column>
          <vxe-column width="200" field="ywbm" title="业务部门"></vxe-column>
          <vxe-column width="200" field="zsyxrq" title="正式运行日期"></vxe-column>
          <vxe-column width="200" field="yxzt" title="运行状态"></vxe-column>
          <vxe-column width="200" field="tglx" title="推广类型"></vxe-column>
          <vxe-column width="200" field="ywdw" title="运维单位"></vxe-column>
          <vxe-column width="200" field="ywbm" title="运维部门"></vxe-column>
        </vxe-table>
      </el-tab-pane>
      <el-tab-pane name="virtualization" :label="tabLabel.virtualization">
        <vxe-table
          :data="xnhptLists"
          show-header-overflow
          :row-config="{ height: 32 }"
          show-overflow
          border
          stripe
          resize
          align="center"
          header-align="center"
          height="100%"
        >
          <vxe-column width="200" field="zylx" title="资源类型"></vxe-column>
          <vxe-column width="200" field="bzqc" title="标准全称"></vxe-column>
          <vxe-column width="200" field="ywdw" title="业务单位"></vxe-column>
          <vxe-column width="200" field="ywbm" title="业务部门"></vxe-column>
          <vxe-column width="200" field="yxzt" title="运行状态"></vxe-column>
          <vxe-column width="200" field="ywdw" title="运维单位"></vxe-column>
          <vxe-column width="200" field="ywbm" title="运维部门"></vxe-column>
        </vxe-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts" name="AssetYfDetails">
import { onMounted, ref, nextTick, watch, onUnmounted, reactive } from 'vue'
import { getYfsbzcByXmid } from '@/api/service/requirement'
import { ElMessage } from 'element-plus'

interface Props {
  selectData: any
  globalParams: any
  opType: string
}

// 自定义组件标识
const ISCUSTOMCOPONENT = true

type Names = 'hardware' | 'engine' | 'information' | 'virtualization'

const tabLabel = reactive({
  hardware: '硬件',
  engine: '机房',
  information: '信息系统',
  virtualization: '虚拟化平台'
})

const jfLists = ref([])
const xnhptLists = ref([])
const xxxtLists = ref([])
const yjLists = ref([])

const containerRef = ref<any>()

const tabName = ref<Names>('hardware')

// 默认值
const props = withDefaults(defineProps<Props>(), {
  selectData: null,
  globalParams: null,
  opType: 'EDIT'
})

// 调用接口
const getTableData = async () => {
  try {
    if (props.globalParams) {
      const res = await getYfsbzcByXmid(props.globalParams.ID)
      if (res.success) {
        if (res.data) {
          jfLists.value = res.data['jfLists'] || []
          xnhptLists.value = res.data['xnhptLists'] || []
          xxxtLists.value = res.data['xxxtLists'] || []
          yjLists.value = res.data['yjLists'] || []
          tabLabel.engine = `硬件(${yjLists.value.length})`
          tabLabel.hardware = `机房(${jfLists.value.length})`
          tabLabel.information = `信息系统(${xxxtLists.value.length})`
          tabLabel.virtualization = `虚拟化平台(${xnhptLists.value.length})`
        }
      } else {
        throw new Error(res.msg)
      }
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  }
}

const initData = () => {
  getTableData()
}

onMounted(() => {
  initData()
})

// 获取表格中数据-自定义组件必须实现方法
const getFormData = () => {
  return {
    assetYfInfos: []
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
  :deep(.el-collapse-item__header) {
    padding-left: 10px;
    font-size: 18px;
    font-weight: bold;
    color: var(--color-primary, #409eff);
  }
}
</style>

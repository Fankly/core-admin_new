<template>
  <div class="container" ref="containerRef" v-loading="loading">
    <el-collapse v-model="activeNames">
      <el-collapse-item name="estimate" title="调度清单">
        <template #title>
          <div>
            <i class="el-icon-s-grid elIconFile"></i>
            <span>调度清单</span>
          </div>
        </template>
        <div class="amount">
          <el-tooltip content="刷新" placement="top" effect="light">
            <span class="toolbar-action-icon" style="cursor: pointer; font-size: 18px" @click="refresh">
              <i class="el-icon-refresh"></i>
            </span>
          </el-tooltip>
        </div>
        <div class="table" :style="{ height: itemHeight + 'px' }">
          <vxe-table
            :data="project"
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
            :cell-style="rowStyle"
          >
            <vxe-column width="50" type="seq" title="序号" />
            <vxe-column min-width="150" field="sxdw" title="实现单位" />
            <vxe-column min-width="150" field="xtmc" title="系统名称" />
            <vxe-column min-width="150" field="xtgs" title="系统概述" />
            <vxe-column min-width="150" field="sspt" title="所属平台" />
            <vxe-column min-width="150" field="dycs" title="对应处室" />
            <vxe-column min-width="150" field="xtsx" title="系统属性" />
            <vxe-column min-width="150" field="zssxrq" title="正式上线日期" />
            <vxe-column min-width="150" field="xtfzr" title="系统负责人" />
            <vxe-column min-width="150" field="dqzcyhsl" title="当前注册用户数量" />
            <vxe-column min-width="150" field="yjhyd2026" title="2026年月均用户活跃率" />
            <vxe-column min-width="150" field="remark" title="备注" />
          </vxe-table>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts" name="AssetDdqdDetails">
import { onMounted, ref, nextTick, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDdPageByXmId } from '@/api/xmInfo/dispatchIntegrationList'
interface Props {
  selectData: any
  globalParams: any
  opType: string
  pageType: string
}

type Names = 'estimate'
const loading = ref(false)
const project = ref([])
const containerRef = ref<any>()
const itemHeight = ref(540)

const activeNames = ref<Names[]>(['estimate'])

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
      await getRefreshData()
    }
  } catch (error) {
    const sjly = error as Error
    ElMessage.error(sjly.message)
  }
}

const refresh = async () => {
  await getRefreshData()
}

const getRefreshData = async () => {
  loading.value = true
  const params = {
    xmid: props.globalParams.ID,
    pageType: props.pageType,
    page: 1,
    limit: 500
  }
  const record = await getDdPageByXmId({ ...params })
  loading.value = false
  if (record.success) {
    const data = record.data
    project.value = data.records || []
  }
}

const rowStyle = ({ row }: any) => {
  if (row?.isAssetLevelEquipment == '1') {
    return {
      color: 'red',
      fontWeight: 'bold'
    }
  }
}

// 计算高度
const calculateItemHeight = () => {
  const totalExpandedItems = activeNames.value.length
  if (totalExpandedItems === 0) {
    itemHeight.value = 0
    return
  }

  let containerHeight = 800
  if (containerRef.value) {
    containerHeight = containerRef.value.clientHeight - 50
  }

  const headerHeight = 2 * 50
  const availableHeight = containerHeight - headerHeight
  itemHeight.value = availableHeight / totalExpandedItems
}

// 监听activeNames变化,重新计算高度
watch(
  activeNames,
  () => {
    nextTick(() => {
      calculateItemHeight()
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
    font-weight: bold;
  }
}
.elIconFile {
  color: var(--color-primary, #00857c);
  font-size: 16px;
  margin-right: 8px;
}
</style>

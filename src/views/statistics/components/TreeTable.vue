<script lang="ts">
export default {
  name: '/statistics/components/TreeTable'
}
</script>

<script setup lang="ts">
import { ref, defineProps, onMounted, watch, defineEmits, reactive, defineExpose } from 'vue'
import { getConfigList, getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { InitParams } from '@/views/statistics/budgetStatisticsConfig.vue'
import { VxeTablePropTypes } from 'vxe-table'
import { ElMessage } from 'element-plus'

interface Props {
  initParams: InitParams
}

export interface RowVo {
  children: RowVo[]
  dispOrder: number | string
  id: string
  isleaf: number | string
  name: string
  parentId: string | null
  recState: number | string
}

const emits = defineEmits(['treeTableChange', 'mainTableData'])

const props = defineProps<Props>()

const treeRef = ref()
const loading = ref(false)
const treeData = ref<RowVo[]>([])
let currentTreeRequestToken = 0
let currentTableRequestToken = 0

const treeConfig = reactive<VxeTablePropTypes.TreeConfig>({})
const expandConfig = reactive<VxeTablePropTypes.ExpandConfig>({})
const rowConfig = reactive<VxeTablePropTypes.RowConfig>({
  height: 32,
  isCurrent: true,
  keyField: 'id'
})

const treeNodeClickHandle = async () => {
  const $treeTable = treeRef.value
  if ($treeTable) {
    let curData: RowVo = $treeTable.getCurrentRecord()
    if (!curData?.id) return
    // 获取右边表格数据
    await getTableData(curData.id)
    emits('treeTableChange', curData)
  }
}

const getTableData = async (parentId: string) => {
  if (!props.initParams.nd || !props.initParams.busiType || !parentId) {
    emits('mainTableData', [])
    return
  }
  const requestToken = ++currentTableRequestToken
  let res = await getConfigList(props.initParams.busiType, props.initParams.nd, parentId)
  if (requestToken !== currentTableRequestToken) return
  if (res.success && res.data) {
    emits('mainTableData', res.data)
  } else {
    ElMessage.error(res.msg)
  }
}

const getTreeTable = async () => {
  const requestToken = ++currentTreeRequestToken
  loading.value = true
  treeData.value = []
  if (!props.initParams.nd || !props.initParams.busiType) {
    if (requestToken === currentTreeRequestToken) {
      loading.value = false
    }
    return
  }
  try {
    let res = await getNodeTree(props.initParams.busiType, props.initParams.nd)
    if (requestToken !== currentTreeRequestToken) return
    if (res.success && res.data) {
      treeData.value = [
        {
          children: res.data,
          dispOrder: '1',
          id: props.initParams.nd,
          isleaf: '0',
          name: props.initParams.nd + '年度',
          recState: '1',
          parentId: null
        }
      ]
      treeRef.value?.setCurrentRow(treeData.value[0])
      expandData()
      return
    }
    treeData.value = []
    ElMessage.error(res.msg)
  } finally {
    if (requestToken === currentTreeRequestToken) {
      loading.value = false
    }
  }
}

const expandData = () => {
  if (!treeRef.value || treeData.value.length === 0) return
  treeRef.value.setTreeExpand(treeData.value, true)
}

const expandRowData = (row: any) => {
  treeRef.value.setTreeExpand(row, true)
}

const clearTreeData = () => {
  currentTreeRequestToken += 1
  currentTableRequestToken += 1
  treeData.value = []
  loading.value = false
}

const initData = async () => {
  await getTreeTable()
  await getTableData(props.initParams.nd)
}

const rowStyle = () => {
  return {
    cursor: 'pointer'
  }
}

watch(
  () => props.initParams.nd,
  () => {
    getTreeTable()
  }
)

defineExpose({
  clearTreeData,
  getTreeTable,
  getTableData,
  expandData,
  treeRef,
  treeData,
  expandRowData
})

onMounted(initData)
</script>

<template>
  <div class="tree-box">
    <vxe-table
      :loading="loading"
      :row-style="rowStyle"
      :expand-config="expandConfig"
      :tree-config="treeConfig"
      border="outer"
      :show-overflow="true"
      ref="treeRef"
      @current-change="treeNodeClickHandle"
      :row-config="rowConfig"
      :show-header="false"
      :column-config="{ resizable: true }"
      :data="treeData"
      height="100%"
    >
      <vxe-column field="name" title="配置名称" tree-node></vxe-column>
    </vxe-table>
  </div>
</template>

<style scoped lang="less">
.tree-box {
  height: 100%;
  width: 300px;
  padding-right: 10px;
  min-width: 0;
  min-height: 0;
}
</style>

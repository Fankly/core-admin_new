<script lang="ts">
export default {
  name: '/statistics/components/TreeDialog'
}
</script>

<script setup lang="ts">
import { ref, defineExpose, defineEmits, defineProps } from 'vue'
import { getYszxlyNodeTree, getNodeTree } from '@/api/statistics/budgetStatisticsConfig'
import { InitParams } from '@/views/statistics/budgetStatisticsConfig.vue'
import { ElMessage } from 'element-plus'

interface Props {
  initParams: InitParams
}

const treeRef = ref()

const emits = defineEmits(['getTreeData'])

const props = defineProps<Props>()

const showModal = ref(false)
const treeDataList = ref<any[]>([])

const closeModalHandle = () => {
  showModal.value = false
  // 清空数据
}

const detailHandle = () => {
  const nodes = treeRef.value.getCheckedNodes()
  if (nodes && nodes.length > 0) {
    emits('getTreeData', nodes)
  }
  // 获取选择的数据
  closeModalHandle()
}

const showModalHandle = async () => {
  await getTreeData()
}

const getTreeData = async () => {
  let GkBmYsZxFx = sessionStorage.getItem('GkBmYsZxFx')
  let res =
    GkBmYsZxFx == 'GkBmYsZxFx'
      ? await getNodeTree('GKBM_YSZXFX', props.initParams.nd)
      : await getYszxlyNodeTree(props.initParams.nd, props.initParams.busiType)
  if (res.success && res.data) {
    treeDataList.value = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

defineExpose({
  showModal
})
</script>

<template>
  <vxe-modal
    @show="showModalHandle"
    @close="closeModalHandle"
    class-name="modal"
    height="320"
    v-model="showModal"
    width="500"
    title="新增-明细汇总"
    show-zoom
    resize
    position="center"
  >
    <div class="modal-table">
      <div class="table">
        <el-tree
          :check-strictly="true"
          ref="treeRef"
          show-checkbox
          :props="{
            label: 'name'
          }"
          :data="treeDataList"
        ></el-tree>
      </div>
      <div class="operation">
        <el-button plain size="mini" type="primary" @click="detailHandle">确 定</el-button>
        <el-button plain size="mini" type="primary" @click="closeModalHandle">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<style lang="less" scoped>
.modal-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  .table {
    overflow: auto;
    min-width: 0;
    min-height: 0;
    flex: 1;
    padding-bottom: 10px;
  }

  .operation {
    text-align: center;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>

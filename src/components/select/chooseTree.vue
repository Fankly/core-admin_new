<!-- 弹窗tree -->
<template>
  <div>
    <vxe-modal
      v-model="treeModal"
      :destroy-on-close="true"
      :title="title"
      :width="400"
      :close-on-press-escape="false"
      @close="closeModalHandle"
    >
      <el-button plain size="mini" type="primary" v-if="showAll" @click="handleAll">
        全选
      </el-button>
      <el-button plain size="mini" type="primary" v-if="showAll" @click="handleIsAll">
        全不选
      </el-button>
      <div style="height: 40vh; overflow: hidden; overflow-y: auto">
        <el-tree
          ref="treeRef"
          :check-strictly="checkStrictly"
          :default-checked-keys="checkedKeys"
          :default-expand-all="true"
          node-key="id"
          show-checkbox
          :props="defaultProps"
          :data="treeDataList"
        />
      </div>
      <div style="text-align: center; margin-top: 20px">
        <el-button plain size="mini" type="primary" @click="handleClick">保 存</el-button>
        <el-button plain size="mini" type="primary" @click="closeModalHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: '/components/select/chooseTree'
}
</script>
<script setup lang="ts">
import { ref, defineExpose, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['chooseData', 'rowsList'])

const treeRef = ref()
const checkStrictly = ref<boolean>(false)
const showAll = ref<boolean>(false)

const treeModal = ref<boolean>(false)
const title = ref<any>('弹窗') //弹窗标题
const treeDataList = ref<any[]>([]) // 单位树结构
const checkedKeys = ref<any[]>([]) //选中的叶子节点
const defaultProps = ref({
  id: 'id',
  label: 'name',
  children: 'children',
  disabled: (data: any, node: any) => {
    if (data.cj) {
      return data.cj == '2'
    }
  }
})
//关闭树结构弹窗
const closeModalHandle = () => {
  treeDataList.value.length = 0
  checkedKeys.value.length = 0
  treeModal.value = false
}
const handleAll = () => {
  if (showAll) {
    const ids = treeDataList.value.map((item: any) => item.id)
    treeRef.value.setCheckedKeys(ids)
  }
}
const handleIsAll = () => {
  if (showAll) {
    treeRef.value.setCheckedKeys([])
  }
}
const handleClick = () => {
  //获取选择的数据
  const nodes: any = treeRef.value.getCheckedNodes(true, true) //获取叶子节点
  const nodeIds: any = treeRef.value.getCheckedNodes() //获取选中的节点
  nodeIds.forEach((item: any) => {
    item.children = null
  })
  if (nodes.length != 0 || nodeIds != 0) {
    nodeIds.forEach((item: any) => {
      item.dwId = item.id
      item.dwName = item.name
    })
    const dwIdList = nodes.map((item: any) => item.id)
    emit('chooseData', dwIdList)
    emit('rowsList', nodeIds)
  } else {
    ElMessage.warning('请选择单位')
  }
  return
}
defineExpose({
  treeModal,
  title,
  checkedKeys,
  treeDataList,
  closeModalHandle,
  checkStrictly,
  showAll
})
</script>

<!-- 弹窗tree -->
<template>
  <div>
    <vxe-modal
      v-model="treeModal"
      :destroy-on-close="true"
      :title="title"
      :width="500"
      resize
      :close-on-press-escape="false"
      @close="closeModalHandle"
    >
      <div style="display: flex; justify-content: space-between">
        <el-form :inline="true">
          <el-form-item label="年度：">
            <el-select v-model="nd" placeholder="请选择" style="width: 115px" @change="handleNd">
              <template v-for="item in ndList" :key="item.code">
                <el-option :label="item.name" :value="item.code"></el-option>
              </template>
            </el-select>
          </el-form-item>
        </el-form>
        <el-form :inline="true">
          <el-form-item label="父子节点联动开关：">
            <el-switch v-model="checkStrictly" />
          </el-form-item>
        </el-form>
      </div>
      <div style="height: 40vh; overflow: hidden; overflow-y: auto; overflow-x: auto">
        <el-tree
          ref="treeRef"
          :check-strictly="!checkStrictly"
          :default-checked-keys="checkedKeys"
          :default-expanded-keys="[treeDataList[0].id]"
          node-key="id"
          show-checkbox
          :props="defaultProps"
          :data="treeDataList"
          @check="handleNode"
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
  name: 'lxTree'
}
</script>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

interface apiVo {
  treeApi: (params: any) => Promise<any>
}

const props = defineProps<apiVo>()
const emit = defineEmits(['chooseData', 'rowsList'])

const treeModal = ref<boolean>(false)
const checkStrictly = ref<boolean>(false)
const title = ref<any>('弹窗') //弹窗标题
const nd = ref()
const treeRef = ref()
const ndList = ref<any>({})
const treeDataList = ref<any[]>([]) // 单位树结构
const checkedKeys = ref<any[]>([]) //选中的叶子节点
const defaultProps = ref({
  id: 'id',
  label: 'name',
  children: 'children'
})
//关闭树结构弹窗
const closeModalHandle = () => {
  // treeDataList.value.length = 0
  checkedKeys.value.length = 0
  checkStrictly.value = false
  treeModal.value = false
}
const handleNd = async (val: any) => {
  checkedKeys.value.length = 0
  let res: any = await props.treeApi(val)
  treeDataList.value = res.data.treeData
  checkedKeys.value = res.data.checkedIdList
}

// 选中事件
const handleNode = (currentNode: any, checkedStatus: any) => {
  if (title.value == '全局一上类型配置') {
    if (checkedStatus.checkedKeys.includes(currentNode.id)) {
      selectParent(currentNode)
    }
  }
}

const selectParent = (node: any) => {
  const $tree: any = treeRef.value
  let parentNode = $tree.getNode(node).parent
  if (parentNode && parentNode.data.id && parentNode.data.id != null) {
    $tree.setChecked(parentNode.data.id, true)
    selectParent(parentNode.data)
  }
}

// 保存
const handleClick = () => {
  //获取选择的数据
  const nodeIds: any = treeRef.value.getCheckedNodes() //获取选中的节点
  if (nodeIds != 0) {
    const dwIdList = nodeIds.map((item: any) => item.id)
    emit('chooseData', {
      nd: nd.value,
      protypeIdList: dwIdList
    })
  } else {
    ElMessage.warning('请选择数据')
  }
  return
}
defineExpose({
  treeModal,
  title,
  checkedKeys,
  treeDataList,
  closeModalHandle,
  ndList,
  nd
})
</script>

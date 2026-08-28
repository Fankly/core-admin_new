<!-- 预算控制 -->
<template>
  <div v-show="isShowPage" class="container">
    <Split ratio="5/5">
      <template #one>
        <el-tree
          ref="treeRef"
          :check-strictly="false"
          :default-checked-keys="checkedKeys"
          :default-expanded-keys="[treeDataList[0].id]"
          node-key="id"
          show-checkbox
          :props="defaultProps"
          :data="treeDataList"
          @check="handleNode"
        />
      </template>
      <template #two>
        <el-tree
          ref="treeRef"
          :check-strictly="false"
          :default-checked-keys="checkedKeys"
          :default-expanded-keys="[treeDataList[0].id]"
          node-key="id"
          show-checkbox
          :props="defaultProps"
          :data="treeDataList"
          @check="handleNode"
        />
      </template>
    </Split>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>
<script lang="tsx">
export default {
  name: '/fy/config/xsConfig/yskz'
}
</script>
<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Split from '@/components/Split/index.vue'

const loading = ref(false)
const userDialogRef = ref()
const userInfo = ref<any>({})
const treeRef = ref()
const isShowPage = ref<boolean>(false)
const treeDataList = ref<any[]>([]) // 单位树结构
const checkedKeys = ref<any[]>([]) //选中的叶子节点
const defaultProps = ref({
  id: 'id',
  label: 'name',
  children: 'children'
})

// 选中事件
const handleNode = (currentNode: any, checkedStatus: any) => {
  if (checkedStatus.checkedKeys.includes(currentNode.id)) {
    selectParent(currentNode)
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

const getRoleHandle = async () => {
  loading.value = false
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
  }
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 10px;
}
</style>

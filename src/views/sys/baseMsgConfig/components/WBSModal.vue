<template>
  <vxe-modal
    destroy-on-close
    :loading="loading"
    position="center"
    title="WBS维护"
    v-model="isShowModal"
    width="600"
    height="540"
    show-zoom
    @close="handleCancel"
    show-footer
    resize
  >
    <template #default>
      <el-tree
        @check-change="getCheckedDataHandle"
        :props="{
          label: 'wbsName',
          isLeaf: 'leaf'
        }"
        :data="wbsData"
        :load="loadNode"
        ref="deptRef"
        node-key="wbsId"
        lazy
        show-checkbox
      ></el-tree>
    </template>
    <template #footer>
      <div class="operation">
        <el-button type="primary" sizi="mini" @click="handleSave">保 存</el-button>
        <el-button type="primary" sizi="mini" @click="handleCancel">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="WBSModal">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getXmWbsTree } from '@/api/common'
import VXETable from 'vxe-table'
import { editWbs } from '@/api/sys/proCategory'

interface AcceptParams {
  ids: string[]
  dwId: string
}

interface WbsData {
  leaf: false
  pwbsId: string
  wbsCode: string
  wbsId: string
  wbsName: string
}

const emit = defineEmits(['saveDataAfter'])

const isShowModal = ref(false)
const deptRef = ref()
const loading = ref(false)
const parameter = ref<AcceptParams>({
  ids: [],
  dwId: ''
})
const wbsData = ref([])

const loadNode = async (node: any, resolve: any) => {
  if (node.level === 0) loading.value = true
  try {
    let id = node.level === 0 ? '-1' : node.data.wbsId
    let res = await getXmWbsTree(id)
    if (res.success) {
      resolve(res.data)
    } else {
      ElMessage.error(res.msg)
      resolve([])
    }
  } finally {
    if (node.level === 0) loading.value = false
  }
}

const getCheckedDataHandle = async (data: WbsData, checked: boolean, indeterminate: boolean) => {
  try {
    loading.value = true
    let node = deptRef.value.getNode(data.wbsId)
    await expandTreeNodeHandle(node)
  } finally {
    loading.value = false
  }
}

const expandTreeNodeHandle = async (node: any): Promise<void> => {
  if (!node.checked) {
    return
  }

  if (!node.expaned && !node.isLeaf) {
    await new Promise<void>((resolve) => {
      node.expand(async () => {
        await new Promise((r) => setTimeout(r, 100))
        resolve()
      })
    })
  }

  const childNodes = node.childNodes || []

  if (childNodes.length > 0) {
    await new Promise((r) => setTimeout(r, 100))
  }

  for (const childNode of childNodes) {
    if (childNode.checked) {
      await expandTreeNodeHandle(childNode)
    }
  }
}

const acceptParams = (params: AcceptParams) => {
  isShowModal.value = true
  parameter.value = { ...parameter.value, ...params }
}

const handleSave = async () => {
  try {
    const type = await VXETable.modal.confirm('是否确认保存?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否',
      showClose: false
    })
    if (type === 'confirm') {
      loading.value = true
      const wbs: number[] = deptRef.value.getCheckedNodes()
      const res = await editWbs({
        ...parameter.value,
        wbs: wbs
      })
      if (res.success) {
        wbsData.value = []
        isShowModal.value = false
        ElMessage.success('保存成功!')
        emit('saveDataAfter')
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
const handleCancel = () => {
  isShowModal.value = false
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.select {
  width: 100%;
}

.operation {
  text-align: center;
}
:deep(.el-date-editor) {
  width: 100%;
}
</style>

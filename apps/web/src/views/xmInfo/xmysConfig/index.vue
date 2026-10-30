<!-- 项目预算一览配置 -->
<template>
  <div class="container" v-if="isShowPage">
    <tableBtn @handler-click="handlerClick" @change-nd="changeNd" @nd-list="ndList" />
    <div style="display: flex; justify-content: space-evenly">
      <div class="contbtn_left">
        <div class="treeDataCont">
          <el-tree
            ref="treeRef"
            :key="treeKey"
            :highlight-current="true"
            :props="defaultProps"
            :expand-on-click-node="false"
            node-key="id"
            :current-node-key="chooseNode || undefined"
            lazy
            :load="loadNode"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span class="tree-node" :class="{ 'tree-node--disabled': data.leaf === '1' }">
                <span class="tree-node__label" :title="node.label">{{ `${node.label}` }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
      <div class="conbtn_right">
        <div style="height: 80vh">
          <proTable @row-click="handlerCilck" ref="proTableRef" :data="pageData" :search-col="4" :columns="tableColumns" :pagination="false" />
        </div>
      </div>
    </div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="modalParams.isShow"
      :destroy-on-close="true"
      :title="modalParams.title"
      :width="800"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <el-form label-suffix=" : " ref="ruleFormRef" label-width="120px" label-position="right" :model="rmarkData" :hide-required-asterisk="false">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入名称' }]">
              <el-input :maxlength="8" v-model="rmarkData.name" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="序号" prop="sortCode">
              <el-input :maxlength="8" v-model="rmarkData.sortCode" placeholder="请输入序号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="是否末级节点" prop="leaf">
              <el-select style="width: 100%" v-model="rmarkData.leaf" placeholder="请选择是否末级节点">
                <el-option v-for="item1 in leafOptions" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目类型" prop="protypeId">
              <ElTreeSelect
                v-model="rmarkData.protypeId"
                clearable
                :data="projectList"
                :props="projectTypeProps"
                :popper-append-to-body="true"
                node-key="middleId"
                placeholder="请选择"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div style="text-align: center">
        <el-button size="small" type="primary" plain @click="pushMsgHandle">保 存</el-button>
        <el-button size="small" plain @click="closeHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <ndCopy ref="ndCpoyRef" @handler-copy="handlerCopy" />
</template>

<script lang="ts">
export default {
  name: '/xmInfo/xmysConfig/index'
}
</script>
<script setup lang="ts">
import proTable from '@/components/ProTable/index.vue' //表格组件
import { onMounted, ref, reactive, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getChildApi, copyApi, addApi, deleteApi } from '@/api/xmInfo/xmysConfig'
import { getAllProtypeTreeNew } from '@/api/common'
import { Result } from '@/api/types'
import tableBtn from '@/views/metrics/components/tableBtn.vue'
import ndCopy from '@/views/metrics/components/ndCopy.vue'
import ElTreeSelect from '@/components/ElTreeSelect'

/** 阶段节点 */
interface StageNode {
  id?: string
  name: string
  sortCode: string
  leaf: string // '1' 末级 / '0' 非末级
  nd: string
  parentId?: string
  protypeId?: string
  children?: StageNode[]
}

/** 通用字典项 */
interface DictItem {
  code: string
  name: string
}

const chooseNode = ref<StageNode | null>(null) //当前选中树节点
const treeRef = ref() //树ref
const treeKey = ref(0)
const proTableRef = ref() //表格ref
const userDialogRef = ref()
const isShowPage = ref(false)
const ndCpoyRef = ref()
const pageData = ref<StageNode[]>([]) //表格数据
const projectList = ref<any[]>([]) //项目类型（TreeSelect 独立组件，保留供其内部使用）
const dialogFormRef = ref()
const ruleFormRef = ref()
/** 刷新进行中标记，防止重复触发 */
const treeExpanding = ref(false)
const modalParams = reactive<{ isShow: boolean; title: string }>({
  isShow: false,
  title: '新增'
})
const rmarkData = ref<StageNode>({ nd: new Date().getFullYear().toString() } as StageNode) //FORM表单
const leafOptions = ref<DictItem[]>([
  { code: '1', name: '是' },
  { code: '0', name: '否' }
])
const defaultProps = {
  label: 'name',
  value: 'protypeId',
  isLeaf: (data: StageNode) => data.leaf === '1',
  children: 'children '
}
const projectTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  const isQuery = userDialogRef.value?.isQuery
  if (!isQuery) return
  isShowPage.value = true
  await nextTick()
  await initParamLists()
}

onMounted(async () => {
  await userDialogRef.value?.getUser()
})

// ========== 树相关（懒加载） ==========
/**
 * el-tree 懒加载：根节点 level=0 传 ''，其余传节点 id。
 * leaf=1 视为末级，不展示展开箭头（由 defaultProps.isLeaf 控制）。
 */
const loadNode = async (node: any, resolve: (data: any[]) => void) => {
  const params = {
    nd: rmarkData.value.nd || '2026',
    parentId: node.level === 0 ? '0' : node.data?.id
  }
  try {
    const res: Result = await getChildApi(params)
    if (!res.success) {
      ElMessage.error(res.msg || '文件目录加载失败')
      resolve([])
      return
    }
    const list: any[] = Array.isArray(res.data) ? res.data : []
    resolve(list)
  } catch (e) {
    ElMessage.error((e as Error)?.message || '文件目录加载失败，请稍后重试')
    resolve([])
  }
}

const handlerClick = async (val: any) => {
  if (val === 'EDIT' && proTableRef.value?.selectedList.length !== 1) {
    return ElMessage.warning('请选择一条数据')
  }
  if (val == 'ADD') {
    modalParams.title = '新增'
    rmarkData.value = {
      name: '',
      sortCode: '0',
      leaf: '0',
      nd: rmarkData.value.nd,
      parentId: chooseNode.value?.id
    }
    modalParams.isShow = true
  } else if (val == 'EDIT') {
    modalParams.title = '编辑'
    rmarkData.value = proTableRef.value?.selectedList[0]
    modalParams.isShow = true
  } else if (val == 'DELETE') {
    ElMessageBox.confirm('确定要删除所选数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const ids: string[] = proTableRef.value?.selectedList.map(({ id }: any) => id)
        const res: Result = await deleteApi({ ids: ids })
        if (res.success) {
          ElMessage.success('删除成功！')
          await menuData()
          await refreshTree()
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else {
    ndCpoyRef.value.title = '复制'
    ndCpoyRef.value.formData.sourceNd = rmarkData.value.nd
    ndCpoyRef.value.treeModal = true
  }
}
// 复制
const handlerCopy = async (val: any) => {
  const params = {
    ...val
  }
  const res: Result = await copyApi(params)
  if (res.success) {
    ndCpoyRef.value.treeModal = false
    ElMessage.success('复制成功')
  } else {
    ElMessage.error(res.msg)
  }
}
// 年度下拉框
const ndList = (val: any) => {
  if (ndCpoyRef.value) {
    ndCpoyRef.value.ndList = val
    ndCpoyRef.value.formData.sourceNd = rmarkData.value.nd
  }
}

// 点击树
const handleNodeClick = (data: any) => {
  // 末级节点不可点击：不切换选中、不刷新右侧表格
  if (data.leaf === '1') return
  chooseNode.value = data
  menuData()
}
// 刷新左侧树并自动展开到当前选中节点
const refreshTree = async () => {
  await nextTick()
  if (!treeRef.value) {
    treeKey.value++
    return
  }
  const id = chooseNode.value?.id
  if (!id) {
    // 未选中具体节点时，重建整树
    treeKey.value++
    return
  }
  const node = treeRef.value.getNode(id)
  if (!node) {
    // 节点不在已加载树中，重建整树
    treeKey.value++
    return
  }
  // 强制重新加载该节点子级并展开，使新增/编辑后的结果可见
  node.loaded = false
  node.expand()
  treeRef.value.setCurrentKey(id)
}
//保存
const pushMsgHandle = () => {
  ruleFormRef.value.validate(async (valid: any) => {
    if (!valid) return
    // 仅新增时根据当前选中树节点设置 parentId；编辑保留原 parentId，避免层级错乱
    if (modalParams.title === '新增') {
      rmarkData.value.parentId = chooseNode.value?.id || '0'
    }

    const res: Result = await addApi(rmarkData.value)
    if (res.success) {
      ElMessage.success(modalParams.title === '编辑' ? '编辑成功' : '新增成功')
      await menuData()
      await refreshTree()
      await closeHandle()
    } else {
      ElMessage.error(res.msg)
    }
  })
}
// 关闭
const closeHandle = () => {
  ruleFormRef.value.resetFields()
  proTableRef.value?.clearSelection()
  modalParams.isShow = false
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'name', label: '名称' },
  {
    prop: 'leaf',
    label: '是否末级节点',
    render: ({ row }: any) => {
      const item = leafOptions.value.find((item: DictItem) => row.leaf == item.code)
      return item ? item.name : row.leaf
    }
  },
  { prop: 'protypeName', label: '项目类型' },
  { prop: 'nd', label: '年度' },
  { prop: 'sortCode', label: '排序' }
])

// 页签数据
const menuData = async () => {
  const params = {
    nd: rmarkData.value.nd,
    parentId: chooseNode.value?.id || '0'
  }
  const res: Result = await getChildApi(params)
  if (res.success) {
    proTableRef.value?.clearSelection()
    pageData.value = res.data
  }
}
// 获取年度
const changeNd = async (nd: any) => {
  if (treeExpanding.value) return
  await nextTick()
  rmarkData.value.nd = nd
  chooseNode.value = null
  treeKey.value++
  await menuData()
}
// 公共代码
const initParamLists = async () => {
  if (rmarkData.value.nd) {
    const proType: any = await getAllProtypeTreeNew()
    if (proType.success && proType.data.length !== 0) {
      projectList.value = proType.data
    }
    await menuData()
  }
}

// 单选
const handlerCilck = (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}

.contbtn_left {
  width: 19%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  overflow: hidden;
  overflow-y: auto;
  .treeDataCont {
    width: 90%;
    height: 90%;
    // 末级节点不可点击，置灰展示
    :deep(.tree-node--disabled) {
      cursor: not-allowed;
      color: #c0c4cc;
    }
  }
}
.conbtn_right {
  width: 82%;
  height: 100%;
  padding: 0px 10px;
  box-sizing: border-box;
  border-radius: 8px;
  .btnList {
    width: 320px;
    display: flex;
    justify-content: space-between;
  }
}
</style>

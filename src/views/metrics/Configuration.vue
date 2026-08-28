<!-- 单位配置 -->
<template>
  <div class="container">
    <tableBtn @handler-click="handlerClick" @change-nd="changeNd" @nd-list="ndList" />
    <div style="display: flex; justify-content: space-evenly">
      <div class="contbtn_left">
        <div class="treeDataCont">
          <el-tree
            ref="treeRef"
            node-key="id"
            :default-expanded-keys="defaultExpandKeys"
            :highlight-current="true"
            @node-click="handlerNodeClick"
            :data="treeData"
            :props="defaultProps"
            :expand-on-click-node="false"
          />
        </div>
      </div>
      <div class="conbtn_right">
        <div style="height: 80vh">
          <proTable
            @row-click="handlerCilck"
            @selection-change="selectionChange"
            ref="proTableRef"
            :data="pageData"
            :search-col="4"
            :columns="tableColumns"
            :pagination="false"
          />
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
      <el-form
        label-suffix=" : "
        ref="ruleFormRef"
        label-width="120px"
        label-position="right"
        :model="rmarkData"
        :rules="rules"
        :hide-required-asterisk="false"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="名称" prop="configName">
              <el-input :maxlength="8" v-model="rmarkData.configName" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="序号" prop="dispOrder">
              <el-input :maxlength="8" v-model="rmarkData.dispOrder" placeholder="请输入序号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否启用" prop="recState">
              <el-select style="width: 100%" v-model="rmarkData.recState" placeholder="请选择是否启用">
                <el-option v-for="item1 in isRecState" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否显示" prop="isDisplay">
              <el-select style="width: 100%" v-model="rmarkData.isDisplay" placeholder="请选择是否显示">
                <el-option v-for="item1 in isShow" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否末级节点" prop="isleaf">
              <el-select style="width: 100%" v-model="rmarkData.isleaf" placeholder="请选择是否末级节点">
                <el-option v-for="item1 in isShow" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="rmarkData.isDisplay == '1'">
            <el-form-item label="是否加粗" prop="isBold">
              <el-select style="width: 100%" v-model="rmarkData.isBold" placeholder="请选择是否加粗">
                <el-option v-for="item1 in isShow" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="rmarkData.isleaf == '1'">
            <el-form-item label="统计方式" prop="statMethod">
              <el-select style="width: 100%" v-model="rmarkData.statMethod" placeholder="请选择统计方式">
                <el-option v-for="item1 in tjfs" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div v-if="rmarkData.isleaf == '1'" style="height: 300px">
        <proTable
          @selection-change="selectionChangeTable"
          ref="proDataRef"
          :data="rmarkData.dataDetails"
          :search-col="4"
          :columns="DWColumns"
          :pagination="false"
        >
          <template #tableHeader="scope">
            <el-button plain size="mini" type="primary" @click="handlerBtn('ADD', scope.selectedList)">新 增</el-button>
            <el-button :disabled="!scope.isSelected" plain size="mini" type="primary" @click="handlerBtn('DELETE', scope.selectedList)"
              >删 除</el-button
            >
          </template>
        </proTable>
      </div>
      <div style="text-align: center">
        <el-button size="mini" type="primary" plain @click="pushMsgHandle">保 存</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
  <chooseTree ref="treeModalRef" @rows-list="saveTree" />
  <ndCopy ref="ndCpoyRef" @handler-copy="handlerCopy" />
</template>

<script lang="ts">
export default {
  name: '/metrics/Configuration'
}
</script>
<script setup lang="ts">
import proTable from '@/components/ProTable/index.vue' //表格组件
import { onMounted, ref, reactive, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox, ElInput } from 'element-plus'
import {
  getNodeTree,
  batchDeleteConfig,
  copyStatConfig,
  deleteDataDetail,
  ysStatDwConfigSaveConfig,
  ysStatDwConfigGetDwTree,
  getConfigList,
  getDataDetail
} from '@/api/metrics/index'
import { getPublicData, getBizOrgXzTreeExcludeBmNoPermissionNoLazy } from '@/api/common'
import { useRoute } from 'vue-router'
import chooseTree from '@/components/select/chooseTree.vue'
import tableBtn from '@/views/metrics/components/tableBtn.vue'
import ndCopy from '@/views/metrics/components/ndCopy.vue'

const route = useRoute()
const chooseNode = ref<any>({}) //节点id
const treeRef = ref() //树ref
const proTableRef = ref() //表格ref
const proDataRef = ref()
const treeModalRef = ref()
const ndCpoyRef = ref()
const treeData = ref<any[]>([]) //左侧菜单树
const pageData = ref<any[]>([]) //表格数据
const dialogFormRef = ref()
const ruleFormRef = ref()
const modalParams = reactive<any>({
  isShow: false,
  title: '新增'
})
const rmarkData = ref<any>({}) //FROM表单
const isRecState = ref<any>([
  { code: '1', name: '启用' },
  { code: '0', name: '停用' }
])
const isShow = ref<any>([
  { code: '1', name: '是' },
  { code: '0', name: '否' }
])
const tjfs = ref<any[]>([])
const rules = reactive<any>({
  configName: [
    {
      required: true,
      message: '请输入名称',
      trigger: 'blur'
    }
  ],
  recState: [
    {
      required: true,
      message: '请请选择是否启用',
      trigger: 'blur'
    }
  ],
  dispOrder: [
    {
      required: true,
      message: '请输入序号',
      trigger: 'blur'
    }
  ],
  isBold: [
    {
      required: true,
      message: '请选择是否加粗',
      trigger: 'blur'
    }
  ],
  isleaf: [
    {
      required: true,
      message: '请选择是否末级节点',
      trigger: 'blur'
    }
  ],
  isDisplay: [
    {
      required: true,
      message: '请选择是否显示',
      trigger: 'blur'
    }
  ]
})
const defaultProps = {
  children: 'children',
  label: 'name'
}
const defaultExpandKeys = computed(() => {
  const keys: any = []
  treeData.value.forEach((item: any) => {
    keys.push(item.id)
    item.children.forEach((child: any) => keys.push(child.id))
  })
  return keys
})

onMounted(async () => {
  await initParamLists()
})

const handlerClick = async (val: any) => {
  if (['EDIT', 'DELETE'].includes(val) && proTableRef.value?.selectedList.length != 1) {
    return ElMessage.warning('请选择一条数据')
  }
  if (val == 'ADD') {
    modalParams.title = '新增'
    rmarkData.value = {
      statMethod: '1',
      recState: '1',
      isDisplay: '1',
      isBold: '0',
      isleaf: '0',
      dataDetails: [],
      nd: rmarkData.value.nd,
      busiType: rmarkData.value.busiType
    }
    modalParams.isShow = true
  } else if (val == 'EDIT') {
    modalParams.title = '编辑'
    rmarkData.value = proTableRef.value?.selectedList[0]
    await dataDetail()
    modalParams.isShow = true
  } else if (val == 'DELETE') {
    if (proTableRef.value?.selectedList[0].recState == '1') {
      return ElMessage.warning('请先停用再删除')
    }
    ElMessageBox.confirm('确定要删除所数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        let res: any = await batchDeleteConfig({ configIds: proTableRef.value?.selectedList[0].configId })
        if (res.success) {
          ElMessage.success('删除成功！')
          await menuData()
          await initParamLists()
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
    ...val,
    busiType: rmarkData.value.busiType
  }
  let res: any = await copyStatConfig(params)
  if (res.success) {
    ndCpoyRef.value.treeModal = false
    ElMessage.success('复制成功')
  } else {
    ElMessage.error(res.msg)
  }
}

// 获取选择的单位
const dataDetail = async () => {
  let res: any = await getDataDetail({ configId: proTableRef.value?.selectedList[0].configId })
  if (res.success) {
    rmarkData.value.dataDetails = res.data
    proDataRef.value?.clearSelection()
  }
}
// 年度下拉框
const ndList = (val: any) => {
  nextTick(() => {
    ndCpoyRef.value.ndList = val
    ndCpoyRef.value.formData.sourceNd = rmarkData.value.nd
  })
}
// 保存选择的单位
const saveTree = async (val: any[]) => {
  const idData: any = []
  val.forEach((root: any) => {
    const index = rmarkData.value.dataDetails.findIndex((item: any) => item.dwId == root.dwId)
    if (index == -1) {
      idData.push(root)
    }
  })
  rmarkData.value.dataDetails = rmarkData.value.dataDetails.concat(idData)
  treeModalRef.value.treeModal = false
}

// 点击树
const handlerNodeClick = (data: any) => {
  chooseNode.value = data
  menuData()
}
//保存
const pushMsgHandle = () => {
  ruleFormRef.value.validate(async (valid: any) => {
    if (!valid) return
    rmarkData.value.parentId = chooseNode.value.id ? chooseNode.value.id : rmarkData.value.nd
    rmarkData.value.dataDetails.forEach((item: any) => {
      item.dwType = item.nodeType
    })
    const res: any = await ysStatDwConfigSaveConfig(rmarkData.value)
    if (res.success) {
      ElMessage.success('新增成功')
      await initParamLists()
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
  {
    prop: 'configName',
    label: '名称'
  },
  {
    prop: 'statMethod',
    label: '统计方式',
    render: ({ row }: any) => {
      const item = tjfs.value.find((item: any) => row.statMethod == item.code)
      return item ? item.name : '-'
    }
  },
  {
    prop: 'recState',
    label: '状态',
    width: '80',
    render: ({ row }: any) => {
      const item = isRecState.value.find((item: any) => row.recState == item.code)
      return item ? item.name : row.recState
    }
  },
  {
    prop: 'isleaf',
    label: '是否末级节点',
    width: '100',
    render: ({ row }: any) => {
      const item = isShow.value.find((item: any) => row.isleaf == item.code)
      return item ? item.name : row.isleaf
    }
  },
  {
    prop: 'isDisplay',
    label: '是否显示',
    width: '100',
    render: ({ row }: any) => {
      const item = isShow.value.find((item: any) => row.isDisplay == item.code)
      return item ? item.name : row.isDisplay
    }
  },
  {
    prop: 'isBold',
    label: '是否加粗',
    width: '100',
    render: ({ row }: any) => {
      const item = isShow.value.find((item: any) => row.isBold == item.code)
      return item ? item.name : row.isBold
    }
  },
  {
    prop: 'nd',
    label: '年度',
    width: '80'
  },
  {
    prop: 'dispOrder',
    label: '排序',
    width: '80'
  }
])
const DWColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'dwName',
    label: '单位名称'
  }
])
// 新增弹窗
const handlerBtn = async (val: any, selectedList: any) => {
  if (val == 'DELETE' && selectedList.length == 0) {
    return ElMessage.warning('请选择数据')
  }
  if (val == 'ADD') {
    let res: any = await getBizOrgXzTreeExcludeBmNoPermissionNoLazy()
    if (res.success) {
      treeModalRef.value.treeModal = true
      treeModalRef.value.title = '选择单位'
      treeModalRef.value.treeDataList = res.data
      treeModalRef.value.checkStrictly = true
      treeModalRef.value.checkedKeys = rmarkData.value.dataDetails ? rmarkData.value.dataDetails.map((item: any) => item.dwId) : []
    }
  } else {
    ElMessageBox.confirm('确定要删除所数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        if (selectedList[0].detailId) {
          const detailIds: any = selectedList.map((item: any) => item.detailId).join(',')
          let res: any = await deleteDataDetail({ detailIds: detailIds })
          if (res.success) {
            ElMessage.success('删除成功！')
            await dataDetail()
          } else {
            ElMessage.error(res.msg)
          }
        } else {
          const index = rmarkData.value.dataDetails.findIndex((item: any) => item.dwId == selectedList[0].dwId)
          rmarkData.value.dataDetails.splice(index, 1)
          ElMessage.success('删除成功！')
          proDataRef.value.clearSelection()
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  }
}
// 页签数据
const menuData = async () => {
  const params = {
    nd: rmarkData.value.nd,
    busiType: rmarkData.value.busiType,
    parentId: chooseNode.value.id ? chooseNode.value.id : rmarkData.value.nd
  }
  let res: any = await getConfigList(params)
  if (res.success) {
    proTableRef.value?.clearSelection()
    pageData.value = res.data
  }
}
// 获取年度
const changeNd = (nd: any) => {
  rmarkData.value.nd = nd
  rmarkData.value.busiType = route.query.busiType
  initParamLists()
}
// 公共代码
const initParamLists = async () => {
  if (rmarkData.value.nd) {
    // 获取菜单树
    const params = {
      nd: rmarkData.value.nd,
      busiType: rmarkData.value.busiType
    }
    const res = await getNodeTree(params)
    treeData.value.length = 0
    if (res.success) {
      treeData.value.push({
        children: res.data,
        dispOrder: '1',
        id: rmarkData.value.nd,
        isleaf: '0',
        name: rmarkData.value.nd + '年度',
        recState: '1',
        parentId: null
      })
      nextTick(() => {
        treeRef.value.setCurrentKey(treeData.value[0].id)
      })
      const publicCodeList = await getPublicData('YSTJPZ_TJFS')
      if (publicCodeList.success && publicCodeList.data.length !== 0) {
        tjfs.value = publicCodeList.data
      }
      await menuData()
    }
  }
}
// 单选
const selectionChangeTable = (selection: any) => {
  if (selection.length > 1) {
    nextTick(() => {
      proTableRef.value?.clearSelection()
      proTableRef.value?.element.toggleRowSelection(selection[selection.length - 1])
    })
  }
}
// 单选
const handlerCilck = (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 单选
const selectionChange = (selection: any) => {
  if (selection.length > 1) {
    nextTick(() => {
      proTableRef.value?.clearSelection()
      proTableRef.value?.element.toggleRowSelection(selection[selection.length - 1])
    })
  }
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
.pageName {
  margin-bottom: 20px;
  font-size: 20px;
  letter-spacing: 2px;
  font-weight: bold;
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

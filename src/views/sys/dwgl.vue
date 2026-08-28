<!-- 组织管理 -->
<template>
  <div class="container" v-show="isShowPage">
    <div class="cont_btn">
      <div class="contbtn_left">
        <div class="pageListCont">
          <el-tree
            ref="treeRef"
            :load="loadChildren"
            lazy
            :highlight-current="true"
            @node-click="handlerNodeClick"
            :data="pageList"
            :props="defaultProps"
            :expand-on-click-node="false"
          />
        </div>
      </div>
      <div class="conbtn_right">
        <proTable
          ref="proTableRef"
          @search="searchHandle"
          @reset="resetHandle"
          :data-callback="pageListData"
          :request-api="pageMeeting"
          :request-auto="false"
          :columns="tableColumns"
          @row-click="handerClickTable"
          :loading="loading"
        >
          <template #tableHeader="scope">
            <el-button size="mini" :disabled="scope.selectedListIds.length == 0" type="primary" plain @click="editMsgHandle(scope.selectedList)">
              编 辑
            </el-button>
            <el-button size="mini" type="primary" plain @click="exportHandle"> 导 出 </el-button>
            <!-- <el-button size="mini" type="primary" plain @click="reset"> 刷 新 </el-button> -->
          </template>
        </proTable>
      </div>
    </div>
    <!-- 编辑 弹窗 -->
    <el-dialog
      ref="dialogFormRef"
      v-model="dialogType.isShow"
      :title="dialogType.title"
      :width="500"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-form
        label-suffix=" : "
        ref="ruleFormRef"
        label-width="100px"
        label-position="right"
        :model="rmarkData"
        :rules="rules"
        :hide-required-asterisk="false"
      >
        <el-form-item label="单位属性" prop="dwsx">
          <el-select style="width: 100%" v-model="rmarkData.dwsx" placeholder="请选择" clearable>
            <el-option v-for="item in GSSXList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
          </el-select>
          <!-- <el-input type="text" placeholder="请输入" :maxlength="20" show-word-limit v-model="rmarkData.dwsx" style="width: 200px" /> -->
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button size="mini" type="primary" plain v-debounce="[pushMsgHandle, `click`, 300]"> 保 存 </el-button>
        <el-button size="mini" plain v-debounce="[closeHandle, `click`, 300]"> 关 闭 </el-button>
      </div>
    </el-dialog>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: '/sys/dwgl'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import { onMounted, ref, reactive, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ElMessage, ElMessageBox } from 'element-plus'
import { getNodeTree, getDwList, updateDwsx, exportFy } from '@/api/sys/dwgl'
import { apiExportHandle } from '@/utils/export'
import { getPublicData } from '@/api/common' //公共代码

const chooseNode = ref('') //节点id
const treeRef = ref() //节点数

const tabBtn = ref('查询条件配置')
// 用户角色
const userDialogRef = ref()
const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
// 弹框标题，类型，显示
const dialogType = reactive({
  isShow: false,
  type: '',
  title: ''
})
const dialogFormRef = ref('')
// 弹框参数
const rmarkData = ref<any>({})
const ruleFormRef = ref()
const proTableRef = ref()
const dwIds = ref<any[]>([])
const paramsData = ref<any>()
const pageList = ref([])
const DWXZList = ref<any>([])
const GSSXList = ref<any[]>([])

const defaultProps = {
  children: 'children',
  label: 'name'
}

//表格规则
const rules = reactive({
  dwsx: [
    {
      required: true,
      message: '单位属性不能为空',
      trigger: 'blur'
    }
  ]
})

onMounted(async () => {
  await userDialogRef.value.getUser()
})

// 点击树
const handlerNodeClick = async (data: any) => {
  chooseNode.value = data.id
  proTableRef.value?.clearSelection()
  proTableRef.value.getTableList()
}

// 列表查询
const pageMeeting = (params: any) => {
  paramsData.value = { ...params, parentId: chooseNode.value }
  return getDwList(paramsData.value)
}

const loadChildren = async (node: any, resolve: any, reject: any) => {
  let id = node.level === 0 ? '-1' : node.data.id
  let res = await getNodeTree(id)
  if (res.success) {
    resolve(res.data)
  } else {
    ElMessage.error(res.msg)
    resolve([])
  }
}

//编辑
const editMsgHandle = (selectedList: any) => {
  dialogType.title = `编辑单位属性`
  dwIds.value = selectedList.map((item: any) => item.id)
  dialogType.isShow = true
}

//保存
const pushMsgHandle = () => {
  ruleFormRef.value.validate((valid: any) => {
    if (!valid) return
    loading.value = true
    updateDwsx({
      ...rmarkData.value,
      dwIds: dwIds.value
    }).then((res: any) => {
      if (res.success) {
        loading.value = false
        ElMessage({ type: 'success', message: '保存成功' })
        closeHandle()
      } else {
        loading.value = false
        ElMessage({ type: 'error', message: res.msg })
      }
    })
  })
}

const initParamLists = async () => {
  chooseNode.value = ''
  const nodeTree = await getNodeTree('')
  if (nodeTree.success && nodeTree.data.length !== 0) {
    pageList.value = nodeTree.data
    nextTick(() => {
      proTableRef.value?.clearSelection()
      proTableRef.value.getTableList()
    })
  }
  DWXZList.value.length = 0
  const res: any = await getPublicData('DWXZ_STATUS')
  if (res.success && res.data.length !== 0) {
    DWXZList.value.push(...res.data)
  }
  GSSXList.value.length = 0
  const item: any = await getPublicData('GSSX')
  if (item.success && item.data.length !== 0) {
    GSSXList.value.push(...item.data)
  }
}

const reset = () => {
  initParamLists()
}

// 导出
const exportHandle = async () => {
  try {
    loading.value = true
    const params = {
      parentId: paramsData.value?.parentId,
      name: paramsData.value?.name,
      dwsxId: paramsData.value?.dwsxId
    }
    const fileName = '一上预算上报数据表'
    apiExportHandle(params, fileName, exportFy)
    loading.value = false
  } catch (e) {
    loading.value = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}
// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    if (isQuery) {
      isShowPage.value = true
      await initParamLists()
    }
  } catch (e) {
    console.error(e)
  }
}

const closeHandle = async () => {
  proTableRef.value?.clearSelection()
  proTableRef.value.getTableList()
  ruleFormRef.value.resetFields()
  dwIds.value.length = 0
  dialogType.isShow = false
}
// 点击行选中
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 重置
const resetHandle = async () => {
  loading.value = false
  await initParamLists()
  // proTableRef.value?.clearSelection()
}
// 搜索
const searchHandle = () => {
  loading.value = false
  proTableRef.value?.clearSelection()
}
// 数据回调
const pageListData = (val: any) => {
  loading.value = false
  return val
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'id', label: 'ID' },
  { prop: 'name', label: '单位名称', search: { el: 'input', order: 1 } },
  {
    prop: 'dwsxId',
    label: '单位属性',
    search: { el: 'select', order: 2 },
    enum: GSSXList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'unicode',
    label: '单位性质',
    search: { el: 'select', order: 3 },
    enum: DWXZList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'unicodeName',
    label: '单位性质编码',
    render: ({ row }: any) => {
      return row.unicode
    }
  },
  {
    prop: 'state',
    label: '状态',
    search: { el: 'select', order: 4, defaultValue: 'Y' },
    enum: [
      { label: '启用', value: 'Y' },
      { label: '停用', value: 'N' }
    ],
    render: ({ row }: any) => {
      return row.state == 'Y' ? '启用' : '停用'
    }
  },
  { prop: 'shortname', label: '简称' }
])
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
.cont_btn {
  width: 100%;
  height: 90%;
  display: flex;
  justify-content: space-evenly;
}
.contbtn_left {
  width: 16%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  overflow: hidden;
  overflow-y: auto;
  .pageListCont {
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
}
</style>

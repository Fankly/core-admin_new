<!-- 承诺项维护 -->
<template>
  <div class="container" v-show="isShowPage">
    <div class="cont_btn">
      <div class="contbtn_left">
        <div class="pageListCont">
          <el-tree
            ref="treeRef"
            node-key="id"
            :filter-node-method="filterTreeData"
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
          :request-api="searchData"
          :request-auto="false"
          :search-col="4"
          :columns="tableColumns"
          @row-click="handerClickTable"
          :loading="loading"
        >
          <template #tableHeader="scope">
            <el-button size="mini" type="primary" plain @click="addMsgHandle"> 新 增 </el-button>
            <el-button size="mini" type="primary" :disabled="scope.selectedList.length != 1" plain @click="editMsgHandle(scope.selectedList)">
              编 辑
            </el-button>
            <el-button
              size="mini"
              :disabled="!scope.isSelected || chooseNode == ''"
              type="primary"
              plain
              @click="delMsgHandle(scope.selectedListIds)"
            >
              删 除
            </el-button>
          </template>
        </proTable>
      </div>
    </div>
    <!-- 新增、编辑 弹窗 -->
    <el-dialog
      ref="dialogFormRef"
      v-model="dialogType.isShow"
      :title="dialogType.title"
      :width="700"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-form label-suffix=" : " ref="ruleFormRef" label-width="100px" label-position="right" :model="rmarkData" :hide-required-asterisk="false">
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入名称' }]">
              <el-input type="text" placeholder="请输入名称" :maxlength="20" show-word-limit v-model.trim="rmarkData.name" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="编码" prop="code" :rules="[{ required: true, message: '请输入编码' }]">
              <el-input type="text" placeholder="请输入编码" :maxlength="20" show-word-limit v-model.trim="rmarkData.code" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态" prop="recState" :rules="[{ required: true, message: '请选择状态' }]">
              <el-select v-model="rmarkData.recState" clearable style="width: 100%">
                <el-option label="启用" :value="1" />
                <el-option label="停用" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="类型" prop="recType" :rules="[{ required: true, message: '请选择类型' }]">
              <el-select v-model="rmarkData.recType" clearable style="width: 100%">
                <el-option label="分类" :value="1" />
                <el-option label="普通" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="note">
              <el-input :maxlength="512" show-word-limit resize="none" type="textarea" :rows="5" v-model="rmarkData.note" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="排序号">
              <el-input type="number" placeholder="请输入排序号" :maxlength="20" show-word-limit v-model.trim="rmarkData.dispOrder" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="父级分类" prop="comCode">
              <el-input disabled type="text" placeholder="请输入父级分类" :maxlength="20" show-word-limit v-model.trim="rmarkData.comCode" />
            </el-form-item>
          </el-col>
        </el-row>
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
  name: '/sys/commonCode/index'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import { onMounted, ref, reactive, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageCode, saveCode, updateCode, deleteCode, treeCode } from '@/api/sys/comcode'

const chooseNode = ref('') //节点id
const parentId = ref('')
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

const defaultProps = {
  children: 'children',
  label: 'name'
}

const pageList = ref([])
onMounted(async () => {
  await userDialogRef.value.getUser()
})

// 点击树
const handlerNodeClick = (data: any) => {
  loading.value = true
  chooseNode.value = data.code
  parentId.value = data.id
  upTableData()
}
// 搜索
const searchHandle = () => {
  loading.value = true
  proTableRef.value?.clearSelection()
}
//重置
const resetHandle = () => {
  loading.value = true
  proTableRef.value?.clearSelection()
}
// 数据处理回调
const pageListData = (val: any) => {
  loading.value = false
  return val
}

const filterTreeData = (val: string, data: any) => {
  if (!val) return true
  return data.name.indexOf(val) !== -1
}
// 列表查询回调
const searchData = async (params: any) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params['comCode'] = chooseNode.value
  params['parentId'] = parentId.value
  return pageCode(params)
}
//新增
const addMsgHandle = () => {
  rmarkData.value = {}
  dialogType.title = `新增`
  rmarkData.value.comCode = chooseNode.value || ''
  rmarkData.value.parentId = parentId.value || ''
  rmarkData.value.recState = 1 // 默认状态为启用
  ;(dialogType.type = 'add'), (dialogType.isShow = true)
}
//编辑
const editMsgHandle = (selectedList: any) => {
  dialogType.title = `编辑`
  rmarkData.value = selectedList[0]
  ;(dialogType.type = 'edit'), (dialogType.isShow = true)
}

// 删除
const delMsgHandle = (selectedListIds: any) => {
  try {
    if (chooseNode.value == '') return ElMessage.warning('请选择年份')
    // 增加comfirm
    ElMessageBox.confirm('是否删除选中数据', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        loading.value = true
        deleteCode(selectedListIds).then(async (res: any) => {
          if (res.success) {
            loading.value = false
            ElMessage.success('删除成功')
            proTableRef.value?.getTableList()
            proTableRef.value?.clearSelection()
            await initParamLists()
          } else {
            loading.value = false
            ElMessage.error(res.msg)
          }
        })
      })
      .catch(() => {
        loading.value = false
      })
  } catch (error) {
    console.log(error)
  }
}

//保存
const pushMsgHandle = () => {
  ruleFormRef.value.validate((valid: any) => {
    if (!valid) return
    loading.value = true
    const api: any = dialogType.title == '新增' ? saveCode : updateCode
    api({
      ...rmarkData.value,
      nd: chooseNode.value
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
  // 获取公共代码
  const publicCodeList = await treeCode({ comCode: '' })
  if (publicCodeList.success && publicCodeList.data.length !== 0) {
    pageList.value = publicCodeList.data
  }
  // 刷新后自动定位到当前选中节点
  nextTick(() => {
    if (parentId.value) {
      treeRef.value?.setCurrentKey(parentId.value)
    }
  })
}

const userInfo = ref<any>()

// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      await initParamLists()
    }
  } catch (e) {
    console.error(e)
  }
}

const closeHandle = () => {
  ruleFormRef.value.resetFields()
  proTableRef.value?.getTableList()
  proTableRef.value?.clearSelection()
  initParamLists()
  dialogType.isShow = false
}
const upTableData = () => {
  proTableRef.value?.getTableList()
  proTableRef.value?.clearSelection()
}
// 点击行选中
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { prop: 'dispOrder', label: '序号', width: '50' },
  { prop: 'name', label: '名称', width: '180' },
  { prop: 'code', label: '编码', width: '180' },
  { prop: 'recStateName', label: '状态', width: '80' },
  { prop: 'recTypeName', label: '类型', width: '80' },
  { prop: 'comCode', label: '父级分类', width: '150' },
  { prop: 'note', label: '描述', width: '180' }
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

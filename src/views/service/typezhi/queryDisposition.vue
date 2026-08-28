<!-- 通用报表查询配置 -->
<template>
  <div class="container" v-show="isShowPage">
    <div class="cont_btn">
      <div class="contbtn_left">
        <el-input placeholder="请输入通用报表名称" @clear="selectSearchTree" v-model="searchForm" clearable style="width: 90%" />
        <div class="pageListCont">
          <el-tree ref="treeRef" :filter-node-method="filterTreeData" :highlight-current="true" @node-click="handlerNodeClick" :data="pageList" :props="defaultProps" :expand-on-click-node="false" />
        </div>
      </div>
      <div class="conbtn_right">
        <el-tabs v-model="tabMsg" type="border-card" @tab-click="handleTab">
          <el-tab-pane label="查询条件配置" name="1">
            <div class="operation">
              <div class="left">
                <el-button size="mini" type="primary" plain @click="addMsgHandle">新 增</el-button>
                <el-button size="mini" type="primary" plain @click="editMsgHandle">编 辑</el-button>
                <el-button size="mini" type="primary" plain @click="delMsgHandle">删 除</el-button>
              </div>
              <div class="right">
                <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
              </div>
            </div>

            <div class="table" v-loading="loading">
              <el-table ref="tableRef" border :header-cell-style="'text-align: center;'" :data="pageData" height="550px" @selection-change="handelCheckRow">
                <el-table-column type="selection" width="50" align="center" />
                <el-table-column label="字段" prop="code" width="130" align="center" />
                <el-table-column label="名称" prop="name" width="180" align="center" />
                <el-table-column label="类型" prop="type" width="100" align="center" />
                <el-table-column label="是否多选" prop="multiple" width="80" align="center" />
                <el-table-column label="公共代码" prop="ggdm" width="180" show-overflow-tooltip />
                <el-table-column label="调用方法" prop="dyff" width="280" show-overflow-tooltip />
                <el-table-column label="依赖项" prop="dependOnColumn" width="150" align="center" />
                <el-table-column label="是否默认展示" prop="sfmrzs" width="100" align="center" />
                <el-table-column label="排序" prop="sort" width="50" align="center" />
              </el-table>
            </div>
          </el-tab-pane>
          <el-tab-pane label="列表项配置" name="2">
            <div class="operation">
              <div class="left">
                <el-button size="mini" type="primary" plain @click="addMsgHandle">新 增</el-button>
                <el-button size="mini" type="primary" plain @click="editMsgHandle">编 辑</el-button>
                <el-button size="mini" type="primary" plain @click="delMsgHandle">删 除</el-button>
              </div>
              <div class="right">
                <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
              </div>
            </div>
            <div class="table" v-loading="loading">
              <el-table ref="tableRef" border :data="pageData1" height="550px" @selection-change="handelCheckRow">
                <el-table-column type="selection" width="50" align="center" />
                <el-table-column label="字段" prop="code" align="center" />
                <el-table-column label="名称" prop="name" align="center" />
                <el-table-column label="是否默认展示" prop="sfmrzs" align="center" />
                <el-table-column label="排序" prop="sort" align="center" />
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <!-- 新增、编辑 弹窗 -->
    <el-dialog ref="dialogFormRef" v-model="dialogType.isShow" :title="dialogType.title" :width="700" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false">
      <div class="commit" v-if="tabBtn == '查询条件配置'">
        <div v-for="(item, index) in editSate" :key="index">
          <div class="commit_form">
            <div class="type_name"><span class="isRed" v-if="item.isShow">*</span>{{ item.name }}</div>
            <el-select v-if="item.type == 'select'" v-model="formData[item.value]" :placeholder="item.placeholder" clearable style="width: 160px">
              <el-option v-for="item1 in item.options" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
            </el-select>
            <el-input :maxlength="30" show-word-limit v-if="item.type == 'input'" v-model="formData[item.value]" clearable :placeholder="item.placeholder" style="width: 160px"></el-input>
            <el-input-number v-if="item.type == 'number'" :placeholder="item.placeholder" v-model="formData[item.value]" style="width: 160px" :min="0" :max="9999999" controls-position="right" />
          </div>
        </div>
      </div>
      <div class="commit" v-else>
        <div v-for="(item, index) in editSate1" :key="index">
          <div class="commit_form">
            <div class="type_name"><span class="isRed" v-if="item.isShow">*</span>{{ item.name }}</div>
            <el-select v-if="item.type == 'select'" v-model="formData1[item.value]" :placeholder="item.placeholder" clearable style="width: 160px">
              <el-option v-for="item1 in item.options" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
            </el-select>
            <el-input :maxlength="30" show-word-limit v-if="item.type == 'input'" v-model="formData1[item.value]" clearable :placeholder="item.placeholder" style="width: 160px"></el-input>
            <el-input-number v-if="item.type == 'number'" :placeholder="item.placeholder" v-model="formData1[item.value]" style="width: 160px" :min="0" :max="9999999" controls-position="right" />
          </div>
        </div>
      </div>
      <div style="text-align: center">
        <el-button size="mini" :disabled="disabled" type="primary" plain @click="pushMsgHandle">保 存</el-button>
        <el-button size="mini" plain @click="closeHandle1">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/service/typezhi/queryDisposition'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import { getPublicData } from '@/api/common' //公共代码
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { onMounted, ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { xmSearchConfigGetList, searchSaveOrUpdate, deleteSearch, getSearchCodeData } from '@/api/service/expertinformation'

const searchForm = ref('') //输入框
const chooseNode = ref('') //节点id
const nodeName = ref('') //节点名称
const treeRef = ref() //节点数
const helpModalRef = ref()

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const tabBtn = ref('查询条件配置')
const tabMsg = ref('1')
// 用户角色
const userDialogRef = ref()
const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
const ids = ref([]) //选择的id
const checkData = ref<any>([]) //选择的数据
const disabled = ref(false)
// 弹框标题，类型，显示
const dialogType = reactive({
  title: '查询条件配置',
  type: '新增',
  isShow: false
})
const editSate = ref<any>([
  {
    isShow: 1,
    name: '字段：',
    type: 'input',
    placeholder: '请输入',
    value: 'code'
  },
  {
    isShow: 1,
    name: '名称：',
    type: 'input',
    placeholder: '请输入',
    value: 'name'
  },
  {
    isShow: 1,
    name: '类型：',
    type: 'input',
    placeholder: '请输入',
    value: 'type'
  },
  {
    isShow: 1,
    name: '是否多选：',
    type: 'select',
    placeholder: '请选择',
    value: 'multiple',
    options: [
      { code: '1', name: '是' },
      { code: '0', name: '否' }
    ]
  },
  {
    isShow: 0,
    name: '公共代码：',
    type: 'input',
    placeholder: '请输入',
    value: 'ggdm'
  },
  {
    isShow: 0,
    name: '调用方法：',
    type: 'input',
    placeholder: '请输入',
    value: 'dyff'
  },
  {
    isShow: 0,
    name: '依赖项：',
    type: 'input',
    placeholder: '请输入',
    value: 'dependOnColumn'
  },
  {
    isShow: 1,
    name: '是否默认显示：',
    type: 'select',
    placeholder: '请选择',
    value: 'sfmrzs',
    options: [
      { code: '1', name: '是' },
      { code: '0', name: '否' }
    ]
  },

  {
    isShow: 0,
    name: '排序：',
    type: 'number',
    placeholder: '请输入',
    value: 'sort'
  }
])

const editSate1 = ref([
  {
    isShow: 1,
    name: '字段：',
    type: 'input',
    placeholder: '请输入',
    value: 'code'
  },
  {
    isShow: 1,
    name: '名称：',
    type: 'input',
    placeholder: '请输入',
    value: 'name'
  },
  {
    isShow: 1,
    name: '是否默认显示：',
    type: 'select',
    placeholder: '请选择',
    value: 'sfmrzs',
    options: [
      { code: '1', name: '是' },
      { code: '0', name: '否' }
    ]
  },

  {
    isShow: 0,
    name: '排序：',
    type: 'number',
    placeholder: '请输入',
    value: 'sort'
  }
])

// 报表内容
const formData = reactive<any>({
  code: '',
  name: '',
  type: '',
  multiple: '1',
  ggdm: '',
  dyff: '',
  dependOnColumn: '',
  sfmrzs: '1',
  sort: 0
})
// 报表内容
const formData1 = reactive<any>({
  code: '',
  name: '',
  sfmrzs: '1',
  sort: 0
})
const dialogFormRef = ref('')
const tableRef = ref() //表格ref
const pageData = ref([]) //表格数据
const pageData1 = ref([]) //表格数据

const defaultProps = {
  children: 'children',
  label: 'name'
}

const pageList = ref([])
onMounted(async () => {
  await userDialogRef.value.getUser()
})

// 查询
const searchDataHandle = async () => {
  try {
    loading.value = true
    const res = await xmSearchConfigGetList(chooseNode.value, 1)

    if (res.success) {
      res.data.forEach((item: any) => {
        item.multiple = item.multiple == 1 ? '是' : '否'
        item.sfmrzs = item.sfmrzs == 1 ? '是' : '否'
      })
      pageData.value = res.data
      loading.value = false
      closeHandle()
    } else {
      ElMessage.success(res.msg)
      loading.value = false
    }
  } catch (e) {
    loading.value = false
    console.error(e)
  }
}
const searchDataHandle1 = async () => {
  try {
    loading.value = true
    const res = await xmSearchConfigGetList(chooseNode.value, 2)

    if (res.success) {
      res.data.forEach((item: any) => {
        item.sfmrzs = item.sfmrzs == 1 ? '是' : '否'
      })
      pageData1.value = res.data
      loading.value = false
      closeHandle()
    } else {
      ElMessage.success(res.msg)
      loading.value = false
    }
  } catch (e) {
    loading.value = false
    console.error(e)
  }
}
// 点击树
const handlerNodeClick = (data: any) => {
  loading.value = true
  chooseNode.value = data.code
  nodeName.value = data.name
  searchDataHandle()
  searchDataHandle1()
}
// 查询树
const selectSearchTree = async () => {
  chooseNode.value = ''
  nodeName.value = ''
  if (searchForm.value.trim() != '') {
    const publicCodeList = await getSearchCodeData(searchForm.value.trim())
    if (publicCodeList.success && publicCodeList.data.length !== 0) {
      pageList.value = publicCodeList.data
    }
  } else {
    await initParamLists()
  }
}

watch(
  () => searchForm.value,
  (val) => {
    if (val.trim() != '') {
      chooseNode.value = ''
      nodeName.value = ''
    }
    treeRef.value.filter(val.trim())
  }
)

const filterTreeData = (val: string, data: any) => {
  if (!val) return true
  return data.name.indexOf(val) !== -1
}
//新增
const addMsgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个通用报表'
    })
    return
  }
  dialogType.title = `${tabBtn.value}-新增`
  ;(dialogType.type = 'add'), (dialogType.isShow = true)
}
//编辑
const editMsgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个通用报表'
    })
    return
  }
  if (ids.value.length != 1) {
    ElMessage({
      type: 'warning',
      message: '请选择一条要编辑的数据'
    })
    return
  }
  dialogType.title = `${tabBtn.value}-编辑`
  ;(dialogType.type = 'edit'), (dialogType.isShow = true)
  if (tabBtn.value == '查询条件配置') {
    formData.sort = parseInt(checkData.value[0].sort)
    formData.code = checkData.value[0].code
    formData.name = checkData.value[0].name
    formData.type = checkData.value[0].type
    formData.multiple = checkData.value[0].multiple == '是' ? '1' : '0'
    formData.ggdm = checkData.value[0].ggdm
    formData.dyff = checkData.value[0].dyff
    formData.dependOnColumn = checkData.value[0].dependOnColumn
    formData.sfmrzs = checkData.value[0].sfmrzs == '是' ? '1' : '0'
  } else {
    formData1.sort = parseInt(checkData.value[0].sort)
    formData1.code = checkData.value[0].code
    formData1.name = checkData.value[0].name
    formData1.sfmrzs = checkData.value[0].sfmrzs == '是' ? '1' : '0'
  }
}

// 删除
const delMsgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个项目类型'
    })
    return
  }
  // 判断是否选中
  if (ids.value.length === 0) {
    ElMessage({
      type: 'warning',
      message: '请选择要删除的数据'
    })
    return
  }

  // 增加comfirm
  ElMessageBox.confirm('是否删除选中数据', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      loading.value = true

      deleteSearch(ids.value).then((res: any) => {
        if (res.success) {
          loading.value = false
          ElMessage({
            type: 'success',
            message: '删除成功'
          })
          searchDataHandle()
          searchDataHandle1()
        } else {
          loading.value = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    })
    .catch(() => {
      loading.value = false
    })
}

//保存
const pushMsgHandle = () => {
  if (tabBtn.value == '查询条件配置') {
    if (formData.code == null || formData.code.trim() == '') {
      return ElMessage.warning('字段不能为空')
    }
    if (formData.name == null || formData.name.trim() == '') {
      return ElMessage.warning('名称不能为空')
    }
    if (formData.type == null || formData.type.trim() == '') {
      return ElMessage.warning('类型不能为空')
    }

    if (formData.multiple == '' || formData.multiple == null) {
      return ElMessage.warning('是否多选不能为空')
    }
    if (formData.sfmrzs == '' || formData.sfmrzs == null) {
      return ElMessage.warning('是否默认显示不能为空')
    }
  } else {
    if (formData1.code == null || formData1.code.trim() == '') {
      return ElMessage.warning('字段不能为空')
    }
    if (formData1.name == null || formData1.name.trim() == '') {
      return ElMessage.warning('名称不能为空')
    }

    if (formData1.sfmrzs == '' || formData1.sfmrzs == null) {
      return ElMessage.warning('是否默认显示不能为空')
    }
  }
  loading.value = true
  var formdata = tabBtn.value == '查询条件配置' ? formData : formData1
  if (dialogType.type == 'add') {
    disabled.value = true
    searchSaveOrUpdate({
      ...formdata,
      searchCode: chooseNode.value,
      searchName: nodeName.value,
      searchType: tabBtn.value == '查询条件配置' ? '1' : '2'
    }).then((res: any) => {
      if (res.success) {
        loading.value = false
        ElMessage({ type: 'success', message: '新增成功' })
        searchDataHandle()
        searchDataHandle1()
        disabled.value = false
      } else {
        loading.value = false
        disabled.value = true
        ElMessage({ type: 'error', message: res.msg })
      }
    })
  } else {
    ElMessageBox.confirm('请确定编辑内容', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        searchSaveOrUpdate({
          ...formdata,
          searchCode: chooseNode.value,
          searchName: nodeName.value,
          searchType: tabBtn.value == '查询条件配置' ? '1' : '2',
          id: ids.value[0]
        }).then((res: any) => {
          if (res.success) {
            loading.value = false
            ElMessage({ type: 'success', message: '编辑成功' })
            searchDataHandle()
            searchDataHandle1()
          } else {
            loading.value = false
            ElMessage({ type: 'error', message: res.msg })
          }
        })
      })
      .catch(() => {
        loading.value = false
      })
  }
}

// 多选
const handelCheckRow = (val: any) => {
  ids.value = []
  ids.value = val.map((row: any) => row.id)
  checkData.value = val
}

const initParamLists = async () => {
  // 获取公共代码
  const publicCodeList = await getPublicData('TYBBCXPZ_COM')
  if (publicCodeList.success && publicCodeList.data.length !== 0) {
    pageList.value = publicCodeList.data
  }
}

const handleTab = ({ props }: any) => {
  tabBtn.value = props.label
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
// 关闭
const closeHandle = () => {
  ids.value = []
  checkData.value = []
  for (let key in formData) {
    formData[key] = null
  }
  for (let key in formData1) {
    formData1[key] = null
  }
  dialogType.isShow = false
}

const closeHandle1 = () => {
  ids.value = []
  checkData.value = []
  for (let key in formData) {
    formData[key] = null
  }
  for (let key in formData1) {
    formData1[key] = null
  }
  searchDataHandle()
  searchDataHandle1()
  dialogType.isShow = false
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;

  .table {
    padding-top: 10px;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}

.pageName {
  margin-bottom: 20px;
  font-size: 20px;
  letter-spacing: 2px;
  font-weight: bold;
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

  .operation {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .btnList {
    width: 320px;
    display: flex;
    justify-content: space-between;
  }
}

.commit {
  width: 100%;
  // border: 1px solid red;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;

  .commit_form {
    display: flex;
    align-items: center;
    margin-bottom: 30px;

    .type_name {
      width: 120px;
      text-align: right;
      margin: 0 10px 0 0;

      .isRed {
        color: red;
        margin-right: 5px;
      }
    }
  }
}
</style>

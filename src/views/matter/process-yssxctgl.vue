<script lang="ts">
export default {
  name: '/matter/process-yssxctgl'
}
</script>

<script setup lang="ts">
import ProTable from '@/components/ProTable/index.vue'
import { onMounted, reactive, ref, h } from 'vue'
import {
  getPage,
  addMsgData,
  delMsgData,
  exportData,
  enableMsgData,
  stopMsgData,
  updateMsg,
  updateBmdMsg,
  getImportTemplate,
  importData,
  getBmByYssxctId1
} from '@/api/matter/matterYslxctgl'
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ImportExcel from '@/components/ImportExcel/index.vue'
import DeptTreeSelect from '@/views/matter/components/DeptTreeSelect/index.vue'
import DeptCascaser from '@/views/matter/components/DeptCascaser.vue'
import { useGuide } from '@/hooks/useGuide'

// ProTable 实例
const proTable = ref<InstanceType<typeof ProTable>>()

const loading = ref<boolean>(false)
const deptTreeSelectRef = ref()
const mainDeptTreeSelectRef = ref()
const importRef = ref()
// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = reactive({ type: 1 })
const ztListData: any = ref([
  {
    code: '1',
    value: '启用'
  },
  {
    code: '0',
    value: '停用'
  }
])
// 表格配置项
const columns = reactive<any[]>([
  { type: 'selection', width: 80 },
  { prop: 'id', label: 'ID' },
  { prop: 'ctmc', label: '重点投向名称', search: { el: 'input' } },
  { prop: 'bmdflag', label: '是否规模化' },
  {
    prop: 'gkbmName',
    label: '归口部门'
  },
  {
    prop: 'gkbm',
    label: '归口部门',
    search: {
      render: () => {
        return h(DeptCascaser, {
          specialOrgId: specialOrgId.value,
          ref: mainDeptTreeSelectRef
        })
      }
    },
    isShow: false,
    width: '140'
  },
  { prop: 'ywsm', label: '业务说明' },
  {
    prop: 'zt',
    label: '状态',
    search: { el: 'select' },
    enum: ztListData.value,
    fieldNames: { label: 'value', value: 'code' }
  },
  { prop: 'cjrName', label: '创建人名称' },
  { prop: 'zhggrName', label: '最后更改人名称' }
])

const userDialogRef = ref<any>()
//加载中
const dialogLoading = ref<boolean>(false)

const aecdialog = ref<boolean>(false)

const bmddialog = ref<boolean>(false)

const { startGuide } = useGuide({
  moduleKey: 'CentralizedModification',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const deptDatas = reactive<{
  specialOrgId: string
  selectDatas: string[]
}>({
  specialOrgId: '',
  selectDatas: []
})

const changeValid = (rule: any, value: any, callback: any) => {
  const selectValue = deptTreeSelectRef.value.selectData.params
  if (selectValue.length === 0) {
    callback(new Error('请选择归口部门'))
  } else {
    callback()
  }
}

const dialogFormRules = reactive({
  ctmc: [{ required: true, message: '重点投向名称必填', trigger: 'blur' }],
  bmdflag: [{ required: true, message: '请选择是否规模化', trigger: 'change' }],
  zt: [{ required: true, message: '请选择状态', trigger: 'change' }],
  bmids: [{ required: true, validator: changeValid }]
})

const dialogFormBmdRules = reactive({
  bmdflag: [{ required: true, message: '请选择是否规模化', trigger: 'change' }]
})

interface RuleForm {
  id: string
  ctmc: string
  bmdflag: string
  zt: string
  ywsm: string
  bmids: any[]
}

interface RuleBmdForm {
  bmdflag: string
}

const dialogForm = reactive<RuleForm>({
  id: '',
  ctmc: '',
  bmdflag: '',
  zt: '',
  ywsm: '',
  bmids: []
})

const dialogBmdForm = reactive<RuleBmdForm>({
  bmdflag: ''
})

const selectRolesHandle = () => {
  userDialogRef.value.getUser()
}

const specialOrgId = ref<string>('')
const roleCode = ref<string>('')
const isShowPage = ref<boolean>(false)
const form = reactive({
  id: '',
  ctmc: '',
  bmdflag: '',
  zt: '',
  ywsm: ''
})

const getRoleHandle = () => {
  specialOrgId.value = userDialogRef.value.specialorgid
  roleCode.value = userDialogRef.value.roleCode
  initParam.specialorgid = specialOrgId.value
  deptDatas.specialOrgId = specialOrgId.value
  initParam.roleCode = roleCode.value
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
    startGuide()
  }
}

const isSaveOrEdit = ref<string>('')
const ruleFormRef = ref('')

const ruleBmdFormRef = ref('')
const titleName = ref<string>('')
let idsString = ref<string>('')

//新增
const submitForm = async (formEl: any) => {
  if (!formEl) return
  await formEl.validate(async (valid: any, fields: any) => {
    if (valid) {
      dialogLoading.value = true
      try {
        dialogForm.bmids.length = 0
        const selectValue = deptTreeSelectRef.value.selectData.params
        dialogForm.bmids.push(...selectValue)

        if (isSaveOrEdit.value === 'add') {
          const res = await addMsgData({
            ...dialogForm
          })
          if (res.success) {
            // 提示
            ElMessage.success('保存成功')
            // 关闭弹窗
            onclose()
          } else {
            ElMessage.error(res.msg)
          }
        } else {
          const res = await updateMsg({
            ...dialogForm
          })
          if (res.success) {
            // 提示
            ElMessage.success('修改成功')
            // 关闭弹窗
            onclose()
          } else {
            ElMessage.error(res.msg)
          }
        }
        // 刷新表格

        proTable.value?.clearSelection()
        proTable.value?.search()
      } finally {
        dialogLoading.value = false
      }
    }
  })
}

const getDataList = (params: any) => {
  loading.value = true
  proTable.value?.clearSelection()
  return getPage(params)
}
//新增
const addHandle = () => {
  isSaveOrEdit.value = 'add'
  dialogForm.id = ''
  dialogForm.ctmc = ''
  dialogForm.bmdflag = '0'
  dialogForm.zt = '1'
  dialogForm.ywsm = ''
  aecdialog.value = true
  titleName.value = '新增'
  dialogForm.bmids.length = 0
  deptDatas.selectDatas.length = 0
}

//白名单设置
const bmdHandle = (selectedListIds: any) => {
  idsString.value = selectedListIds
  dialogForm.bmdflag = ''
  bmddialog.value = true
}

// 编辑
const editMsg = async (selectedList: any) => {
  if (selectedList.length !== 1) {
    ElMessage.error('只能选择一条数据进行编辑')
    return
  }
  setYjdwOrEjdwData('edit', selectedList[0])
}

//查看
const viewMsg = (selectedList: any) => {
  if (selectedList.length !== 1) {
    ElMessage.error('只能选择一条数据进行编辑')
    return
  }
  setYjdwOrEjdwData('view', selectedList[0])
}

//删除
const delMsg = (ids: string[]) => {
  loading.value = true
  ElMessageBox.confirm('是否删除选中数据', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const res = await delMsgData(ids)
      if (res.success) {
        loading.value = false
        ElMessage.success('删除成功')
        // 刷新表格

        proTable.value?.clearSelection()

        proTable.value?.search()
      } else {
        loading.value = false
        ElMessage.error(res.msg)
        // 刷新表格

        proTable.value?.clearSelection()

        proTable.value?.search()
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const setDefaultBmData = async (id: string): Promise<string[]> => {
  let res = await getBmByYssxctId1(id)
  if (res.success) {
    let defaultKeys: any = []
    let defaultChecked: any = []
    res.data.forEach((item: any) => {
      defaultChecked.push(...item.splice(item.length - 1, 1))
      defaultKeys.push(...item)
    })
    defaultKeys = Array.from(new Set(defaultKeys))
    let selectDatas = defaultChecked.join(',').split(',').concat()
    return [defaultKeys, selectDatas]
  } else {
    ElMessage.error(res.msg)
    return []
  }
}

const setYjdwOrEjdwData = async (flag: string, selectedList: any) => {
  try {
    dialogLoading.value = true
    isSaveOrEdit.value = flag
    let selectDatas = await setDefaultBmData(selectedList.id)
    selectDatas.length === 2 ? deptDatas.selectDatas.push(...selectDatas) : []
    selectDatas.length !== 0
      ? dialogForm.bmids.push(...selectDatas[1])
      : (dialogForm.bmids.length = 0)
    if (flag === 'edit') {
      dialogForm.id = selectedList.id
      dialogForm.ctmc = selectedList.ctmc
      dialogForm.bmdflag = selectedList.bmdflag == '是' ? '1' : '0'
      dialogForm.zt = selectedList.zt
      dialogForm.ywsm = selectedList.ywsm
      titleName.value = '编辑'
    }
    if (flag === 'view') {
      dialogForm.id = selectedList.id
      dialogForm.ctmc = selectedList.ctmc
      dialogForm.bmdflag = selectedList.bmdflag
      dialogForm.zt = selectedList.zt
      dialogForm.ywsm = selectedList.ywsm
      titleName.value = '查看'
    }
    aecdialog.value = true
  } finally {
    dialogLoading.value = false
  }
}

// 导入
const importMsg = () => {
  let params = {
    title: '数据',
    tempApi: getImportTemplate,
    importApi: importData,
    specialorgid: specialOrgId.value,

    getTableList: proTable.value?.getTableList
  }
  importRef.value.acceptParams(params)
}

// 导出
const exportMsg = () => {
  loading.value = true
  exportData({
    specialorgid: specialOrgId.value,
    ...proTable.value?.searchParam
  }).then((res) => {
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  })
}

//启用
const enableMsg = (ids: string[]) => {
  loading.value = true
  ElMessageBox.confirm('是否启用', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const res = await enableMsgData(ids)
      if (res.success) {
        loading.value = false
        ElMessage.success('启用成功')
        // 刷新表格

        proTable.value?.clearSelection()

        proTable.value?.search()
      } else {
        loading.value = false
        ElMessage.error(res.msg)
      }
    })
    .finally(() => {
      loading.value = false
    })
}

//停用
const stopMsg = (ids: string[]) => {
  loading.value = true
  ElMessageBox.confirm('是否停用', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const res = await stopMsgData(ids)
      if (res.success) {
        loading.value = false
        ElMessage.success('停用成功')
        // 刷新表格

        proTable.value?.clearSelection()

        proTable.value?.search()
      } else {
        loading.value = false
        ElMessage.error(res.msg)
      }
    })
    .finally(() => {
      loading.value = false
    })
}

//关闭
const onclose = () => {
  // 清除
  dialogForm.ctmc = ''
  dialogForm.bmdflag = ''
  dialogForm.zt = ''
  dialogForm.ywsm = ''
  aecdialog.value = false
  dialogForm.bmids.length = 0
  deptDatas.selectDatas.length = 0
}

//关闭
const onBmdclose = () => {
  // 清除
  dialogForm.bmdflag = ''
  bmddialog.value = false
}

//白名单设置确定
const submitBmdForm = async (formEl: any) => {
  if (!formEl) return
  await formEl.validate(async (valid: any, fields: any) => {
    if (valid) {
      const res = await updateBmdMsg({
        ids: idsString.value,
        bmdFlag: dialogBmdForm.bmdflag
      })
      if (res.success) {
        // 提示
        ElMessage.success('保存成功')
        // 关闭弹窗
        onBmdclose()
      } else {
        ElMessage.error(res.msg)
      }
      // 刷新表格

      proTable.value?.clearSelection()
      proTable.value?.search()
    }
  })
}

const resetHandle = () => {
  mainDeptTreeSelectRef.value.deptData = ''
}

onMounted(() => {
  selectRolesHandle()
})

const dataCallbackHandle = (data: any) => {
  loading.value = false
  return data
}

const searchHandle = () => {
  proTable.value?.clearSelection()
}
</script>

<template>
  <div class="table-box" v-loading="loading" v-if="isShowPage">
    <ProTable
      @reset="resetHandle"
      @search="searchHandle"
      :data-callback="dataCallbackHandle"
      :request-auto="true"
      :pagination="true"
      :search-col="4"
      ref="proTable"
      :requestApi="getDataList"
      :init-param="initParam"
      :columns="columns"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button v-permission="'ADD'" size="mini" type="primary" plain @click="addHandle"
          >新 增</el-button
        >
        <el-button
          v-permission="'EDIT'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="editMsg(scope.selectedList)"
          >编 辑
        </el-button>
        <el-button
          v-permission="'VIEW'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="viewMsg(scope.selectedList)"
          >查 看</el-button
        >
        <el-button
          v-permission="'DELETE'"
          size="mini"
          :disabled="!scope.isSelected"
          type="danger"
          plain
          @click="delMsg(scope.selectedListIds)"
          >物理删除</el-button
        >
        <el-button v-permission="'IMPORT'" size="mini" type="primary" plain @click="importMsg"
          >导 入</el-button
        >
        <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="exportMsg"
          >导 出</el-button
        >
        <el-button
          v-permission="'START'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="enableMsg(scope.selectedListIds)"
          >启 用</el-button
        >
        <el-button
          v-permission="'STOP'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="stopMsg(scope.selectedListIds)"
          >停 用</el-button
        >
        <el-button
          v-permission="'WHITELIST'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="bmdHandle(scope.selectedListIds)"
          >规模化设置</el-button
        >
      </template>
    </ProTable>
  </div>
  <ImportExcel ref="importRef" />
  <!--  权限选择-->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>

  <vxe-modal
    width="40%"
    position="center"
    height="380"
    :loading="dialogLoading"
    @close="onclose"
    :destroy-on-close="true"
    v-model="aecdialog"
    :title="titleName"
    show-footer
  >
    <template #default>
      <el-form
        label-position="right"
        label-width="120px"
        ref="ruleFormRef"
        :rules="dialogFormRules"
        :model="dialogForm"
        :disabled="isSaveOrEdit === 'view'"
      >
        <el-form-item prop="ctmc" label="重点投向名称:">
          <el-input v-model="dialogForm.ctmc" maxlength="127"></el-input>
        </el-form-item>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item prop="bmdflag" label="是否规模化:">
              <el-select v-model="dialogForm.bmdflag" style="width: 100%" placeholder="请选择">
                <el-option label="是" value="1"></el-option>
                <el-option label="否" value="0"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="zt" label="状态:">
              <el-select v-model="dialogForm.zt" style="width: 100%" placeholder="请选择">
                <el-option label="启用" value="1"></el-option>
                <el-option label="停用" value="0"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item prop="bmids" label="归口部门:">
          <DeptTreeSelect
            :dept-datas="deptDatas.selectDatas"
            ref="deptTreeSelectRef"
            :special-org-id="deptDatas.specialOrgId"
          ></DeptTreeSelect>
        </el-form-item>
        <el-form-item label="业务说明:">
          <el-input
            type="textarea"
            v-model="dialogForm.ywsm"
            maxlength="127"
            :rows="4"
            resize="none"
          ></el-input>
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <div class="dialog-footer" style="text-align: center">
        <el-button v-if="isSaveOrEdit !== 'view'" type="primary" @click="submitForm(ruleFormRef)"
          >保存</el-button
        >
        <el-button type="primary" @click="onclose">关闭</el-button>
      </div>
    </template>
  </vxe-modal>
  <vxe-modal title="规模化设置" show-footer :loading="dialogLoading" v-model="bmddialog">
    <el-form
      label-position="right"
      label-width="100px"
      ref="ruleBmdFormRef"
      :rules="dialogFormBmdRules"
      :model="dialogBmdForm"
    >
      <el-form-item prop="bmdflag" label="是否规模化:">
        <el-select v-model="dialogBmdForm.bmdflag" placeholder="请选择" style="width: 100%">
          <el-option label="是" value="1"></el-option>
          <el-option label="否" value="0"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer" style="text-align: center">
        <el-button type="primary" @click="submitBmdForm(ruleBmdFormRef)">确定</el-button>
        <el-button type="primary" @click="onBmdclose">取消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<style scoped lang="less">
.table-box {
  padding: 10px;
}
</style>

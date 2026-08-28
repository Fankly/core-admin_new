<template>
  <div class="container" v-loading="loading">
    <ProTable
      @row-click="rowClick"
      @search="clearSelect"
      @reset="clearSelect"
      v-if="isShowPage"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button size="mini" type="primary" plain @click="openModal('add')">新 增</el-button>
        <el-button
          size="mini"
          type="primary"
          plain
          :disabled="!scope['isSelected'] || scope['selectedList'].length !== 1"
          @click="openModal('view', scope['selectedList'][0])"
          >查 看</el-button
        >
        <el-button
          size="mini"
          type="primary"
          plain
          :disabled="
            !scope['isSelected'] ||
            scope['selectedList'].length !== 1 ||
            scope['selectedList'][0]?.status === '1'
          "
          @click="openModal('edit', scope['selectedList'][0])"
          >编 辑</el-button
        >
        <el-button
          size="mini"
          type="primary"
          plain
          :disabled="!scope['isSelected'] || !canSubmit(scope['selectedList'])"
          @click="deleteRow(scope['selectedList'])"
          >删 除</el-button
        >
        <el-button
          @click="submitRow(scope['selectedList'].filter((v: any) => v.status === '0'))"
          size="mini"
          type="primary"
          plain
          :disabled="!scope['isSelected'] || !canSubmit(scope['selectedList'])"
          >提 交</el-button
        >
        <el-button size="mini" type="primary" plain @click="handleImport">导 入</el-button>
        <el-button size="mini" type="primary" plain @click="handleExport">导 出</el-button>
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <ImportExcel ref="importRef" />
  <FormModal
    ref="formModalRef"
    title="专利和研发费用信息"
    :mode="mode"
    :fields="formFields"
    :data="formData"
    @save="handleSave"
    @close="handleClose"
    :label-width="'200px'"
  />
</template>

<script lang="ts">
export default {
  name: '/motivation/Science'
}
</script>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import ImportExcel from '@/components/ImportExcel/indexSy.vue'
import FormModal, { FormField } from '@/components/FormModal'
import { getEjdw, getPublicData, getYjdw } from '@/api/common' //公共代码
import { decimal2Rules, integerRules } from '@/utils/rules'
import {
  zlhyffyxxPageApi,
  zlhyffyxxRemoveApi,
  zlhyffyxxSubmit,
  zlhyffyxxSaveApi,
  zlhyffyxxGetInfoApi,
  zlhyffyxxgetImportTemplate,
  zlhyffyxxImportExcel,
  zlhyffyxxExportExcel
} from '@/api/motivation/science'

const userDialogRef = ref()
const isShowPage = ref(false)

const proTableRef = ref<InstanceType<typeof ProTable>>()
const formModalRef = ref<InstanceType<typeof FormModal>>()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const mode = ref<'add' | 'edit' | 'view'>('add')
const formData = ref({})

const yjdwList = ref<
  {
    code: string
    name: string
  }[]
>([]) // 一级单位（市）
const ejdwList = ref<
  {
    code: string
    name: string
  }[]
>([]) // 二级单位（县）

const getYjdwData = async () => {
  const yjdwRes = await getYjdw({
    dwId: userInfo.value.dwId,
    bmId: userInfo.value.deptId
  })
  if (yjdwRes.success) {
    yjdwList.value.push(...yjdwRes.data)
  }
}

const selectYjdwChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  params.ejdw = ''
  ejdwList.value.length = 0
  const ejdwRes = await getEjdw({
    YJDW: val,
    parentCode: val,
    dwId: userInfo.value.dwId,
    bmId: userInfo.value.deptId
  })
  if (ejdwRes.success && ejdwRes.data.length !== 0) {
    ejdwList.value.push(...ejdwRes.data)
  }
}
const canSubmit = (selectList: any[]) => {
  return selectList.find((v) => v.status === '0')
}

// 表格字段
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 80 },
  // { type: 'index', width: 80, label: '序号' },

  {
    prop: 'yjdw',
    label: '一级单位（市）',
    search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
    isShow: false,
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'ejdw',
    label: '二级单位（县）',
    search: { el: 'select', order: 2 },
    enum: ejdwList.value,
    isShow: false,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'status',
    label: '状态',
    width: '120',
    search: {
      el: 'select',
      order: 3
    },
    enum: [
      { label: '草稿', value: '0' },
      { label: '提交', value: '1' }
    ],
    fieldNames: { label: 'label', value: 'value' }
  },
  {
    prop: 'yjdwName',
    label: '一级单位（市）',
    width: '180'
  },
  {
    prop: 'ejdwName',
    label: '二级单位（县）',
    width: '180'
  },
  {
    prop: 'fmzlgs',
    label: '发明专利个数'
  },
  {
    prop: 'syxywazlgs',
    label: '实用型与外观专利个数'
  },
  {
    prop: 'yjkff',
    label: '总部确定研究开发费（元）'
  }
])

//  表单字段
const formFields: FormField[] = [
  {
    prop: 'id',
    label: 'Id',
    type: 'hidden'
  },
  {
    prop: 'yjdw',
    label: '一级单位（市）',
    type: 'select',
    required: true,
    options: yjdwList.value as any
  },
  {
    prop: 'ejdw',
    label: '二级单位（县）',
    type: 'select',
    required: true,
    dependsOn: 'yjdw',
    optionsLoader: async (yjdwValue: string, formData: Record<string, any>) => {
      const response = await getEjdw({
        YJDW: yjdwValue,
        parentCode: yjdwValue,
        dwId: userInfo.value.dwId,
        bmId: userInfo.value.deptId
      })
      return response.data.map((ejdw: any) => ({
        label: ejdw.name,
        value: ejdw.code
      }))
    }
  },
  {
    prop: 'fmzlgs',
    label: '发明专利个数',
    type: 'input',
    rules: integerRules()
  },

  {
    prop: 'syxywazlgs',
    label: '实用型与外观专利个数',
    type: 'input',
    rules: integerRules()
  },
  {
    prop: 'yjkff',
    label: '总部确定研究开发费（元）',
    type: 'input',
    rules: decimal2Rules()
  }
]
// loading状态
const loading = ref(false)
const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: ''
})

// 清除表格选择状态
const clearSelect = () => {
  proTableRef.value?.clearSelection()
}
const deleteRow = async (rows: any) => {
  const isDel = rows.some((item: any) => item.status == '1')
  if (isDel) {
    return ElMessage.warning('包含已提交数据无法删除！')
  }
  const ids = rows.map((v: any) => v.id)
  await ElMessageBox.confirm('是否删除选中数据', {
    title: '提示',
    cancelButtonText: '取消',
    confirmButtonText: '确定'
  })
  const res = await zlhyffyxxRemoveApi(ids)
  if (res.success) {
    ElMessage.success('删除成功')
    proTableRef.value && proTableRef.value.reset()
  } else {
    ElMessage.error(res.msg)
  }
}
const submitRow = async (rows: any) => {
  const ids = rows.map((v: any) => v.id)
  await ElMessageBox.confirm('是否提交选中数据', {
    title: '提示',
    cancelButtonText: '取消',
    confirmButtonText: '确定'
  })
  const res = await zlhyffyxxSubmit(ids)
  if (res.success) {
    ElMessage.success('提交成功')
    proTableRef.value && proTableRef.value.reset()
    clearSelect()
    proTableRef.value?.getTableList()
  } else {
    ElMessage.error(res.msg)
  }
}
// 操作功能新增-编辑-查看
const openModal = async (modeFlag: 'add' | 'edit' | 'view', row?: any) => {
  mode.value = modeFlag
  if (modeFlag !== 'add') {
    if (!row.id) return

    let res = await zlhyffyxxGetInfoApi({ id: row.id })
    if (res.success) {
      formData.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
  } else {
    formData.value = {}
  }
  formModalRef.value?.open()
}

//新增,编辑保存功能
const handleSave = async (data: any) => {
  console.log('保存数据:', data)
  let res = await zlhyffyxxSaveApi(data)
  if (res.success) {
    clearSelect()
    proTableRef.value?.getTableList()
  } else {
    ElMessage.error(res.msg)
  }
  // 处理保存逻辑
  formModalRef.value?.close()
}

// 关闭功能
const handleClose = () => {
  console.log('弹窗关闭')
}

// 导入
const handleImport = () => {
  let newParmas = {}
  let tempApi: any = zlhyffyxxgetImportTemplate
  let importApi: any = zlhyffyxxImportExcel

  if (!tempApi && !importApi) return
  let params = {
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: '专利和研发费用信息',
    specialorgid: userInfo.value.dwId,
    getTableList: () => {
      proTableRef.value?.getTableList()
    }
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

const handleExport = async () => {
  loading.value = true
  try {
    if (proTableRef.value) {
      const params = proTableRef.value.searchParam
      const res: any = await zlhyffyxxExportExcel(params)
      const blob = new Blob([res])
      const blobUrl = window.URL.createObjectURL(blob)
      const exportFile = document.createElement('a')
      exportFile.style.display = 'none'
      exportFile.download = `专利和研发费用信息-${new Date().getTime()}.xlsx`
      exportFile.href = blobUrl
      document.body.appendChild(exportFile)
      exportFile.click()
      // 去除下载对 url 的影响
      document.body.removeChild(exportFile)
      window.URL.revokeObjectURL(blobUrl)
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

// 行点击
const rowClick = (row: any) => {
  clearSelect()
  if (proTableRef.value && proTableRef.value.element)
    proTableRef.value.element.toggleRowSelection(row, true)
}

// 查询列表
const getPageList = (params: any) => {
  loading.value = true
  const api: any = zlhyffyxxPageApi
  return api(params)
}

// 列表查询回调函数
const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

// 获取公共代码
const getPublicCodeData = async () => {}

//  获取权限
const getRoleHandle = () => {
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value.userMsg
  if (isQuery) {
    userInfo.value = {
      deptId: userInfOther.specialorgid,
      deptName: userInfOther.specialorgname,
      dwId: userInfOther.org_id,
      dwName: userInfOther.org_name,
      roleId: userInfOther.role_id,
      roleCode: userInfOther.code,
      spRoleId: userInfOther.id,
      specialorgcode: userInfOther.specialorgcode
    }
    getYjdwData()
    isShowPage.value = true
  }
}

const initParams = () => {
  getPublicCodeData()
}

onMounted(async () => {
  initParams()
  await userDialogRef.value.getUser()
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  padding: 10px;
}
</style>

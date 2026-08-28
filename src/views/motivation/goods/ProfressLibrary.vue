<!-- 专业仓数据填报 -->
<template>
  <div class="container" v-loading="loading">
    <ProTable @row-click="rowClick" @search="clearSelect" @reset="clearSelect" v-if="isShowPage" :pagination="true"
      :data-callback="callBackHandle" :request-api="getPageList" :request-auto="true" :search-col="4"
      :columns="tableColumns" ref="proTableRef">
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button size="mini" type="primary" plain @click="openModal('add')">新 增</el-button>
        <el-button size="mini" type="primary" plain
          :disabled="!scope['isSelected'] || scope['selectedList'].length !== 1"
          @click="openModal('view', scope['selectedList'][0])">查 看</el-button>
        <el-button size="mini" type="primary" plain
          :disabled="!scope['isSelected'] || scope['selectedList'].length !== 1 || scope['selectedList'][0]?.status === '1'"
          @click="openModal('edit', scope['selectedList'][0])">编 辑</el-button>
        <el-button size="mini" type="primary" plain
          :disabled="!scope['isSelected'] || !canSubmit(scope['selectedList'])"
          @click="deleteRow(scope['selectedList'].filter((v: any) => v.status === '0'))">删 除</el-button>
        <el-button @click="submitRow(scope['selectedList'].filter((v: any) => v.status === '0'))" size="mini"
          type="primary" plain :disabled="!scope['isSelected'] || !canSubmit(scope['selectedList'])">提 交</el-button>
        <el-button size="mini" type="primary" plain @click="handleImport">导 入</el-button>
        <el-button size="mini" type="primary" plain @click="handleExport">导 出</el-button>
      </template>
    </ProTable>
  </div>
  <ImportExcel ref="importRef" />
  <FormModal ref="formModalRef" labelWidth="140px" title="专业仓填报" :mode="mode" :fields="formFields" :data="formData"
    @save="handleSave" @close="handleClose" />
</template>


<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import ImportExcel from '@/components/ImportExcel/indexSy.vue'
import FormModal, { FormField } from '@/components/FormModal'
import {
  decimal2Rules
} from '@/utils/rules';
import {
  zycxxPage,
  zycxxInfo,
  zycxxSave,
  zycxxRemove,
  zycxxSubmit,
  zycxxImportExcel,
  zycxxExportExcel,
  zycxxGetImportTemplate,
} from '@/api/motivation/goods';
// hooks
import { useLevelDw } from './hooks/useLevelDw'
import type { UserInfo } from './types'

const {
  levelOne,
  levelTwo,
  getLevelOne,
  getLevelTwo
} = useLevelDw();
const props = defineProps<{
  userInfo: UserInfo,
  isLoad: Promise<any>
}>();
const isShowPage = ref(false)

const proTableRef = ref<InstanceType<typeof ProTable>>()
const formModalRef = ref<InstanceType<typeof FormModal>>()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const mode = ref<'add' | 'edit' | 'view'>('add')
let formData = reactive({})

const canSubmit = (selectList: any[]) => {
  return selectList.find(v => v.status === '0')
}
// 表格字段
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 80 },
  {
    prop: 'status',
    label: '状态',
    width: '120',
    search: {
      el: 'select',
      order: 3
    },
    enum: [{ label: '草稿', value: '0' }, { label: '提交', value: '1' }],
    fieldNames: { label: "label", value: "value" },
  },
  {
    prop: 'yjdw',
    label: '一级单位(市)',
    search: {
      el: "select", props: {
        onChange: (val: any) => {
          const params = proTableRef.value?.searchParam;
          params.ejdw = "";
          levelTwo.value.length = 0;
          const { id }: any = levelOne.value.find((item: any) => item.code === val);
          getLevelTwo(id)
        }
      }, order: 1
    },
    enum: levelOne.value,
    fieldNames: { label: "name", value: "code" },
    width: '180'
  },
  {
    prop: 'ejdw',
    label: '二级单位(县)',
    search: {
      el: 'select',
      order: 2
    },
    enum: levelTwo.value,
    render: (scope: any) => (<span>{scope.row.ejdwName}</span>),
    fieldNames: { label: "name", value: "code" },
    width: '200'
  },
  {
    prop: 'gkzybm',
    label: '归口专业部门',
    width: '180'
  },
  {
    prop: 'zycName',
    label: '专业仓名称',
    width: '180'
  },
  {
    prop: 'zycAddr',
    label: '地址',
    width: '180'
  },
  {
    prop: 'jzArea',
    label: '建筑面积(m²)',
    width: '180'
  }
])

//  表单字段
let formFields = ref<FormField[]>([])
// loading状态
const loading = ref(false)

// 清除表格选择状态
const clearSelect = () => {
  proTableRef.value?.clearSelection()
}

// 操作功能新增-编辑-查看
const openModal = async (modeFlag: 'add' | 'edit' | 'view', row?: any) => {
  mode.value = modeFlag;
  let data = {};
  if (modeFlag === 'edit' || modeFlag == 'view') {
    const res = await zycxxInfo({
      id: row?.id
    })
    if (res.success) {
      data = res.data;
    } else {
      ElMessage.error(res.msg)
    }
  } else {
    setTimeout(() => {
      formModalRef.value?.resetForm()
    }, 200)
  }
  Object.assign(formData, data)
  formModalRef.value?.open()
}
const deleteRow = async (rows: any) => {
  const ids = rows.map((v: any) => v.id);
  await ElMessageBox.confirm('是否删除选中数据', {
    title: '提示',
    cancelButtonText: '取消',
    confirmButtonText: '确定'
  })
  const res = await zycxxRemove(ids)
  if (res.success) {
    ElMessage.success('删除成功');
    proTableRef.value && proTableRef.value.reset();
    proTableRef.value && proTableRef.value.clearSelection();
  } else {
    ElMessage.error(res.msg)
  }
}
const submitRow = async (rows: any) => {
  const ids = rows.map((v: any) => v.id);
  await ElMessageBox.confirm('是否提交选中数据', {
    title: '提示',
    cancelButtonText: '取消',
    confirmButtonText: '确定'
  })
  const res = await zycxxSubmit(ids)
  if (res.success) {
    ElMessage.success('提交成功');
    proTableRef.value && proTableRef.value.reset();
    proTableRef.value && proTableRef.value.clearSelection();
  } else {
    ElMessage.error(res.msg)
  }
}
//新增,编辑保存功能
const handleSave = (data: any) => {
  // 处理保存逻辑
  zycxxSave(data)
    .then(res => {
      if (res.success) {
        ElMessage.success(`${data.id ? '修改' : '新增'}成功`)
        proTableRef.value && proTableRef.value.reset()
      } else {
          ElMessage.error(res.msg)
      }
    })
  formModalRef.value?.close()
}

// 关闭功能
const handleClose = () => {
}

// 导入
const handleImport = () => {

  // zycxxExportExcel

  let newParmas = {}
  let tempApi: any = zycxxGetImportTemplate;
  let importApi: any = zycxxImportExcel;

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
      return importApi(newImportParams).then((res: any) => {
        if (res.success) {
          proTableRef.value && proTableRef.value.reset();
          return res;
        } else {
          ElMessage.error(res.msg)
        }
      })
    },
    title: '专业仓信息填报',
    specialorgid: props.userInfo.dwId,
    getTableList: () => { }
  }
  if (importRef.value) importRef.value.acceptParams(params)
}
const handleExport = async () => {
  loading.value = true
  try {
    if (proTableRef.value) {
      const params = proTableRef.value.searchParam
      const res: any = await zycxxExportExcel(params)
      const blob = new Blob([res])
      const blobUrl = window.URL.createObjectURL(blob)
      const exportFile = document.createElement('a')
      exportFile.style.display = 'none'
      exportFile.download = `专业仓信息填报.xlsx`
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
  params['current'] = params['page']
  params['size'] = params['limit']
  return zycxxPage(params)
}

// 列表查询回调函数
const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

// 获取公共代码
const getPublicCodeData = async () => {
  await getLevelOne();
  formFields.value = [
    {
      prop: 'id',
      label: 'id',
      type: 'hidden',
    },
    {
      prop: 'yjdw',
      label: '一级单位(市)',
      type: 'select',
      options: levelOne.value.map(v => ({
        label: v.name,
        value: v.code
      })),
      required: true,
    }, {
      prop: 'ejdw',
      label: '二级单位(县)',
      type: 'select',
      required: true,
      dependsOn: 'yjdw',
      optionsLoader: async (depValue: string, formData: any) => {
        const leveloneItem: any = levelOne.value.find(v => v.code === depValue);
        const res: any = await getLevelTwo(leveloneItem.id, true);
        if (res.success) {
          return res.data.map((v: any) => ({
            label: v.name,
            value: v.code
          }))
        } else {
          return [];
        }
      }
    },
    {
      prop: 'gkzybm',
      label: '归口专业部门',
      type: 'input'
    },
    {
      prop: 'zycName',
      label: '专业仓名称',
      type: 'input',
      required: true
    },
    {
      prop: 'zycAddr',
      label: '地址',
      type: 'input'
    },
    {
      prop: 'jzArea',
      label: '建筑面积(m²)',
      type: 'input',
      rules: decimal2Rules()
    },
  ];
}

const initParams = async () => {
  await getPublicCodeData()
}

onMounted(async () => {
  await initParams()
  await props.isLoad;

  isShowPage.value = true;
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  padding: 10px;
}
</style>
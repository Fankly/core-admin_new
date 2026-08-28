<!-- 在线测算项目清单 -->
<template>
  <div class="container" v-loading="gridOptions.loading" v-if="isShowPage">
    <div class="operation">
      <el-dropdown placement="bottom" style="margin: 0 10px">
        <el-button size="mini" plain type="primary">项目管理<i class="el-icon-arrow-down el-icon--right" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-permission="'ADD'" @click="handleBtn('ADD', '新增')">新 增</el-dropdown-item>
            <el-dropdown-item v-permission="'EDIT'" @click="handleBtn('EDIT', '编辑')">编 辑</el-dropdown-item>
            <el-dropdown-item v-permission="'DELETE'" @click="handleRemove">删 除</el-dropdown-item>
            <el-dropdown-item v-permission="'IMPORT'" @click="handleImport('info')">信息导入</el-dropdown-item>
            <el-dropdown-item v-permission="'EXPORT'" @click="handleExport">导 出</el-dropdown-item>
            <el-dropdown-item v-permission="'IMPORT'" @click="handleImport('dy')">动因导入</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown placement="bottom" style="margin: 0 10px">
        <el-button size="mini" plain type="primary">在线测算<i class="el-icon-arrow-down el-icon--right" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-permission="'ZXCS'" @click="handleZxcs('1', 'EDIT')"> 定额测算 </el-dropdown-item>
            <el-dropdown-item v-permission="'ZXCS'" @click="handleZxcs('2', 'EDIT')"> 406号文测算 </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown placement="bottom" style="margin: 0 10px">
        <el-button size="mini" v-permission="'CSCX'" plain type="primary">测算查询<i class="el-icon-arrow-down el-icon--right" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-permission="'JBXX'" @click="handleBtn('VIEW', '查看')">基本信息</el-dropdown-item>
            <el-dropdown-item v-permission="'DECS'" @click="handleZxcs('1', 'VIEW')"> 定额测算 </el-dropdown-item>
            <el-dropdown-item v-permission="'SLLHWCS'" @click="handleZxcs('2', 'VIEW')"> 406号文测算 </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button size="mini" v-permission="'GHDECSMB'" plain type="primary" @click="handleZxcsMb">更换定额测算模板</el-button>
      <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" style="margin-left: auto" />
    </div>
    <div>
      <el-form :model="searchForm" label-suffix=" : " label-width="120px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="项目名称">
              <ReMultipleText
                v-model="searchForm.xmmc"
                dialog-title="项目名称"
                tooltip-text="项目名称"
                placeholder="请输入项目名称,多个项目名称以逗号分隔"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="部门">
              <el-select style="width: 100%" v-model="searchForm.dept" placeholder="请选择部门" clearable>
                <el-option v-for="(item, index) in deptList" :key="index" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select style="width: 100%" v-model="searchForm.zxcsStatus" placeholder="请选择状态" clearable>
                <el-option v-for="(item, index) in zxcsStatusList" :key="index" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="专业细分">
              <el-select style="width: 100%" v-model="searchForm.zyxf" placeholder="请选择专业细分" clearable>
                <el-option v-for="(item, index) in zyxfList" :key="index" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="编制人">
              <el-input maxlength="32" v-model.trim="searchForm.creatorGl" placeholder="请输入编制人" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="权限">
              <el-select style="width: 100%" v-model="searchForm.sfjkzj" placeholder="请选择权限" clearable>
                <el-option label="仅自己" value="1" />
                <el-option label="全部" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6" />
          <!-- <el-col :span="6" /> -->
          <!-- <el-col :span="6" /> -->
          <el-col :span="6">
            <div style="text-align: right; margin-bottom: 10px">
              <el-button type="primary" plain @click="handleSearch">查 询</el-button>
              <el-button plain @click="handleReset">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="table">
      <vxe-grid ref="gridRef" :empty-text="gridOptions.emptyRender" v-bind="gridOptions" />
    </div>
    <div class="main-pagination">
      <el-pagination
        :current-page="pagination.page"
        background
        :page-sizes="[20, 50, 100, 200]"
        :page-size="pagination.limit"
        :total="parseInt(pagination.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleChangeSizeChange"
        @current-change="handleChangeCurrentChange"
      ></el-pagination>
    </div>
  </div>
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <!-- 新增编辑 -->
  <xmModal ref="xmModalRef" :user-info="userInfo" @search-handle="closeModal" />
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
  <!-- 帮助 -->
  <HelpModal ref="helpModalRef" />
  <select-modal ref="selectModalRef" @show-modal="showModal" :title="'定额测算模板'" :label="'定额测算模板'" :options="deModeOptions" />
</template>

<script setup lang="tsx" name="/service/xmcs/index">
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import {
  checkProjectDyAndAttach,
  query,
  deleteHandler,
  getImportTemplateByDy,
  importExcelByDy,
  getImportTemplate,
  importExcel,
  exportExcel,
  updateMblx
} from '@/api/service/xmcs/index'
import { ElMessage } from 'element-plus'
import userDialog from '@/components/select/userDialog.vue'
import baseService from '@/service/baseService'
import xmModal from '@/views/service/xmcs/components/xmModal.vue' //新增
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { apiExportHandle } from '@/utils/export'
import { useRouter, useRoute } from 'vue-router'
import { encrypt } from '@/utils/crypto'
import { useStore } from 'vuex'
import { mianPage } from '@/views/service/xmcs/hooks/index'
import { getPublicCodeList } from '@/api/common'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { usePage } from '@/hooks/useUser'
import selectModal from '@/components/yssxTable/selectModalNew.vue'
import { VXETable } from 'vxe-table'

const store = useStore()
const route = useRoute()
const router = useRouter()
const countInfo = ref<any>({})
const userDialogRef = ref()
const xmModalRef = ref()
const selectModalRef = ref()
const isShowPage = ref(false)
const importRef = ref()
const paramsPage = ref({})
const gridRef = ref()
const queryParams = ref<string>('')
const searchForm = ref<any>({
  xmmc: '',
  zxcsStatus: '',
  sfjkzj: '1',
  dept: '',
  creatorGl: ''
})

const zxcsStatusList = ref<any[]>([])
const zyxfList = ref<any[]>([])
const deptList = ref<any[]>([])
const { userInfo, gridOptions, spanMethodData, buildSpanCache, spanMergeCache, deModeOptions } = mianPage() //gridOptions

const helpModalRef = ref()
const getHelpMessageHandle = () => {
  if (helpModalRef.value) {
    helpModalRef.value.showModal = true
  }
}
const getCodeList = async () => {
  const code: any = await getPublicCodeList({
    codes: ['ZXCS_STATUS', 'ZXCSBM_COM', 'ZXCSZYXF_COM']
  })
  zxcsStatusList.value = code.data['ZXCS_STATUS']
  deptList.value = code.data['ZXCSBM_COM']
  zyxfList.value = code.data['ZXCSZYXF_COM']
}

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0 as number | string
})
//查询
const handleSearch = () => {
  if (searchForm.value.creatorGl != '') {
    searchForm.value.sfjkzj = '0'
  }
  getPageList()
}
//重置
const handleReset = () => {
  for (const key in searchForm.value) {
    searchForm.value[key] = null
  }
  searchForm.value.sfjkzj = '1'
  // pagination.page = 1
  // pagination.limit = 100
  // getPageList()
}
const closeModal = () => {
  pagination.page = 1
  pagination.limit = 20
  getPageList()
}

const handleChangeSizeChange = async (val: number) => {
  if (val <= 0) return
  pagination.limit = val
  pagination.page = 1
  getPageList()
}

const handleChangeCurrentChange = async (val: number) => {
  if (val <= 0) return
  pagination.page = val
  getPageList()
}

const getPageList = async () => {
  gridOptions.emptyRender = '查询中'
  paramsPage.value = {
    ...searchForm.value,
    creator: countInfo.value.name,
    creatorAccount: countInfo.value.namecode
  }
  const params = {
    ...paramsPage.value,
    page: pagination.page,
    limit: pagination.limit
  }
  gridOptions.loading = true
  try {
    gridOptions.data.length = 0
    spanMergeCache.value = []
    const res: any = await query({ ...params })
    gridOptions.data.length = 0
    gridOptions.emptyRender = '查无数据'
    if (!res.success) return ElMessage.error(res.msg)
    if (res.success) {
      if (res.data.records.length > 0) {
        gridOptions.data = [...spanMethodData(res.data.records)]
      } else {
        gridOptions.data.length = 0
        gridOptions.emptyRender = '查无数据'
      }
      pagination.total = res.data.total
      buildSpanCache(gridOptions.data)
    }
  } finally {
    gridOptions.loading = false
  }
}

// 按 id 去重获取选中项目（合并单元格场景：同一项目多动因会展开多行，去重后得到项目数）
const getSelectedProjects = () => {
  const $table = gridRef.value
  const records = $table.getCheckboxRecords() || []
  const map = new Map()
  records.forEach((row: any) => {
    if (!map.has(row.id)) map.set(row.id, row)
  })
  return Array.from(map.values())
}

//新增、编辑
const handleBtn = (type: any, text: any) => {
  const selectedList = getSelectedProjects()
  if (type != 'ADD') {
    if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
    if (selectedList[0].editFlag != '1' && type == 'EDIT') return ElMessage.warning('非当前账号创建，不能【编辑】！')
  }

  const countParams = { creator: countInfo.value.name, creatorAccount: countInfo.value.namecode }
  const params = {
    searchParams: type != 'ADD' ? { ...selectedList[0], ...countParams } : { ...countParams },
    type: text
  }
  xmModalRef.value.acceptParams(params)
}

// 删除
const handleRemove = async () => {
  const selectedList = getSelectedProjects()
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  if (selectedList[0].editFlag != '1') return ElMessage.warning('非当前账号创建，不能【删除】！')
  const status = selectedList.every((item: any) => item.zxcsstatus == '0' || !item.zxcsstatus)
  if (!status) return ElMessage.warning('状态为【待定额测算】的数据才可删除！')
  const type = await VXETable.modal.confirm(`删除后不能恢复，确定删除？`, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  let res = await deleteHandler(selectedList)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('删除成功！')
  handleReset()
}

// 导入
const handleImport = (type: any) => {
  let newParmas = { creator: countInfo.value.name, creatorAccount: countInfo.value.namecode }
  importRef.value.fromData = { ...newParmas }
  let tempApi: any = type == 'info' ? getImportTemplate : getImportTemplateByDy
  let importApi: any = type == 'info' ? importExcel : importExcelByDy
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
    title: '在线测算项目清单',
    specialorgid: userInfo.value.deptId,
    getTableList: handleReset
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

// 导出
const handleExport = () => {
  const params = { ...paramsPage.value, creator: countInfo.value.name, creatorAccount: countInfo.value.namecode }
  const fileName = '在线测算项目清单'
  apiExportHandle(params, fileName, exportExcel)
}

// 在线测算
const handleZxcs = async (type: any, handler: any) => {
  const selectedList = getSelectedProjects()
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  if (type == '2' && selectedList[0].zxcsstatus == '0') return ElMessage.warning('406号文未测算！')
  if (selectedList[0].editFlag != '1' && handler == 'EDIT') return ElMessage.warning('非当前账号创建，不能测算！')
  if (selectedList[0].zxcsstatus == '0') {
    const isDone = await checkProjectDyAndAttach({ xmId: selectedList[0].id })
    if (isDone.success) {
      const apiReturn: any = isDone.data
      if (!apiReturn.hasDy || !apiReturn.allAttachUploaded) {
        const dyMsg = !apiReturn.hasDy ? '请维护动因' : ''
        const fileMsg = !apiReturn.allAttachUploaded ? `缺少附件：${apiReturn.missingAttachTypes}` : ''
        ElMessage.warning(`${dyMsg} ${fileMsg}`)
        return
      }
    }
  }
  queryParams.value = encrypt(
    JSON.stringify({
      xmid: selectedList[0].id,
      creatorAccount: countInfo.value.namecode,
      deptId: userInfo.value.deptId,
      dwId: userInfo.value.dwId,
      spRoleId: userInfo.value.spRoleId,
      isAdministrator: false,
      handler: handler == 'VIEW'
    })
  )
  if (type == '1') {
    const urltype = selectedList[0].mblx
    const modalType: any = deModeOptions.value.find((item: any) => item.code == urltype)
    router.push({
      name: modalType.url,
      query: {
        xmcsParams: queryParams.value
      }
    })
    return
  }
  router.push({
    name: '/service/xmcs/xscs',
    query: {
      xmcsParams: queryParams.value
    }
  })
}

//定额测算模板更换
const handleZxcsMb = () => {
  const selectedList = getSelectedProjects()
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  if (selectedList[0].editFlag != '1') return ElMessage.warning('非当前账号创建，不能【更换定额测算模板】！')
  selectModalRef.value.open()
  return
}

const showModal = async (val: any) => {
  const selectedList = getSelectedProjects()
  const params = {
    id: selectedList[0].id,
    mblx: val
  }
  const res: any = await updateMblx(params)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success(`定额测算模板更换成功!`)
  await getPageList()
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value.userMsg
  if (isQuery) {
    const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.specialorgid}`)
    if (flagData.success && flagData.data) {
      userInfo.value = {
        deptId: userInfOther.specialorgid,
        deptName: userInfOther.specialorgname,
        dwId: userInfOther.org_id,
        dwName: userInfOther.org_name,
        roleId: userInfOther.role_id,
        roleCode: userInfOther.code,
        roleName: userInfOther.rolename,
        spRoleId: userInfOther.id,
        specialorgcode: userInfOther.specialorgcode,
        fqzzFlag: flagData.data
      }
      isShowPage.value = true
      await getCodeList()
    }
  }
}

const loadByRouteParams = async () => {
  const { roleId, specialorgid, spRoleId, xmmc }: any = route.params
  const isRoel = await usePage(roleId, specialorgid, spRoleId)
  if (isRoel) {
    searchForm.value.xmmc = xmmc
    isShowPage.value = true
    await getCodeList()
    await getPageList()
  } else {
    userDialogRef.value.getUser()
  }
}

watch(
  () => route.params,
  async (newParams, oldParams) => {
    if (!isShowPage.value) return
    if (newParams?.xmmc === oldParams?.xmmc) return
    searchForm.value.xmmc = newParams?.xmmc ?? ''
    pagination.page = 1
    await getPageList()
  },
  { deep: true }
)

onMounted(async () => {
  countInfo.value = { ...store.getters.getUserMsg }
  await loadByRouteParams()
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  .operation {
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>

<!-- 评审查询(观察) -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <div class="operation">
      <el-dropdown placement="bottom" style="margin: 0 10px">
        <el-button size="mini" v-permission="'PERSON'" plain type="primary">观察人员设置<i class="el-icon-arrow-down el-icon--right" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-permission="'PERSONGL'" @click="handlePerson">观察人员管理</el-dropdown-item>
            <el-dropdown-item v-permission="'PERSONFP'" @click="handlePersonFp">人员分配</el-dropdown-item>
            <el-dropdown-item v-permission="'PERSONCK'" @click="handlePersonXm">人员分配查看</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button v-permission="'GXDWTYPE'" size="mini" @click="handleDwType" type="primary" plain>更新单位类型</el-button>
      <el-button v-permission="'EXPORT'" size="mini" @click="handleExport" type="primary" plain> 导 出</el-button>
      <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" style="margin-left: auto" />
    </div>
    <searchModal
      :zxcs-status-list="zxcsStatusList"
      :zxcsps-status-list="zxcspsStatusList"
      :dept-list="deptList"
      :zyxf-list="zyxfList"
      @handle-search="handleSearch"
      @handle-reset="handleReset"
      :is-lhpsqk="false"
      :lhpsqk-list="[]"
    />
    <div class="table">
      <vxe-grid ref="gridRef" v-on="gridEvent" v-bind="gridGcOptions" />
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
  <!-- 帮助 -->
  <HelpModal ref="helpModalRef" />
  <!--人员维护 -->
  <personGcModal ref="personGcModalRef" @save-xm="saveXm" />
  <!-- 项目分配 -->
  <personGcTable ref="personGcTableRef" />
  <selectModalNew ref="selectModalRef" @show-modal="showModal" :title="'更新单位类型'" :label="'更新单位类型'" :options="deModeOptions" />
</template>

<script setup lang="tsx" name="/service/xmcs/csqr">
import { onMounted, ref } from 'vue'
import { getZxcsSpGcPage, exportZxcsSpGc, gcStaffSave, updateDwType } from '@/api/service/xmcs/index'
import { ElMessage } from 'element-plus'
import userDialog from '@/components/select/userDialog.vue'
import baseService from '@/service/baseService'
import { apiExportHandle } from '@/utils/export'
import { mianPage } from '@/views/service/xmcs/hooks/index'
import { csqrParams } from '@/views/service/xmcs/hooks/csqr'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import personGcModal from '@/views/service/xmcs/components/personGcModal.vue'
import personGcTable from '@/views/service/xmcs/components/personGcTable.vue'
import searchModal from './components/searchModal.vue'
import selectModalNew from '@/components/yssxTable/selectModalNew.vue'
import { getPublicData } from '@/api/common'

const countInfo = ref<any>({})
const userDialogRef = ref()
const selectModalRef = ref()
const isShowPage = ref(false)
const loading = ref(false)
const gridRef = ref()
const personGcModalRef = ref()
const personGcTableRef = ref()
const { userInfo } = mianPage() //gridGcOptions
const deModeOptions = ref<any[]>([])
const {
  store,
  gridGcOptions,
  searchForm,
  helpModalRef,
  getHelpMessageHandle,
  zxcsStatusList,
  zxcspsStatusList,
  deptList,
  zyxfList,
  getCodeList,
  pagination,
  gridEvent
} = csqrParams(userInfo)

const handleSearch = async (val: any) => {
  searchForm.value = { ...val }
  await getPageList()
}

const handleReset = async (val: any) => {
  searchForm.value = { ...val }
  pagination.page = 1
  pagination.limit = 100
  await getPageList()
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
  const params = {
    ...searchForm.value,
    page: pagination.page,
    limit: pagination.limit
  }
  gridGcOptions.data.length = 0
  const res: any = await getZxcsSpGcPage({ ...params })
  if (res.success) {
    if (res.data.records.length > 0) {
      gridGcOptions.data = res.data.records
    } else {
      gridGcOptions.data.length = 0
    }
    pagination.total = res.data.total
  }
}

// 按 xmId 去重获取选中项目（合并单元格场景：同一项目多动因会展开多行，去重后得到项目数）
const getSelectedProjects = () => {
  const $table = gridRef.value
  const records = $table.getCheckboxRecords() || []
  const map = new Map()
  records.forEach((row: any) => {
    if (!map.has(row.xmId)) map.set(row.xmId, row)
  })
  return Array.from(map.values())
}

const handlePerson = () => {
  let params = {
    specialorgid: userInfo.value.deptId,
    clickType: true
  }
  personGcModalRef.value.acceptParams({ ...params })
}

const handlePersonFp = () => {
  const selectedList = getSelectedProjects()
  console.log(selectedList, 'selectedList')
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  const xmIds = selectedList.map(({ xmId }: any) => xmId)
  let params = {
    specialorgid: userInfo.value.deptId,
    clickType: false,
    xmIds: xmIds
  }
  personGcModalRef.value.acceptParams({ ...params })
}

const handlePersonXm = () => {
  const selectedList = getSelectedProjects()
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  const xmid = selectedList.map(({ xmId }: any) => xmId)
  let params = {
    xmid: xmid.join(','),
    specialorgid: userInfo.value.deptId
  }
  personGcTableRef.value.acceptParams({ ...params })
}

const saveXm = async (parma: any) => {
  const res: any = await gcStaffSave({ ...parma })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('已保存')
  personGcModalRef.value?.closeHandle()
  getPageList()
}
// 更新单位类型
const handleDwType = () => {
  const selectedList = getSelectedProjects()
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  selectModalRef.value.open()
}

const showModal = async (val: any) => {
  const selectedList = getSelectedProjects()
  const xmid = selectedList.map(({ xmId }: any) => xmId)
  const res: any = await updateDwType({ xmid: xmid, dwType: val })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('已保存！')
  getPageList()
}

// 导出
const handleExport = () => {
  loading.value = true
  const params = { ...searchForm.value }
  const fileName = '评审查询'
  apiExportHandle(params, fileName, exportZxcsSpGc)
  loading.value = false
}

const codePublic = async () => {
  const res: any = await getPublicData('ZXCSGCTYPE_COM')
  if (!res.success) return ElMessage.error(res.msg)
  deModeOptions.value = res.data
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
      getPageList()
      codePublic()
    }
  }
}

onMounted(() => {
  getCodeList()
  countInfo.value = { ...store.getters.getUserMsg }
  userDialogRef.value.getUser()
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

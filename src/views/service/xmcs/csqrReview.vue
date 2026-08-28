<!-- 测算评审 -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <div class="operation">
      <el-button v-permission="'CONFIRM'" size="mini" @click="handleBtn('3')" type="primary" plain>提 交</el-button>
      <el-button v-permission="'UNCONFIRM'" size="mini" @click="handleBtn('2')" type="primary" plain>驳 回</el-button>
      <el-button v-permission="'SHENHE'" size="mini" @click="handleReview" type="primary" plain>维护评审意见</el-button>
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
      <vxe-grid ref="gridRef" v-on="gridEvent" v-bind="gridSpOptions" />
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
  <!-- 帮助 -->
  <HelpModal ref="helpModalRef" />
  <modalReview ref="modalReviewRef" @show-modal="saveReview" />
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="tsx" name="/service/xmcs/csqrReview">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import { getBindXmByUser, whyj, zxcsSpReject, zxcsSpSubmit } from '@/api/service/xmcs/index'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { mianPage } from '@/views/service/xmcs/hooks/index'
import { csqrParams } from '@/views/service/xmcs/hooks/csqr'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { VXETable } from 'vxe-table'
import modalReview from '@/views/service/xmcs/components/modalReview.vue'
import searchModal from './components/searchModal.vue'
import { useStore } from 'vuex'

const store = useStore()
const userDialogRef = ref()
const isShowPage = ref(false)
const loading = ref(false)
const gridRef = ref()
const modalReviewRef = ref()
const { userInfo } = mianPage() //gridSpOptions
const countName = ref<any>({})
const {
  gridSpOptions,
  searchForm,
  helpModalRef,
  getHelpMessageHandle,
  getCodeList,
  pagination,
  zxcsStatusList,
  zxcspsStatusList,
  deptList,
  zyxfList,
  gridEvent
} = csqrParams(userInfo)

const handleSearch = async (val: any) => {
  val.xmmcList = undefined
  searchForm.value = { ...val }
  await getPageList()
}

const handleReset = async (val: any) => {
  val.xmmcList = undefined
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
  gridSpOptions.data.length = 0
  const res: any = await getBindXmByUser({ ...params })
  if (res.success) {
    if (res.data.records.length > 0) {
      gridSpOptions.data = res.data.records
    } else {
      gridSpOptions.data.length = 0
    }
    pagination.total = res.data.total
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

//提交/驳回
const handleBtn = async (status: string) => {
  const text = status == '3' ? '是否提交' : '是否驳回'
  const api = status == '3' ? zxcsSpSubmit : zxcsSpReject
  const selectedList: any = getSelectedProjects()
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  // 一致性校验：所选数据 zxcsspstatus 必须一致
  const baseStatus = selectedList[0].zxcsspstatus
  const inconsistent = selectedList.some((item: any) => item.zxcsspstatus != baseStatus)
  if (inconsistent) return ElMessage.warning(`请选择状态一致的数据！`)
  const isFinishCs = selectedList.every((item: any) => item.zxcsstatus == '2')
  if (!isFinishCs) return ElMessage.warning(`包含尚未测算完成的数据！`)
  if (status == '3' && selectedList[0].creator != countName.value && baseStatus == '0') return ElMessage.warning('非编制人无法提交！')
  if (status == '3' && userInfo.value.roleName != '省财务预算专职' && baseStatus == '1') return ElMessage.warning('非省财务预算专职无法提交！')
  if (status == '2' && userInfo.value.roleName != '省财务预算专职' && baseStatus == '1') return ElMessage.warning('非省财务预算专职无法驳回！')
  const editFlag = selectedList[0].editFlag
  const inconsedit = selectedList.some((item: any) => item.editFlag != editFlag)
  if (inconsedit) return ElMessage.warning('非当前账号创建，不能【提交/驳回】！')
  const type = await VXETable.modal.confirm(`请确认${text}`, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const xmidList = selectedList.map(({ id }: any) => id)
  const res: any = await api(xmidList)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('已处理')
  getPageList()
  return
}

const handleReview = async () => {
  const selectedList = getSelectedProjects()
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  // 一致性校验：所选数据 zxcsspstatus 必须一致
  const baseStatus = selectedList[0].zxcsspstatus
  const inconsistent = selectedList.some((item: any) => item.zxcsspstatus != baseStatus)
  if (inconsistent) return ElMessage.warning(`请选择状态一致的数据！`)
  const isFinishCs = selectedList.every((item: any) => item.zxcsstatus == '2')
  if (!isFinishCs) return ElMessage.warning(`包含尚未测算完成的数据！`)
  const ids = selectedList.map(({ id }: any) => id)
  const modalParams = {
    ids: ids,
    userCount: userInfo.value.roleName.includes('处长') && userInfo.value.deptName.includes('设备'),
    isCity: selectedList[0].zxcsspstatus == '1'
    // reason: selectedList[0].reason || '',
    // djReason: selectedList[0].djReason || '',
    // sszqReason: selectedList[0].sszqReason || ''
  }
  modalReviewRef.value.open({ ...modalParams })
}

const saveReview = async (val: any) => {
  const type = await VXETable.modal.confirm(`确认保存审批意见？`, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const params: any = { ...val }
  const res: any = await whyj({ ...params })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('保存成功')
  modalReviewRef.value.closeHandle()
  getPageList()
  return
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
      await getPageList()
      await getCodeList()
    }
  }
}

onMounted(async () => {
  const countInfo: any = { ...store.getters.getUserMsg }
  countName.value = countInfo.name
  isShowPage.value = false
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

<!-- 测算评审(观察) -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <div class="operation">
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
  <modalWatch ref="modalWatchRef" @show-modal="saveReview" />
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="tsx" name="/service/xmcs/csqrReviewWatch">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import { reviewGetBindXmByUser, reviewWhyj } from '@/api/service/xmcs/index'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { mianPage } from '@/views/service/xmcs/hooks/index'
import { csqrParams } from '@/views/service/xmcs/hooks/csqr'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { VXETable } from 'vxe-table'
import modalWatch from '@/views/service/xmcs/components/modalWatch.vue'
import searchModal from './components/searchModal.vue'

const userDialogRef = ref()
const isShowPage = ref(false)
const loading = ref(false)
const gridRef = ref()
const modalWatchRef = ref()
const { userInfo } = mianPage() //gridSpOptions
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

const handleSearch = () => {
  getPageList()
}

const handleReset = () => {
  for (const key in searchForm.value) {
    searchForm.value[key] = null
  }
  searchForm.value.sfjkzj = '0'
  pagination.page = 1
  pagination.limit = 100
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
  const params = {
    ...searchForm.value,
    page: pagination.page,
    limit: pagination.limit
  }
  gridSpOptions.data.length = 0
  const res: any = await reviewGetBindXmByUser({ ...params })
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

const handleReview = async () => {
  const selectedList = getSelectedProjects()
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  if (selectedList[0].zxcsstatus != '2') return ElMessage.warning('尚未测算完成，暂无法评审！')
  if (selectedList[0].zxcsspstatus == '0') return ElMessage.warning('编制中不允许维护观察意见！')
  const ids = selectedList.map(({ id }: any) => id)
  const modalParams = {
    ids: ids
    // reason: selectedList[0].reason || '',
    // djReason: selectedList[0].djReason || '',
    // sszqReason: selectedList[0].sszqReason || ''
  }
  modalWatchRef.value.open({ ...modalParams })
}

const saveReview = async (val: any) => {
  const type = await VXETable.modal.confirm(`确认保存审批意见？`, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const params: any = { ...val }
  const res: any = await reviewWhyj({ ...params })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('保存成功')
  modalWatchRef.value.closeHandle()
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

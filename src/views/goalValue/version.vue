<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <div class="top">
      <div class="left" v-if="pageInfo.isShowPage && isRole">
        <el-button v-permission="'ADD'" :disabled="isDisabled" type="primary" plain size="mini" @click="operationHandle('ADD')">版本创建</el-button>
        <el-button v-permission="'VIEW'" :disabled="isDisabled" type="primary" plain size="mini" @click="operationHandle('VIEW')">版本查看</el-button>
        <el-button v-permission="'EDIT'" :disabled="isDisabled" type="primary" plain size="mini" @click="operationHandle('EDIT')">版本修改</el-button>
        <el-button v-permission="'DELETE'" :disabled="isDisabled" type="primary" plain size="mini" @click="operationHandle('DELETE')"
          >版本删除</el-button
        >
        <el-button v-permission="'BBBD'" :disabled="isDisabled" type="primary" plain size="mini" @click="versionCompare">版本比对</el-button>
        <el-button v-permission="'MBZWH'" :disabled="isDisabled" type="primary" plain size="mini" @click="goalValueMainHandle">目标值维护</el-button>
        <el-button v-permission="'SZNDMBZ'" :disabled="isDisabled" type="primary" plain size="mini" @click="annualTargetValueHandle"
          >设置年度目标值</el-button
        >

        <el-button v-permission="'TZJSRYSZ'" :disabled="isDisabled" size="mini" type="primary" plain @click="notifyPersonSettingHandle"
          >通知接收人员设置</el-button
        >
      </div>
      <div class="left" v-else-if="pageInfo.isShowPage && !isRole">
        <el-button v-if="permissions.includes('ADD')" :disabled="isDisabled" type="primary" plain size="mini" @click="operationHandle('ADD')"
          >版本创建</el-button
        >
        <el-button v-if="permissions.includes('VIEW')" :disabled="isDisabled" type="primary" plain size="mini" @click="operationHandle('VIEW')"
          >版本查看</el-button
        >
        <el-button v-if="permissions.includes('EDIT')" :disabled="isDisabled" type="primary" plain size="mini" @click="operationHandle('EDIT')"
          >版本修改</el-button
        >
        <el-button v-if="permissions.includes('DELETE')" :disabled="isDisabled" type="primary" plain size="mini" @click="operationHandle('DELETE')"
          >版本删除</el-button
        >
        <el-button v-if="permissions.includes('BBBD')" :disabled="isDisabled" type="primary" plain size="mini" @click="versionCompare"
          >版本比对</el-button
        >
        <el-button v-if="permissions.includes('MBZWH')" :disabled="isDisabled" type="primary" plain size="mini" @click="goalValueMainHandle"
          >目标值维护</el-button
        >
        <el-button v-if="permissions.includes('SZNDMBZ')" :disabled="isDisabled" type="primary" plain size="mini" @click="annualTargetValueHandle"
          >设置年度目标值</el-button
        >

        <el-button v-if="permissions.includes('TZJSRYSZ')" :disabled="isDisabled" size="mini" type="primary" plain @click="notifyPersonSettingHandle"
          >通知接收人员设置</el-button
        >
      </div>
      <div class="right">
        <div class="year">
          <el-form :inline="true">
            <el-form-item label="年度：">
              <el-select v-model="formParams.nd" placeholder="请选择" @change="changeNdDataHandle">
                <template v-for="item in formParams.ndList" :key="item.yearCode">
                  <el-option :label="item.yearName" :value="item.yearCode"></el-option>
                </template>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="help">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="search">
      <el-form ref="searchFormRef" :model="formData">
        <Grid ref="gridRef" :gap="[12, 0]" :cols="4">
          <GridItem>
            <el-form-item prop="versionName">
              <template #label>
                <el-space :size="4">
                  <span>{{ `版本名称` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input :maxlength="40" v-model.trim="formData.versionName"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="status">
              <template #label>
                <el-space :size="4">
                  <span>{{ `状态` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="formData.status" style="width: 100%">
                  <el-option v-for="item in statusList" :key="item.code" :value="item.code" :label="item.name"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem></GridItem>
          <GridItem>
            <div class="btn" style="text-align: right">
              <el-button type="primary" plain size="mini" @click="searchHandle">查 询</el-button>
              <el-button type="primary" plain size="mini" @click="resetHandle">重 置</el-button>
            </div>
          </GridItem>
        </Grid>
      </el-form>
    </div>
    <div class="table">
      <vxe-table
        :loading="pageInfo.loading"
        resizable
        :data="tableData"
        align="center"
        header-align="center"
        :show-overflow="true"
        border
        stripe
        :row-config="{
          height: 32
        }"
        height="100%"
        ref="vxeTableRef"
      >
        <vxe-column width="50" type="checkbox"></vxe-column>
        <vxe-column width="50" type="seq" title="序号"></vxe-column>
        <vxe-column
          :formatter="({ column, cellValue }:any) => formatterData(item, column, cellValue)"
          v-for="item in columns"
          :width="item.width"
          :key="item.field"
          :align="item.align"
          :header-align="item.headerAlign"
          :field="item.field"
          :title="item.title"
        ></vxe-column>
      </vxe-table>
    </div>
    <el-pagination
      :current-page="page.page"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="limitChangeHandle"
      @current-change="pageChangeHandle"
    ></el-pagination>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <UserManager :special-org-id="userInfo.specialorgid" v-model="dialogVisible" ref="userManagerRef" />
  <VersionDialog
    :selectedData="selectedData"
    :flag="versionDialogInfo.flag"
    @searchData="searchDataHandle"
    :nd="formParams.nd"
    :title="versionDialogInfo.title"
    ref="versionDialogRef"
    @close-dialog="closeDialogHandle"
  />
  <HelpModal ref="helpModalRef" />
  <vxe-modal
    v-model="annualTargetModal.visible"
    :destroy-on-close="true"
    :loading="annualTargetModal.loading"
    show-footer
    position="center"
    width="420"
    height="168"
    title="设置年度目标值"
    @close="closeAnnualTargetValueModal"
  >
    <el-form label-width="120px" label-suffix="：">
      <el-form-item label="年度目标值">
        <el-select v-model="annualTargetForm.sfnd" placeholder="请选择" style="width: 100%">
          <el-option label="是" value="1"></el-option>
          <el-option label="否" value="0"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="modal-footer">
        <el-button :disabled="annualTargetModal.loading" plain size="mini" type="primary" @click="saveAnnualTargetValueHandle">保 存</el-button>
        <el-button :disabled="annualTargetModal.loading" plain size="mini" @click="closeAnnualTargetValueModal">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: '/goalValue/version'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import VersionDialog from '@/views/goalValue/components/VersionDialog.vue'
import UserManager from '@/views/goalValue/components/UserManager.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { getYearData } from '@/api/common'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref, computed } from 'vue'

import { delVersion, getVersionPage, Params, setYearTargetValue } from '@/api/goalValue/version'

import { User, RowVo } from '@/views/goalValue/interface'
import { formatDate, formatValue } from '@/utils/utils'
import { VXETable } from 'vxe-table'
import router from '@/router'
import emits from '@/utils/emits'
import { decrypt, encrypt } from '@/utils/crypto'
import { useRoute } from 'vue-router'
import baseService from '@/service/baseService'
import { getMenuMessage } from '@/api/process'
import { getWjhNum } from '@/api/targetBudget/provinceTarget'

type ndList = {
  yearCode: string
  yearName: string
}

interface FormParams {
  nd: string
  ndList: ndList[]
}

interface FromSearch {
  versionName: string
  status: string
}

const userDialogRef = ref()
const helpModalRef = ref()
const versionDialogRef = ref()
const vxeTableRef = ref()
const searchFormRef = ref()
const isRole = ref(true)

const isDisabled = computed(() => pageInfo.loading)
const route = useRoute()

const formParams = reactive<FormParams>({
  nd: '',
  ndList: []
})

const formData = reactive<FromSearch>({
  versionName: '',
  status: ''
})

const pageInfo = reactive({
  loading: false,
  isShowPage: false
})

const versionDialogInfo = reactive({
  title: '',
  flag: ''
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const selectedData = ref<RowVo>()
const dialogVisible = ref(false)
const annualTargetRow = ref<RowVo | null>(null)

const annualTargetModal = reactive({
  visible: false,
  loading: false
})

const annualTargetForm = reactive({
  sfnd: ''
})

const notifyPersonSettingHandle = () => {
  dialogVisible.value = true
}

const userInfo = ref<User>({
  code: '',
  id: '',
  info: '',
  name: '',
  org_id: '',
  org_name: '',
  role_id: '',
  rolename: '',
  spRoleCode: '',
  specialorgid: '',
  specialorgname: '',
  systemId: '',
  systemName: ''
})

const page = reactive({
  total: 0,
  limit: 20,
  page: 1,
  current: '1'
})

const statusList = reactive<
  {
    code: string
    name: string
  }[]
>([
  {
    code: '1',
    name: '初始'
  },
  {
    code: '2',
    name: '通知'
  },
  {
    code: '3',
    name: '激活'
  },
  {
    code: '4',
    name: '过期'
  }
])

const yapStatus = reactive<
  {
    code: string
    name: string
  }[]
>([
  {
    code: '0',
    name: '否'
  },
  {
    code: '1',
    name: '是'
  }
])

const tableData = ref<RowVo[]>([])

const columns = reactive<any[]>([
  {
    field: 'versionNo',
    title: '版本编号',
    align: 'center',
    headerAlign: 'center',
    width: 90
  },
  {
    field: 'versionName',
    title: '版本名称',
    align: 'center',
    headerAlign: 'center',
    width: 260
  },
  {
    field: 'mbz',
    title: '成本项目目标值-可控(省公司)',
    align: 'right',
    headerAlign: 'center',
    width: 260
  },
  {
    field: 'sgsMbzBkk',
    title: '成本项目目标值-不可控(省公司)',
    align: 'right',
    headerAlign: 'center',
    width: 260
  },
  {
    field: 'zgsMbz',
    title: '成本项目目标值(子公司)',
    align: 'right',
    headerAlign: 'center',
    width: 170
  },
  {
    field: 'nd',
    title: '年度',
    align: 'center',
    headerAlign: 'center',
    width: 80
  },
  {
    field: 'sfnd',
    title: '年度目标值',
    align: 'center',
    headerAlign: 'center',
    width: 80
  },
  {
    field: 'status',
    title: '版本状态',
    align: 'center',
    headerAlign: 'center',
    width: 80
  },
  {
    field: 'sfyap',
    title: '是否预安排',
    align: 'center',
    headerAlign: 'center',
    width: 120
  },
  {
    field: 'activateTime',
    title: '激活时间',
    align: 'center',
    headerAlign: 'center',
    width: 160
  },
  {
    field: 'createDate',
    title: '创建日期',
    align: 'center',
    headerAlign: 'center',
    width: 100
  },
  {
    field: 'creatorName',
    title: '创建人',
    align: 'center',
    headerAlign: 'center',
    width: 80
  },
  {
    field: 'remake',
    title: '备注',
    align: 'center',
    headerAlign: 'center',
    width: 260
  }
])

const formatterData = (item: any, column: any, cellValue: string) => {
  if (item.field === 'status') {
    const findValue: any = statusList.find((item: { code: string; name: string }) => item.code === cellValue)
    return findValue.name
  }
  if (item.field === 'sfyap') {
    if (cellValue === '' || cellValue === null || cellValue === undefined) {
      return '-'
    }
    const findValue: any = yapStatus.find((item: { code: string; name: string }) => item.code === cellValue)
    return findValue.name
  }
  if (item.field === 'sfnd') {
    if (cellValue === '' || cellValue === null || cellValue === undefined) {
      return '-'
    }
    if (`${cellValue}` === '1') return '是'
    if (`${cellValue}` === '0') return '否'
    return '-'
  }
  if (item.field === 'createDate') {
    return formatDate(cellValue, 'yyyy-mm-dd')
  }
  if (item.field === 'mbz' || item.field === 'zgsMbz') {
    if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
    return formatValue(cellValue.toString(), 6)
  }
  if (cellValue === '' || cellValue === null || cellValue === undefined) {
    return '-'
  }
  return cellValue
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

const closeDialogHandle = (val: boolean) => {
  versionDialogRef.value.versionDialogInfo.isShowVersionDialog = val
}

// 设置年度目标值
const annualTargetValueHandle = () => {
  const $table = vxeTableRef.value
  if (!$table) return
  const records = $table.getCheckboxRecords()
  if (records.length !== 1) {
    ElMessage.warning('请选择一条数据!')
    return
  }
  annualTargetRow.value = records[0] as RowVo
  annualTargetModal.visible = true
}

const closeAnnualTargetValueModal = () => {
  annualTargetModal.visible = false
  annualTargetForm.sfnd = ''
  annualTargetRow.value = null
}

const saveAnnualTargetValueHandle = async () => {
  if (!annualTargetForm.sfnd) {
    ElMessage.warning('请选择年度目标值！')
    return
  }
  if (!annualTargetRow.value) return
  const type = await VXETable.modal.confirm('设置后将影响执行分析报表年度目标值，确认更新？', '提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return

  try {
    annualTargetModal.loading = true
    const res = await setYearTargetValue({
      nd: annualTargetRow.value.nd || formParams.nd,
      specialorgid: userInfo.value.specialorgid,
      versionId: annualTargetRow.value.versionId,
      sfnd: annualTargetForm.sfnd
    })
    if (res.success) {
      ElMessage.success('保存成功！')
      closeAnnualTargetValueModal()
      await searchHandle()
    } else {
      ElMessage.error(res.msg)
    }
  } finally {
    annualTargetModal.loading = false
  }
}

// 目标值维护
const goalValueMainHandle = () => {
  const $table = vxeTableRef.value
  if ($table) {
    const records = $table.getCheckboxRecords()
    if (records.length !== 1) {
      ElMessage.warning('请选择一条数据!')
      return
    }
    const str = encrypt(
      JSON.stringify({
        specialOrgId: userInfo.value.specialorgid,
        sendSpRoleId: userInfo.value.id,
        nd: formParams.nd,
        versionId: records[0].versionId,
        versionName: encodeURIComponent(records[0].versionName),
        versionNo: records[0].versionNo,
        status: records[0].status
      })
    )
    router.push({
      name: '/goalValue/versionDetail',
      query: {
        versionParams: str
      }
    })
  }
}

// 版本比对
const versionCompare = () => {
  const $table = vxeTableRef.value
  if ($table) {
    const records = $table.getCheckboxRecords()
    if (records.length !== 2) {
      ElMessage.warning('请选择两条数据,进行比对!')
      return
    }
    const versionIds = records.map((item: any) => item.versionId)
    const str = encrypt(
      JSON.stringify({
        specialOrgId: userInfo.value.specialorgid,
        nd: formParams.nd,
        versionIds: versionIds,
        versionNo: records[0].versionNo
      })
    )
    router.push({
      name: '/goalValue/versionCompare',
      query: {
        versionParams: str
      }
    })
  }
}

const validateCityTargetValueSum = async () => {
  try {
    const res = await getWjhNum(formParams.nd)
    if (!res.success) throw new Error(res.msg)
    return res.data
  } catch (error) {
    ElMessage({
      type: 'error',
      duration: 1500,
      message: (error as Error).message
    })
    return ''
  }
}

const operationHandle = async (flag: string) => {
  versionDialogInfo.flag = flag
  if (flag === 'ADD') {
    versionDialogInfo.title = '版本管理-新建'
    // 增加校验
    const validate = await validateCityTargetValueSum()
    if (validate) {
      const type = await VXETable.modal.confirm(`${validate}，创建版本将影响省专业部门或地市调整数据，是否仍需创建?`, '提示', {
        width: '500px',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
    }
    versionDialogRef.value.versionDialogInfo.isShowVersionDialog = true
  } else if (flag === 'EDIT') {
    const $table = vxeTableRef.value
    if ($table) {
      const records = $table.getCheckboxRecords()
      if (records.length !== 1) {
        ElMessage.warning('请选择一条数据进行编辑!')
        return
      }
      selectedData.value = records[0] as RowVo
      const status = selectedData.value['status']
      if (![1, 2].includes(Number(status))) {
        ElMessage.warning('仅“初始”和“通知”状态支持编辑!')
        return
      }
      versionDialogInfo.title = '版本管理-编辑'
      versionDialogRef.value.versionDialogInfo.isShowVersionDialog = true
    }
  } else if (flag === 'DELETE') {
    const $table = vxeTableRef.value
    if ($table) {
      const records = $table.getCheckboxRecords()
      if (records.length !== 1) {
        ElMessage.warning('请选择一条数据进行删除!')
        return
      }
      const seletedData = records[0]
      const status = seletedData.status
      if (![1, 2].includes(Number(status))) {
        ElMessage.warning('仅“初始”和“通知”状态支持删除!')
        return
      }
      const type = await VXETable.modal.confirm('您确定要删除吗？')
      if (type === 'confirm') {
        pageInfo.loading = true
        const res = await delVersion(records[0].versionId)
        if (res.success) {
          ElMessage.success('删除成功')
          searchHandle()
          pageInfo.loading = false
        } else {
          ElMessage.error(res.msg)
          pageInfo.loading = false
          return
        }
      }
    }
  } else {
    const $table = vxeTableRef.value
    if ($table) {
      const records = $table.getCheckboxRecords()
      if (records.length !== 1) {
        ElMessage.warning('请选择一条数据进行查看!')
        return
      }
      selectedData.value = records[0] as RowVo
      versionDialogInfo.title = '版本管理-查看'
      versionDialogRef.value.versionDialogInfo.isShowVersionDialog = true
    }
  }
}

const initParams = async () => {
  let res = await getYearData()
  if (res.success) {
    formParams.ndList = res.data
    formParams.nd = new Date().getFullYear().toString()
  } else {
    ElMessage.error(res.msg)
  }
}

const searchDataHandle = () => {
  searchHandle()
}

const resetHandle = () => {
  searchFormRef.value.resetFields()
  page.page = 1
  page.limit = 20
  searchHandle()
}

const searchHandle = async () => {
  pageInfo.loading = true
  tableData.value.length = 0
  const params: Params = {
    versionName: formData.versionName,
    status: formData.status,
    specialorgid: userInfo.value.specialorgid,
    nd: Number(formParams.nd),
    page: Number(page.page),
    limit: Number(page.limit)
  }
  const res = await getVersionPage(params)
  if (res.success) {
    page.total = res.data.total
    tableData.value = res.data.records
    pageInfo.loading = false
  } else {
    ElMessage.error(res.msg)
    pageInfo.loading = false
  }
}

const getRoleHandle = () => {
  pageInfo.loading = false
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    pageInfo.isShowPage = true
    searchHandle()
  }
}

const changeNdDataHandle = () => {
  searchHandle()
}

const permissions = ref<string[]>([])

const initData = async () => {
  pageInfo.loading = true
  initParams()
  if (route.query && route.query.versionParams) {
    const params = JSON.parse(decrypt(route.query.versionParams as string))
    userInfo.value = { ...params.userInfo }
    formParams.nd = params.nd
    pageInfo.isShowPage = true
    searchHandle()
    isRole.value = false
    const result = await getMenuMessage('/goalValue/version')
    if (result.success && result.data) {
      let res = await baseService.get(`/sysMenu/getButtonList?menuCode=${result.data.outsideMenu}&spRoleId=${userInfo.value.id}`)
      permissions.value = res.data
    }
  } else {
    isRole.value = true
    userDialogRef.value.getUser()
  }
}

emits.on('onActive', (val) => {
  if (val) searchHandle()
})

onMounted(initData)
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;

  .top {
    display: flex;
    margin-bottom: 10px;

    .left {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }

    .right {
      text-align: right;
      width: 200px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      :deep(.el-form) {
        .el-form-item {
          margin: 0;

          .el-form-item__content {
            width: 102px;
          }
        }
      }
    }
  }

  .search {
    .el-form-item--mini.el-form-item,
    .el-form-item--small.el-form-item {
      margin-bottom: 10px;
    }

    .el-pagination {
      :deep(.btn-prev),
      :deep(.btn-next) {
        padding-left: 10px;
      }
    }
  }

  .table {
    flex: 1;
    min-width: 100%;
    min-height: 0;
  }

  .el-pagination {
    :deep(.btn-prev),
    :deep(.btn-next) {
      padding-left: 10px;
    }
  }
}

.modal-footer {
  text-align: center;
}
</style>

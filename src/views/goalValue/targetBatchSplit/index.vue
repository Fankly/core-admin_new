<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="pageInfo.loading">
    <div class="top">
      <div class="left" v-if="pageInfo.isShowPage">
        <div :class="item.value" v-for="item in dropdownData" :key="item.value">
          <el-dropdown>
            <el-button v-show="permissions.includes(item.permission)" type="primary">
              {{ item.label }}
              <i v-if="item.icon" :class="item.icon" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu v-for="dropdown in item.children" :key="dropdown.value">
                <el-dropdown-item v-show="permissions.includes(item.permission)" @click="handleClickData(dropdown.value)">{{
                  dropdown.label
                }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <el-button style="margin-left: 10px; height: 32px" type="primary" v-show="permissions.includes('LOG')" @click="handleClickData('viewLog')">
          日志
        </el-button>
        <el-button
          style="margin-left: 10px; height: 32px"
          type="primary"
          v-show="permissions.includes('FYLOG')"
          @click="handleClickData('viewFyLog')"
        >
          费用日志
        </el-button>
      </div>
      <div class="right">
        <div class="dwTitle"> 单位:{{ dwName }}</div>
        <div class="nd">
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
      <el-form ref="searchFormRef" :model="fromSearch">
        <Grid ref="gridRef" :gap="[12, 0]" :cols="4">
          <GridItem>
            <el-form-item prop="dwId">
              <template #label>
                <el-space :size="4">
                  <span>{{ `一级单位` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select v-model="fromSearch.dwId" style="width: 100%">
                  <el-option v-for="item in yjdwList" :key="item.code" :value="item.code" :label="item.name"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="versionName">
              <template #label>
                <el-space :size="4">
                  <span>{{ `版本名称` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-input :maxlength="60" v-model.trim="fromSearch.versionName"></el-input>
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="zt">
              <template #label>
                <el-space :size="4">
                  <span>{{ `状态` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <el-select clearable v-model="fromSearch.zt" style="width: 100%">
                  <el-option v-for="item in statusList" :key="item.code" :value="item.code" :label="item.name"></el-option>
                </el-select>
              </div>
            </el-form-item>
          </GridItem>
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
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        @cell-click="cellClickHandle"
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
        <vxe-column width="80" type="checkbox"></vxe-column>
        <vxe-column width="80" type="seq" title="序号"></vxe-column>
        <vxe-column
          :header-align="item.headerAlign"
          :align="item.align"
          :formatter="item.formatter"
          v-for="item in columns"
          :key="item.field"
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
  <FormModal
    ref="formModalRef"
    title="-目标值总控值"
    width="40%"
    :mode="mode"
    :height="mode === 'add' ? '420px' : '380px'"
    :fields="mode === 'add' ? addformFields : editformFields"
    :data="formData"
    label-width="100px"
    @save="handleSave"
    @close="handleClose"
  />
  <BreakdownModal @on-active="handleActive" :show="showBtn" :params="params" ref="breakdownModalRef" />
  <LogModal ref="logModalRef" />
  <FYLogModal ref="logFyModalRef" />
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

<script setup lang="ts" name="/goalValue/targetBatchSplit/index">
import userDialog from '@/components/select/userDialog.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import FormModal from '@/components/FormModal'
import BreakdownModal from '@/views/goalValue/targetBatchSplit/components/BreakdownModal.vue'
import LogModal from '@/views/goalValue/targetBatchSplit/components/LogModal.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import FYLogModal from '@/views/goalValue/targetBatchSplit/components/FYLogModal.vue'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useData } from '@/views/goalValue/targetBatchSplit/hooks/useData'
import { useOperation } from '@/views/goalValue/targetBatchSplit/hooks/useOperation'
import { checkDw, createVersion, deleteVersion, getVersionPage, setYearTargetValue } from '@/api/mbz'
import { useRoute } from 'vue-router'
import { decrypt } from '@/utils/crypto'
import baseService from '@/service/baseService'
import { getMenuMessage } from '@/api/process'
import VXETable from 'vxe-table'

interface Params {
  cjr: string
  cjrId: string
  dwId: string
  dwName: string
  id: string
  nd: string
  remark: string
  versionCode: string
  versionName: string
  zt: string
  ztName: string
}

interface YjdwOption {
  code: string
  name: string
}

const userDialogRef = ref<InstanceType<typeof userDialog>>()
const helpModalRef = ref<InstanceType<typeof HelpModal>>()
const formModalRef = ref<InstanceType<typeof FormModal>>()
const breakdownModalRef = ref<InstanceType<typeof BreakdownModal>>()
const logModalRef = ref<InstanceType<typeof LogModal>>()
const logFyModalRef = ref<InstanceType<typeof FYLogModal>>()
const vxeTableRef = ref()
const searchFormRef = ref()
const route = useRoute()
const permissions = ref<string[]>([])
const yjdwList = ref<YjdwOption[]>([])

const annualTargetModal = reactive({
  visible: false,
  loading: false
})

const annualTargetForm = reactive({
  sfnd: ''
})

const annualTargetRow = ref<Params | null>(null)

const params = ref<Params>({
  cjr: '',
  cjrId: '',
  dwId: '',
  dwName: '',
  id: '',
  nd: '',
  remark: '',
  versionCode: '',
  versionName: '',
  zt: '',
  ztName: ''
})
const showBtn = ref<boolean>(false)
const {
  dropdownData,
  userInfo,
  formParams,
  tableData,
  statusList,
  page,
  pageInfo,
  fromSearch,
  columns,
  pageChangeHandle,
  limitChangeHandle,
  getPublicCode,
  searchHandle,
  addformFields,
  editformFields,
  initParams,
  dwName
} = useData(getVersionPage)

const { handleSave, handleClose, openModal, mode, formData, handleDelete } = useOperation(
  pageInfo,
  formParams,
  searchHandle,
  vxeTableRef,
  formModalRef,
  createVersion,
  deleteVersion
)

const handleActive = () => {
  searchHandle()
}

const setDefaulDwId = () => {
  const specialorgid = userInfo.value.specialorgid
  const defaultDw = yjdwList.value.find((item) => item.code === specialorgid) || yjdwList.value[0]
  fromSearch.dwId = defaultDw?.code || specialorgid
}

const resetHandle = () => {
  searchFormRef.value.resetFields()
  setDefaulDwId()
  page.page = 1
  page.limit = 20
  searchHandle()
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await vxeTableRef.value.clearCheckboxRow()
  vxeTableRef.value.setCheckboxRow(row, true)
}
const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const getYjdwList = async () => {
  const res = await baseService.post('/bizOrgTree/getYjdw', {
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id
  })
  if (res.success) {
    yjdwList.value = res.data || []
  } else {
    ElMessage.error(res.msg)
  }
}

const initUnitParams = async () => {
  await getYjdwList()
  setDefaulDwId()
  const apiFields = addformFields.filter((field) => field.apiConfig && field.type === 'select')
  for (const field of apiFields) {
    if (field.apiConfig?.params) {
      field.apiConfig.params = {
        bmId: userInfo.value.specialorgid,
        dwId: userInfo.value.org_id
      }
    }
  }
}

const getRoleHandle = async () => {
  pageInfo.loading = false
  if (userDialogRef.value) {
    userInfo.value = { ...userDialogRef.value.userMsg } as any
    const isQuery = userDialogRef.value.isQuery
    const isShow = await checkDwData(userInfo.value.org_id)
    permissions.value = userDialogRef.value.btnPermissions
    if (isQuery && isShow) {
      await initUnitParams()
      pageInfo.isShowPage = true
      searchHandle()
    }
  }
}

const checkDwData = async (dwId: string) => {
  try {
    const res = await checkDw(dwId)
    if (!res.success) throw new Error(res.msg)
    dwName.value = res.data
    return true
  } catch (error) {
    ElMessage.error((error as Error).message)
    return false
  }
}

// 设置年度目标值
const annualTargetValueHandle = (row: Params) => {
  annualTargetRow.value = row
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
      versionId: annualTargetRow.value.id,
      dwId: annualTargetRow.value.dwId,
      nd: annualTargetRow.value.nd,
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

const handleClickData = (flag: string) => {
  const $table = vxeTableRef.value
  if (!$table) return
  const records = $table.getCheckboxRecords()
  if (flag !== 'versionAdd' && flag !== 'versionDelete' && records.length !== 1) {
    ElMessage.warning('请选择一条数据!')
    return
  }
  if (flag === 'versionDelete' && records.length === 0) {
    ElMessage.warning('请至少选择一条数据!')
    return
  }
  switch (flag) {
    case 'versionAdd':
      openModal('add', records)
      break
    case 'versionEdit':
      openModal('edit', records)
      break
    case 'versionView':
      openModal('view', records)
      break
    case 'versionDelete':
      handleDelete(records)
      break
    case 'annualTargetValue':
      annualTargetValueHandle(records[0])
      break
    case 'targetValueBreakdown':
      const zt = records[0].zt
      if (zt !== '1') {
        ElMessage.warning('非初始状态,不能进行目标值编辑操作!')
        return
      }
      params.value = {
        ...records[0]
      }
      showBtn.value = true
      if (breakdownModalRef.value) breakdownModalRef.value.isShowModal = true
      break
    case 'targetValueView':
      params.value = {
        ...records[0]
      }
      showBtn.value = false
      if (breakdownModalRef.value) breakdownModalRef.value.isShowModal = true
      break
    case 'viewLog':
      params.value = {
        ...records[0]
      }
      if (logModalRef.value) logModalRef.value.accpect(params.value)
      break
    case 'viewFyLog':
      params.value = {
        ...records[0]
      }
      if (logFyModalRef.value) logFyModalRef.value.accpect(params.value)
      break
  }
}

const changeNdDataHandle = () => {
  searchHandle()
}

const initData = async () => {
  initParams()
  getPublicCode()
  if (route.query && route.query.versionParams) {
    const params = JSON.parse(decrypt(route.query.versionParams as string))
    userInfo.value = { ...params.userInfo }
    formParams.nd = params.nd
    const result = await getMenuMessage('/goalValue/targetBatchSplit/index')
    if (result.success && result.data) {
      let res = await baseService.get(`/sysMenu/getButtonList?menuCode=${result.data.outsideMenu}&spRoleId=${userInfo.value.id}`)
      permissions.value = res.data
    }
    const isShow = await checkDwData(userInfo.value.org_id)
    if (isShow) {
      await initUnitParams()
      pageInfo.isShowPage = true
      searchHandle()
    }
  } else {
    userDialogRef.value.getUser()
  }
}

onMounted(initData)
</script>

<style scoped lang="less">
@import url(./css/index.less);

.modal-footer {
  text-align: center;
}
</style>

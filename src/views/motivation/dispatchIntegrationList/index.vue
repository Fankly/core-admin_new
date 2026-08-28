<!-- 调度信息系统清单 -->
<template>
  <div class="container-main">
    <el-tabs v-model="tabData" v-show="isShowPage">
      <el-tab-pane :key="item.name" v-for="item in tables" :label="item.label" :name="item.name">
        <ProtableCurd
          v-if="isShowPage"
          :export-api="item.exportApi"
          :get-table-list="item.getTableList"
          :delete-api="item.deleteApi"
          :modal-title="item.modalTitle"
          :import-title="item.importTitle"
          :save-api="item.saveApi"
          :temp-api="item.tempApi"
          :table-columns="item.tableColumns"
          :form-fields="item.formFields"
          :import-api="item.importApi"
          :label-width="'180px'"
          :user-info="userInfo"
          ref="protableCurdRef"
          :cjr="cjr"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script setup lang="ts" name="/motivation/dispatchIntegrationList/index">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProtableCurd from '@/views/motivation/MarketingMotivation/components/ProtableCurdNew.vue'
import { getPublicData } from '@/api/common' //公共代码
import { exportDdxt, deleteDdxt, saveOrUpdate, importData, page } from '@/api/xmInfo/dispatchIntegrationList'
import { decimal2Rules } from '@/utils/rules'
import { useStore } from 'vuex'

const userDialogRef = ref<any>()
const tabData = ref('1')
const protableCurdRef = ref<any>()
const isShowPage = ref(false)
const cjr = ref<string>('')
const store = useStore()
const countInfo = ref<any>()

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
    isShowPage.value = true
  }
}

const tables = ref([
  {
    label: '调度信息系统清单',
    name: '1',
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      { prop: 'sxdw', label: '实现单位', width: '300' },
      { prop: 'xtmc', label: '系统名称', width: '300', search: { el: 'input', order: 1 } },
      { prop: 'xtgs', label: '系统概述', width: '300' },
      { prop: 'sspt', label: '所属平台', width: '300' },
      { prop: 'dycs', label: '对应处室', width: '300' },
      { prop: 'xtsx', label: '系统属性', width: '300' },
      { prop: 'zssxrq', label: '正式上线日期', width: '150' },
      { prop: 'xtfzr', label: '系统负责人', width: '100' },
      { prop: 'dqzcyhsl', label: '当前注册用户数量', width: '100' },
      { prop: 'yjhyd2026', label: '2026年月均用户活跃率', width: '120' },
      { prop: 'remark', label: '备注', width: '300' }
    ],
    formFields: [
      { prop: 'id', label: 'id', type: 'hidden' },
      { prop: 'sxdw', label: '实现单位', type: 'input', required: true },
      { prop: 'xtmc', label: '系统名称', type: 'input', required: true },
      { prop: 'xtgs', label: '系统概述', type: 'input', required: true },
      { prop: 'sspt', label: '所属平台', type: 'input', required: true },
      { prop: 'dycs', label: '对应处室', type: 'input', required: true },
      { prop: 'xtsx', label: '系统属性', type: 'input', required: true },
      { prop: 'zssxrq', label: '正式上线日期', type: 'date', required: true },
      { prop: 'xtfzr', label: '系统负责人', type: 'input', required: true },
      { prop: 'dqzcyhsl', label: '当前注册用户数量', type: 'input', required: true },
      { prop: 'yjhyd2026', label: '2026年月均用户活跃率', type: 'input', required: true },
      { prop: 'remark', label: '备注', type: 'input', required: false }
    ],
    importTitle: '人工',
    modalTitle: '人工',
    getTableList: page,
    deleteApi: deleteDdxt,
    saveApi: saveOrUpdate,
    tempApi: exportDdxt,
    importApi: importData,
    exportApi: exportDdxt
  }
])

const getPublicCodeData = () => {}

const initParams = () => {
  getPublicCodeData()
}

onMounted(async () => {
  initParams()
  countInfo.value = { ...store.getters.getUserMsg }
  cjr.value = countInfo.value?.name || ''

  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
.container-main {
  height: 100%;
  padding: 10px;
  :deep(.el-tabs) {
    height: 100%;
    .el-tabs__content {
      height: calc(100% - 40px);
    }
  }
  :deep(.el-tab-pane) {
    height: 100%;
  }
}
</style>

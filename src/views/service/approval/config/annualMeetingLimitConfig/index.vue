<template>
  <div class="main" v-if="userMsg.isShowPage">
    <splitpane :splitSet="pageConfig">
      <template #paneL>
        <div class="panel-left">
          <div class="panel-left-main">
            <div class="panel-left-main__search">
              <el-input @input="changeInputValueHandle" v-model="pageData.filterDeptData" placeholder="请输入专业归口名称"></el-input>
            </div>
            <div class="panel-left-main__content">
              <el-tree
                :expand-on-click-node="false"
                v-loading="pageConfig.loading"
                @node-click="handleNodeClick"
                highlightCurrent
                ref="gkbmRef"
                default-expand-all
                node-key="code"
                :data="pageData.deptData"
                :props="pageData.treeProps"
                :filter-node-method="getNameDataHandle"
              ></el-tree>
            </div>
          </div>
        </div>
      </template>
      <template #paneR>
        <div class="panel-right">
          <div class="panel-right-tools">
            <div class="left">
              <el-button type="primary" plain @click="saveHandle">保存</el-button>
            </div>
            <div class="right">
              <span>年度：</span>
              <el-select @change="changeNdData" v-model="nd" placeholder="请选择" style="width: 115px; margin-right: 10px">
                <template v-for="item in ndList" :key="item.code">
                  <el-option :label="item.name" :value="item.code"></el-option>
                </template>
              </el-select>
              <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
            </div>
          </div>
          <div class="table">
            <vxe-table
              :loading="pageConfig.loading"
              keep-source
              ref="tableRef"
              :column-config="{
                resizable: true
              }"
              size="mini"
              :edit-config="{
                trigger: 'click',
                mode: 'cell',
                showStatus: true,
                enabled: true
              }"
              stripe
              align="center"
              header-align="center"
              border
              height="100%"
              :data="pageData.numData"
            >
              <vxe-column align="center" type="seq" width="60" title="序号"></vxe-column>
              <vxe-column field="pspcTypeName" align="center" title="评审批次类型" width="120"> </vxe-column>
              <vxe-column
                header-align="center"
                field="maxNum"
                align="right"
                title="会议上限数量"
                width="120"
                :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input v-number-input="'6'" class="my-input" v-model="row['maxNum']" />
                </template>
              </vxe-column>
            </vxe-table>
          </div>
        </div>
      </template>
    </splitpane>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts" name="/service/approval/config/annualMeetingLimitConfig/index">
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, reactive, ref } from 'vue'
import { getDataByParent, getPublicData } from '@/api/common'
import { ElMessage, ElTree } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getPageList, saveData } from '@/api/service/IhhsMeeting/approval/annualMeetingLimitConfig'

interface PageConfig extends ContextProps {
  loading: boolean
}

const curYear = new Date().getFullYear().toString()

const tableRef = ref()
const userDialogRef = ref()
const helpModalRef = ref()
const gkbmRef = ref<InstanceType<typeof ElTree>>()
const ndList = ref<any[]>([])
const nd = ref(curYear)

onMounted(() => {
  selectRolesHandle()
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const pageConfig = reactive<PageConfig>({
  loading: true,
  minPercent: 20,
  defaultPercent: 20,
  maxPercent: 35,
  split: 'vertical'
})

const userMsg = reactive({
  specialOrgId: '',
  isShowPage: false
})

const pageData = reactive<any>({
  filterDeptData: '',
  treeProps: {
    children: 'children',
    label: 'name'
  },
  deptData: [],
  numData: []
})

const getNdList = async () => {
  try {
    const res = await getPublicData('ZLYS_XMJHSSND')
    if (!res.success) throw new Error(res.msg)
    if (res.data) {
      ndList.value = res.data
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
    ndList.value = []
  }
}

const selectRolesHandle = () => {
  userDialogRef.value.getUser()
}

const getRoleHandle = () => {
  pageConfig.loading = false
  userMsg.specialOrgId = userDialogRef.value.specialorgid
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    userMsg.isShowPage = true
    getNdList()
    getDeptData()
  }
}

const getDeptData = async () => {
  const parentData: any[] = [
    {
      name: '专业部门',
      children: []
    }
  ]
  try {
    pageConfig.loading = true
    const res = await getDataByParent('QMYS_ZZJG')
    if (!res.success) throw new Error(res.msg)
    if (res.data) {
      parentData[0].children = res.data
    }
    pageData.deptData = parentData
  } catch (error) {
    ElMessage.error((error as Error).message)
    pageData.deptData = []
  } finally {
    pageConfig.loading = false
  }
}

const handleNodeClick = async (val: any) => {
  if (!val['code'] || val['code'] === '-1') {
    pageData.numData = []
    return
  }
  pageConfig.loading = true
  try {
    const res = await getPageList(val['code'], nd.value)
    if (!res.success) throw new Error(res.msg)
    pageData.numData = res.data
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    pageConfig.loading = false
  }
}

const searchData = async () => {
  const currentKey = gkbmRef.value?.getCurrentKey()
  if (!currentKey) {
    ElMessage.warning('请选择专业部门!')
    return
  }
  pageConfig.loading = true
  try {
    const res = await getPageList(currentKey, nd.value)
    if (!res.success) throw new Error(res.msg)
    pageData.numData = res.data
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    pageConfig.loading = false
  }
}

const changeNdData = async (val: string) => {
  const currentKey = gkbmRef.value?.getCurrentKey()
  if (!currentKey) {
    pageData.numData = []
    return
  }
  pageConfig.loading = true
  try {
    const res = await getPageList(currentKey, val)
    if (!res.success) throw new Error(res.msg)
    pageData.numData = res.data
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    pageConfig.loading = false
  }
}

const changeInputValueHandle = (val: string) => {
  gkbmRef.value?.filter(val)
}

const getNameDataHandle = (value: string, data: any) => {
  if (!value) return true
  return data.name.indexOf(value) !== -1
}

const saveHandle = async () => {
  const gkbmData = gkbmRef.value?.getCurrentNode()
  if (!gkbmData || gkbmData['children']) {
    ElMessage.warning('请选择专业部门!')
    return
  }
  // 获取修改的数据
  const $table = tableRef.value
  const records: any[] = $table.getUpdateRecords()
  if (records.length === 0) {
    ElMessage.warning('请修改后,再进行保存!')
    return
  }
  const type = await VXETable.modal.confirm('请确认是否保存', '确认', {
    status: 'warning',
    cancelButtonText: '否',
    confirmButtonText: '是'
  })
  if (type !== 'confirm') return
  pageConfig.loading = true
  try {
    // 保存数据
    const res = await saveData(records)
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('保存成功!')
    searchData()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    pageConfig.loading = false
  }
}
</script>

<style scoped lang="less">
.main {
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .panel-left,
  .panel-right {
    height: 100%;
    padding: 10px 0 10px 10px;
  }

  .panel-right {
    display: flex;
    flex-direction: column;
    .table {
      flex: 1;
      min-height: 400px;
    }
    &-tools {
      height: 32px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }

  .panel-left {
    &-main {
      height: calc(100% - 32px);
      display: flex;
      flex-direction: column;

      &__search {
        padding: 0 10px 10px 0;
      }

      &__content {
        flex: 1;
        min-width: 200px;
        min-height: 200px;
        overflow: auto;
      }
    }
  }
}
</style>

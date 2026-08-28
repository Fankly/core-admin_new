<template>
  <div class="main" v-loading="pageConfig.loading" v-if="userMsg.isShowPage">
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
              <el-button v-permission="'SAVE'" type="primary" plain @click="saveHandle">保存</el-button>
            </div>
            <div class="right">
              <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
            </div>
          </div>
          <Grid ref="gridRef" :gap="[20, 0]" :cols="2">
            <GridItem>
              <el-form-item>
                <template #label>
                  <el-space :size="4">
                    <span>{{ `评审专业` }}</span>
                  </el-space>
                  <span>&nbsp;:</span>
                </template>
                <div class="panel-right-main">
                  <el-tree
                    show-checkbox
                    ref="majorRef"
                    default-expand-all
                    node-key="code"
                    :data="pageData.majorData"
                    :props="pageData.treeProps"
                  ></el-tree
                ></div>
              </el-form-item>
            </GridItem>
          </Grid>
        </div>
      </template>
    </splitpane>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts" name="/service/approval/config/deptMajor/index">
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, reactive, ref } from 'vue'
import { getDataByParent, getPublicData } from '@/api/common'
import { ElMessage, ElTree } from 'element-plus'
import { getMajorDataList, saveData } from '@/api/service/IhhsMeeting/approval/deptMajor'
import { VXETable } from 'vxe-table'

interface PageConfig extends ContextProps {
  loading: boolean
}

const userDialogRef = ref()
const helpModalRef = ref()
const gkbmRef = ref<InstanceType<typeof ElTree>>()
const majorRef = ref<InstanceType<typeof ElTree>>()

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
  majorData: []
})

const selectRolesHandle = () => {
  pageConfig.loading = true
  userDialogRef.value.getUser()
}

const getRoleHandle = () => {
  pageConfig.loading = false
  userMsg.specialOrgId = userDialogRef.value.specialorgid
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    userMsg.isShowPage = true
    getDeptData()
    getMajorData()
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

const getMajorData = async () => {
  const parentData: any[] = [
    {
      name: '评审专业',
      children: []
    }
  ]
  try {
    pageConfig.loading = true
    const res = await getPublicData('MAJOR_COM')
    if (!res.success) throw new Error(res.msg)
    if (res.data) {
      parentData[0].children = res.data
    }
    pageData.majorData = parentData
  } catch (error) {
    ElMessage.error((error as Error).message)
    pageData.majorData = []
  } finally {
    pageConfig.loading = false
  }
}

const handleNodeClick = async (val: any) => {
  if (!val['code'] || val['code'] === '-1') {
    majorRef.value?.setCheckedKeys([], false)
    return
  }
  pageConfig.loading = true
  try {
    const res = await getMajorDataList(val['code'])
    if (!res.success) throw new Error(res.msg)
    majorRef.value?.setCheckedKeys(res.data || [], false)
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
  const majorData = majorRef.value?.getCheckedNodes(false, false)
  if (!majorData) {
    ElMessage.warning('请选择评审专业!')
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
    const bmId = gkbmData['code']
    const codes = majorData.map((item: any) => item.code)
    const res = await saveData({
      bmId: bmId,
      codes: codes
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('保存成功!')
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

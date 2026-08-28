<template>
  <div
    class="main"
    v-if="userMsg.isShowPage"
    v-loading="pageConfig.loading"
    element-loading-text="页面加载中..."
    element-loading-background="rgba(255, 255, 255, 0.72)"
  >
    <splitpane :splitSet="pageConfig">
      <template #paneL>
        <div class="panel-left">
          <div class="panel-left-main">
            <div class="panel-left-header">
              <span class="panel-title">
                <i class="el-icon-folder-opened"></i>
                <span>项目类型树</span>
              </span>
            </div>
            <div class="panel-left-main__search">
              <el-input
                @input="changeInputValueHandle"
                v-model="pageData.filterXmlxData"
                placeholder="请输入项目类型名称"
                prefix-icon="el-icon-search"
                clearable
              ></el-input>
            </div>
            <div class="panel-left-main__content">
              <el-tree
                :expand-on-click-node="false"
                @node-click="getClickxmlxDataHandle"
                :highlight-current="true"
                ref="xmlxRef"
                node-key="middleId"
                :data="pageData.xmlxData"
                :props="pageData.treeProps"
                :filter-node-method="getNameDataHandle"
              >
                <template #default="{ data }">
                  <span class="custom-tree-node">
                    <i class="tree-node-icon" :class="data.leaf ? ['el-icon-document', 'is-leaf'] : ['el-icon-folder', 'is-parent']"></i>
                    <span class="tree-node-label" :title="data.name">{{ data.name }}</span>
                  </span>
                </template>
              </el-tree>
            </div>
          </div>
        </div>
      </template>
      <template #paneR>
        <div class="panel-right">
          <div class="panel-right-tools">
            <div class="left">
              <el-button :disabled="hasSelectedProjects || loading" v-permission="'SAVE'" type="primary" plain @click="handleBaseMaintain"
                >批量通用配置修改</el-button
              >
              <el-button :disabled="hasSelectedProjects || loading" type="primary" v-permission="'DEPTWH'" plain @click="handleDeptMaintain"
                >批量专业部门修改</el-button
              >
              <el-button :disabled="hasSelectedProjects || loading" type="primary" v-permission="'WBSWH'" plain @click="handleWbsMaintain"
                >批量WBS修改</el-button
              >
              <el-button :disabled="hasSelectedProjects || loading" type="primary" v-permission="'SGBMWH'" plain @click="handleSgbmMaintain"
                >批量省管部门修改</el-button
              >
              <el-button v-permission="'MBZZKJDPZ'" :disabled="!isLeaf || loading" type="primary" plain @click="handleMbzConfig"
                >目标值总控节点配置</el-button
              >
              <el-button v-permission="'MBZYZXPZ'" :disabled="!isLeaf || loading" type="primary" plain @click="handleMbzYzxConfig"
                >目标值一致性配置</el-button
              >
              <el-button
                v-permission="'GLNDZDRW'"
                :disabled="hasSelectedProjects || loading"
                type="primary"
                plain
                @click="handleAnnualKeyTaskAssociation"
                >关联年度重点任务</el-button
              >
              <el-button v-permission="'LOG'" :disabled="loading" type="primary" plain @click="handleLogView">日 志</el-button>
              <el-button v-permission="'EXPORT'" :disabled="isDisabled || loading" type="primary" plain @click="handleExport">导 出</el-button>
            </div>
            <div class="right">
              <div class="right-type">
                <span>展示类型：</span>
                <el-select @change="changeSearchType" style="width: 130px" v-model="searchType">
                  <el-option v-for="item in searchTypeList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                </el-select>
              </div>
              <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
            </div>
          </div>
          <div class="panel-right-table">
            <vxe-table
              ref="tableRef"
              :checkbox-config="tableCheckboxConfig"
              @cell-click="cellClickHandle"
              @checkbox-change="checkChangeHandle"
              @checkbox-all="checkChangeAllHandle"
              align="center"
              :loading="loading"
              :loading-config="tableLoadingConfig"
              show-overflow
              show-header-overflow
              header-align="center"
              height="100%"
              :row-config="tableRowConfig"
              :border="true"
              :data="tableData"
              :column-config="tableColumnConfig"
              :scroll-x="tableScrollX"
              :scroll-y="tableScrollY"
            >
              <vxe-column type="checkbox" width="80"></vxe-column>
              <vxe-column width="120" field="id" title="ID"></vxe-column>
              <vxe-column width="200" field="pppName" title="一级项目类别名称"></vxe-column>
              <vxe-column width="200" field="ppName" title="二级项目类别名称"></vxe-column>
              <vxe-column width="200" field="pname" title="三级项目类别名称"></vxe-column>
              <vxe-column width="200" field="name" title="四级项目类别名称"></vxe-column>
              <vxe-column width="180" field="code" title="项目类别编码"></vxe-column>
              <vxe-column width="120" field="hiberarchy" title="层级"></vxe-column>
              <vxe-column width="200" field="yjfl" title="一级分类"></vxe-column>
              <vxe-column width="200" field="ejfl" title="二级分类"></vxe-column>
              <vxe-column width="200" field="sjfl" title="三级分类"></vxe-column>
              <vxe-column width="200" field="dyxzCode" title="单元性质"></vxe-column>
              <vxe-column width="120" field="ysbzCodeName" title="预算编制方式"></vxe-column>
              <vxe-column width="120" field="ysspgn" title="预算审批功能"></vxe-column>
              <vxe-column width="120" field="byskz" title="包预算控制"></vxe-column>
              <vxe-column width="120" field="hasprovince" title="预算编制审批"></vxe-column>
              <vxe-column width="120" field="sxyskz" title="事项预算控制"></vxe-column>
              <vxe-column width="120" field="sflr" title="是否录入"></vxe-column>
              <vxe-column width="120" field="xmbtolerance" title="项目包容差(%)"></vxe-column>
              <vxe-column width="120" field="sfyxjdys" title="是否允许机动预算"></vxe-column>
              <vxe-column width="120" field="sfglzc" title="是否关联资产"></vxe-column>
              <vxe-column width="120" field="sfxyxqsh" title="是否需要需求审核"></vxe-column>
              <vxe-column width="120" field="sfxylhhs" title="是否需要联合会审"></vxe-column>
              <vxe-column width="120" field="sfywdj" title="是否业务冻结"></vxe-column>
              <vxe-column width="120" field="zcsjfl" title="资产三级分类"></vxe-column>
              <vxe-column width="120" field="expenseCategory" title="费用类别"></vxe-column>
              <vxe-column width="120" field="cblb" title="成本类别"></vxe-column>
              <vxe-column width="120" field="ysly" title="预算来源"></vxe-column>
              <vxe-column width="120" field="jhlx" title="计划类型"></vxe-column>
              <vxe-column width="120" field="yssfkz" title="预算释放控制"></vxe-column>
              <vxe-column width="120" field="mbzkkz" title="目标总控值控制(普通包)"></vxe-column>
              <vxe-column width="120" field="mbztolerance" title="目标值容差"></vxe-column>
              <vxe-column width="360" field="cbjdlc" title="储备阶段流程"></vxe-column>
              <vxe-column width="120" field="sfjyzdtx" title="是否校验事项必填"></vxe-column>
              <vxe-column width="120" field="sfgmblr" title="是否允许规模包录入"></vxe-column>
              <vxe-column width="120" field="sfxmlr" title="是否需求录入"></vxe-column>
              <vxe-column width="120" field="gbdksfywdj" title="关闭打开是否业务冻结"></vxe-column>
              <vxe-column width="180" field="qgcCode" title="过程名称"></vxe-column>
              <vxe-column width="120" field="provincialManagementOffice" title="省管处室"></vxe-column>
              <vxe-column width="120" field="processingMode" title="处理模式"></vxe-column>
              <vxe-column width="120" field="tabType" title="页签类型"></vxe-column>
              <vxe-column width="220" field="zdtx" title="重点投向"></vxe-column>
              <vxe-column width="120" field="xtly" title="系统来源"></vxe-column>
              <vxe-column width="120" field="isZgs" title="是否子公司"></vxe-column>
              <vxe-column width="120" field="isSgs" title="是否省公司"></vxe-column>
              <vxe-column width="120" field="zjsx" title="资金属性"></vxe-column>
              <vxe-column width="120" field="mbzGkjb" title="目标值管控级别"></vxe-column>
              <vxe-column width="130" field="mbzZkjd" title="是否目标值总控节点"></vxe-column>
              <vxe-column width="130" field="mbzYzx" title="是否目标值一致性"></vxe-column>
              <vxe-column width="180" field="cnx" title="承诺项编码"></vxe-column>
              <vxe-column width="300" field="cnxName" title="承诺项名称"></vxe-column>
              <vxe-column width="120" field="isGjPspfwj" title="是否需要挂接评审及批复文件"></vxe-column>
              <vxe-column width="120" field="isBkk" title="不可控标识"></vxe-column>
              <vxe-column width="120" field="status" title="状态"></vxe-column>
              <vxe-column width="120" field="stoptime" title="停用时间"></vxe-column>
              <vxe-column width="120" field="tghsRjh" title="跳过会审（仍建会）"></vxe-column>
              <vxe-column width="120" field="tghsJe" title="建会跳过会审金额"></vxe-column>
              <vxe-column width="120" field="zyxtyys" title="专业系统已预审"></vxe-column>
              <vxe-column width="120" field="csbl" title="抽审比例"></vxe-column>
              <vxe-column width="120" field="aiAuditInuseType" title="智能审核启用类型"></vxe-column>
              <vxe-column width="100" field="sfjjcl" title="是否降级处理"></vxe-column>
              <vxe-column width="120" field="xqlrWfCode" title="需求录入流程编码"></vxe-column>
              <vxe-column width="100" field="sfzdck" title="是否自动出库"></vxe-column>
              <vxe-column width="200" field="wlzcbwtsmFjType" title="物料资成本问题说明附件"></vxe-column>
              <vxe-column width="220" field="ysbgSfkyxgztz" title="预算变更是否可以修改总投资"></vxe-column>
              <vxe-column width="160" field="xqlrEdit" title="集中修改是否不可修改"></vxe-column>
              <vxe-column width="200" field="ndzdrw" title="重点任务"></vxe-column>
            </vxe-table>
          </div>
        </div>
      </template>
    </splitpane>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <BasicAttributeModal @save-data-after="searchData" ref="basicAttributeModalRef" />
  <DeptModal @save-data-after="searchData" ref="deptModalRef" />
  <WBSModal @save-data-after="searchData" ref="wbsModalRef" />
  <CggbmModal @save-data-after="searchData" ref="cgbmModalRef" />
  <MbzConfigModal @save-data-after="searchData" ref="mbzConfigModalRef" />
  <MbzYzxConfigModal @save-data-after="searchData" ref="MbzYzxConfigModalRef" />
  <AnnualKeyTaskAssociationModal @save-data-after="searchData" ref="annualKeyTaskAssociationModalRef" />
  <LogModal ref="logModalRef" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts" name="/sys/baseMsgConfig/proCategory">
import { getProtypeTree, getPublicCodeList } from '@/api/common'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import userDialog from '@/components/select/userDialog.vue'
import BasicAttributeModal from '@/views/sys/baseMsgConfig/components/BasicAttributeModal.vue'
import CggbmModal from '@/views/sys/baseMsgConfig/components/CggbmModal.vue'
import DeptModal from '@/views/sys/baseMsgConfig/components/DeptModal.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import WBSModal from '@/views/sys/baseMsgConfig/components/WBSModal.vue'
import LogModal from '@/views/sys/baseMsgConfig/components/LogModal.vue'
import { ElMessage, ElTree } from 'element-plus'
import { onBeforeUnmount, onMounted, reactive, ref, computed, shallowRef } from 'vue'
import { getChildLeafByParentId, exportData } from '@/api/sys/proCategory'
import MbzConfigModal from '@/views/sys/baseMsgConfig/components/MbzConfigModal.vue'
import MbzYzxConfigModal from '@/views/sys/baseMsgConfig/components/MbzYzxConfigModal.vue'
import AnnualKeyTaskAssociationModal from '@/views/sys/baseMsgConfig/components/AnnualKeyTaskAssociationModal.vue'

interface PageConfig extends ContextProps {
  loading: boolean
}

const publicCodes = ['XMLB_QUERY_TYPE']
const searchTypeList = ref<any[]>([])
const userDialogRef = ref()
const helpModalRef = ref()
const tableRef = ref()
const loading = ref(false)
const xmlxRef = ref<InstanceType<typeof ElTree>>()
const basicAttributeModalRef = ref<InstanceType<typeof BasicAttributeModal>>()
const deptModalRef = ref<InstanceType<typeof DeptModal>>()
const wbsModalRef = ref<InstanceType<typeof WBSModal>>()
const cgbmModalRef = ref<InstanceType<typeof CggbmModal>>()
const mbzConfigModalRef = ref<InstanceType<typeof MbzConfigModal>>()
const MbzYzxConfigModalRef = ref<InstanceType<typeof MbzYzxConfigModal>>()
const annualKeyTaskAssociationModalRef = ref<InstanceType<typeof AnnualKeyTaskAssociationModal>>()
const logModalRef = ref<InstanceType<typeof LogModal>>()
const tableData = shallowRef<any[]>([])
const searchType = ref('2')
const tableCheckboxConfig = {
  trigger: 'row',
  highlight: true
}
const tableRowConfig = {
  height: 32
}
const tableColumnConfig = {
  resizable: true
}
const tableScrollX = {
  enabled: true,
  gt: 20
}
const tableScrollY = {
  enabled: true,
  gt: 80
}
const tableLoadingConfig = {
  icon: 'el-icon-loading',
  text: '数据加载中...'
}
let treeFilterTimer: number | undefined
let tableRequestSeq = 0

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const xmId = ref('')
const checkedData = ref<any[]>([])
const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

const isLeaf = computed(() => checkedData.value.some((item) => item.leaf === true))

const checkChangeHandle = ({ records }: any) => {
  checkedData.value = records
}
const checkChangeAllHandle = ({ records }: any) => {
  checkedData.value = records
}

const changeSearchType = async () => {
  //   获取选中的节点
  const node = xmlxRef.value?.getCurrentNode() as any
  if (node) {
    xmId.value = node.id
    await loadTableData(node.id)
  }
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  checkedData.value = []
  await tableRef.value?.clearCheckboxRow()
  await tableRef.value?.setCheckboxRow(row, true)
  checkedData.value.push(row)
}
const isDisabled = computed(() => xmId.value === '')

const initPublicParams = async () => {
  try {
    //   获取公共代码
    const res = await getPublicCodeList({
      codes: publicCodes
    })
    if (!res.success) throw new Error(res.msg)
    searchTypeList.value = res.data['XMLB_QUERY_TYPE']
  } catch (error) {
    ElMessage.error((error as Error).message || '公共代码加载失败!')
  }
}

onMounted(() => {
  initPublicParams()
  selectRolesHandle()
})

onBeforeUnmount(() => {
  if (treeFilterTimer) window.clearTimeout(treeFilterTimer)
  tableRequestSeq += 1
})

const pageConfig = reactive<PageConfig>({
  loading: true,
  minPercent: 20,
  maxPercent: 30,
  defaultPercent: 20,
  split: 'vertical'
})

const userMsg = reactive({
  specialOrgId: '',
  roleCode: '',
  isShowPage: false
})

const pageData = reactive<any>({
  filterXmlxData: '',
  treeProps: {
    children: 'children',
    label: 'name',
    isLeaf: 'leaf'
  },
  xmlxData: []
})

const handleBaseMaintain = () => {
  if (basicAttributeModalRef.value) {
    const ids = checkedData.value.map((item) => item.id)
    basicAttributeModalRef.value.acceptParams({
      ids: ids,
      dwId: userMsg.specialOrgId,
      roleCode: userMsg.roleCode
    })
  }
}

const handleDeptMaintain = () => {
  if (deptModalRef.value) {
    const ids = checkedData.value.map((item) => item.id)
    deptModalRef.value.acceptParams({
      ids: ids,
      dwId: userMsg.specialOrgId
    })
  }
}

const handleSgbmMaintain = () => {
  if (cgbmModalRef.value) {
    const ids = checkedData.value.map((item) => item.id)
    cgbmModalRef.value.acceptParams({
      ids: ids,
      dwId: userMsg.specialOrgId
    })
  }
}

const handleMbzConfig = () => {
  if (mbzConfigModalRef.value) {
    const ids = checkedData.value.map((item) => item.id)
    mbzConfigModalRef.value.acceptParams({
      ids: ids,
      dwId: userMsg.specialOrgId
    })
  }
}

const handleMbzYzxConfig = () => {
  if (MbzYzxConfigModalRef.value) {
    const isZkjd = checkedData.value.every((item) => item.mbzZkjd == '是')
    if (!isZkjd) return ElMessage.warning('包含非总控节点，重新选择')
    const ids = checkedData.value.map((item) => item.id)
    MbzYzxConfigModalRef.value.acceptParams({
      ids: ids,
      dwId: userMsg.specialOrgId
    })
  }
}

const handleAnnualKeyTaskAssociation = () => {
  const ids = checkedData.value.map((item) => String(item.id)).filter(Boolean)
  if (!ids.length || !annualKeyTaskAssociationModalRef.value) return

  const role = userDialogRef.value?.userMsg || {}
  annualKeyTaskAssociationModalRef.value.acceptParams({
    ids,
    userRole: {
      bmId: userMsg.specialOrgId,
      bmName: role.specialorgname || '',
      dwId: role.org_id || '',
      dwName: role.org_name || '',
      roleCode: userMsg.roleCode,
      roleId: role.role_id || '',
      specialOrgCode: role.specialorgcode || '',
      spRoleId: role.id || ''
    }
  })
}

const handleLogView = () => {
  if (logModalRef.value) {
    const ids = checkedData.value.map((item) => item.id)
    logModalRef.value.acceptParams({
      id: ids[0] || '',
      dwId: userMsg.specialOrgId
    })
  }
}

const handleWbsMaintain = () => {
  if (wbsModalRef.value) {
    // 判断是否可以进行wbs
    const isWbs = checkedData.value.some((item) => item.ysbzCode === 'BZDFL')
    if (isWbs) {
      ElMessage.warning('预算编制编码为编制到分类,不允许进行WBS维护')
      return
    }
    const ids = checkedData.value.map((item) => item.id)
    wbsModalRef.value.acceptParams({
      ids: ids,
      dwId: userMsg.specialOrgId
    })
  }
}

const handleExport = async () => {
  loading.value = true
  try {
    const res: any = await exportData(xmId.value, searchType.value)
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers?.['content-disposition']?.split(';')[1]?.split('=')[1] || '项目类型配置.xlsx'
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const selectRolesHandle = () => {
  pageConfig.loading = true
  userDialogRef.value.getUser()
}

const getRoleHandle = () => {
  pageConfig.loading = false
  userMsg.specialOrgId = userDialogRef.value.specialorgid
  userMsg.roleCode = userDialogRef.value.roleCode
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    userMsg.isShowPage = true
    getXmlxData()
  }
}

const changeInputValueHandle = (val: string) => {
  if (treeFilterTimer) window.clearTimeout(treeFilterTimer)
  treeFilterTimer = window.setTimeout(() => {
    xmlxRef.value?.filter(val)
    treeFilterTimer = undefined
  }, 200)
}

const getNameDataHandle = (value: string, data: any) => {
  if (!value) return true
  return data.name.indexOf(value) !== -1
}

const getXmlxData = async () => {
  try {
    pageConfig.loading = true
    let res = await getProtypeTree()
    if (!res.success) throw new Error(res.msg)
    pageData.xmlxData = res.data
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    pageConfig.loading = false
  }
}

const loadTableData = async (id: string) => {
  if (!id) {
    tableData.value = []
    checkedData.value = []
    return
  }

  const requestSeq = ++tableRequestSeq
  checkedData.value = []
  tableRef.value?.clearCheckboxRow?.()
  loading.value = true
  try {
    const res = await getChildLeafByParentId(id, searchType.value)
    if (requestSeq !== tableRequestSeq) return
    if (!res.success) throw new Error(res.msg)
    tableData.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    if (requestSeq !== tableRequestSeq) return
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    if (requestSeq === tableRequestSeq) loading.value = false
  }
}

const getClickxmlxDataHandle = async (data: any) => {
  xmId.value = data.id
  await loadTableData(data.id)
}

const searchData = async () => {
  await loadTableData(xmId.value)
}
</script>

<style scoped lang="less">
@primary-color: var(--color-primary, var(--el-color-primary, #00706b));
@primary-soft: var(--color-primary-light, var(--el-color-primary-light-9, #edf8f7));

// 树 / 表格统一滚动条样式
.thin-scrollbar() {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 112, 107, 0.32) transparent;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 112, 107, 0.26);
    border-radius: 999px;

    &:hover {
      background: rgba(0, 112, 107, 0.42);
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-corner {
    background: transparent;
  }
}

.main {
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  animation: pageFadeIn 0.36s cubic-bezier(0.16, 1, 0.3, 1) both;
  .panel-left,
  .panel-right {
    height: 100%;
    min-height: 0;
    padding: 14px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    background: var(--el-bg-color, #ffffff);
    border: 1px solid rgba(0, 112, 107, 0.13);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(31, 45, 61, 0.06);
    transition: border-color 0.2s ease;

    &:hover {
      border-color: rgba(0, 112, 107, 0.28);
    }
  }

  .panel-left {
    &-main {
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    &-header {
      margin: -2px -2px 12px;
      padding: 0 2px 12px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
    }

    .panel-title {
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #00706b;
      font-size: 15px;
      font-weight: 600;
      line-height: 22px;

      i {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: @primary-color;
        background: @primary-soft;
        border-radius: 8px;
      }
    }

    &-main__search {
      padding: 0 0 12px;

      :deep(.el-input__wrapper) {
        border-radius: 7px;
        box-shadow: 0 0 0 1px var(--el-border-color-light, #dcdfe6) inset;
        transition: box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease;

        &:hover {
          box-shadow: 0 0 0 1px rgba(0, 112, 107, 0.35) inset;
        }

        &.is-focus {
          box-shadow: 0 0 0 1px @primary-color;
          transform: translateY(-1px);
        }
      }
    }

    &-main__content {
      flex: 1;
      min-width: 0;
      height: 100%;
      padding: 4px 6px 4px 0;
      overflow: auto;
      .thin-scrollbar();
    }
  }

  .panel-right {
    &-tools {
      margin: -2px -2px 12px;
      padding: 0 2px 12px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px 14px;
      border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);

      .left {
        flex: 1;
        min-width: 360px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }

      .right {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 10px;
      }

      :deep(.el-button) {
        height: 32px;
        margin-left: 0 !important;
        padding: 0 12px;
        border-radius: 7px;
        font-weight: 500;
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;

        &.el-button--primary.is-plain {
          color: @primary-color;
          background: rgba(0, 112, 107, 0.05);
          border-color: rgba(0, 112, 107, 0.26);
        }

        &:not(.is-disabled):hover {
          color: #ffffff;
          background: @primary-color;
          border-color: @primary-color;
          box-shadow: 0 6px 14px rgba(0, 112, 107, 0.2);
          transform: translateY(-1px);
        }
        &:not(.is-disabled):active {
          box-shadow: 0 2px 8px rgba(0, 112, 107, 0.18);
          transform: translateY(0);
        }
      }
    }

    &-table {
      flex: 1;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border-radius: 8px;
      background: var(--el-bg-color, #ffffff);
      box-shadow: 0 0 0 1px var(--el-border-color-lighter, #ebeef5) inset;
    }
  }
}

:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.82);
}

:deep(.el-loading-spinner) {
  .circular {
    width: 34px;
    height: 34px;
    animation: loadingRotate 1s linear infinite;
  }

  .path {
    stroke: @primary-color;
    stroke-width: 3;
  }

  .el-loading-text {
    color: @primary-color;
    font-weight: 500;
    animation: loadingTextPulse 1.4s ease-in-out infinite;
  }
}

.right-type {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  white-space: nowrap;

  span {
    font-weight: 500;
  }

  :deep(.el-select .el-input__wrapper) {
    box-shadow: none !important;
    background: transparent;
  }
}

.custom-tree-node {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  font-size: 13px;

  .tree-node-icon {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder, #a8abb2);
    font-size: 14px;
    transition: color 0.18s ease;

    &.is-parent {
      color: #00706b;
    }

    &.is-leaf {
      color: #00706b;
    }
  }

  .tree-node-label {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-primary, #303133);
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.18s ease;
  }
}

:deep(.el-tree) {
  background: transparent;

  .el-tree-node__content {
    height: 34px;
    margin: 2px 0;
    border-radius: 7px;
    transition: background-color 0.18s ease;

    &:hover {
      background: rgba(0, 112, 107, 0.07);

      .tree-node-icon,
      .tree-node-label {
        color: @primary-color;
      }
    }
  }

  .el-tree-node.is-current > .el-tree-node__content {
    background: @primary-color !important;
    box-shadow: 0 4px 12px rgba(0, 112, 107, 0.18);

    .tree-node-icon,
    .tree-node-label {
      color: #ffffff !important;
      font-weight: 600;
    }
  }

  .el-tree-node__expand-icon {
    transition: transform 0.2s ease, color 0.2s ease;

    &:not(.is-leaf) {
      color: var(--el-text-color-secondary, #909399);
    }

    &.expanded {
      color: @primary-color;
    }
  }
}

:deep(.vxe-table) {
  --vxe-table-border-color: var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  overflow: hidden;
  border-color: var(--el-border-color, #dcdfe6);
  box-shadow: none;

  .vxe-table--body-wrapper {
    .thin-scrollbar();
  }

  .vxe-header--column {
    color: var(--el-text-color-primary);
    font-weight: 600;
    background: linear-gradient(180deg, rgba(0, 112, 107, 0.08), rgba(0, 112, 107, 0.03)), var(--el-fill-color-lighter, #fafafa);
    border-right: 1px solid var(--el-border-color, #dcdfe6) !important;
  }

  .vxe-body--column {
    border-bottom: 1px solid var(--el-border-color, #dcdfe6) !important;
    border-right: 1px solid var(--el-border-color, #dcdfe6) !important;
  }

  .vxe-body--row {
    &.row--hover,
    &:hover {
      background-color: rgba(0, 112, 107, 0.05) !important;
    }

    &.row--checked,
    &.row--current {
      background-color: rgba(0, 112, 107, 0.1) !important;
    }
  }

  .vxe-cell--checkbox .vxe-checkbox--icon {
    transition: color 0.18s ease;
  }

  .vxe-cell--checkbox:hover .vxe-checkbox--icon {
    color: @primary-color;
  }

  .vxe-loading {
    background-color: rgba(255, 255, 255, 0.82);
    animation: loadingFade 0.18s ease both;
  }

  .vxe-loading--default-icon,
  .el-icon-loading {
    color: @primary-color;
    font-size: 24px;
    animation: loadingRotate 1s linear infinite;
  }

  .vxe-loading--text {
    color: @primary-color;
    font-weight: 500;
    animation: loadingTextPulse 1.4s ease-in-out infinite;
  }
}

.toolbar-guide-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: @primary-color;
  background: @primary-soft;
  border: 1px solid rgba(0, 112, 107, 0.2);
  border-radius: 50%;
  transition: background-color 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;

  &:hover {
    color: #ffffff;
    background: @primary-color;
    border-color: @primary-color;
    box-shadow: 0 7px 16px rgba(0, 112, 107, 0.22);
    transform: translateY(-1px);
  }
  &:active {
    box-shadow: 0 2px 8px rgba(0, 112, 107, 0.16);
    transform: translateY(0) rotate(0);
  }

  i {
    font-size: 18px;
  }
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes loadingFade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes loadingRotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes loadingTextPulse {
  0%,
  100% {
    opacity: 0.7;
  }

  50% {
    opacity: 1;
  }
}
</style>

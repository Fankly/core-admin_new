<template>
  <div class="container" v-if="isShowPage">
    <div class="header">
      <div class="header-actions">
        <div class="left">
          <template v-if="isProjectAdjustmentTab">
            <el-dropdown v-if="hasProjectChangePermission" class="change-order-dropdown" placement="bottom" trigger="click" :disabled="loading">
              <el-button :disabled="loading" type="primary" plain>变更申请单<i class="el-icon-arrow-down" style="margin-left: 6px"></i></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-permission="'CREATE_CART'" @click="handleCreateProjectChange">创建变更申请单</el-dropdown-item>
                  <el-dropdown-item v-permission="'EDIT_CART'" @click="handleEditProjectChange">编辑变更申请单</el-dropdown-item>
                  <el-dropdown-item v-permission="'VIEW_CART'" @click="handleViewProjectChange">查看变更申请单</el-dropdown-item>
                  <el-dropdown-item v-permission="'DELETE_CART'" @click="handleDeleteProjectChange">删除变更申请单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button v-permission="'SUBMIT'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleSubmit">提 交</el-button>
            <el-button v-permission="'PROCESS'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleViewProcess"
              >流程履历</el-button
            >
          </template>
          <template v-else>
            <el-button v-permission="'CREATE'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleCreateChangeCart"
              >创建变更申请单
            </el-button>
            <el-button
              v-if="sfgmb === ANNUAL_BUDGET_ADJUSTMENT_TAB"
              v-permission="'DELETE_NDYS'"
              :disabled="loading || hasSelectedProjects"
              type="danger"
              plain
              @click="handleCleanOldSqd"
              >删除变更申请单</el-button
            >
            <el-button
              v-if="sfgmb === SCALE_PACKAGE_ADJUSTMENT_TAB"
              v-permission="'DELETE_GMB'"
              :disabled="loading || hasSelectedProjects"
              type="danger"
              plain
              @click="handleCleanOldSqd"
              >删除变更申请单</el-button
            >
            <el-button v-permission="'SUBMIT'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleSubmit">提 交</el-button>
            <el-button v-permission="'RESENDJHXT'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleResendJhxt"
              >推送失败补推计划系统</el-button
            >
            <el-button
              v-permission="'RESENDSAP'"
              :disabled="isShowBtn || loading || hasSelectedProjects"
              type="primary"
              plain
              @click="handleResendSap"
              >补推SAP</el-button
            >
            <el-button v-permission="'HISTORY'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleHistroyView"
              >历史变更情况查询</el-button
            >
            <el-button v-permission="'IMPORT'" type="primary" plain :disabled="loading" @click="handleImport">导 入</el-button>
            <el-button v-permission="'EXPORT'" :disabled="loading" type="primary" plain @click="exportHandle">导 出</el-button>
            <el-button v-permission="'PROCESS'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleViewProcess"
              >流程履历</el-button
            >
          </template>
        </div>
        <div class="right">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="content">
      <splitpane :splitSet="settingLR">
        <template #paneL>
          <div class="tree">
            <div class="tree-data">
              <el-tree
                :current-node-key="currentKey"
                lazy
                :load="loadTreeData"
                :expand-on-click-node="false"
                highlight-current
                ref="treeRef"
                :props="defaultProps"
                node-key="id"
                @node-click="handleNodeClick"
              ></el-tree>
            </div>
          </div>
        </template>
        <template #paneR>
          <div class="main">
            <div class="main-search">
              <el-form ref="searchRef" label-position="right" :label-width="120" :model="searchForm">
                <Grid ref="gridRef" :gap="[10, 0]" :cols="4">
                  <GridItem>
                    <el-form-item prop="xmmc">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `项目名称` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-input v-model="searchForm.xmmc"></el-input>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="gwxmbms">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `国网项目编码` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <ReMultipleText v-model="searchForm.gwxmbms" />
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="xmbms">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `储备编码` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <ReMultipleText v-model="searchForm.xmbms" />
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="xmbmc">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `项目包名称` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-input v-model="searchForm.xmbmc"></el-input>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="xmxz">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `项目性质` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select clearable collapse-tags v-model="searchForm.xmxz">
                          <el-option v-for="item in publicCodeList['XMXZ']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="yjfl">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `一级分类` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select @change="(val:string)=>handleFieldChange(val,'yjfl')" clearable collapse-tags v-model="searchForm.yjfl">
                          <el-option v-for="item in publicCodeList['GWXMFL']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="ejfl">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `二级分类` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select @change="(val:string)=>handleFieldChange(val,'ejfl')" clearable collapse-tags v-model="searchForm.ejfl">
                          <el-option v-for="item in searchList.ejflList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="sjfl">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `三级分类` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select @change="(val:string)=>handleFieldChange(val,'sjfl')" clearable collapse-tags v-model="searchForm.sjfl">
                          <el-option v-for="item in searchList.sjflList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="yjdw">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `一级单位` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select @change="(val:string)=>handleFieldChange(val,'yjdw')" clearable collapse-tags v-model="searchForm.yjdw">
                          <el-option v-for="item in searchList.yjdwList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="ejdw">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `二级单位` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select @change="(val:string)=>handleFieldChange(val,'ejdw')" clearable collapse-tags v-model="searchForm.ejdw">
                          <el-option v-for="item in searchList.ejdwList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem v-if="!isProjectAdjustmentTab">
                    <el-form-item prop="bgStatus">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `变更审核状态` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select multiple clearable collapse-tags v-model="searchForm.bgStatus">
                          <el-option
                            v-for="item in publicCodeList['ZLYS_YSBG_STATUS']"
                            :key="item.code"
                            :label="item.name"
                            :value="item.code"
                          ></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="xmjhlx">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `项目计划类型` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select clearable collapse-tags v-model="searchForm.xmjhlx">
                          <el-option v-for="item in publicCodeList['ZLYS_XMJHLX']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem v-if="isProjectAdjustmentTab">
                    <el-form-item prop="flowStatus">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `最新更变状态` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select clearable collapse-tags v-model="searchForm.flowStatus">
                          <el-option
                            v-for="item in publicCodeList['YSBG_FLOW_STATUS']"
                            :key="item.code"
                            :label="item.name"
                            :value="item.code"
                          ></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem suffix>
                    <div class="operation">
                      <el-button type="primary" size="mini" plain @click="loadData">查 询</el-button>
                      <el-button size="mini" plain @click="resetHandle">重 置</el-button>
                    </div>
                  </GridItem>
                </Grid>
              </el-form>
            </div>
            <div class="custom-tabs">
              <div class="tab-item" :class="{ active: sfgmb === PROJECT_ADJUSTMENT_TAB }" @click="() => handleTabClick(PROJECT_ADJUSTMENT_TAB)">
                项目调整
              </div>
              <div
                class="tab-item"
                :class="{ active: sfgmb === ANNUAL_BUDGET_ADJUSTMENT_TAB }"
                @click="() => handleTabClick(ANNUAL_BUDGET_ADJUSTMENT_TAB)"
              >
                年度预算调整
              </div>
              <div
                class="tab-item"
                :class="{ active: sfgmb === SCALE_PACKAGE_ADJUSTMENT_TAB }"
                @click="() => handleTabClick(SCALE_PACKAGE_ADJUSTMENT_TAB)"
              >
                规模包调整
              </div>
            </div>
            <div class="main-table">
              <vxe-table
                :checkbox-config="checkboxConfig"
                :radio-config="radioConfig"
                ref="tableRef"
                :row-config="{ height: 32 }"
                align="center"
                show-overflow
                header-align="center"
                border
                resizable
                stripe
                :data="tableData"
                height="auto"
                max-height="100%"
                :loading="loading"
                :loading-config="{ icon: 'el-icon-loading', text: '正在加载...' }"
                @cell-click="cellClickHandle"
                @radio-change="radioChangeHandle"
                @checkbox-change="checkChangeHandle"
                @checkbox-all="checkChangeAllHandle"
              >
                <vxe-column v-if="isProjectAdjustmentTab" width="55" type="radio"></vxe-column>
                <vxe-column v-else width="55" type="checkbox"></vxe-column>
                <vxe-column
                  title="最新变更状态"
                  :field="latestChangeStatusField"
                  :formatter="latestChangeStatusFormatter"
                  min-width="150"
                ></vxe-column>
                <vxe-column title="项目名称" field="xmmc" min-width="220"></vxe-column>
                <vxe-column title="项目计划类型" field="xmjhlxName" min-width="150"></vxe-column>
                <vxe-column title="调整事由" field="tzsy" :formatter="tzsyFormatter" min-width="150"></vxe-column>
                <vxe-column title="是否出具评审意见" field="sfcjpsyj" :formatter="sfcjpsyjFormatter" min-width="150"></vxe-column>
                <vxe-column title="储备编码" field="xmbm" min-width="150"></vxe-column>
                <vxe-column title="国网项目编码" field="gwxmbm" min-width="150"></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="总投资计划(万元)"
                  field="ztzjh"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="初始年度投资计划(万元)"
                  field="csndtzjh"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  :visible="true"
                  title="总预算含税(万元)"
                  field="allInvestTax"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="项目总预算不含税(万元)"
                  field="amount"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  :visible="true"
                  title="当年预算含税(万元)"
                  field="yearInvestTax"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="当年预算不含税(万元)"
                  field="dnys"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="当年投资计划(万元)"
                  field="dntzjh"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="当年财务支出(万元)"
                  field="dncwzc"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="当年项目承诺(万元)"
                  field="dnxmcn"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="累计项目承诺(万元)"
                  field="ljxmcn"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  :visible="true"
                  title="最新调整总预算含税(万元)"
                  field="bgAllInvestTax"
                  min-width="140"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="最新调整总预算不含税(万元)"
                  field="bgAmount"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  :visible="true"
                  title="最新调整当年预算含税(万元)"
                  field="bgYearInvestTax"
                  min-width="150"
                ></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="最新调整当年预算不含税(万元)"
                  field="bgDnys"
                  min-width="160"
                ></vxe-column>
                <vxe-column title="最新变更原因" field="bgyy" min-width="150"></vxe-column>
                <vxe-column align="right" header-align="center" title="当年预算调整次数" field="ystzcs" min-width="150"></vxe-column>
                <vxe-column align="right" header-align="center" title="累计预算调整次数" field="ljtzcs" min-width="150"></vxe-column>
                <vxe-column
                  align="right"
                  header-align="center"
                  :formatter="formatterHandle"
                  title="年初预算(万元)"
                  field="ncys"
                  min-width="150"
                ></vxe-column>
                <vxe-column title="最新变更时间" field="bgsj" min-width="150"></vxe-column>
                <vxe-column title="项目性质" field="xmxz" min-width="150"></vxe-column>
                <vxe-column title="一级单位" field="yjdw" min-width="150"></vxe-column>
                <vxe-column title="二级单位" field="ejdw" min-width="150"></vxe-column>
                <vxe-column title="归口部门" field="gkbm" min-width="150"></vxe-column>
                <vxe-column title="一级分类" field="yjfl" min-width="150"></vxe-column>
                <vxe-column title="二级分类" field="ejfl" min-width="150"></vxe-column>
                <vxe-column title="三级分类" field="sjfl" min-width="150"></vxe-column>
                <vxe-column title="项目包名称" field="xmbName" min-width="150"></vxe-column>
                <vxe-column title="是否打捆" field="ispack" min-width="150"></vxe-column>
                <vxe-column title="国网项目校验信息" field="reason" min-width="150"></vxe-column>
                <vxe-column title="SAP校验信息" field="remark" min-width="150"></vxe-column>
                <vxe-column title="是否幅度范围内" field="sftzfdfwn" min-width="150"></vxe-column>
                <vxe-column title="本次调整幅度(%)" field="tzfd" min-width="150"></vxe-column>
              </vxe-table>
            </div>
            <div class="main-pagination">
              <el-pagination
                :current-page="childrenCurrentPage"
                background
                align="center"
                :page-sizes="[20, 50, 100, 200]"
                :page-size="childrenPageSize"
                :total="parseInt(totalProjects + '')"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleChildrenSizeChange"
                @current-change="handleChildrenCurrentChange"
              ></el-pagination>
            </div>
          </div>
        </template>
      </splitpane>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <budgetChangeCreate ref="budgetChangeCreateRef" />
  <budgetChangeHistory ref="budgetChangeHistoryRef" />
  <CentralizedModification
    ref="projectChangeFormRef"
    :userInfo="userInfo"
    :formData="projectChangeFormData"
    :flag="projectChangeFormFlag"
    :project-change-mode="projectChangeFormMode"
    :editable-component-names="PROJECT_CHANGE_EDITABLE_COMPONENTS"
    :budget-changes-project-change="true"
    @saveAfter="loadData"
  ></CentralizedModification>
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
  <HelpModal ref="helpModalRef" />
  <vxe-modal title="补推SAP" v-model="isShowResetModal" :loading="modalLoading">
    <template #default>
      <el-form ref="modalformRef" label-suffix=":" :model="modalForm" :rules="modalFormRules">
        <el-form-item prop="sendType" label="补推SAP">
          <el-select v-model="modalForm.sendType" style="width: 100%">
            <el-option v-for="item in publicCodeList['ZLYS_SENDSAP_TYPE']" :key="item.code" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button type="primary" size="mini" plain @click="reSendToSapHandle">推 送</el-button>
        <el-button size="mini" plain @click="closeResendHandle">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
import { getParamConfig, getParamValueMulti, getProtypeYearTreeB, getPublicCodeList } from '@/api/common'
import {
  canBeNrhy,
  cleanOldSqd,
  deleteYsbg,
  exportData,
  getYsbgPage as getProjectAdjustmentPage,
  nrhy,
  resendData,
  resendSap,
  searchData,
  submitWf
} from '@/api/service/budget'
import { getBqshFlag } from '@/api/service/requirement'
import GridItem from '@/components/Grid/components/GridItem.vue'
import Grid from '@/components/Grid/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import userDialog from '@/components/select/userDialog.vue'
import { useProcess } from '@/hooks/useProcess'
import { useUser } from '@/hooks/useUser'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import baseService from '@/service/baseService'
import { formatValue } from '@/utils/utils'
import budgetChangeCreate from '@/views/service/budget/changes/components/budgetChangeCreate/index.vue'
import budgetChangeHistory from '@/views/service/budget/changes/components/budgetChangeHistory/index.vue'
import { GlobalInfo } from '@/views/service/lkyptzl/interface'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type Node from 'element-plus/es/el-tree/src/model/node'
import { computed, defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { VXETable } from 'vxe-table'
import { Project, PublicCode, PublicParams, RowVo, Tree } from './interface'
import { useGuide } from '@/hooks/useGuide'

const handleError = (error: Error, message = '操作失败'): void => {
  ElMessage({
    message: `${message}:${error.message}`,
    type: 'error',
    duration: 5000
  })
}

type ProjectChangeMode = 'create' | 'edit' | 'view'

const PROJECT_ADJUSTMENT_TAB = '2'
const ANNUAL_BUDGET_ADJUSTMENT_TAB = '0'
const SCALE_PACKAGE_ADJUSTMENT_TAB = '1'
const PROJECT_CHANGE_PERMISSION_CODES = ['CREATE_CART', 'EDIT_CART', 'VIEW_CART', 'DELETE_CART']
const PROJECT_CHANGE_EDITABLE_COMPONENTS = ['xmbgxx']
const PROJECT_CHANGE_STATUS_NAMES: Record<string, string> = {
  Q00: '需求草稿',
  Q01: '审批驳回',
  A01: '待联合会审',
  Q02: '会审驳回',
  A03: '会审通过',
  A10: '评审意见上传',
  '300': '批复意见上传',
  '310': '发展合规审核中',
  '301': '发展合规审核驳回',
  B99: '变更完成'
}
const PROJECT_CHANGE_EDITABLE_STATUSES = ['Q00', 'Q01', 'Q02', '301']
const PROJECT_CHANGE_DELETABLE_STATUSES = PROJECT_CHANGE_EDITABLE_STATUSES
const PROJECT_CHANGE_CREATABLE_STATUSES = ['', 'B99']
const getProjectChangeStatusText = (statuses: string[]) => statuses.map((status) => PROJECT_CHANGE_STATUS_NAMES[status] || '空状态').join('、')
const PROJECT_CHANGE_EDITABLE_STATUS_TEXT = getProjectChangeStatusText(PROJECT_CHANGE_EDITABLE_STATUSES)
const PROJECT_CHANGE_CREATABLE_STATUS_TEXT = getProjectChangeStatusText(PROJECT_CHANGE_CREATABLE_STATUSES)
const PROJECT_CHANGE_DELETABLE_STATUS_TEXT = getProjectChangeStatusText(PROJECT_CHANGE_DELETABLE_STATUSES)

export default defineComponent({
  name: '/service/budget/changes/index',
  components: {
    userDialog,
    splitpane,
    Grid,
    ReMultipleText,
    budgetChangeCreate,
    budgetChangeHistory,
    CentralizedModification,
    HelpModal,
    ToolbarButtons,
    GridItem
  },
  setup() {
    const store = useStore()
    const sfgmb = ref(ANNUAL_BUDGET_ADJUSTMENT_TAB)
    const route = useRoute()
    const isShowPage = ref<boolean>(false)
    const currentKey = ref<string>(new Date().getFullYear().toString())
    const settingLR: ContextProps = reactive({
      minPercent: 15,
      defaultPercent: 15,
      split: 'vertical'
    })
    const processData = reactive({
      isShowDialog: false,
      compName: null,
      id: ''
    })

    const isProjectAdjustmentTab = computed(() => sfgmb.value === PROJECT_ADJUSTMENT_TAB)
    const isShowBtn = computed(() => sfgmb.value === SCALE_PACKAGE_ADJUSTMENT_TAB)
    const latestChangeStatusField = computed(() => (isProjectAdjustmentTab.value ? 'subFlowStatusName' : 'auditStatusMc'))
    const getBackendSfgmb = () => (isProjectAdjustmentTab.value ? '0' : sfgmb.value)
    const checkboxConfig = computed(() => {
      return isProjectAdjustmentTab.value
        ? { highlight: false }
        : {
            trigger: 'row',
            highlight: true
          }
    })
    const radioConfig = computed(() => {
      return isProjectAdjustmentTab.value
        ? { highlight: true }
        : {
            highlight: false
          }
    })
    const hasProjectChangePermission = computed(() => {
      const permissions = (store.state.permissions || []) as string[]
      return PROJECT_CHANGE_PERMISSION_CODES.some((permission) => permissions.includes(permission))
    })

    const { startGuide } = useGuide({
      moduleKey: 'changes',
      tragetSelector: '.toolbar-guide-icon',
      onKnow: () => {},
      onNoMoreRemind: () => {}
    })

    const isProvinceSb = ref('')
    const treeRef = ref()
    const helpModalRef = ref()
    const tableData = ref<RowVo[]>([])
    const ysbgSwitchType = ref<any>(null)
    const ysbgSwitch = ref<string>('')
    const isIndeterminate = ref<boolean>(false)
    const loading = ref<boolean>(false)
    const error = ref<string | null>(null)
    const defaultProps = reactive({
      children: 'children',
      label: 'name',
      isLeaf: 'leaf',
      id: 'id'
    })
    const wfParam = ref<WFParam>({
      XMIDS: '',
      FQBM: '',
      FQZZ: ''
    })
    const publicCodeList = reactive<any>({
      XMXZ: [],
      ['ZLYS_XMJHLX']: [],
      ['YSBG_FLOW_STATUS']: [],
      ['ZLYS_YSBG_STATUS']: [],
      ['GWXMFL']: [],
      ['ZLYS_SENDSAP_TYPE']: [],
      ['YSBG_TZSY']: []
    })
    const searchList = reactive<{
      yjdwList: PublicCode[]
      ejdwList: PublicCode[]
      yjflList: PublicCode[]
      ejflList: PublicCode[]
      sjflList: PublicCode[]
    }>({
      yjdwList: [],
      ejdwList: [],
      yjflList: [],
      ejflList: [],
      sjflList: []
    })
    const userDialogRef = ref()
    const budgetChangeHistoryRef = ref()
    const tableRef = ref()
    const searchRef = ref()
    const budgetChangeCreateRef = ref()
    const projectChangeFormRef = ref()
    const projectChangeFormFlag = ref<'EDIT' | 'VIEW'>('EDIT')
    const projectChangeFormMode = ref<ProjectChangeMode>('edit')
    const projectChangeFormData = ref<any>({})
    const publicParams = reactive<PublicParams>({
      bmId: '',
      nd: '',
      xmlxId: '',
      dwId: '',
      userId: '',
      specialorgcode: '',
      fqzz: '',
      spRoleId: ''
    })

    const searchForm = reactive<Project>({})

    const limitNum = ref(50)

    const childrenCurrentPage = ref<number>(1)
    const childrenPageSize = ref<number>(20)
    const checkedData = ref<RowVo[]>([])

    const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

    const totalProjectsCount = ref<number>(0)

    const getSearchCodes = () => {
      let xmbms: string[] = []
      let gwxmbms: string[] = []
      if (searchForm.xmbms && !Array.isArray(searchForm.xmbms)) {
        xmbms = searchForm.xmbms.split(',')
      }
      if (searchForm.gwxmbms && !Array.isArray(searchForm.gwxmbms)) {
        gwxmbms = searchForm.gwxmbms.split(',')
      }
      return {
        xmbms,
        gwxmbms
      }
    }

    const getSearchParams = (page?: number, pageSize?: number) => {
      const { xmbms, gwxmbms } = getSearchCodes()
      const params: Project = {
        ...searchForm,
        gwxmbms,
        xmbms,
        ...publicParams
      }
      if (page) params.page = page
      if (pageSize) params.limit = pageSize
      if (isProjectAdjustmentTab.value) {
        params.sfgmb = 0
        delete params.bgStatus
      } else {
        params.sfgmb = sfgmb.value
      }
      return params
    }

    const apiService = {
      async getProjectsWithGroups(page: number, pageSize: number): Promise<{ data: RowVo[]; total: number }> {
        try {
          const requestApi = isProjectAdjustmentTab.value ? getProjectAdjustmentPage : searchData
          const groupsRes = await requestApi(getSearchParams(page, pageSize))
          let totalProjects = groupsRes.data.total || 0
          return {
            data: groupsRes.data.records,
            total: totalProjects
          }
        } catch (error) {
          console.error('获取项目分组及子项目数据失败', error)
          throw new Error('获取项目分组及子项目数据失败')
        }
      },
      async exportDataPages(): Promise<boolean> {
        try {
          const res = await exportData(getSearchParams())
          const blob = res
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          // 获取文件名
          let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
          dom.download = `${decodeURI(decodeURI(filename))}`
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
          return true
        } catch (error) {
          throw new Error('导出数据失败')
        }
      }
    }

    const checkChangeHandle = ({ records }: any) => {
      checkedData.value = records
    }
    const checkChangeAllHandle = ({ records }: any) => {
      checkedData.value = records
    }

    const getSelectedRecords = (): RowVo[] => {
      const $table = tableRef.value
      if (!$table) return []
      if (isProjectAdjustmentTab.value) {
        const record: RowVo = $table.getRadioRecord()
        return record ? [record] : []
      }
      return $table.getCheckboxRecords()
    }

    const clearTableSelection = async () => {
      if (!tableRef.value) return
      await tableRef.value.clearCheckboxRow()
      await tableRef.value.clearRadioRow()
    }

    const radioChangeHandle = async ({ row }: any) => {
      await tableRef.value.clearCheckboxRow()
      checkedData.value = row ? [row] : []
    }

    const formatterHandle = ({ cellValue }: any) => {
      if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
      return formatValue(cellValue, 6)
    }

    const latestChangeStatusFormatter = ({ row, cellValue }: any) => {
      if (cellValue) return cellValue
      if (isProjectAdjustmentTab.value) return PROJECT_CHANGE_STATUS_NAMES[row.subFlowStatus] || '-'
      return '-'
    }

    const tzsyFormatter = ({ cellValue }: any) => {
      if (cellValue === undefined || cellValue === null || cellValue === '') return '-'
      const item = (publicCodeList['YSBG_TZSY'] || []).find((code: any) => code.code === cellValue)
      return item ? item.name : cellValue
    }

    const sfcjpsyjFormatter = ({ cellValue }: any) => {
      if (cellValue === undefined || cellValue === null || cellValue === '') return '-'
      return String(cellValue) === '1' ? '是' : '否'
    }

    const cellClickHandle = async ({ row, column }: any) => {
      if (column.type === 'checkbox' || column.type === 'radio') return
      checkedData.value = []
      if (isProjectAdjustmentTab.value) {
        await clearTableSelection()
        await tableRef.value.setRadioRow(row)
      } else {
        await clearTableSelection()
        tableRef.value.setCheckboxRow(row, true)
      }
      checkedData.value.push(row)
    }

    const loadData = async (): Promise<void> => {
      try {
        tableData.value = []
        loading.value = true
        error.value = null
        checkedData.value = []
        await clearTableSelection()
        const { data, total } = await apiService.getProjectsWithGroups(childrenCurrentPage.value, childrenPageSize.value)
        tableData.value = data
        totalProjectsCount.value = total
      } catch (e) {
        handleError(e as Error, '加载项目数据失败')
      } finally {
        loading.value = false
      }
    }

    const totalProjects = computed<number>(() => {
      return totalProjectsCount.value
    })

    const getPublicParamsList = async () => {
      try {
        const res = await getPublicCodeList({
          codes: ['ZLYS_XMJHLX', 'ZLYS_YSBG_STATUS', 'XMXZ', 'GWXMFL', 'ZLYS_SENDSAP_TYPE', 'YSBG_TZSY', 'YSBG_FLOW_STATUS']
        })
        if (res.success) {
          for (const key in res.data) {
            publicCodeList[key] = res.data[key]
          }
        } else {
          throw new Error(res.msg)
        }
      } catch (e) {
        handleError(e as Error, '公共代码初始化数据失败')
      }
    }

    const handleChildrenSizeChange = (val: number): void => {
      try {
        if (val > 0) {
          childrenPageSize.value = val
          childrenCurrentPage.value = 1
          loadData()
        } else {
          throw new Error('页面大小必须大于0')
        }
      } catch (e) {
        handleError(e as Error, '更改子项目页面大小失败')
      }
    }

    const handleChildrenCurrentChange = (val: number): void => {
      try {
        if (val > 0) {
          childrenCurrentPage.value = val
          loadData()
        } else {
          throw new Error('页码必须大于0')
        }
      } catch (e) {
        handleError(e as Error, '更改子项目页码失败')
      }
    }

    watch([childrenCurrentPage, childrenPageSize], () => {
      error.value = null
    })

    const handleNodeClick = (node: any): void => {
      checkedData.value = []
      publicParams.nd = node.nd
      publicParams.xmlxId = node.id
      currentKey.value = node.id
      loadData()
    }

    const loadTreeData = async (node: Node, resolve: (data: Tree[]) => void) => {
      try {
        let parentId = -1
        let nd = ''
        if (node.level === 0) {
          nd = ''
          parentId = -1
        } else {
          parentId = node.data.id
          nd = node.data.nd
        }
        const res = await getProtypeYearTreeB({
          nd: nd || publicParams.nd,
          bmId: publicParams.bmId,
          parentId
        })
        if (!res.success || !res.data) {
          throw new Error(res.msg || '请求的数据为空!')
        }
        resolve(res.data)
      } catch (e) {
        handleError(e as Error, '加载项目数据失败')
      }
    }

    const getRoleHandle = async () => {
      publicParams.bmId = userDialogRef.value.specialorgid
      publicParams.dwId = userDialogRef.value.userMsg.org_id
      publicParams.specialorgcode = userDialogRef.value.userMsg.specialorgcode
      publicParams.userId = userDialogRef.value.userMsg.id
      publicParams.spRoleId = userDialogRef.value.spRoleId
      const isQuery = userDialogRef.value.isQuery
      if (isQuery) {
        isShowPage.value = true
        await initPublicParams()
      }
    }

    const initPublicParams = async () => {
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userDialogRef.value.specialorgid}`)
      if (flagData.success) {
        publicParams.fqzz = flagData.data
      }
      const yjdwRes = await initParamsData('/bizOrgTree/getYjdw', {
        ...publicParams
      })
      searchList.yjdwList = yjdwRes
      if (treeRef.value) {
        await nextTick(() => {
          const year = new Date().getFullYear().toString()
          treeRef.value.setCurrentKey(year)
          publicParams.nd = year
          publicParams.xmlxId = year
          loadData()
        })
      }
      startGuide()
    }

    const selectRolesHandle = () => {
      userDialogRef.value.getUser()
    }

    const initParamsData = async (method: any, params: any): Promise<any[]> => {
      const res = await baseService.post(method, params)
      if (res.success) {
        return res.data
      } else {
        ElMessage.error(res.msg)
        return []
      }
    }
    const resetHandle = () => {
      searchRef.value.resetFields()
      searchList.ejflList = []
      searchList.sjflList = []
      searchList.ejdwList = []
      loadData()
    }

    const handleFieldChange = async (value: string, prop: string) => {
      if (prop === 'yjdw') {
        searchList.ejdwList = []
        searchForm['ejdw'] = ''
        if (value) {
          const ejdwData = await baseService.post('/bizOrgTree/getEjdw', {
            YJDW: value,
            ...publicParams,
            parentCode: value
          })
          searchList.ejdwList = ejdwData.data || []
        }
      }

      if (prop === 'yjfl') {
        searchList.ejflList = []
        searchList.sjflList = []
        searchForm['ejfl'] = ''
        searchForm['sjfl'] = ''
        if (value) {
          const ejflData = await baseService.post('/commonCode/getCommonCodeByParentCode', {
            code: 'GWXMFL',
            ...publicParams,
            parentCode: value
          })
          searchList.ejflList = ejflData.data || []
        }
      }

      if (prop === 'ejfl') {
        searchList.sjflList = []
        searchForm['sjfl'] = ''
        if (value) {
          const sjflData = await baseService.post('/commonCode/getCommonCodeByParentCode', {
            code: 'GWXMFL',
            ...publicParams,
            parentCode: value
          })
          searchList.sjflList = sjflData.data || []
        }
      }
    }

    const getLatestChangeStatus = (record: RowVo) => {
      if (isProjectAdjustmentTab.value) {
        const status = record.subFlowStatus || ''
        return {
          status,
          statusName: record.subFlowStatusName || PROJECT_CHANGE_STATUS_NAMES[status] || '-'
        }
      }
      return {
        status: record.auditStatus || '',
        statusName: record.auditStatusMc || '-'
      }
    }

    const checkData = (records: RowVo[], tip = '创建变更申请单!', projectChangeAllowedStatuses = PROJECT_CHANGE_EDITABLE_STATUSES): boolean => {
      if (publicParams.nd.toString() !== new Date().getFullYear().toString()) {
        ElMessage({
          message: '存在非今年的项目，不能' + tip,
          type: 'warning'
        })
        return false
      }
      const status = ['0', '1', '3', '4', '10']
      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const latestChangeStatus = getLatestChangeStatus(record)
        const allowedStatuses = isProjectAdjustmentTab.value ? projectChangeAllowedStatuses : status
        if (!allowedStatuses.includes(latestChangeStatus.status)) {
          const actionName = tip.replace(/!$/, '')
          ElMessage({
            message: isProjectAdjustmentTab.value
              ? `项目:(${record.xmmc}):最新变更状态为:(${latestChangeStatus.statusName})，仅${PROJECT_CHANGE_EDITABLE_STATUS_TEXT}状态可${actionName}!`
              : `项目:(${record.xmmc}):最新变更状态为:(${latestChangeStatus.statusName})不能` + tip,
            type: 'warning'
          })
          return false
        }
      }
      return true
    }

    const checkProjectChangeStatus = (
      records: RowVo[],
      actionName: string,
      allowedStatuses = PROJECT_CHANGE_EDITABLE_STATUSES,
      allowedStatusText = PROJECT_CHANGE_EDITABLE_STATUS_TEXT
    ): boolean => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const latestChangeStatus = getLatestChangeStatus(record)
        if (!allowedStatuses.includes(latestChangeStatus.status)) {
          ElMessage({
            message: `项目:(${record.xmmc}):最新变更状态为:(${latestChangeStatus.statusName})，仅${allowedStatusText}状态可${actionName}!`,
            type: 'warning'
          })
          return false
        }
      }
      return true
    }

    const checkProjectChangeViewStatus = (records: RowVo[]): boolean => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const latestChangeStatus = getLatestChangeStatus(record)
        if (!latestChangeStatus.status) {
          ElMessage({
            message: `项目:(${record.xmmc}):最新变更状态为空，不能查看变更申请单!`,
            type: 'warning'
          })
          return false
        }
      }
      return true
    }

    const getSingleSelectedRecord = (): RowVo | null => {
      const $table = tableRef.value
      if (!$table) return null
      if (isProjectAdjustmentTab.value) {
        const record: RowVo = $table.getRadioRecord()
        if (!record) {
          ElMessage({
            message: '请选择一个项目',
            type: 'warning'
          })
          return null
        }
        return record
      }
      const records: RowVo[] = $table.getCheckboxRecords()
      if (records.length !== 1) {
        ElMessage({
          message: '请选择一个项目',
          type: 'warning'
        })
        return null
      }
      return records[0]
    }

    const hasProjectChangeOrder = (record: RowVo, actionName: string): boolean => {
      if (record.bgid) return true
      ElMessage.warning(`当前项目暂无变更申请单，不能${actionName}!`)
      return false
    }

    const openBudgetChangeCreate = (records: RowVo[], maxLimitNum = limitNum.value) => {
      budgetChangeCreateRef.value.acceptParams({
        selectedRowData: records,
        limitNum: maxLimitNum,
        publicParams: publicParams,
        searchPage: loadData,
        sfgmb: sfgmb.value
      })
    }

    const getProjectChangeFormData = (record: RowVo, mode: ProjectChangeMode) => {
      const formData: any = {
        ...record,
        id: record.xmid,
        xmlx: (record as any).xmlx || record.proType || publicParams.xmlxId
      }
      // 创建为全新变更申请单，不携带历史变更id，避免覆盖已完成的变更单
      if (mode === 'create' || !record.bgid) {
        delete formData.bgid
      }
      return formData
    }

    const openProjectChangeForm = (mode: ProjectChangeMode, record: RowVo) => {
      projectChangeFormData.value = getProjectChangeFormData(record, mode)
      projectChangeFormMode.value = mode
      projectChangeFormFlag.value = mode === 'view' ? 'VIEW' : 'EDIT'
      nextTick(() => {
        projectChangeFormRef.value.isShowModal = true
      })
    }

    // 创建变更申请单：无需预先拉取变更信息，直接打开空白变更单
    const handleCreateProjectChange = () => {
      const record = getSingleSelectedRecord()
      if (!record || !checkProjectChangeStatus([record], '创建变更申请单', PROJECT_CHANGE_CREATABLE_STATUSES, PROJECT_CHANGE_CREATABLE_STATUS_TEXT))
        return
      openProjectChangeForm('create', record)
    }

    // 编辑/查看变更申请单：变更信息由变更页签调用 /sjtc/xmysbg/getBgInfo 获取
    const handleEditProjectChange = () => {
      const record = getSingleSelectedRecord()
      if (!record || !checkProjectChangeStatus([record], '编辑变更申请单')) return
      openProjectChangeForm('edit', record)
    }

    const handleViewProjectChange = () => {
      const record = getSingleSelectedRecord()
      if (!record || !checkProjectChangeViewStatus([record])) return
      openProjectChangeForm('view', record)
    }

    const handleDeleteProjectChange = async () => {
      const record = getSingleSelectedRecord()
      if (!record || !checkProjectChangeStatus([record], '删除变更申请单', PROJECT_CHANGE_DELETABLE_STATUSES, PROJECT_CHANGE_DELETABLE_STATUS_TEXT))
        return
      try {
        const type = await VXETable.modal.confirm('是否确定删除变更申请单？', '提示', {
          status: 'warning',
          confirmButtonText: '是',
          cancelButtonText: '否'
        })
        if (type !== 'confirm') return
        loading.value = true
        const res = await deleteYsbg({
          ...publicParams,
          ids: [record.xmid],
          bgids: record.bgid ? [record.bgid] : []
        })
        if (!res.success) throw new Error(res.msg)
        ElMessage.success('删除成功!')
        await loadData()
      } catch (e) {
        handleError(e as Error, '删除变更申请单失败')
      } finally {
        loading.value = false
      }
    }

    // 年度预算调整 / 规模包调整：清除老的变更申请单
    const handleCleanOldSqd = async () => {
      try {
        const records: RowVo[] = getSelectedRecords()
        if (records.length === 0) {
          ElMessage({
            message: '请至少选择一个项目',
            type: 'warning'
          })
          return
        }
        try {
          await ElMessageBox.confirm(`确定要删除选中的${records.length} 个项目的变更申请单吗?`, `确认操作`, {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
        } catch (e) {
          return
        }
        loading.value = true
        const res = await cleanOldSqd({ xmid: records.map((item) => item.xmid).join(',') })
        if (!res.success) throw new Error(res.msg)
        ElMessage.success('删除成功!')
        await loadData()
      } catch (e) {
        handleError(e as Error, '删除变更申请单失败')
      } finally {
        loading.value = false
      }
    }

    const handleCreateChangeCart = async () => {
      try {
        // 获取数据
        const $table = tableRef.value
        if ($table) {
          const records: RowVo[] = getSelectedRecords()
          if (records.length === 0) {
            ElMessage({
              message: '请至少选择一个项目',
              type: 'warning'
            })
            return
          }
          if (records.length > limitNum.value) {
            ElMessage({
              message: `变更申请单创建项目数量应小于${limitNum.value}条`,
              type: 'warning'
            })
            return
          }
          try {
            const flag = checkData(records)
            if (flag) {
              await ElMessageBox.confirm(`确定要对选中的${records.length} 个项目进行变更申请单创建吗?`, `确认操作`, {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              })
              openBudgetChangeCreate(records)
            }
          } catch (e) {
            console.log('用户取消了')
          }
        }
      } catch (e) {
        handleError(e as Error, '提交操作失败')
        loading.value = false
      }
    }

    const exportHandle = async () => {
      try {
        loading.value = true
        error.value = null
        const flag = await apiService.exportDataPages()
        if (flag) loading.value = false
      } catch (e) {
        handleError(e as Error, '导出数据失败')
      }
    }

    // 项目调整提交前判断是否可直接纳会：命中可纳会集合(1)则直接纳会，否则返回 false 走原有工作流
    const handleProjectAdjustmentNrhy = async (records: RowVo[]): Promise<boolean> => {
      const ids = records.map((item) => item.xmid)
      const res = await canBeNrhy(ids)
      if (!res.success) throw new Error(res.msg)
      const canNrhyIds = res.data?.['1'] || []
      const targetIds = ids.filter((id) => canNrhyIds.includes(id))
      if (targetIds.length === 0) return false
      try {
        await ElMessageBox.confirm(`确定要对选中的${targetIds.length} 个项目进行直接纳会吗?`, `确认操作`, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (e) {
        // 用户取消纳会，已在可纳会集合中不再走原有工作流
        return true
      }
      try {
        loading.value = true
        const nrhyRes = await nrhy(targetIds)
        if (!nrhyRes.success) throw new Error(nrhyRes.msg)
        ElMessage.success('纳会成功')
        await loadData()
      } finally {
        loading.value = false
      }
      return true
    }

    const setProvinceApprovalFlag = async (record: RowVo) => {
      const resultEjflData = await getParamConfig('YSBG_WXSGSSP')
      const ejflData = resultEjflData.data
      const startEjfl = (record.ejfl || '').substr(0, 2)
      isProvinceSb.value = ejflData.indexOf(startEjfl) != -1 ? '1' : '0'
      return ejflData
    }

    const submitSelectedRecords = async (records: RowVo[]) => {
      try {
        await ElMessageBox.confirm(`确定要对选中的${records.length} 个项目进行提交审核吗?`, `确认操作`, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        try {
          // 调用提交接口
          const wfUserInfo: WFUserInfo = {
            userId: store.getters.getUserMsg.id,
            spOrgId: publicParams.bmId || '',
            spRoleId: publicParams.spRoleId || ''
          }
          let xmIds = records.map((item) => item.xmid).join(',')
          const getDataRes = await getBqshFlag(xmIds, publicParams.dwId || '')
          if (getDataRes.success) {
            wfParam.value.XMIDS = xmIds || ''
            wfParam.value.FQZZ = publicParams.fqzz //市县 CITY OR COUNTY
            wfParam.value.SFGMB = getBackendSfgmb()
            wfParam.value.DWLX = getDataRes.data.DWLX || ''
            wfParam.value.XMLX = isProvinceSb.value
            wfParam.value.FQBM = publicParams.specialorgcode === 'BM_CWZC' ? 'CWB' : 'YWB' //CWB
            submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_MISXMYSBGLC', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
          } else {
            throw new Error(getDataRes.msg)
          }
        } catch (e) {
          handleError(e as Error, '提交失败')
        }
      } catch (e) {
        console.log('用户取消了')
      }
    }

    const handleSubmit = async () => {
      try {
        // 获取数据
        const $table = tableRef.value
        if (!$table) return
        const records: RowVo[] = getSelectedRecords()
        if (records.length === 0) {
          ElMessage({
            message: '请至少选择一个项目',
            type: 'warning'
          })
          return
        }
        checkedData.value = records
        if (isProjectAdjustmentTab.value) {
          if (!checkProjectChangeStatus(records, '提交审核')) return
          await setProvinceApprovalFlag(records[0])
          // 项目调整为单选，提交前判断是否可以直接纳会
          const nrhyHandled = await handleProjectAdjustmentNrhy(records)
          if (nrhyHandled) return
          await submitSelectedRecords(records)
          return
        }
        // 获取数据
        const multipleParams = await getParamValueMulti([
          'YSBZ_SWITCH',
          'YSBZ_SWITCH_TYPE',
          'YSSF_SWITCH',
          'YSSF_SWITCH_TYPE',
          'YSBG_SWITCH',
          'YSBG_SWITCH_TYPE',
          'YSSF_ADDTYPE'
        ])
        if (multipleParams.success) {
          const data = multipleParams.data
          ysbgSwitch.value = data['YSBG_SWITCH']
          if (data['YSBG_SWITCH_TYPE'] === 'ALL') {
            ysbgSwitchType.value = data['YSBG_SWITCH_TYPE']
          } else {
            let type_arr = data['YSBG_SWITCH_TYPE'].split(',')
            let dict = []
            for (let index = 0; index < type_arr.length; index++) {
              if (type_arr[index].split('@').length === 2) {
                dict[type_arr[index].split('@')[0]] = type_arr[index].split('@')[1]
              }
            }
            ysbgSwitchType.value = dict
          }
        }
        if ($table) {
          // const isCurNd = rec
          if (records.length > limitNum.value) {
            ElMessage({
              message: `提交审核的项目数量应小于${limitNum.value}条`,
              type: 'warning'
            })
            return
          }
          const ejflData = await setProvinceApprovalFlag(records[0])
          for (var i = 0; i < records.length; i++) {
            if (i != 0) {
              if (ejflData.indexOf((records[i].ejfl || '').substr(0, 2)) != -1) {
                if (isProvinceSb.value != '1') {
                  ElMessage({
                    message: `以下项目存在走省公司审批和只走地市公司审批，请分开提交！`,
                    type: 'warning'
                  })
                  return
                }
              } else {
                if (isProvinceSb.value != '0') {
                  ElMessage({
                    message: `以下项目存在走省公司审批和只走地市公司审批，请分开提交！`,
                    type: 'warning'
                  })
                  return
                }
              }
            }
            // 判断项目关闭流程中，不可做预算变更
            if (records[i].gbdkShStatus === '01') {
              ElMessage({
                message: `国网项目编码为${records[i].gwxmbm}的项目处于项目关闭流程中，不可做预算变更!`,
                type: 'warning'
              })
              return
            }
            // 判断成本中心变更审核中
            if (records[i].auditStatusApplyCenter && records[i].auditStatusApplyCenter === '2') {
              ElMessage({
                message: `国网项目编码为${records[i].gwxmbm}的项目处于成本中心变更审核中，不可做预算变更!`,
                type: 'warning'
              })
              return
            }

            // 预算编制功能关闭;（规模包调整维持原状，不做此拦截）
            if (sfgmb.value !== SCALE_PACKAGE_ADJUSTMENT_TAB && ysbgSwitch.value === '02') {
              const proType = records[i].proType
              const switch_type = ysbgSwitchType.value[proType]
              if (ysbgSwitchType.value === 'ALL') {
                ElMessage({
                  message: `项目预算变更功能已关闭，不能释放！`,
                  type: 'warning'
                })
                return
              }
              if (switch_type != undefined) {
                ElMessage({
                  message: `${switch_type}的项目预算变更功能已关闭，不能释放！`,
                  type: 'warning'
                })
                return
              }
            }
            if (publicParams.nd.toString() !== new Date().getFullYear().toString()) {
              ElMessage({
                message: `存在非今年的项目，不能做预算变更`,
                type: 'warning'
              })
              return
            }
            // if (records[i].sfzt === '0' || records[i].sfzt === '3') {
            //   ElMessage({
            //     message: `已释放或取消释放中的项目不可提交审核！`,
            //     type: 'warning'
            //   })
            //   return
            // }
            const status = isProjectAdjustmentTab.value ? PROJECT_CHANGE_EDITABLE_STATUSES : ['1', '3', '10']
            const latestChangeStatus = getLatestChangeStatus(records[i])
            if (!status.includes(latestChangeStatus.status)) {
              ElMessage({
                message: isProjectAdjustmentTab.value
                  ? `项目:(${records[i].xmmc}):最新变更状态为:(${latestChangeStatus.statusName})，仅${PROJECT_CHANGE_EDITABLE_STATUS_TEXT}状态可提交审核!`
                  : `项目:(${records[i].xmmc}):最新变更状态为:(${latestChangeStatus.statusName})不能提交审核!`,
                type: 'warning'
              })
              return false
            }
            if (isProjectAdjustmentTab.value && !hasProjectChangeOrder(records[i], '提交审核')) {
              return
            }
            if (records[i].amount != records[i].bgAmount && !records[i].attachName) {
              ElMessage({
                message: `存在变更项目总预算的记录，请先上传附件再提交审核！`,
                type: 'warning'
              })
              return
            }
          }
          await submitSelectedRecords(records)
        }
      } catch (e) {
        handleError(e as Error, '提交操作失败')
        loading.value = false
      }
    }

    const modalLoading = ref(false)
    const modalformRef = ref()
    const isShowResetModal = ref(false)
    const modalForm = reactive({
      sendType: ''
    })
    const ids = ref<string[]>([])
    const modalFormRules = reactive({
      sendType: [{ required: true, message: '请选择补发类型', trigger: ['change'] }]
    })

    const handleResendSap = () => {
      try {
        // 获取数据
        const $table = tableRef.value
        if ($table) {
          const records: RowVo[] = $table.getCheckboxRecords()
          if (records.length === 0) {
            ElMessage.warning('请至少选择一条数据进行操作!')
            return
          }
          isShowResetModal.value = true
          ids.value = records.map((item) => item.xmid)
        }
      } catch (e) {
        handleError(e as Error, '推送SAP失败')
      }
    }

    const handleResendJhxt = async () => {
      try {
        // 获取数据
        const $table = tableRef.value
        if ($table) {
          const records: RowVo[] = $table.getCheckboxRecords()
          if (records.length === 0) {
            ElMessage.warning('请至少选择一条数据进行操作!')
            return
          }
          const ids = records.map((item) => item.xmid)
          const type = await VXETable.modal.confirm('确认是否推送?', '提示', {
            confirmButtonText: '是',
            cancelButtonText: '否'
          })
          if (type === 'confirm') {
            loading.value = true
            const res = await resendData({
              ids: ids
            })
            if (res.success) {
              ElMessage.success('推送成功！')
              // 刷新页面
              loadData()
            } else {
              throw new Error(res.msg)
            }
          }
        }
      } catch (e) {
        handleError(e as Error, '推送计划系统失败')
      }
    }

    const reSendToSapHandle = async () => {
      if (modalformRef.value) await modalformRef.value.validate()
      try {
        const type = await VXETable.modal.confirm('确认是否推送?', '提示', {
          confirmButtonText: '是',
          cancelButtonText: '否'
        })
        if (type === 'confirm') {
          modalLoading.value = true
          const res = await resendSap({
            ids: ids.value,
            sendType: modalForm.sendType
          })
          if (res.success) {
            ElMessage.success('推送成功！')
            closeResendHandle()
            // 刷新页面
            loadData()
          } else {
            throw new Error(res.msg)
          }
        }
      } catch (e) {
        const error = e as Error
        ElMessage.error(error.message)
      } finally {
        modalLoading.value = false
      }
    }
    const closeResendHandle = () => {
      isShowResetModal.value = false
      modalForm.sendType = ''
      ids.value = []
    }

    const handleHistroyView = () => {
      try {
        // 获取数据
        const $table = tableRef.value
        if ($table) {
          const records: RowVo[] = $table.getCheckboxRecords()
          if (records.length !== 1) {
            ElMessage({
              message: '请选择一个项目',
              type: 'warning'
            })
            return
          }
          budgetChangeHistoryRef.value.acceptParams({
            selectedRowData: records,
            limitNum: limitNum.value,
            publicParams: publicParams,
            searchPage: loadData,
            sfgmb: sfgmb.value
          })
        }
      } catch (e) {
        handleError(e as Error, '查看历史记录失败')
      }
    }

    const submitWFCallback = async (nextPersonAndPath: string) => {
      try {
        loading.value = true
        let spfrom = {
          userId: store.getters.getUserMsg.id,
          spOrgId: publicParams.bmId || '',
          spRoleId: publicParams.spRoleId,
          wfCode: 'WF_MISXMYSBGLC',
          wfData: wfParam.value,
          bgData: checkedData.value,
          sfgmb: getBackendSfgmb(),
          nextPersonAndPath: nextPersonAndPath
        }
        const res = await submitWf({
          ...spfrom
        })
        if (res.success) {
          loading.value = false
          ElMessage.success('提交成功')
          // 刷新页面
          loadData()
        } else {
          throw new Error(res.msg)
        }
      } catch (e) {
        handleError(e as Error, '提交工作流操作失败')
      } finally {
        loading.value = false
      }
    }

    const handleImport = async () => {
      try {
        if (publicParams.nd.toString() !== new Date().getFullYear().toString()) {
          ElMessage({
            message: '只能本年度的预算调整才能导入！',
            type: 'warning'
          })
          return
        }
        const types = ['xls', 'xlsx']
        const $table = tableRef.value
        if ($table) {
          const { files } = await $table.readFile({ multiple: false })
          const formData = new FormData()
          Array.from(files).map((file: any) => {
            const ns = file.name.split('.')
            const type = ns[ns.length - 1].toLowerCase()
            if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
            formData.append('file', file)
          })
          loading.value = true
          //   上传文件
          const res = await baseService.post(`/xmysbg/importYsbg?sfgmb=${sfgmb.value}`, formData)
          if (res.success) {
            ElMessage.success('导入成功!')
            await loadData()
          } else {
            throw new Error(res.msg)
          }
        }
      } catch (e) {
        handleError(e as Error, '导入失败')
      } finally {
        loading.value = false
      }
    }

    const handleTabClick = (flag: string) => {
      if (sfgmb.value === flag) return
      sfgmb.value = flag
      checkedData.value = []
      childrenCurrentPage.value = 1
      clearTableSelection()
      loadData()
    }

    const handleViewProcess = async () => {
      try {
        // 获取数据
        const $table = tableRef.value
        if ($table) {
          const records: RowVo[] = getSelectedRecords()
          if (records.length !== 1) {
            ElMessage({
              message: '请选择一个项目',
              type: 'warning'
            })
            return
          }
          const resultData = records.map((item) => {
            return {
              ...item,
              id: item.xmid
            }
          })
          await useProcess(resultData, processData)
        }
      } catch (e) {
        handleError(e as Error, '查看流程履历失败')
      }
    }

    onMounted(async () => {
      try {
        // 获取公共代码
        await getPublicParamsList()
        // 设置限制提交数量
        let limitNumData = await baseService.get('/workflow/declare/getParamValue?paramKey=XMYSBG_SUBMIT_NUM')
        if (limitNumData.success) {
          limitNum.value = limitNumData.data || 50
        } else {
          throw new Error(limitNumData.msg)
        }
        const isRoel = await useUser('getCbGlobalInfo', store as any)
        if (isRoel && route.params.formJsc) {
          const cbGlobalInfo = store.getters.getCbGlobalInfo as GlobalInfo
          publicParams.bmId = cbGlobalInfo.deptId
          publicParams.dwId = cbGlobalInfo.dwId
          publicParams.specialorgcode = cbGlobalInfo.specialorgcode
          publicParams.userId = store.getters.getUserMsg.id
          publicParams.spRoleId = cbGlobalInfo.spRoleId
          isShowPage.value = true
          await initPublicParams()
        } else {
          selectRolesHandle()
        }
      } catch (e) {
        handleError(e as Error, '初始化加载失败')
      }
    })

    const getHelpMessageHandle = () => {
      helpModalRef.value.showModal = true
    }

    return {
      sfgmb,
      PROJECT_ADJUSTMENT_TAB,
      ANNUAL_BUDGET_ADJUSTMENT_TAB,
      SCALE_PACKAGE_ADJUSTMENT_TAB,
      isProjectAdjustmentTab,
      latestChangeStatusField,
      latestChangeStatusFormatter,
      tzsyFormatter,
      sfcjpsyjFormatter,
      checkboxConfig,
      radioConfig,
      hasProjectChangePermission,
      PROJECT_CHANGE_EDITABLE_COMPONENTS,
      isShowResetModal,
      modalformRef,
      handleResendJhxt,
      modalLoading,
      modalForm,
      modalFormRules,
      reSendToSapHandle,
      closeResendHandle,
      handleResendSap,
      handleViewProcess,
      processData,
      currentKey,
      helpModalRef,
      getHelpMessageHandle,
      handleImport,
      handleTabClick,
      formatterHandle,
      handleSubmit,
      handleHistroyView,
      exportHandle,
      cellClickHandle,
      radioChangeHandle,
      handleCreateProjectChange,
      handleEditProjectChange,
      handleViewProjectChange,
      handleDeleteProjectChange,
      handleCleanOldSqd,
      handleCreateChangeCart,
      checkChangeHandle,
      checkChangeAllHandle,
      hasSelectedProjects,
      tableData,
      loadData,
      tableRef,
      handleFieldChange,
      searchList,
      searchRef,
      resetHandle,
      publicCodeList,
      settingLR,
      loadTreeData,
      getRoleHandle,
      isShowPage,
      userDialogRef,
      budgetChangeHistoryRef,
      budgetChangeCreateRef,
      projectChangeFormRef,
      projectChangeFormFlag,
      projectChangeFormMode,
      projectChangeFormData,
      defaultProps,
      handleNodeClick,
      isIndeterminate,
      childrenCurrentPage,
      childrenPageSize,
      loading,
      totalProjects,
      isShowBtn,
      error,
      handleChildrenSizeChange,
      handleChildrenCurrentChange,
      treeRef,
      searchForm
    }
  }
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>

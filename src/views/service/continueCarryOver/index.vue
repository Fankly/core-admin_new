<template>
  <div class="container" v-if="isShowPage" v-loading="loading" element-loading-text="正在加载...">
    <div class="header">
      <div class="header-actions">
        <div class="left">
          <el-dropdown class="drop-button" style="margin-right: 10px">
            <el-button v-permission="'ADD'" :disabled="loading || !isLeaf || !isDisabled" type="primary" plain>
              创建项目申请单
              <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleContinueCarryOver('1')">项目续建</el-dropdown-item>
                <el-dropdown-item @click="handleContinueCarryOver('2')">项目结转</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-permission="'EDIT'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleEditData">编 辑 </el-button>
          <el-button v-permission="'SUBMIT'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleSubmitData"
            >提 交
          </el-button>
          <el-button v-permission="'UPLOAD'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleUploadFile"
            >上传附件
          </el-button>
          <el-button v-permission="'DELETE'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleDeleteFile"
            >删除附件
          </el-button>
          <el-button v-permission="'IMPORT'" type="primary" plain :disabled="loading || !isLeaf || !isDisabled" @click="importDataHandle"
            >导 入
          </el-button>
          <el-button v-permission="'EXPORT'" :disabled="loading" type="primary" plain @click="exportHandle">导 出 </el-button>
          <el-button v-permission="'SENDSAP'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleSendSapData">
            发送预算至SAP
          </el-button>
          <el-button v-permission="'REJECT'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleRetractData"
            >删 除
          </el-button>
          <el-button v-permission="'LINKMATTER'" :disabled="loading || !isLeaf || hasSelectedProjects" type="primary" plain @click="handleLinkMatter"
            >关联事项
          </el-button>
          <el-button v-permission="'PROCESS'" :disabled="loading || hasSelectedProjects" type="primary" plain @click="handleViewProcess"
            >流程履历
          </el-button>
        </div>
        <div class="right">
          <div class="tool-button">
            <el-tooltip content="列设置" placement="top">
              <span @click="openColSetting" style="cursor: pointer; font-size: 18px" class="el-icon-s-operation"></span>
            </el-tooltip>
            <el-tooltip content="隐藏/展示查询" placement="top">
              <span style="cursor: pointer; font-size: 18px; margin: 0 10px" @click="handleIsShowSearch">
                <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
              </span>
            </el-tooltip>
            <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
          </div>
        </div>
      </div>
    </div>
    <div class="content">
      <SplitPanel :splitSet="settingLR">
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
            <div class="main-search" v-show="isShowSearch">
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
                  <GridItem>
                    <el-form-item prop="xmFlowStatus">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `项目流转状态` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select clearable collapse-tags v-model="searchForm.xmFlowStatus">
                          <el-option
                            v-for="item in publicCodeList['XM_FLOW_STATUS']"
                            :key="item.code"
                            :label="item.name"
                            :value="item.code"
                          ></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <div class="operation">
                      <el-button type="primary" size="mini" plain @click="loadData">查 询</el-button>
                      <el-button size="mini" plain @click="resetHandle">重 置</el-button>
                    </div>
                  </GridItem>
                </Grid>
              </el-form>
            </div>
            <div class="custom-tabs">
              <div class="tab-item" :class="{ active: tab === '0' }" @click="() => handleTabClick('0')">项目信息</div>
            </div>
            <div class="main-table">
              <vxe-table
                :checkbox-config="{
                  trigger: 'row',
                  highlight: true
                }"
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
                @cell-click="cellClickHandle"
                @checkbox-change="checkChangeHandle"
                @checkbox-all="checkChangeAllHandle"
              >
                <vxe-column show-overflow show-header-overflow align="center" :width="55" type="checkbox"></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="proTypeName"
                  title="项目类别"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="left"
                  :width="220"
                  field="xmmc"
                  title="项目名称"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="gwxmbm"
                  title="国网项目编码"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="circulStatusName"
                  title="项目流转状态"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="sbxmyssap"
                  title="预算发送SAP状态"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="sbxmjhxt"
                  title="项目发送计划系统状态"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="right"
                  :width="180"
                  field="ztzjh"
                  title="续建结转总投资计划(万元)"
                  :formatter="formatterHandle"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="right"
                  :width="150"
                  field="amount"
                  title="总预算不含税(万元)"
                  :formatter="formatterHandle"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="right"
                  :width="150"
                  field="dntzjh"
                  title="当年计划(预算)(万元)"
                  :formatter="formatterHandle"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="right"
                  :width="150"
                  field="dnys"
                  title="当年预算不含税(万元)"
                  :formatter="formatterHandle"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="kgsj"
                  title="开工时间"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="yjwcsj"
                  title="预计完成时间"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="jzyy"
                  title="续建结转原因"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="right"
                  :width="150"
                  field="yqljcwzc"
                  title="累计财务支出(万元)"
                  :formatter="formatterHandle"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="xmxzName"
                  title="项目性质"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="preArrStatusName"
                  title="是否预安排"
                ></vxe-column>
                <vxe-column show-overflow show-header-overflow headerAlign="center" align="center" :width="220" field="xjjzAttachname" title="附件">
                  <template #default="{ row }">
                    <el-button type="text" v-if="row['xjjzAttachname']" @click="() => handleDownloadFile(row['xjjzUuid'], row['xjjzAttachname'])">
                      {{ row['xjjzAttachname'] }}
                    </el-button>
                    <span v-else>{{ row['xjjzAttachname'] }}</span>
                  </template>
                </vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="220"
                  field="remark"
                  title="发送SAP结果"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="220"
                  field="remark2"
                  title="项目发送计划系统结果"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="220"
                  field="xjshyj"
                  title="计划系统反馈原因"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="xjshsj"
                  title="计划系统反馈时间"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="220"
                  field="xmbName"
                  title="项目包名称"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="yjdwName"
                  title="一级单位"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="ejdwName"
                  title="二级单位"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="gkbm"
                  title="归口部门"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="yjfl"
                  title="一级分类"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="ejfl"
                  title="二级分类"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="sjfl"
                  title="三级分类"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="right"
                  :width="150"
                  field="dncwzc"
                  title="当年财务支出(万元)"
                  :formatter="formatterHandle"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="right"
                  :width="150"
                  field="dnxmcn"
                  title="当年项目承诺(万元)"
                  :formatter="formatterHandle"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="right"
                  :width="150"
                  field="ljxmcn"
                  title="累计项目承诺(万元)"
                  :formatter="formatterHandle"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="220"
                  field="cnx1"
                  title="承诺项"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="xmbm"
                  title="储备编码"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="instime"
                  title="转续建/结转时间"
                ></vxe-column>
                <vxe-column
                  show-overflow
                  show-header-overflow
                  headerAlign="center"
                  align="center"
                  :width="150"
                  field="xjjzSfglsxName"
                  title="是否关联事项"
                ></vxe-column>
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
      </SplitPanel>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <HelpModal ref="helpModalRef" />
  <Order ref="orderRef" />
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
  <EditModal ref="editModalRef" :public-params="publicParams" :get-table-list="loadData" />
  <!-- 列设置 -->
  <ColSetting ref="colRef" :col-setting="colSetting" :gridRef="tableRef" />
  <ImportExcel ref="importRef" />
  <LinkMatter ref="linkMatterRef" />
</template>

<script lang="ts" setup name="/service/continueCarryOver/index">
import LinkMatter from '@/views/service/continueCarryOver/modules/LinkMatter.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import Grid from '@/components/Grid/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import SplitPanel, { ContextProps } from '@/components/ReSplitPane'
import userDialog from '@/components/select/userDialog.vue'
import { useProcess } from '@/hooks/useProcess'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { RowVo } from './interface'
import { useGuide } from '@/hooks/useGuide'
import { formData } from '@/views/service/continueCarryOver/formData'
import { service } from '@/views/service/continueCarryOver/service'
import Order from '@/views/service/continueCarryOver/modules/Order.vue'
import { getPageData } from '@/api/config/continueCarryover'
import EditModal from '@/views/service/continueCarryOver/modules/EditModal.vue'
import ColSetting from '@/views/service/project/projectActivation/components/ColSetting.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import { getImportTemplate, importPageData } from '@/api/service/continueCarryOver'
import Decimal from 'decimal.js'
import { getPublicData } from '@/api/common' //公共代码

const orderRef = ref<InstanceType<typeof Order>>()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const linkMatterRef = ref<InstanceType<typeof LinkMatter>>()
const isShowPage = ref<boolean>(false)
const editModalRef = ref()
const currentKey = ref<string>(new Date().getFullYear().toString())
const isLeaf = ref(false)
const settingLR: ContextProps = reactive({
  minPercent: 15,
  maxPercent: 30,
  defaultPercent: 15,
  split: 'vertical'
})
const processData = reactive<any>({
  isShowDialog: false,
  compName: null,
  id: ''
})

const { startGuide } = useGuide({
  moduleKey: 'continueCarryOver',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const {
  searchForm,
  publicCodeList,
  searchList,
  handleFieldChange,
  publicParams,
  getPublicParamsList,
  handleError,
  loading,
  handleChildrenCurrentChange,
  handleChildrenSizeChange,
  checkedData,
  loadData,
  tableData,
  childrenCurrentPage,
  childrenPageSize,
  apiService,
  totalProjects,
  error,
  loadTreeData
} = formData()

const {
  setUserInfo,
  handleSubmit,
  formatterHandle,
  downloadFile,
  setSearchTable,
  retractHandle,
  fbProToSapHandler,
  uploadFjHandle,
  deleteFjHandle,
  handleWarnMsg
} = service(loading)
const treeRef = ref()
const helpModalRef = ref()

const defaultProps = reactive({
  children: 'children',
  label: 'name',
  isLeaf: 'leaf',
  id: 'id'
})

const userDialogRef = ref()
const tableRef = ref()
const searchRef = ref()
const tab = ref('0')
const editStatus = ref<any[]>([])

const handleEditData = async () => {
  if (checkedData.value.length !== 1) return ElMessage.warning('请选择一条数据进行编辑!')
  const data: any = checkedData.value[0]
  const codeItme = editStatus.value.some((item: any) => item.code == data.circulStatus)
  if (!codeItme) return ElMessage.warning(`项目流转状态为[${data.circulStatusName}]不可编辑，请重新选择！`)
  editModalRef.value.rmarkData = {
    ...data
  }
  const editRef = editModalRef.value.rmarkData
  if (data.amount != null) {
    editRef.amount = new Decimal(data.amount).toFixed(6)
  }
  if (data.dntzjh != null) {
    editRef.dntzjh = new Decimal(data.dntzjh).toFixed(6)
  }
  if (data['xmxz'] === '2' || data['xmxz'] === 2) {
    editRef.dntzjh = new Decimal('0').toFixed(6)
  }
  if (data.dnys != null) {
    editRef.dnys = new Decimal(data.dnys).toFixed(6)
  }
  if (data.xjjzUuid != null) {
    editModalRef.value.pageData = checkedData.value
  } else {
    editModalRef.value.pageData.length = 0
  }
  editModalRef.value.isShowModel = true
}

const isShowSearch = ref(true)
// 列设置 ==> 需要过滤掉不需要设置的列
const colRef = ref()
const colSetting = ref([])
const openColSetting = () => {
  colSetting.value = tableRef.value.getColumns().filter((item: any) => !item.type)
  colRef.value.openColSetting()
}

const handleIsShowSearch = () => {
  isShowSearch.value = !isShowSearch.value
}

const handleSubmitData = () => {
  handleSubmit(checkedData.value)
}
const handleSendSapData = () => {
  fbProToSapHandler(checkedData.value)
}

const importDataHandle = () => {
  let gwxmbms = []
  let xmbms = []
  if (searchForm.gwxmbms) gwxmbms = searchForm.gwxmbms.split(',')
  if (searchForm.xmbms) xmbms = searchForm.xmbms.split(',')
  let newParams = {
    ...searchForm,
    xmbms: xmbms,
    gwxmbms: gwxmbms,
    ...publicParams.value
  }
  let tempApi: any = getImportTemplate
  let importApi: any = importPageData
  if (!tempApi && !importApi) return
  let params = {
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParams,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParams,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: '',
    specialorgid: publicParams.value.bmId,
    getTableList: () => loadData()
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

const handleDeleteFile = () => {
  deleteFjHandle(checkedData.value)
}

const handleDownloadFile = (uuId: string, fileName: string) => {
  downloadFile(uuId, fileName)
}

const handleUploadFile = () => {
  uploadFjHandle(checkedData.value, tableRef)
}

const initData = () => {
  setSearchTable(loadData)
}

const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

const checkChangeHandle = ({ records }: any) => {
  checkedData.value = records
}
const checkChangeAllHandle = ({ records }: any) => {
  checkedData.value = records
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  checkedData.value = []
  await tableRef.value.clearCheckboxRow()
  await tableRef.value.setCheckboxRow(row, true)
  checkedData.value.push(row)
}

const isDisabled = ref(false)

const handleNodeClick = async (node: any) => {
  checkedData.value = []
  publicParams.value.nd = node.nd
  publicParams.value.protypeId = node.id
  currentKey.value = node.id
  isLeaf.value = node.leaf
  if (node.leaf) isDisabled.value = await getIsDisabledData()
  await loadData()
}

const getIsDisabledData = async () => {
  try {
    const res = await getPageData({
      dataType: '1',
      protypeId: currentKey.value,
      nd: publicParams.value.nd
    })
    if (!res.success) throw new Error(res.msg)
    if (res.data.records.length === 1) {
      const records = res.data.records
      return isDateInRange(records[0].startDate, records[0].endDate)
    }
    return false
  } catch (e) {
    return false
  }
}

const isDateInRange = (startDate: string | Date, endDate: string | Date): boolean => {
  const now = new Date()
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  return now >= start && now <= end
}

const getRoleHandle = async () => {
  publicParams.value.bmId = userDialogRef.value.specialorgid
  publicParams.value.dwId = userDialogRef.value.userMsg.org_id
  publicParams.value.specialorgcode = userDialogRef.value.userMsg.specialorgcode
  publicParams.value.userId = userDialogRef.value.userMsg.id
  publicParams.value.spRoleId = userDialogRef.value.spRoleId
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
    await initPublicParams()
    await initData()
    await codeData()
    setUserInfo(publicParams.value)
  }
}
const codeData = async () => {
  const root: any = await getPublicData('XJJZ_EDIT_STATUS')
  if (root.success && root.data.length !== 0) {
    editStatus.value = root.data
  }
}

const handleContinueCarryOver = (flag: '1' | '2') => {
  if (orderRef.value)
    orderRef.value.acceptParams({
      sqdType: flag,
      publicParams: publicParams.value,
      searchData: loadData
    })
}

const initPublicParams = async () => {
  const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userDialogRef.value.specialorgid}`)
  if (flagData.success) {
    publicParams.value.fqzz = flagData.data
  }
  searchList.yjdwList = await initParamsData('/bizOrgTree/getYjdw', {
    ...publicParams.value
  })
  if (treeRef.value) {
    await nextTick(() => {
      const year = new Date().getFullYear().toString()
      treeRef.value.setCurrentKey(year)
      publicParams.value.nd = year
      publicParams.value.protypeId = year
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
  searchList.bmList = []
  loadData()
}

const exportHandle = async () => {
  try {
    loading.value = true
    error.value = null
    await apiService.exportDataPages()
  } catch (e) {
    handleError(e as Error, '导出数据失败')
  } finally {
    loading.value = false
  }
}

const handleTabClick = (flag: string) => {
  if (tab.value === flag) return
  tab.value = flag
  loadData()
}

const handleRetractData = () => {
  retractHandle(checkedData.value)
}

// 关联事项
const handleLinkMatter = () => {
  // 获取数据
  const $table = tableRef.value
  if ($table) {
    const records: RowVo[] = $table.getCheckboxRecords()
    if (records.length == 0) {
      handleWarnMsg('请选择一条或多条项目进行事项关联！')
      return false
    }
    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const circulStatus = row.circulStatus.toString()
      if (circulStatus == '2' || circulStatus === '4') {
        handleWarnMsg('预算资金审批中或预算资金审批通过的项目不可进行事项关联！')
        return false
      }
    }
    linkMatterRef.value?.acceptParams({
      checkedData: records,
      searchData: loadData,
      proTypeId: publicParams.value.protypeId
    })
  }
}

const handleViewProcess = async () => {
  try {
    // 获取数据
    const $table = tableRef.value
    if ($table) {
      const records: RowVo[] = $table.getCheckboxRecords()
      if (records.length !== 1) {
        ElMessage({
          message: '请选择一个项目进行流程查看!',
          type: 'warning'
        })
        return
      }
      const resultData = records.map((item) => {
        return {
          ...item,
          id: item.xmId
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
    // 获取权限
    selectRolesHandle()
  } catch (e) {
    handleError(e as Error, '初始化加载失败')
  }
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}
</script>

<style scoped lang="less">
@import url(./index.less);
</style>

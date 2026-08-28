<template>
  <div class="form-container" v-if="isShowPage">
    <div class="steps-nav">
      <div class="step-container" v-for="(item, index) in steps" :key="item.stepId">
        <div class="step" :class="activeStep === index + 1 ? 'step-selected' : ''">
          <div class="font">
            {{ item.stepName }}
          </div>
          <div class="icon">
            <img v-if="index % 4 === 0" src="@/assets/service/shixiangdengji.png" alt="" />
            <img v-if="index % 4 === 1" src="@/assets/service/jibenxinxi.png" alt="" />
            <img v-if="index % 4 === 2" src="@/assets/service/shenbao.png" alt="" />
            <img v-if="index % 4 === 3" src="@/assets/service/a-fujian3.png" alt="" />
          </div>
        </div>
        <div class="allow" v-if="index !== steps.length - 1">
          <img src="@/assets/service/allow.png" alt="" />
        </div>
      </div>
      <div class="myCart" @click="handleShopping">
        <div class="main">
          <div class="title">我的需求</div>
          <div class="number">{{ notifyNumber }}</div>
        </div>
        <div class="pic">
          <img src="@/assets/service/lanzi.png" alt="" />
        </div>
      </div>
    </div>
    <div class="form-main" v-loading="loading">
      <div class="form-content">
        <div class="form-title" v-show="activeStep !== 1">
          <h2>{{ steps[activeStep - 1]?.stepName || '表单信息' }}</h2>
        </div>
        <div class="first-step" v-show="activeStep === 1">
          <div class="left">
            <div class="form-title" v-show="activeStep === 1">
              <h2>{{ steps[activeStep - 1]?.stepName || '表单信息' }}</h2>
            </div>
            <div class="top">
              <el-select
                clearable
                @change="handleChangeProvinceDataWrapper"
                placeholder="请先选择省归口部门"
                v-model="provinceData"
                style="width: 100%"
              >
                <el-option
                  v-for="option in provinceDataList"
                  :key="option.code"
                  :label="option.name"
                  :value="option.code"
                />
              </el-select>
            </div>
            <div class="bottom">
              <vxe-table
                ref="yskmTableRef"
                @current-change="handleCurrentChange"
                :cell-style="cellStyle"
                show-overflow
                :row-config="{ height: 32, isCurrent: true, keyField: 'id' }"
                :show-header="false"
                border="outer"
                :tree-config="{
                  lazy: true,
                  loadMethod: loadTreeData,
                  hasChild: 'hasChildren',
                  children: 'children'
                }"
                :column-config="{ resizable: true }"
                :data="protypeTreeDataList"
                height="100%"
              >
                <vxe-column show-overflow field="name" title="项目类型名称" tree-node></vxe-column>
              </vxe-table>
            </div>
          </div>
          <div class="right">
            <div class="search">
              <el-form :model="searchData">
                <el-row :gutter="24">
                  <el-col :span="6">
                    <el-form-item label="预算事项编码：">
                      <el-input v-model="searchData.zyssxbm"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="预算事项名称：">
                      <el-input v-model="searchData.zyssxmc"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6"> </el-col>
                  <el-col :span="6">
                    <div class="operation" style="text-align: right">
                      <el-button plain @click="() => resetHandle(userInfo)">重 置</el-button>
                      <el-button type="primary" plain @click="() => searchYssxHandle(userInfo)">查 询</el-button>
                    </div>
                  </el-col>
                </el-row>
              </el-form>
            </div>
            <div class="table">
              <vxe-table
                border
                :row-config="{
                  height: 32,
                  keyField: 'id'
                }"
                :radio-config="{
                  highlight: true,
                  trigger: 'row'
                }"
                stripe
                show-overflow
                show-header-overflow
                align="center"
                header-align="center"
                resizable
                height="100%"
                :data="yssxDataList"
                ref="yssxTableRef"
              >
                <vxe-column type="radio" width="80"></vxe-column>
                <vxe-column
                  align="center"
                  header-align="center"
                  show-overflow
                  field="zyssxbm"
                  title="预算事项编码"
                ></vxe-column>
                <vxe-column
                  align="center"
                  header-align="center"
                  show-overflow
                  field="zyssxmc"
                  title="预算事项名称"
                ></vxe-column>
                <vxe-column
                  align="center"
                  header-align="center"
                  show-overflow
                  field="yslyName"
                  title="预算类型"
                ></vxe-column>
                <vxe-column
                  align="center"
                  header-align="center"
                  show-overflow
                  field="xmlxName"
                  title="项目类型"
                ></vxe-column>
                <vxe-column
                  align="center"
                  header-align="center"
                  show-overflow
                  field="yjflName"
                  title="一级分类"
                ></vxe-column>
                <vxe-column
                  align="center"
                  header-align="center"
                  show-overflow
                  field="ejflName"
                  title="二级分类"
                ></vxe-column>
                <vxe-column
                  align="center"
                  header-align="center"
                  show-overflow
                  field="sjflName"
                  title="三级分类"
                ></vxe-column>
              </vxe-table>
            </div>

            <div class="pager">
              <el-pagination
                :current-page="page.page"
                background
                align="center"
                :page-sizes="[10, 20, 50, 100, 500]"
                :page-size="page.limit"
                :total="parseInt(page.total + '')"
                layout="total, sizes, prev, pager, next, jmper"
                @size-change="(size:number) => limitChangeHandle(size, userInfo)"
                @current-change="(page:number) => pageChangeHandle(page, userInfo)"
              ></el-pagination>
            </div>
          </div>
        </div>
        <div
          v-for="(formConfig, index) in formConfigs"
          :key="index"
          class="form-panel"
          v-show="activeStep === index + 2"
        >
          <component
            opType="ADD"
            :ref="setFormRef(index)"
            v-if="formConfig.path"
            :is="formConfig.path"
          ></component>
          <DynamicForm
            v-else
            @clearFieldValue="clearFieldValue"
            @setValue="setValue"
            :isChange="isChange"
            :globalParams="globalParams"
            :userInfo="userInfo"
            @field-change="(e:any) => handleFieldChange(e, index)"
            @input-append-handle="handleInputAppend"
            :ref="setFormRef(index)"
            :fields="formConfig.fields"
            :form-config="formConfig.config"
            :initial-data="formConfig.data"
            :show-actions="false"
            :update-form-data="updateFormData"
            :append-data="['CZF']"
          ></DynamicForm>
        </div>
      </div>
      <div class="form-actions">
        <el-button :disabled="isDisabled" @click="prevStep" v-if="activeStep > 1">返回上一步</el-button>
        <el-button
          :disabled="isDisabled"
          type="primary"
          @click="nextStep"
          v-if="activeStep === 1 || activeStep < steps.length"
        >
          下一步
        </el-button>
        <el-button
          type="success"
          @click="submitFormWrapper"
          v-if="activeStep !== 1 && activeStep === steps.length"
          :disabled="isDisabled"
        >
          提 交
        </el-button>
      </div>
      <vxe-modal
        ref="modalRef"
        resize
        show-zoom
        v-model="isShowTable"
        :destroy-on-close="true"
        title="维护出租方信息"
        width="860"
        :height="700"
        :close-on-press-escape="false"
        @close="closeModal"
      >
        <proTable
          ref="proTableRef"
          :cell-style="columnStyle"
          @cell-click="runTask"
          :data-callback="pageList"
          :request-api="pageMeeting"
          :request-auto="true"
          :columns="tableColumns"
          :search-col="3"
          :tool-button="['setting', 'search', 'other']"
        >
          <template #tableHeader="scope">
            <el-button
              plain
              type="primary"
              size="mini"
              :disabled="!scope.isSelected"
              @click.stop="saveModal(scope.selectedList)"
            >确 定</el-button>
          </template>
        </proTable>
      </vxe-modal>
    </div>
  </div>
  <component
    v-if="dynamicCartComponent"
    :is="dynamicCartComponent"
    ref="myCartRef"
    :userInfo="userInfo"
  />
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
import { ElMessage } from 'element-plus'
import { computed, defineComponent, onMounted, ref, shallowRef, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import DynamicForm from '@/components/DynamicFormNew/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { getLabel } from "@/utils";

import proTable from '@/components/ProTable/index.vue' //表格组件

import {
  checkByStep,
  getGkbmInProvince,
  getGmb,
  getSgbm,
  getXmbm,
  getXqlrNum,
  getZlDwpz,
  qryGysData
} from '@/api/service/requirement'

import { getDataByParent } from '@/api/common'
import { BusinessType, useRequirementForm } from '@/composables/useRequirementFormNew'
import { useTableOperations } from '@/composables/useTableOperations'
import { useWorkflowSubmit } from '@/composables/useWorkflowSubmitNew'
import { useUser } from '@/hooks/useUser'
import baseService from '@/service/baseService'
import { MenuConfig } from '@/views/service/xq/interface'

export default defineComponent({
  name: 'RequirementFormBaseNew',
  components: {
    DynamicForm,
    userDialog,
    proTable
  },
  props: {
    businessType: {
      type: String as () => BusinessType,
      required: true,
      validator: (value: string) => ['sfxqlr', 'sfgmblr', 'sfzl'].includes(value)
    },
    cartModalComponent: {
      type: String,
      default: 'MyCart'
    }
  },
  setup(props) {
    const wfCode = ref()
    const route = useRoute()
    const store = useStore()
    const isShowTable = ref<boolean>(false)
    const proTableRef = ref()

    // Composables
    const {
      formConfigs,
      globalParams,
      stepIds,
      steps,
      isChange,
      getFormDatas,
      resetFormConfigs,
      clearFieldValue,
      setValue
    } = useRequirementForm(props.businessType)

    const {
      loading: tableLoading,
      yskmTableRef,
      yssxTableRef,
      page,
      searchData,
      provinceData,
      provinceDataList,
      protypeTreeDataList,
      yssxDataList,
      cellStyle,
      getProTypeData,
      handleCurrentChange: handleCurrentChangeBase,
      handleChangeProvinceData,
      pageChangeHandle,
      limitChangeHandle,
      searchYssxHandle,
      resetHandle,
      loadTreeData,
      setUserInfo
    } = useTableOperations(props.businessType)

    const {
      loading: workflowLoading,
      notifyNumber,
      submitForm,
      resetWorkflow
    } = useWorkflowSubmit()

    // Refs
    const activeStep = ref(1)
    const formRefs = shallowRef<Array<any>>([])
    const isShowPage = ref(false)
    const myCartRef = ref()
    const userDialogRef = ref()
    const operationBtn = shallowRef<MenuConfig[]>([])
    const searchBtn = shallowRef<MenuConfig[]>([])
    const userInfOther = ref<any>()
    const dynamicCartComponent = shallowRef<any>(null)
    const orderParams = shallowRef<any>(null)
    const lubmCodeData = shallowRef<Array<any>>([])
    const updateFormData = ref<any>({})

    const componentMap: any = {
      MyCart: () => import('@/views/service/xq/components/MyCart.vue'),
      ZlMyCartNew: () => import('@/views/service/xq/components/ZlMyCartNew.vue')
    }

    const userInfo = ref<{
      deptId: string
      deptName: string
      dwId: string
      dwName: string
      roleCode: string
      spRoleId: string
      specialorgcode: string
      roleId: string
      fqzzFlag: string
    }>({
      deptId: '',
      deptName: '',
      dwId: '',
      dwName: '',
      roleCode: '',
      spRoleId: '',
      specialorgcode: '',
      fqzzFlag: '',
      roleId: ''
    })

    // Computed
    const loading = computed(() => tableLoading.value || workflowLoading.value)
    const isDisabled = computed(() => loading.value)

    // Methods
    const setFormRef = (index: any) => (el: any) => {
      if (el) {
        formRefs.value[index] = el
      }
    }

    const handleChangeProvinceDataWrapper = (val: string) => {
      handleChangeProvinceData(val, userInfo.value)
    }

    const handleCurrentChange = () => {
      handleCurrentChangeBase(userInfo.value)
    }

    const prevStep = () => {
      if (activeStep.value > 1) {
        activeStep.value--
      }
    }

    const nextStep = async () => {
      try {
        await getZlDwpzData(store.getters.getZlGlobalInfo.deptId)
        if (activeStep.value === 1) {
          const $table = yssxTableRef.value
          if ($table) {
            const currRow = $table.getRadioRecord()
            if (!currRow) {
              ElMessage.warning('请选择一条预算事项数据进行操作!')
              return
            }
            const success = await getFormDatas(currRow.id, currRow.xmlx, userInfo.value)
            if (success) {
              activeStep.value++
            }
          }
        } else {
          if (activeStep.value <= formRefs.value.length) {
            const currentForm = formRefs.value[activeStep.value - 2]
            if (currentForm) {
              try {
                if (currentForm.ISCUSTOMCOPONENT) {
                  if (currentForm.formEl) await currentForm.formEl.validate()
                  const data = currentForm.getFormData()
                  for (const key in data) {
                    globalParams.value[key] = data[key]
                  }
                } else {
                  if (currentForm.validate) await currentForm.validate()
                }
                if (activeStep.value === 2) {
                  // 基本信息
                  if (['4'].includes(orderParams.value.SX)) {
                    // 市管审批单位和市管审批部门必填
                    if (!globalParams.value.XJSPDW) {
                      ElMessage.error('请选择市管审批单位!')
                      return
                    }
                    if (!globalParams.value.XJSPBM) {
                      ElMessage.error('请选择市管审批部门!')
                      return
                    }
                  } else if (['1', '2'].includes(orderParams.value.SX) && ['Y'].includes(orderParams.value.SGS_CYDW_AUDIT)) {
                    // 市管审批单位和市管审批部门必填
                    if (!globalParams.value.XJSPDW) {
                      ElMessage.error('请选择市管审批单位!')
                      return
                    }
                    if (!globalParams.value.XJSPBM) {
                      ElMessage.error('请选择市管审批部门!')
                      return
                    }
                  }
                }

                const res = await checkByStep({
                  datas: globalParams.value,
                  stepId: steps.value[activeStep.value - 1].stepId
                })
                if (!res.success) {
                  ElMessage.error(res.msg)
                  return
                }
                activeStep.value++
              } catch (error: any) {
                ElMessage.error('请填写完毕后,再点击下一步!')
              }
            } else {
              activeStep.value++
            }
          }
        }
      } catch (error: any) {
        console.error(error)
        ElMessage.error(error.toString())
      }
    }

    const submitFormWrapper = async () => {
      const sfzl = props.cartModalComponent !== 'MyCart' ? '1' : '0'
      for (let i = 0; i < formRefs.value.length; i++) {
        const form = formRefs.value[i]
        if (form.getFormData && form.ISCUSTOMCOPONENT) {
          const data = form.getFormData()
          for (const key in data) {
            globalParams.value[key] = data[key]
          }
        }
      }
      await submitForm(globalParams.value, userInfo.value, sfzl, closeHandle, orderParams.value)
    }

    const showHandle = async () => {
      try {
        tableLoading.value = true
        formRefs.value.forEach((form) => {
          if (form?.getFormData) form.getFormData()
        })

        const res = await getGkbmInProvince()
        const xqlrNum = await getXqlrNum({
          sfzl: props.cartModalComponent !== 'MyCart' ? '1' : '0',
          bmId: userInfo.value?.deptId || '',
          dwId: userInfo.value?.dwId || ''
        })

        if (xqlrNum.success) {
          notifyNumber.value = xqlrNum.data
        }

        if (res.data && res.success) {
          provinceDataList.value = res.data
        }

        getProTypeData('', userInfo.value)
      } catch (error) {
        console.error(error)
      } finally {
        tableLoading.value = false
      }
    }

    const closeHandle = () => {
      activeStep.value = 1
      formRefs.value.forEach((form) => {
        if (form?.getFormData) {
          const formData = form.getFormData()
          if (formData.yssxId !== undefined) {
            form.setFieldValue('yssxId', '')
          }
        }
      })
      resetWorkflow()
      formRefs.value = []
      resetFormConfigs()
    }

    const handleFieldChange = async (event: any, _index: any) => {
      const { prop, value, formData } = event
      if (prop === 'ALL_INVEST_TAX') {
        // 租赁需求录入页面-申报信息-含税总租金(万元)
        if (globalParams.value['ALL_INVEST_TAX_FREE'] && value && Number(value) < Number(globalParams.value['ALL_INVEST_TAX_FREE'])) {
          if (Number(value) >= 1000) {
            ElMessage.warning(`含税总租金输入有误，不能小于不含税总租金；含税总租金单位为：万元！`)
          } else {
            ElMessage.warning(`含税总租金输入有误，不能小于不含税总租金！`)
          }
          globalParams.value[prop] = ''
          formRefs.value.forEach((form) => {
            if (form?.getFormData) {
              form.setFieldValue('ALL_INVEST_TAX', '')
            }
          })
        } else {
          if (Number(value) >= 1000) {
            ElMessage.warning('含税总租金单位为：万元')
          }
          globalParams.value[prop] = value
        }
      } else if (prop === 'ALL_INVEST_TAX_FREE') {
        // 租赁需求录入页面-申报信息-不含税总租金(万元)
        if (globalParams.value['ALL_INVEST_TAX'] && value && Number(value) > Number(globalParams.value['ALL_INVEST_TAX'])) {
          ElMessage.warning(`不含税总租金输入有误，不能大于含税总租金！`)
          globalParams.value[prop] = ''
          formRefs.value.forEach((form) => {
            if (form?.getFormData) {
              form.setFieldValue('ALL_INVEST_TAX_FREE', '')
            }
          })
        } else {
          globalParams.value[prop] = value
        }
      } else {
        globalParams.value[prop] = value
      }
      if (prop === 'EJDW' && value) {
        const xmbmData = await getXmbm(formData)
        if (xmbmData.success) {
          formRefs.value.forEach((form) => {
            if (form?.getFormData && form.getFormData().XMBM !== undefined) {
              form.setFieldValue('XMBM', xmbmData.data)
            }
          })
        }
      }

      if ((prop === 'SJFL' && value) || prop === 'IS_DISPATCH') {
        const params: any = {
          SJFL: globalParams.value['SJFL']
        }

        if (prop === 'IS_DISPATCH' && value) {
          params['IS_DISPATCH'] = value
        }
        const dydjData = await baseService.post('/xmAttributeConfig/getDydj', params)
        formRefs.value.forEach((form) => {
          if (form?.getFormData && form.getFormData().DYDJ !== undefined) {
            form.updateField('DYDJ', { options: dydjData.data })
          }
        })
      }

      // 租入资产类型
      if (prop === 'ZRZCLB' && value) {
        // 3：非电网类资产-办公用房，4：非电网类资产-专业仓（库），5和9：非电网类资产-充电场站（地）
        wfCode.value = getLabel(value, lubmCodeData.value)
      }
    }

    const handleShopping = async () => {
      if (!dynamicCartComponent.value) {
        await loadCartComponent()
      }
      myCartRef.value.isShowModal = true
    }

    const loadCartComponent = async () => {
      const componentName: string = props.cartModalComponent
      const componentLoader = componentMap[componentName]
      if (componentLoader) {
        try {
          const component = await componentLoader()
          dynamicCartComponent.value = component.default || component
        } catch (error) {
          console.error(`${componentName}组件加载失败`, error)
          if (componentName !== 'MyCart') {
            const defaultComponent = await componentMap.MyCart()
            dynamicCartComponent.value = defaultComponent.default || defaultComponent
          }
        }
      }
    }

    const getRoleHandle = async () => {
      try {
        const isQuery = userDialogRef.value.isQuery
        userInfOther.value = { ...userDialogRef.value.userMsg }
        if (isQuery) {
          isShowPage.value = true
          const flagData = await baseService.post(
            `/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.value.specialorgid}`
          )
          if (flagData.success && flagData.data) {
            showHandle()
            const userInfoOthers = {
              deptId: userInfOther.value.specialorgid,
              deptName: userInfOther.value.specialorgname,
              dwId: userInfOther.value.org_id,
              dwName: userInfOther.value.org_name,
              roleId: userInfOther.value.role_id,
              roleCode: userInfOther.value.code,
              spRoleId: userInfOther.value.id,
              specialorgcode: userInfOther.value.specialorgcode,
              fqzzFlag: flagData.data
            }
            userInfo.value = userInfoOthers
            setUserInfo(userInfOther as any)
            if (props.businessType === 'sfzl') store.commit('setZlGlobalInfo', userInfoOthers)
            else store.commit('setXqGlobalInfo', userInfoOthers)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    // 通过配置公共代码，获取相关流程对应的wfCode
    const getPublicCode = async () => {
      try {
        const res = await getDataByParent('ZRZCLB_COM')
        if (res.success) {
          lubmCodeData.value = res.data
        } else {
          throw new Error(res.msg)
        }
      } catch (e) {
        const error = e as Error
        ElMessage.error(error.message)
      }
    }

    const getZlDwpzData = async (deptId: string) => {
      try {
        const res = await getZlDwpz(deptId)
        if (res.success) {
          orderParams.value = {
            WFCODE: wfCode.value,
            SX: res.data.sx, // 属性
            SFZYDW: res.data.sfzydw, // 是否主业单位
            SFSGS: res.data.sfsgs, // 是否市公司
            SFWZBM: res.data.sfwzbm, // 是否物资部门
            SFSJCY: res.data.sfsjcy, // 是否市公司产业单位
            SFBGS: res.data.sfbgs, // 是否办公室
            CITYCY: res.data.citycy, // 市产业
            COUNTYCY: res.data.countycy, // 县产业
            COUNTYGD: res.data.countygd, // 县供电
            CITYGD: res.data.citygd, // 市供电
            PROYWBM: res.data.provinceCybId,
            SGS_CYDW_AUDIT: res.data.sgsCydwAudit, // 是否需要市级产业单位审核
            XGS_GDDW_AUDIT: res.data.xgsGddwAudit, // 是否需要县级供电单位审核
            SGS_GDDW_AUDIT: res.data.sgsGddwAudit, // 是否需要市级供电单位审核
            FQBM_UNICODE : res.data.bmUnicode, // 发起部门性质
            FQDWSX : res.data.sx, // 发起单位产业单位属性
            FQDWID : res.data.dwId // 发起单位ID
          }
        } else {
          throw new Error(res.msg)
        }
      } catch (e) {
        const error = e as Error
        ElMessage.error(error.message)
      }
    }

    // 租赁需求录入-申报信息-需求名称-打开弹窗
    const handleInputAppend = async () => {
      isShowTable.value = true
    }

    // 租赁需求录入-申报信息-需求名称-关闭弹窗
    const closeModal = () => {
      isShowTable.value = false
    }

    // 租赁需求录入-申报信息-需求名称-弹窗确定“保存数据”
    const saveModal = (selectedList: any) => {
      if (selectedList.length == 1) {
        updateFormData.value = {
          CZF: selectedList[0].name,
          CZFSX: selectedList[0].innreflag
        }
        globalParams.value.CZF = selectedList[0].name
        globalParams.value.CZFSX = selectedList[0].innreflag
        isShowTable.value = false
      } else {
        ElMessage.warning('请选择一条数据')
      }
    }

    // 数据回调
    const pageList = (val: any) => {
      if (val && val.records) {
        val.records.forEach((item: any, index: any) => {
          item.id = index
        })
      }
      return val
    }

    // 列表查询
    const pageMeeting = (params: any) => {
      params = { ...params, comCode: 'YSSX_COM' }
      return qryGysData(params)
    }

    // 列颜色
    const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
      return 'cursor: pointer;'
    }

    const runTask = async (row: any, column: any) => {
      proTableRef.value?.clearSelection()
      proTableRef.value?.element.toggleRowSelection(row)
    }

    const tableColumns = reactive<any>([
      { type: 'selection', label: '序号', width: '50' },
      { type: 'index', label: '序号', width: '50' },
      {
        prop: 'lifnr',
        label: '出租方编码',
        search: { el: 'input', order: 1 }
      },
      {
        prop: 'name',
        label: '出租方名称',
        search: { el: 'input', order: 2 }
      }
    ])

    onMounted(async () => {
      getPublicCode()
      const str = props.businessType === 'sfzl' ? 'getZlGlobalInfo' : 'getXqGlobalInfo'
      const isRole = await useUser(str)
      if (isRole && route.params.formJsc) {
        let xqGlobalInfo = null
        if (props.businessType === 'sfzl') xqGlobalInfo = store.getters.getZlGlobalInfo
        else xqGlobalInfo = store.getters.getXqGlobalInfo
        isShowPage.value = true
        userInfo.value = {
          ...(xqGlobalInfo as any)
        }
        setUserInfo(userInfo.value)
        await showHandle()
      } else {
        await userDialogRef.value.getUser()
      }
    })

    return {
      dynamicCartComponent,
      searchYssxHandle,
      pageChangeHandle,
      limitChangeHandle,
      page,
      resetHandle,
      searchData,
      handleChangeProvinceDataWrapper,
      handleCurrentChange,
      yssxDataList,
      yskmTableRef,
      yssxTableRef,
      cellStyle,
      protypeTreeDataList,
      provinceData,
      provinceDataList,
      isDisabled,
      isShowPage,
      notifyNumber,
      steps,
      loading,
      activeStep,
      handleFieldChange,
      formConfigs,
      setFormRef,
      prevStep,
      nextStep,
      submitFormWrapper,
      handleShopping,
      showHandle,
      globalParams,
      isChange,
      setValue,
      clearFieldValue,
      closeHandle,
      userInfo,
      myCartRef,
      getRoleHandle,
      operationBtn,
      searchBtn,
      userDialogRef,
      loadTreeData,
      isShowTable,
      handleInputAppend,
      closeModal,
      saveModal,
      columnStyle,
      runTask,
      pageList,
      pageMeeting,
      tableColumns,
      updateFormData
    }
  }
})
</script>

<style lang="less" scoped>
.form-content {
  .form-panel:first-of-type {
    max-width: 500px !important;
  }
}

.first-step {
  width: 100%;
  height: 100%;
  display: flex;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  .left {
    width: 260px;
    height: 100%;
    min-height: 0;
    min-width: 0;
    margin-right: 10px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    .top {
      margin-bottom: 10px;
    }

    .bottom {
      flex: 1;
    }
  }
  .right {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;

    .table {
      flex: 1;
      min-height: 0;
      min-width: 0;
    }
  }
}

.project-form-prototype {
  padding: 10px;
  height: 100%;
  min-height: 100%;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-container {
  height: 100%;
  width: 100%;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  padding: 20px;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
}

.steps-nav {
  height: 70px;
  border-radius: 8px;
  display: flex;

  .step {
    height: 100%;
    flex: 1;
    min-width: 0;
    min-height: 0;
    margin: 0 10px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to right, #e8f4f4, #c6e9e5);
    color: #009895;
    padding: 0 20px;
    .font {
      flex: 1;
      min-width: 0;
      min-height: 0;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
    }

    .icon {
      width: 50px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      img {
        width: 30px;
      }
    }
  }

  .step-selected {
    background: linear-gradient(to right, #49b6b1, #29827e);
    color: white;
  }
  .allow {
    line-height: 70px;
  }

  .myCart {
    margin-left: 20px;
    width: 160px;
    height: 100%;
    background: linear-gradient(to right, #287e7b, #376988);
    border-radius: 10px;
    display: flex;
    cursor: pointer;

    .main {
      flex: 1;
      min-width: 0;
      min-height: 0;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-left: 20px;
      .title {
        font-size: 16px;
        font-weight: bold;
        padding-bottom: 10px;
      }

      .number {
        font-size: 20px;
      }
    }

    .pic {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      img {
        width: 65px;
      }
    }
  }
}

.form-main {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #cccccc;
  border-radius: 8px;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.form-title {
  margin-bottom: 25px;
  padding-left: 12px;
  border-left: 4px solid #409eff;
}

.form-title h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.form-content {
  border-radius: 8px;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.form-panel {
  flex: 1;
  min-width: 500px;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  padding: 0 10%;
  overflow: auto;
}

.form-actions {
  display: flex;
  justify-content: center;
  padding: 10px 0 0 0;
  border-top: 1px solid #ebeef5;
  margin-top: 10px;
}

.form-actions .el-button {
  min-width: 130px;
  margin: 0 20px;
  padding: 12px 20px;
  font-size: 15px;
}

.step-container {
  display: contents;
}
</style>

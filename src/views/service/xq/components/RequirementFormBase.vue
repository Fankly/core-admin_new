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
            <div class="top" role="search" aria-label="预算事项筛选条件">
              <el-form class="tree-filter-form" label-position="right" label-width="88px">
                <el-form-item label="省归口部门">
                  <el-select v-model="provinceData" clearable filterable placeholder="请选择" @change="handleChangeProvinceDataWrapper">
                    <el-option v-for="option in provinceDataList" :key="option.code" :label="option.name" :value="option.code" />
                  </el-select>
                </el-form-item>
                <el-form-item label="预算类型">
                  <el-select v-model="ysly" clearable placeholder="请选择" @change="handleChangeYslyWrapper">
                    <el-option label="省级统筹" value="1" />
                    <el-option label="市域统筹" value="2" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
            <div class="bottom">
              <vxe-table
                ref="yskmTableRef"
                @current-change="handleCurrentChange"
                :cell-style="cellStyle"
                show-overflow
                :row-config="{ height: 32, isCurrent: true }"
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
                <vxe-column align="center" header-align="center" show-overflow field="zyssxbm" title="预算事项编码"></vxe-column>
                <vxe-column align="center" header-align="center" show-overflow field="zyssxmc" title="预算事项名称"></vxe-column>
                <vxe-column align="center" header-align="center" show-overflow field="remark" title="预算事项适用说明"></vxe-column>
                <vxe-column align="center" header-align="center" show-overflow field="yslyName" title="预算类型"></vxe-column>
                <vxe-column align="center" header-align="center" show-overflow field="xmlxName" title="项目类型"></vxe-column>
                <vxe-column align="center" header-align="center" show-overflow field="yjflName" title="一级分类"></vxe-column>
                <vxe-column align="center" header-align="center" show-overflow field="ejflName" title="二级分类"></vxe-column>
                <vxe-column align="center" header-align="center" show-overflow field="sjflName" title="三级分类"></vxe-column>
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
        <div v-for="(formConfig, index) in formConfigs" :key="index" class="form-panel" v-show="activeStep === index + 2">
          <component opType="ADD" :ref="setFormRef(index)" v-if="formConfig.path" :is="formConfig.path"></component>
          <DynamicForm
            v-else
            @clearFieldValue="clearFieldValue"
            @setValue="setValue"
            :isChange="isChange"
            :globalParams="globalParams"
            :selectData="dynamicUploadSelectData"
            :userInfo="userInfo"
            @field-change="(e: any) => handleFieldChange(e, index)"
            :ref="setFormRef(index)"
            :fields="formConfig.fields"
            :form-config="formConfig.config"
            :initial-data="formConfig.data"
            :show-actions="false"
          ></DynamicForm>
        </div>
      </div>
      <div class="form-actions">
        <el-button :disabled="isDisabled" @click="prevStep" v-if="activeStep > 1">返回上一步</el-button>
        <el-button :disabled="isDisabled" type="primary" @click="nextStep" v-if="activeStep === 1 || activeStep < steps.length"> 下一步 </el-button>
        <el-button
          type="success"
          @click="() => submitFormWrapper('SAVE')"
          v-if="activeStep !== 1 && activeStep === steps.length"
          :disabled="isDisabled"
        >
          暂 存
        </el-button>
        <el-button
          @click="() => submitFormWrapper('SUBMIT')"
          type="success"
          v-if="activeStep !== 1 && activeStep === steps.length"
          :disabled="isDisabled"
        >
          提 交
        </el-button>
      </div>
    </div>
  </div>
  <component v-if="dynamicCartComponent" :is="dynamicCartComponent" ref="myCartRef" :userInfo="userInfo" />
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
import { ElMessage } from 'element-plus'
import { computed, defineComponent, onMounted, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import DynamicForm from '@/components/DynamicForm/index.vue'
import userDialog from '@/components/select/userDialog.vue'

import { checkByStep, getGkbmInProvince, getGmb, getSgbm, getXmbm, getXqlrNum } from '@/api/service/requirement'
import { BusinessType, useRequirementForm } from '@/composables/useRequirementForm'
import { useTableOperations } from '@/composables/useTableOperations'
import { useWorkflowSubmit, WfCode } from '@/composables/useWorkflowSubmit'
import { useUser } from '@/hooks/useUser'
import baseService from '@/service/baseService'
import { MenuConfig } from '@/views/service/xq/interface'

export default defineComponent({
  name: 'RequirementFormBase',
  components: {
    DynamicForm,
    userDialog
  },
  props: {
    wfCode: {
      type: String as () => WfCode,
      default: 'WF_NEWCBXQSHLC'
    },
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
    const route = useRoute()
    const store = useStore()

    // Composables
    const { formConfigs, globalParams, stepIds, steps, isChange, getFormDatas, resetFormConfigs, clearFieldValue, setValue } = useRequirementForm(
      props.businessType
    )

    const {
      loading: tableLoading,
      yskmTableRef,
      yssxTableRef,
      page,
      searchData,
      provinceData,
      ysly,
      provinceDataList,
      protypeTreeDataList,
      yssxDataList,
      cellStyle,
      getProTypeData,
      handleCurrentChange: handleCurrentChangeBase,
      handleChangeProvinceData,
      handleChangeYsly,
      pageChangeHandle,
      limitChangeHandle,
      searchYssxHandle,
      resetHandle,
      loadTreeData,
      setUserInfo
    } = useTableOperations(props.businessType)

    const { loading: workflowLoading, notifyNumber, submitForm, resetWorkflow, saveInfo } = useWorkflowSubmit(props.wfCode)

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
    // 步骤切换进行中标记，防止重复点击导致跳步
    const stepChanging = ref(false)
    let xmbmRequestSequence = 0
    let yjdwRequestSequence = 0

    const componentMap: any = {
      MyCart: () => import('@/views/service/xq/components/MyCart.vue'),
      ZlMyCart: () => import('@/views/service/xq/components/ZlMyCart.vue')
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
    const isDisabled = computed(() => loading.value || stepChanging.value)
    const dynamicUploadSelectData = computed(() => ({
      ...globalParams.value,
      xmlx: globalParams.value.xmlx || globalParams.value.protypeId || ''
    }))

    // Methods
    const setFormRef = (index: any) => (el: any) => {
      if (el) {
        formRefs.value[index] = el
      }
    }

    const handleChangeProvinceDataWrapper = (val: string) => {
      handleChangeProvinceData(val, userInfo.value)
    }

    const handleChangeYslyWrapper = (val: string) => {
      handleChangeYsly(val, userInfo.value)
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
      if (stepChanging.value) return
      stepChanging.value = true
      try {
        if (activeStep.value === 1) {
          const $table = yssxTableRef.value
          if ($table) {
            const currRow = $table.getRadioRecord()
            if (!currRow) {
              ElMessage.warning('请选择一条预算事项数据进行操作!')
              return
            }
            xmbmRequestSequence++
            yjdwRequestSequence++
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
      } finally {
        stepChanging.value = false
      }
    }

    const submitFormWrapper = async (flag: 'SUBMIT' | 'SAVE') => {
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
      flag === 'SUBMIT'
        ? await submitForm(globalParams.value, userInfo.value, sfzl, closeHandle)
        : await saveInfo(globalParams.value, userInfo.value, sfzl, closeHandle)
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
      xmbmRequestSequence++
      yjdwRequestSequence++
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

    const handleFieldChange = async (event: any, index: number) => {
      const { prop, value, formData } = event
      globalParams.value[prop] = value

      const hasLocalDependency = (targetProp: string, sourceProp: string) => {
        const currentFields = formConfigs.value[index]?.fields || []
        return currentFields.some(
          (field: any) =>
            field.prop === targetProp &&
            Array.isArray(field.dependencies) &&
            field.dependencies.includes(sourceProp) &&
            (field.dyff || field.loadOptions)
        )
      }

      if (prop === 'EJDW') {
        const requestSequence = ++xmbmRequestSequence
        const hasLocalXmbmDependency = hasLocalDependency('XMBM', 'EJDW')

        if (!hasLocalXmbmDependency) {
          try {
            const xmbmData: any = value ? await getXmbm(formData) : { success: true, data: '' }
            if (requestSequence !== xmbmRequestSequence) return
            if (!xmbmData.success) {
              throw new Error(xmbmData.msg || '获取项目编码失败')
            }
            formRefs.value.forEach((form) => {
              if (form?.getFormData && form.getFormData().XMBM !== undefined) {
                form.setFieldValue('XMBM', xmbmData.data ?? '')
              }
            })
          } catch (error: any) {
            if (requestSequence !== xmbmRequestSequence) return
            console.error('加载项目编码失败:', error)
            ElMessage.error(`加载项目编码失败：${error?.message || '未知错误'}，请重新选择后重试`)
          }
        }
      }

      if (prop === 'YJDW') {
        const requestSequence = ++yjdwRequestSequence
        const needsCtbmBridge = !hasLocalDependency('CTBM', 'YJDW')
        const needsGmbBridge = !hasLocalDependency('GMB_ID', 'YJDW')
        if (needsCtbmBridge || needsGmbBridge) {
          try {
            const gkbmRequest: Promise<any> = needsCtbmBridge && value ? getSgbm(formData) : Promise.resolve({ success: true, data: [] })
            const gmbRequest: Promise<any> =
              needsGmbBridge && value
                ? getGmb({
                    ...globalParams.value,
                    dwId: userInfo.value?.dwId || '',
                    bmId: userInfo.value?.deptId || ''
                  })
                : Promise.resolve({ success: true, data: [] })
            const [gkbmData, gmbData] = await Promise.all([gkbmRequest, gmbRequest])
            if (requestSequence !== yjdwRequestSequence) return
            if (!gkbmData.success) throw new Error(gkbmData.msg || '获取市归口部门失败')
            if (!gmbData.success) throw new Error(gmbData.msg || '获取归口部门失败')

            formRefs.value.forEach((form) => {
              if (!form?.getFormData) return
              const currentFormData = form.getFormData()
              if (needsCtbmBridge && currentFormData.CTBM !== undefined) {
                form.updateField('CTBM', { options: gkbmData.data || [] })
                form.setFieldValue('CTBM', '')
              }
              if (needsGmbBridge && currentFormData.GMB_ID !== undefined) {
                form.updateField('GMB_ID', { options: gmbData.data || [] })
                form.setFieldValue('GMB_ID', '')
              }
            })
          } catch (error: any) {
            if (requestSequence !== yjdwRequestSequence) return
            console.error('加载归口部门联动数据失败:', error)
            ElMessage.error(`加载归口部门联动数据失败：${error?.message || '未知错误'}，请重新选择后重试`)
          }
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
    }

    const handleShopping = async () => {
      if (!dynamicCartComponent.value) {
        await loadCartComponent()
      }
      if (myCartRef.value) myCartRef.value.isShowModal = true
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
          const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.value.specialorgid}`)
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

    onMounted(async () => {
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
      handleChangeYslyWrapper,
      handleCurrentChange,
      yssxDataList,
      yskmTableRef,
      yssxTableRef,
      cellStyle,
      protypeTreeDataList,
      provinceData,
      ysly,
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
      dynamicUploadSelectData,
      loadTreeData
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
    width: 390px;
    height: 100%;
    min-height: 0;
    min-width: 0;
    margin-right: 10px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    .top {
      margin-bottom: 10px;
      padding: 10px 12px 12px;
      flex: 0 0 auto;
      box-sizing: border-box;
      background-color: #f8fcfb;
      border: 1px solid #e2e8f0;
      border-radius: 6px;

      .tree-filter-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      :deep(.el-form-item) {
        min-width: 0;
        margin-bottom: 0;
      }

      :deep(.el-form-item__label) {
        height: auto;
        padding: 0 10px 0 0;
        color: #475569;
        font-size: 13px;
        font-weight: 500;
        line-height: 32px;
      }

      :deep(.el-form-item__content) {
        min-width: 0;
        line-height: 32px;
      }

      :deep(.el-select) {
        width: 100%;
      }

      :deep(.el-input__inner) {
        height: 32px;
        color: #475569;
        line-height: 32px;
        background-color: #fff;
        border-color: #e2e8f0;
        border-radius: 6px;
        transition: border-color 0.15s ease;

        &:hover {
          border-color: #b8ddd9;
        }

        &:focus {
          border-color: #00706b;
          box-shadow: 0 0 0 2px rgba(0, 112, 107, 0.12);
        }
      }

      :deep(.el-select .el-input .el-select__caret) {
        color: #64748b;
      }
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
  border-left: 4px solid #b8ddd9;
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

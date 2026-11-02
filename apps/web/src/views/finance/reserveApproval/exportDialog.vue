<template>
  <dialogContainer
    submitLabel="确认"
    :buttonLoading="buttonLoading"
    class="exportDialog"
    ref="dialogContainer"
    :onCancel="() => onCancel(false)"
    :onSubmit="() => onSubmit()"
  >
    <FormConfigBox :config="{ rules }" ref="form" :options="infoOptions" v-model="dataValue"> </FormConfigBox>
    <div style="margin-left: 35px" class="floor-info">注:数据量大时，表格导出较慢，需等待1分钟左右，勿反复点击</div>
  </dialogContainer>
</template>
<script setup>
import { CwProjectApply, FinanceReserveNotice, Category, CwCategoryInvest, CwProject } from '@/api/mainController'
import { DropdownWidget, TableWidget, UploadWidget, ChartWidget } from '@/utils/widget.js'
import { DictionaryController, SysGlobalDictController } from '@/api'
import { encrypt, treeDataTranslate, findTreeNodePath } from '@/utils'
import componentStore from '@/store/business'
import { reactive, toRef, toRefs, computed, onMounted, getCurrentInstance, useTemplateRef } from 'vue'
defineOptions({
  name: 'exportDialog'
})
const componentProps = defineProps({
  vtSource: Number,
  exportOptions: Array
})
const componentInstance = getCurrentInstance().proxy
const formRef = useTemplateRef('form')
const componentData = reactive({
  buttonLoading: false,
  dataValue: {},
  rules: {
    type: {
      required: true,
      message: '请选择导出内容',
      trigger: 'blur'
    },
    year: {
      required: true,
      message: '请选择储备年份',
      trigger: 'blur'
    },
    reserveStatuses: {
      required: true,
      message: '请选择储备状态',
      trigger: 'blur'
    },
    batchId: {
      required: true,
      message: '请选择储备批次',
      trigger: 'blur'
    },
    preArranged: {
      required: true,
      message: '请选择预安排',
      trigger: 'blur'
    }
    // affiliateDeptIdList: { required: true, message: '请选择归口部门', trigger: 'blur' }
  },
  deptId: {
    impl: new DropdownWidget(loadDeptIdDropdownList)
  },
  batchId: [],
  year: [],
  reserveStatus: []
})
const buttonLoading = toRef(componentData, 'buttonLoading')
const dataValue = toRef(componentData, 'dataValue')
const rules = toRef(componentData, 'rules')
const deptId = toRef(componentData, 'deptId')
const batchId = toRef(componentData, 'batchId')
const year = toRef(componentData, 'year')
const reserveStatus = toRef(componentData, 'reserveStatus')
function loadDeptIdDropdownList() {
  return new Promise((resolve, reject) => {
    let params = {}
    DictionaryController.dictSysDept(componentInstance, params)
      .then((res) => {
        resolve(treeDataTranslate(res.getList(), 'id'))
      })
      .catch((e) => {
        reject(e)
      })
  })
}
function onDeptIdVisibleChange(show) {
  return componentData.deptId.impl.onVisibleChange(show).catch((e) => {})
}
function onDeptIdValueChange(value) {
  componentData.dataValue.deptId = Array.isArray(value) ? value[value.length - 1] : undefined
}
function getReserveStatus() {
  CwProject.reserveStatus(componentInstance, {}).then((res) => {
    componentData.reserveStatus = res.data
  })
}
async function initFormData() {
  await onDeptIdVisibleChange(true)
  componentData.dataValue = {
    ...componentData.dataValue,
    affiliateDeptIdList: [
      componentInstance.$utils.findParentPathIterative(componentData.deptId.impl.dropdownList, componentStore.getters.getUserInfo.deptId)
    ]
  }
  yearList({}, (res) => {
    componentData.year = [
      ...res.map((item) => ({
        label: item,
        value: item
      }))
    ]
  })
}
function handleSelectionChange(selectedValues, dataKey = 'batchId') {
  const hasAll = selectedValues.includes('-1')
  const lastSelected = selectedValues[selectedValues.length - 1]
  if (hasAll && lastSelected === '-1') {
    componentData.dataValue[dataKey] = ['-1']
    return
  }
  if (hasAll && lastSelected !== '-1') {
    componentData.dataValue[dataKey] = selectedValues.filter((item) => item !== '-1')
  }
  if (componentData.dataValue[dataKey].length === 0) {
    componentData.dataValue[dataKey] = [selectedValues[0]]
  }
}
function getFinanceReserveNotice(params, callback = () => {}) {
  return FinanceReserveNotice.list(componentInstance, params).then((res) => {
    const [obj] = res.data?.dataList
    callback(res.data)
  })
}
function yearList(params, callback = () => {}) {
  return FinanceReserveNotice.yearList(componentInstance, params, null, {
    showMask: false
  }).then((res) => {
    callback(res.data)
  })
}
function addApi(callback) {
  const { type, batchId, ...other } = componentData.dataValue
  if (type == '1') {
    CwProjectApply.exportApplyMulti2(componentInstance, {
      cwProjectApproveDtoFilter: {
        ...other,
        vtSource: componentProps.vtSource,
        type,
        batchIds: batchId?.join(',')
      }
    })
  }
  if (type == '2') {
    CwProjectApply.exportReviewOpinionMulti(componentInstance, {
      cwProjectApproveDtoFilter: {
        ...other,
        vtSource: componentProps.vtSource,
        type,
        batchIds: batchId?.join(',')
      }
    })
  }
  if (type == '5') {
    CwProjectApply.preliminaryExaminationExecl(componentInstance, {
      cwProjectApproveDtoFilter: {
        ...other,
        vtSource: componentProps.vtSource,
        type,
        batchIds: batchId?.join(',')
      }
    })
  }
  callback()
}
function onCancel(isSuccess = false, data) {
  if (componentInstance.observer != null) {
    componentInstance.observer.cancel(isSuccess, data)
  }
}
function onSubmit() {
  formRef.value.handleSubmit(() => {
    componentData.buttonLoading = true
    addApi(() => {
      componentData.buttonLoading = false
      onCancel(true)
    })
  })
}
const infoOptions = computed(() => {
  return [
    {
      tag: 'select',
      prop: 'type',
      label: '导出内容',
      value: '1',
      attrs: {
        options: [
          {
            value: '1',
            label: '储备项目导出'
          },
          {
            value: '5',
            label: '联合初审意见导出'
          }
        ].filter((item) => (componentProps.exportOptions ? componentProps.exportOptions.includes(item.value * 1) : item))
      },
      listeners: {
        change: (reserveId) => {}
      }
    },
    {
      tag: 'cascader',
      prop: 'affiliateDeptIdList',
      label: '归口部门',
      attrs: {
        filterable: true,
        'collapse-tags': true,
        props: {
          value: 'id',
          label: 'name',
          checkStrictly: false,
          multiple: true
        },
        loading: componentData.deptId?.impl?.loading,
        options: componentData.deptId?.impl?.dropdownList || [],
        placeholder: '请选择归口部门'
      }
    },
    {
      tag: 'select',
      prop: 'reserveStatuses',
      label: '储备状态',
      value: ['-1'],
      attrs: {
        multiple: true,
        'collapse-tags': true,
        options: [
          {
            value: '-1',
            label: '全部'
          },
          ...componentData.reserveStatus.map((item) => ({
            value: item.key,
            label: item.value
          }))
        ].filter((item) => item.value != componentInstance.StatusReserveDict.PENDING_SUBMIT)
      },
      listeners: {
        change: (data) => handleSelectionChange(data, 'reserveStatuses')
      }
    },
    {
      tag: 'select',
      prop: 'year',
      label: '储备年份',
      attrs: {
        props: {
          value: 'value',
          label: 'label'
        },
        options: componentData.year || [],
        filterable: true
      },
      listeners: {
        change: (year) => {
          componentData.dataValue = {
            ...componentData.dataValue,
            year,
            batchId: undefined
          }
          getFinanceReserveNotice(
            {
              financeReserveNoticeDtoFilter: {
                year
              }
            },
            (res) => {
              componentData.batchId = [...res.dataList]
            }
          )
        }
      }
    },
    {
      tag: 'select',
      prop: 'batchId',
      label: '储备批次',
      attrs: {
        multiple: true,
        'collapse-tags': true,
        props: {
          value: 'reserveId',
          label: 'batchTitle'
        },
        options: componentData.dataValue.year
          ? [
              {
                reserveId: '-1',
                batchTitle: '全部'
              },
              ...componentData.batchId
            ]
          : []
      },
      listeners: {
        change: (data) => handleSelectionChange(data, 'batchId')
      }
    },
    {
      tag: 'select',
      prop: 'preArranged',
      label: '预安排',
      value: '-1',
      attrs: {
        options: [
          {
            value: '-1',
            label: '全部'
          },
          {
            value: '0',
            label: '否'
          },
          {
            value: '1',
            label: '是'
          }
        ]
      }
    }
  ]
})
onMounted(() => {
  initFormData()
  getReserveStatus()
})
defineExpose({
  loadDeptIdDropdownList,
  onDeptIdVisibleChange,
  onDeptIdValueChange,
  getReserveStatus,
  initFormData,
  handleSelectionChange,
  getFinanceReserveNotice,
  yearList,
  addApi,
  onCancel,
  onSubmit,
  ...toRefs(componentData),
  infoOptions
})
</script>
<style lang="less" scoped>
:deep(.config-item) {
  .el-select__tags {
    max-width: 100% !important;
  }
}
</style>

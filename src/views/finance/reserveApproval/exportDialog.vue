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
<script>
import { CwProjectApply, FinanceReserveNotice, Category, CwCategoryInvest, CwProject } from '@/api/mainController'

import { DropdownWidget, TableWidget, UploadWidget, ChartWidget } from '@/utils/widget.js'

import { DictionaryController, SysGlobalDictController } from '@/api'

import { encrypt, treeDataTranslate, findTreeNodePath } from '@/utils'

export default {
  components: {},
  props: {
    vtSource: Number,
    exportOptions: Array
  },
  name: 'exportDialog',
  data() {
    return {
      buttonLoading: false,
      dataValue: {},
      rules: {
        type: { required: true, message: '请选择导出内容', trigger: 'blur' },
        year: { required: true, message: '请选择储备年份', trigger: 'blur' },
        reserveStatuses: { required: true, message: '请选择储备状态', trigger: 'blur' },
        batchId: { required: true, message: '请选择储备批次', trigger: 'blur' },
        preArranged: { required: true, message: '请选择预安排', trigger: 'blur' }
        // affiliateDeptIdList: { required: true, message: '请选择归口部门', trigger: 'blur' }
      },
      deptId: {
        impl: new DropdownWidget(this.loadDeptIdDropdownList)
      },
      batchId: [],
      year: [],
      reserveStatus: []
    }
  },
  created() {},
  mounted() {
    this.initFormData()
    this.getReserveStatus()
  },
  methods: {
    loadDeptIdDropdownList() {
      return new Promise((resolve, reject) => {
        let params = {}
        DictionaryController.dictSysDept(this, params)
          .then((res) => {
            resolve(treeDataTranslate(res.getList(), 'id'))
          })
          .catch((e) => {
            reject(e)
          })
      })
    },
    onDeptIdVisibleChange(show) {
      return this.deptId.impl.onVisibleChange(show).catch((e) => {})
    },
    onDeptIdValueChange(value) {
      this.dataValue.deptId = Array.isArray(value) ? value[value.length - 1] : undefined
    },
    getReserveStatus() {
      CwProject.reserveStatus(this, {}).then((res) => {
        this.reserveStatus = res.data
      })
    },
    async initFormData() {
      await this.onDeptIdVisibleChange(true)
      this.dataValue = {
        ...this.dataValue,
        affiliateDeptIdList: [this.$utils.findParentPathIterative(this.deptId.impl.dropdownList, this.getUserInfo.deptId)]
      }
      this.yearList({}, (res) => {
        this.year = [...res.map((item) => ({ label: item, value: item }))]
      })
    },
    handleSelectionChange(selectedValues, dataKey = 'batchId') {
      const hasAll = selectedValues.includes('-1')
      const lastSelected = selectedValues[selectedValues.length - 1]

      if (hasAll && lastSelected === '-1') {
        this.dataValue[dataKey] = ['-1']
        return
      }

      if (hasAll && lastSelected !== '-1') {
        this.dataValue[dataKey] = selectedValues.filter((item) => item !== '-1')
      }

      if (this.dataValue[dataKey].length === 0) {
        this.dataValue[dataKey] = [selectedValues[0]]
      }
    },
    getFinanceReserveNotice(params, callback = () => {}) {
      return FinanceReserveNotice.list(this, params).then((res) => {
        const [obj] = res.data?.dataList
        callback(res.data)
      })
    },
    yearList(params, callback = () => {}) {
      return FinanceReserveNotice.yearList(this, params, null, { showMask: false }).then((res) => {
        callback(res.data)
      })
    },
    addApi(callback) {
      const { type, batchId, ...other } = this.dataValue
      if (type == '1') {
        CwProjectApply.exportApplyMulti2(this, {
          cwProjectApproveDtoFilter: {
            ...other,
            vtSource: this.vtSource,
            type,
            batchIds: batchId?.join(',')
          }
        })
      }
      if (type == '2') {
        CwProjectApply.exportReviewOpinionMulti(this, {
          cwProjectApproveDtoFilter: {
            ...other,
            vtSource: this.vtSource,
            type,
            batchIds: batchId?.join(',')
          }
        })
      }
      if (type == '5') {
        CwProjectApply.preliminaryExaminationExecl(this, {
          cwProjectApproveDtoFilter: {
            ...other,
            vtSource: this.vtSource,
            type,
            batchIds: batchId?.join(',')
          }
        })
      }
      callback()
    },
    onCancel(isSuccess = false, data) {
      if (this.observer != null) {
        this.observer.cancel(isSuccess, data)
      }
    },
    onSubmit() {
      this.$refs.form.handleSubmit(() => {
        this.buttonLoading = true
        this.addApi(() => {
          this.buttonLoading = false
          this.onCancel(true)
        })
      })
    }
  },
  computed: {
    infoOptions() {
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
            ].filter((item) => (this.exportOptions ? this.exportOptions.includes(item.value * 1) : item))
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
            props: { value: 'id', label: 'name', checkStrictly: false, multiple: true },
            loading: this.deptId?.impl?.loading,
            options: this.deptId?.impl?.dropdownList || [],
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
              ...this.reserveStatus.map((item) => ({
                value: item.key,
                label: item.value
              }))
            ].filter((item) => item.value != this.StatusReserveDict.PENDING_SUBMIT)
          },
          listeners: {
            change: (data) => this.handleSelectionChange(data, 'reserveStatuses')
          }
        },
        {
          tag: 'select',
          prop: 'year',
          label: '储备年份',
          attrs: {
            props: { value: 'value', label: 'label' },
            options: this.year || [],
            filterable: true
          },
          listeners: {
            change: (year) => {
              this.dataValue = {
                ...this.dataValue,
                year,
                batchId: undefined
              }

              this.getFinanceReserveNotice({ financeReserveNoticeDtoFilter: { year } }, (res) => {
                this.batchId = [...res.dataList]
              })
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
            props: { value: 'reserveId', label: 'batchTitle' },
            options: this.dataValue.year
              ? [
                  {
                    reserveId: '-1',
                    batchTitle: '全部'
                  },
                  ...this.batchId
                ]
              : []
          },
          listeners: {
            change: (data) => this.handleSelectionChange(data, 'batchId')
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
    }
  },
  watch: {}
}
</script>
<style lang="less" scoped>
:deep(.config-item) {
  .el-select__tags {
    max-width: 100% !important;
  }
}
</style>

<template>
  <dialogContainer ref="dialogContainer" :buttonLoading="buttonLoading" :onCancel="() => onCancel(false)" :onSubmit="() => onSubmit()">
    <FormConfigBox :config="{ rules, labelWidth: '220px' }" ref="formConfigBox" class="publicSet" :options="options" v-model="dataValue" />
    <div class="floor-info">注:配置修改生效后，对之前的对比结果不产生影响</div>
  </dialogContainer>
</template>
<script>
import { CwProjectApprove } from '@/api/mainController'

export default {
  components: {},
  props: {},
  name: 'similarSetting',
  data() {
    return {
      buttonLoading: false,
      dataValue: {},
      rules: {
        diffMinValue: [
          { required: true, message: '请输入向量结果展示阈值（类型）', trigger: 'blur' },
          { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的数字，最多保留两位小数', trigger: 'blur' }
        ],
        riskMinValue: [
          { required: true, message: '请输入相似度风险预警阈值（类型）', trigger: 'blur' },
          { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的数字，最多保留两位小数', trigger: 'blur' }
        ],
        itemDiffMinValue: [
          { required: true, message: '请输入向量结果展示阈值（事项）', trigger: 'blur' },
          { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的数字，最多保留两位小数', trigger: 'blur' }
        ],
        itemVectorValue: [
          { required: true, message: '请输入项目剔除阈值（事项）', trigger: 'blur' },
          { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的数字，最多保留两位小数', trigger: 'blur' }
        ],
        itemRiskMinValue: [
          { required: true, message: '请输入相似度风险预警阈值（事项）', trigger: 'blur' },
          { pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的数字，最多保留两位小数', trigger: 'blur' }
        ]
      }
    }
  },
  created() {},
  mounted() {
    this.getInfo()
  },
  methods: {
    getInfo() {
      return CwProjectApprove.viewDiffConfig(this).then((res) => {
        this.dataValue = {
          ...res.data,
          diffRange: +res.data?.diffRange,
          diffMinValue: +res.data?.diffMinValue,
          riskMinValue: +res.data?.riskMinValue,
          itemDiffMinValue: +res.data?.itemDiffMinValue,
          itemRiskMinValue: +res.data?.itemRiskMinValue,
          itemVectorValue: +res.data?.itemVectorValue,
          amountCalcErrorValue: +res.data?.amountCalcErrorValue,
          historyCostErrorValue: +res.data?.historyCostErrorValue
        }
      })
    },
    addApi(callback = () => {}) {
      return CwProjectApprove.updateDiffConfig(this, {
        cwProjectDiffConfigVo: {
          ...this.dataValue
        }
      }).then((res) => {
        this.$message.success('操作成功')
        callback(res.data)
      })
    },
    onCancel(isSuccess = false, data) {
      if (this.observer != null) {
        this.observer.cancel(isSuccess, data)
      }
    },
    onSubmit() {
      this.$refs.formConfigBox.handleSubmit((val) => {
        this.buttonLoading = true
        this.addApi((res) => {
          this.onCancel(true, res)
        }).finally(() => {
          this.buttonLoading = false
        })
      })
    }
  },
  computed: {
    options() {
      return [
        {
          tag: 'radio-group',
          prop: 'diffProjectCategory',
          label: '对比类型',
          value: '2',
          attrs: {
            isButton: true,
            options: [
              { value: '2', label: '同类型' },
              { value: '1', label: '全部类型' }
            ]
          }
        },
        {
          tag: 'radio-group',
          prop: 'diffProjectStatus',
          label: '对比状态',
          value: '2',
          attrs: {
            isButton: true,
            options: [
              { value: '2', label: '已储备' },
              { value: '1', label: '已提交' }
            ]
          }
        },
        {
          tag: 'number',
          prop: 'diffMinValue',
          label: '向量结果展示阈值（类型）',
          value: 0,
          attrs: {
            precision: 2
          }
        },
        {
          tag: 'number',
          prop: 'riskMinValue',
          label: '相似度风险预警阈值（类型）',
          value: 0,
          attrs: {
            precision: 2
          }
        },
        {
          tag: 'number',
          prop: 'itemDiffMinValue',
          label: '向量结果展示阈值（事项）',
          value: 0,
          attrs: {
            precision: 2
          }
        },
        {
          tag: 'number',
          prop: 'itemVectorValue',
          label: '项目剔除阈值（事项）',
          value: 0,
          attrs: {
            precision: 2
          }
        },
        {
          tag: 'number',
          prop: 'itemRiskMinValue',
          label: '相似度风险预警阈值（事项）',
          value: 0,
          attrs: {
            precision: 2
          }
        },
        {
          tag: 'number',
          prop: 'amountCalcErrorValue',
          label: '申请金额计算误差（万元）',
          value: 0,
          attrs: {
            precision: 2
          }
        },
        {
          tag: 'number',
          prop: 'historyCostErrorValue',
          label: '历史费用比对误差（%）',
          value: 0,
          attrs: {
            precision: 2
          }
        },
        {
          tag: 'textarea',
          prop: 'sensitiveWords',
          label: '敏感词',
          value: '',
          attrs: {
            placeholder: '请输入敏感词，多个敏感词之间用分号隔开，如:换流站;源网荷储'
          }
        }
      ]
    }
  },
  watch: {}
}
</script>
<style lang="scss" scoped></style>

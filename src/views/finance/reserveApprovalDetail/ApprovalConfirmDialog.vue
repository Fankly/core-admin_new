<template>
  <dialogContainer
    submitLabel="确认"
    :buttonLoading="buttonLoading"
    class="ApprovalConfirmDialog"
    ref="dialogContainer"
    :onCancel="() => onCancel(false)"
    :onSubmit="() => onSubmit()"
  >
    <FormConfigBox :config="{ rules }" ref="form" :options="infoOptions" v-model="dataValue"> </FormConfigBox>
    <div class="info">注：以上为不含税金额，单位统一为万元</div>
  </dialogContainer>
</template>
<script>
import { CwProjectApply, FinanceReserveNotice, Category, CwCategoryInvest } from '@/api/mainController'

const AmountPattern = {
  pattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  message: '请输入有效的金额（非负，最多两位小数）',
  trigger: 'blur'
}

const Subtract = (a, b) => {
  const multiplier = Math.pow(10, Math.max(a.toString().split('.')[1]?.length || 0, b.toString().split('.')[1]?.length || 0))
  return (a * multiplier - b * multiplier) / multiplier
}

export default {
  components: {},
  props: {
    applyTaxExclusive: [String, Number]
  },
  name: '/finance/reserveApprovalDetail/ApprovalConfirmDialog',
  data() {
    return {
      buttonLoading: false,
      dataValue: {},
      rules: {
        applyTaxExclusive: [{ required: true, message: '请输入申请总额', trigger: 'blur' }, AmountPattern],
        verifiedAmount: [
          { required: true, message: '请输入核定金额', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value > this.dataValue.applyTaxExclusive) {
                callback(new Error('核定金额 不能大于 申请总额'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          },
          AmountPattern
        ],
        reductionAmount: [{ required: true, message: '请输入核减金额', trigger: 'blur' }, AmountPattern]
      },
      batchId: []
    }
  },
  created() {
    this.dataValue = {
      applyTaxExclusive: this.applyTaxExclusive,
      verifiedAmount: this.applyTaxExclusive,
      reductionAmount: 0
    }
  },
  mounted() {
    this.initFormData()
  },
  methods: {
    async initFormData() {},
    addApi() {},
    onCancel(isSuccess = false, data) {
      if (this.observer != null) {
        this.observer.cancel(isSuccess, data)
      }
    },
    onSubmit() {
      this.$refs.form.handleSubmit(() => {
        // this.buttonLoading = true;
        // this.addApi(() => {
        this.onCancel(true, this.dataValue)
        // })
        // .finally(() => {
        //   this.buttonLoading = false;
        // })
      })
    },
    changeAmount() {
      this.$nextTick(() => {
        const { applyTaxExclusive, verifiedAmount } = this.dataValue
        if (applyTaxExclusive != null && verifiedAmount != null) {
          const result = Subtract(applyTaxExclusive, verifiedAmount)
          this.dataValue = {
            ...this.dataValue,
            reductionAmount: result < 0 ? null : result
          }
        }
      })
    }
  },
  computed: {
    infoOptions() {
      return [
        {
          tag: 'number',
          prop: 'applyTaxExclusive',
          label: '申请总额',
          attrs: {
            disabled: true
          },
          listeners: {
            change: () => {
              this.changeAmount()
            }
          }
        },
        {
          tag: 'number',
          prop: 'verifiedAmount',
          label: '核定金额',
          listeners: {
            change: () => {
              this.changeAmount()
            }
          }
        },
        {
          tag: 'number',
          prop: 'reductionAmount',
          label: '核减金额',
          listeners: {
            change: () => {}
          }
        }
      ]
    }
  },
  watch: {}
}
</script>
<style lang="less" scoped>
.info {
  color: @color-primary-light-4;
  margin-left: 35px;
  font-size: 12px;
}
</style>

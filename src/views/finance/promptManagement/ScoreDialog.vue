<template>
  <dialogContainer :buttonLoading="buttonLoading" :onCancel="() => handleCancel()" :onSubmit="() => handleSubmit()" ref="dialogContainer">
    <FormConfigBox :config="{ rules }" ref="form" :options="infoOptions" v-model="formData">
      <template #effectScore>
        <el-rate v-model="formData.effectScore" :max="5" allow-half show-score text-color="#ff9900" />
      </template>
    </FormConfigBox>
  </dialogContainer>
</template>

<script>
export default {
  name: 'ScoreDialog',
  props: {
    id: {
      type: [String, Number],
      required: true
    },
    score: {
      type: [Number, String],
      default: 0
    },
    remark: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      buttonLoading: false,
      formData: {
        effectScore: 0,
        effectScoreRemark: ''
      }
    }
  },
  watch: {
    score: {
      immediate: true,
      handler(val) {
        this.formData.effectScore = val || 0
      }
    },
    remark: {
      immediate: true,
      handler(val) {
        this.formData.effectScoreRemark = val || ''
      }
    }
  },
  methods: {
    handleCancel() {
      if (this.observer != null) {
        this.observer.cancel(false)
      }
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          if (this.observer != null) {
            this.observer.cancel(true, this.formData)
          }
        }
      })
    }
  },
  computed: {
    rules() {
      return {}
    },
    infoOptions() {
      return [
        {
          prop: 'effectScore',
          label: '效果评分',
          slot: true
        },
        {
          tag: 'textarea',
          prop: 'effectScoreRemark',
          label: '备注说明',
          attrs: {
            placeholder: '请输入',
            rows: 5
          }
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
:deep(.el-form-item) {
  display: flex;
  align-items: center;

  .el-form-item__label {
    display: flex;
    align-items: center;
    width: auto !important;
  }

  .el-form-item__content {
    display: flex;
    align-items: center;
    margin-left: 0 !important;
    flex: 1;
  }
}
</style>

<template>
  <dialogContainer ref="dialogContainer" :onCancel="() => onCancel(false)" :onSubmit="() => onSubmit()">
    <FormConfigBox :config="{ rules }" ref="formConfigBox" class="publicSet" :options="options" v-model="reason" />
  </dialogContainer>
</template>
<script>
export default {
  components: {},
  props: {},
  name: 'rejectReason',
  data() {
    return {
      reason: {},
      rules: {
        reason: { required: true, message: '请输入驳回理由', trigger: 'blur' }
      }
    }
  },
  created() {},
  mounted() {},
  methods: {
    onCancel(isSuccess = false, data) {
      if (this.observer != null) {
        this.observer.cancel(isSuccess, data)
      }
    },
    onSubmit() {
      this.$refs.formConfigBox.handleSubmit((val) => {
        this.onCancel(true, this.reason)
      })
    }
  },
  computed: {
    options() {
      return [
        {
          tag: 'textarea',
          prop: 'reason',
          label: '驳回理由',
          attrs: {}
        }
      ]
    }
  },
  watch: {}
}
</script>
<style lang="less" scoped></style>

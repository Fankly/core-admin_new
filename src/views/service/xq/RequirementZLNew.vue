<template>
  <RequirementFormBase cart-modal-component="ZlMyCartNew" business-type="sfzl" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import RequirementFormBase from './components/RequirementFormBaseNew.vue'

export default defineComponent({
  name: '/service/xq/RequirementZLNew',
  components: {
    RequirementFormBase
  }
})
</script>

<template>
  <RequirementFormBase business-type="sfgmblr" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RequirementFormBase from "./components/RequirementFormBase.vue";

export default defineComponent({
  name: "/service/xq/RequirementGMB",
  components: {
    RequirementFormBase
  }
});
</script>

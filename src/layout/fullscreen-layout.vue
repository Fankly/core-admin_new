<script lang="ts">
import { defineComponent } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import RouteLoading from "@/components/Loading/index.vue";

/**
 * 全屏布局
 */
export default defineComponent({
  name: "FullScreenLayout",
  components: { RouteLoading },
  setup() {
    const route = useRoute();
    const store = useStore();
    return { route, store };
  }
});
</script>
<template>
  <div :class="`rr-fullscreen ${route.query.pop ? 'new-pop-window' : ''}`">
    <div class="fullscreen-router-wrapper">
      <router-view />
      <RouteLoading :visible="store.getters.getRouteLoading" />
    </div>
  </div>
</template>

<style lang="less" scoped>
.fullscreen-router-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>

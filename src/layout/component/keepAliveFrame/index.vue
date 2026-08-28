<script setup lang="ts">
import { Component, shallowRef, watch, computed } from "vue";
import { RouteRecordRaw, RouteLocationNormalizedLoaded } from "vue-router";
import { useMultiFrame } from "@/layout/component/keepAliveFrame/useMultiFrame";
import app from "@/constants/app";
import { useStore } from "vuex";

const props = defineProps<{
  currRoute: RouteLocationNormalizedLoaded;
  currComp: Component;
}>();

const compList: any = shallowRef([]);
const { setMap, getMap, MAP, delMap } = useMultiFrame();

const store = useStore();
const keep = computed(() => {
  return app.enabledKeepAlive && props.currRoute.meta?.isIframe && !!props.currRoute.meta?.frameSrc;
});
// 避免重新渲染 frameView
const normalComp = computed(() => !keep.value && props.currComp);

// 监听store.state.tabs变化
watch(
  () => store.state.tabs,
  (tags: any) => {
    if (!Array.isArray(tags) || !keep.value) {
      return;
    }
    const iframeTags = tags.filter((i) => i.mete?.frameSrc);
    // tags必须是小于MAP，才是做了关闭动作，因为MAP插入的顺序在tags变化后发生
    if (iframeTags.length < MAP.size) {
      for (const i of MAP.keys()) {
        if (!tags.some((s) => s.value === i)) {
          delMap(i);
          compList.value = getMap();
        }
      }
    }
  },
  {
    deep: true
  }
);

watch(
  () => props.currRoute.fullPath,
  (path) => {
    const multiTags = store.state.tabs as RouteRecordRaw[];
    const iframeTags = multiTags.filter((i: any) => i.mete?.frameSrc);
    if (keep.value) {
      if (iframeTags.length !== MAP.size) {
        const sameKey = [...MAP.keys()].find((i) => path === i);
        if (!sameKey) {
          // 添加缓存
          setMap(path, props.currComp);
        }
      }
    }
    if (MAP.size > 0) {
      compList.value = getMap();
    }
  },
  {
    immediate: true
  }
);
</script>
<template>
  <template v-for="[fullPath, Comp] in compList" :key="fullPath">
    <div v-show="fullPath === props.currRoute.fullPath" class="w-full h-full">
      <slot :fullPath="fullPath" :Comp="Comp" :frameInfo="{ frameSrc: currRoute.meta?.frameSrc, fullPath }" />
    </div>
  </template>
  <div v-show="!keep" class="comp-layout">
    <slot :Comp="normalComp" :fullPath="props.currRoute.fullPath" frameInfo />
  </div>
</template>

<style lang="less" scoped>
.comp-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

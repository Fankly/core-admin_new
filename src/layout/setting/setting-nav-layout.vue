<script lang="ts">
import { EMitt, ESidebarLayoutEnum, EThemeSetting } from "@/constants/enum";
import { IObject } from "@/types/interface";
import emits from "@/utils/emits";
import { getThemeConfigCacheByKey } from "@/utils/theme";
import { defineComponent, reactive } from "vue";
import SettingSwitch from "@/components/base/setting-switch.vue";

/**
 * 导航模式设置
 */
export default defineComponent({
  name: "SettingNavLayout",
  components: { SettingSwitch },
  props: { value: Object, onChange: Function },
  setup(props) {
    const layout = [
      { label: "左侧菜单布局", value: ESidebarLayoutEnum.Left },
      { label: "顶部菜单布局", value: ESidebarLayoutEnum.Top },
      { label: "混合菜单布局", value: ESidebarLayoutEnum.Mix }
    ];
    const layoutToTheme: IObject<string> = {
      left: "side dark",
      top: "header dark",
      mix: "header dark mix"
    };
    const state = reactive<IObject>({
      active: {
        layout: getThemeConfigCacheByKey(EThemeSetting.NavLayout, props.value),
        full: getThemeConfigCacheByKey(EThemeSetting.ContentFull, props.value)
      },
      themeClass: {}
    });
    const onSetTheme = (type: string, key: EThemeSetting, value: string | boolean) => {
      onSet(type, key, value);
      emits.emit(EMitt.OnSetNavLayout, value);
    };
    const onSet = (type: string, key: EThemeSetting, value: string | boolean) => {
      state.active[type] = value;
      state.themeClass[key] = value;
      emits.emit(EMitt.OnSetTheme, [key, `${key}-${value}`]);
      props.onChange && props.onChange(key, value);
    };
    const onSetContentFull = () => {
      onSet("full", EThemeSetting.ContentFull, !state.active.full);
    };
    return { state, layout, layoutToTheme, onSetTheme, onSetContentFull, EThemeSetting };
  }
});
</script>
<template>
  <el-space direction="vertical" :size="15" alignment="flex-start" class="rr-theme">
    <span class="rr-setting-title text-2">{{ "布局模式" }}</span>
    <el-space>
      <el-tooltip v-for="x in layout" :key="x.value" :class="`card navlayout ${layoutToTheme[x.value]} ${state.active.layout === x.value ? 'active' : ''}`" effect="dark" :content="x.label" placement="top">
        <span @click="onSetTheme('layout', EThemeSetting.NavLayout, x.value)"></span>
      </el-tooltip>
    </el-space>
    <setting-switch title="内容区域铺满" :value="state.active.full" :onChange="onSetContentFull"></setting-switch>
  </el-space>
</template>

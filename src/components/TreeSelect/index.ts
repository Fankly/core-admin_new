import TreeSelect from "./index.vue";
import { App } from "vue";

// 确保组件名称存在
const NAME = "TreeSelect";
// @ts-ignore
TreeSelect.name = TreeSelect.name || NAME;

TreeSelect.install = function (Vue: App) {
  Vue.component(TreeSelect.name as string, TreeSelect);
};

export default TreeSelect;

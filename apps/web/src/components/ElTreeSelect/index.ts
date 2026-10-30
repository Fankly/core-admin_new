import ElTreeSelect from "./index.vue";

import {App} from "vue";


const NAME = "ElTreeSelect";

// @ts-ignore
ElTreeSelect.name = ElTreeSelect.name || NAME;

ElTreeSelect.install = function (Vue:App) {
  Vue.component(ElTreeSelect.name as string, ElTreeSelect);
}

export default ElTreeSelect;
import { App } from "vue";
import Loading from "./index.vue";
import { showFullScreenLoading, tryHideFullScreenLoading } from "@/components/Loading/fullScreen";
import { loadingDirective, spinningDirective } from "./directive";

export { showFullScreenLoading, tryHideFullScreenLoading };
export { default as AppLoading } from './loading.vue';
export { default as AppSpinner } from './spinner.vue';
export { loadingDirective, spinningDirective };

Loading.name = "Loading";

const LoadingPlugin = {
  install(app: App) {
    app.component(Loading.name as string, Loading);
    app.component('AppLoading', () => import('./loading.vue'));
    app.component('AppSpinner', () => import('./spinner.vue'));

    // 注册指令（使用自定义前缀避免与 Element Plus 冲突）
    app.directive('app-loading', loadingDirective);
    app.directive('app-spinning', spinningDirective);

    app.config.globalProperties.$loading = {
      show: showFullScreenLoading,
      hide: tryHideFullScreenLoading
    };
  }
};

export default LoadingPlugin;

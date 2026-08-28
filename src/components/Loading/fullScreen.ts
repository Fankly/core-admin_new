import { createApp, h } from "vue";
import Loading from "./spinner.vue";

let loadingInstance: any = null;
let container: HTMLElement | null = null;

const createLoadingComponent = () => {
  if (container) return;

  try {
    container = document.createElement("div");
    container.className = "ant-spin-fullscreen";

    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.right = "0";
    container.style.bottom = "0";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.backgroundColor = "rgba(255,255,255,0.9)";
    container.style.backdropFilter = "blur(4px)";
    container.style.overflow = "hidden";

    const loadingApp = createApp({
      render() {
        return h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }
        }, [
          h(Loading, { spinning: true })
        ]);
      }
    });

    document.body.appendChild(container);

    loadingInstance = loadingApp.mount(container);

    document.body.classList.add("loading-active");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error(error);
  }
};

export const startLoading = () => {
  if (!loadingInstance) {
    createLoadingComponent();
  }
};

export const endLoading = () => {
  if (loadingInstance && container) {
    document.body.classList.remove("loading-active");
    document.body.style.overflow = "";
    try {
      if (container.parentNode === document.body) {
        document.body.removeChild(container);
      }
      loadingInstance = null;
      container = null;
    } catch (error) {
      console.error('Error removing loading container:', error);
      // 强制重置状态
      loadingInstance = null;
      container = null;
    }
  }
};

let needLoadingRequestCount = 0;

export const showFullScreenLoading = () => {
  if (needLoadingRequestCount === 0) {
    startLoading();
  }
  needLoadingRequestCount++;
};

export const tryHideFullScreenLoading = () => {
  if (needLoadingRequestCount <= 0) {
    return;
  }
  needLoadingRequestCount--;
  if (needLoadingRequestCount === 0) {
    endLoading();
  }
};

// 强制重置loading状态，用于异常情况
export const resetFullScreenLoading = () => {
  needLoadingRequestCount = 0;
  endLoading();
};

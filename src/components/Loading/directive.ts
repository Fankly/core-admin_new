import { createApp, DirectiveBinding, VNode } from 'vue';
import { AppLoading, AppSpinner } from './index';

interface LoadingElement extends HTMLElement {
  _loadingInstance?: any;
  _loadingApp?: any;
}

// Loading 指令实现
const loadingDirective = {
  mounted(el: LoadingElement, binding: DirectiveBinding) {
    // 检查是否已有 Element Plus 的 loading
    if (el.querySelector('.el-loading-mask')) {
      return;
    }
    if (binding.value) {
      createLoadingInstance(el, binding, 'loading');
    }
  },
  updated(el: LoadingElement, binding: DirectiveBinding) {
    // 检查是否已有 Element Plus 的 loading
    if (el.querySelector('.el-loading-mask')) {
      return;
    }
    if (binding.value !== binding.oldValue) {
      if (binding.value) {
        createLoadingInstance(el, binding, 'loading');
      } else {
        removeLoadingInstance(el);
      }
    }
  },
  beforeUnmount(el: LoadingElement) {
    removeLoadingInstance(el);
  }
};

// Spinning 指令实现
const spinningDirective = {
  mounted(el: LoadingElement, binding: DirectiveBinding) {
    // 检查是否已有 Element Plus 的 loading
    if (el.querySelector('.el-loading-mask')) {
      return;
    }
    if (binding.value) {
      createLoadingInstance(el, binding, 'spinning');
    }
  },
  updated(el: LoadingElement, binding: DirectiveBinding) {
    // 检查是否已有 Element Plus 的 loading
    if (el.querySelector('.el-loading-mask')) {
      return;
    }
    if (binding.value !== binding.oldValue) {
      if (binding.value) {
        createLoadingInstance(el, binding, 'spinning');
      } else {
        removeLoadingInstance(el);
      }
    }
  },
  beforeUnmount(el: LoadingElement) {
    removeLoadingInstance(el);
  }
};

// 创建加载实例
function createLoadingInstance(el: LoadingElement, binding: DirectiveBinding, type: 'loading' | 'spinning') {
  if (el._loadingInstance) {
    return;
  }

  // 确保目标元素有相对定位
  const originalPosition = getComputedStyle(el).position;
  if (originalPosition === 'static') {
    el.style.position = 'relative';
  }

  // 创建加载容器
  const loadingContainer = document.createElement('div');
  loadingContainer.style.position = 'absolute';
  loadingContainer.style.top = '0';
  loadingContainer.style.left = '0';
  loadingContainer.style.width = '100%';
  loadingContainer.style.height = '100%';
  loadingContainer.style.zIndex = '1000';

  // 获取指令修饰符和参数
  const text = binding.arg || '加载中...';
  const Component = type === 'loading' ? AppLoading : AppSpinner;

  // 创建 Vue 应用实例
  const app = createApp(Component, {
    spinning: true,
    text: type === 'loading' ? text : undefined,
    className: 'directive-loading'
  });

  // 挂载到容器
  el.appendChild(loadingContainer);
  const instance = app.mount(loadingContainer);

  // 保存实例引用
  el._loadingApp = app;
  el._loadingInstance = instance;
}

// 移除加载实例
function removeLoadingInstance(el: LoadingElement) {
  if (el._loadingApp && el._loadingInstance) {
    try {
      el._loadingApp.unmount();
      const container = el.querySelector('.directive-loading')?.parentElement;
      if (container && container.parentNode === el) {
        el.removeChild(container);
      }
    } catch (error) {
      console.error('移除加载实例失败:', error);
    }
    el._loadingApp = null;
    el._loadingInstance = null;
  }
}

export { loadingDirective, spinningDirective };
<template>
  <div class="process-step" @click="showDropdown" @mouseleave="hideDropdown">
    <div class="step-content">
      <div class="step-header">
        <div class="step-icon">
          <img v-if="step.icon === '1'" src="@/assets/images/zl/wendangxinxi.svg" :alt="step.appName" />
          <img v-if="step.icon === '2'" src="@/assets/images/zl/iconfront-.svg" :alt="step.appName" />
          <img v-if="step.icon === '3'" src="@/assets/images/zl/xingzhuangjiehe.svg" :alt="step.appName" />
          <img v-if="step.icon === '4'" src="@/assets/images/zl/wendangxiazai.svg" :alt="step.appName" />
        </div>
      </div>
      <div class="step-body">
        <div class="step-title">{{ step.appName }}</div>
        <!-- <div class="step-desc">鼠标移入查看更多</div> -->
      </div>
    </div>
    <div class="step-dropdown" :class="{ show: dropdownVisible }" @mouseenter="showDropdown" @mouseleave="hideDropdown">
      <div class="dropdown-menu">
        <div v-for="action in step.menus" :key="action.id" class="dropdown-item" :class="{ disabled: !action.hasPermision }" @click="handleActionClick(action)">
          {{ action.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, onBeforeUnmount, ref,defineExpose } from "vue";
import { useRouter } from "vue-router";
import baseService from "@/service/baseService";
import { useStore } from "vuex";



// Props定义
interface StepAction {
  id: string;
  name: string;
  hasPermision: boolean;
  url: string;
  outsideMenu:string
}

interface Step {
  appId: string;
  appName: string;
  appIcon: string;
  icon: string;
  menus: StepAction[];
  userInfo:any
}

const props = defineProps<{
  step: Step;
}>();

// Emits定义
const emit = defineEmits(["action-click"]);

const userInfo=ref<any>({})

const store = useStore();


// 获取路由实例
const router = useRouter();

// 响应式数据
const dropdownVisible = ref(false);
const hideTimeout = ref(null as ReturnType<typeof setTimeout> | null);

// 显示下拉菜单
const showDropdown = () => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }
  dropdownVisible.value = true;
};

// 隐藏下拉菜单
const hideDropdown = () => {
  hideTimeout.value = setTimeout(() => {
    dropdownVisible.value = false;
    hideTimeout.value = null;
  }, 200);
};

// 处理操作点击
const handleActionClick =async (action: StepAction) => {
  if (!action.hasPermision) {
    return;
  }
  console.log(action,'actionaction');
  console.log(props.step.userInfo,'props.stepprops.step');


  let res = await baseService.get(`/sysMenu/getButtonList?menuCode=${action.outsideMenu}&spRoleId=${props.step.userInfo.id}`);
  if (res.success) {
    if (res.success) {
      store.commit("setPermissions", res.data);
    }
  }

  // 如果有URL，进行页面跳转
  if (action.url) {
    router.push({
      name: action.url,
      params: { formJsc: "1" }
    });
  } else {
    // 否则触发事件给父组件处理
    emit("action-click", action, props.step);
  }
};

// 组件卸载前清理定时器
onBeforeUnmount(() => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
  }
});

defineExpose({
  userInfo
})
</script>

<style scoped>
.process-step {
  position: relative;
  display: flex;
  align-items: stretch;
  background: linear-gradient(135deg, rgba(0, 112, 107, 0.1) 0%, rgba(248, 250, 252, 0.9) 100%);
  border: 2px solid rgba(0, 112, 107, 0.3);
  padding: 0;
  border-radius: 16px;
  height: 200px;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 112, 107, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: visible;
  flex: 1;
  max-width: none;
  color: #00706b;
  backdrop-filter: blur(10px);
}

.process-step:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 8px 32px rgba(0, 112, 107, 0.2);
  background: linear-gradient(135deg, rgba(0, 112, 107, 0.5) 0%, rgba(240, 248, 255, 0.95) 100%);
  border-color: rgba(0, 112, 107, 1);
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  padding: 24px 16px;
  height: 100%;
  position: relative;
}

.step-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  gap: 12px;
}

.step-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.step-desc {
  font-size: 12px;
  color: rgba(0, 112, 107, 0.6);
  font-weight: 400;
  line-height: 1.3;
}

.step-icon {
  width: 56px;
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  z-index: 2;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 251, 255, 0.8) 100%);
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(0, 112, 107, 0.12);
  border: 2px solid rgba(0, 112, 107, 0.1);
}

.step-icon::before {
  content: "";
  position: absolute;
  inset: -9px;
  border-radius: 40px;
  background: linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #fff));
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
}

.process-step:hover .step-icon {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 112, 107, 0.25);
  background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 248, 255, 0.95) 100%);
  border-color: var(--color-primary);
}

.process-step:hover .step-icon::before {
  opacity: 0.3;
}

.process-step:hover .step-icon img {
  filter: brightness(0) saturate(100%) invert(39%) sepia(65%) saturate(1052%) hue-rotate(138deg) brightness(96%) contrast(97%);
  transform: scale(1.1);
}

.step-title {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
  letter-spacing: 0.3px;
  color: inherit;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  margin: 0;
  padding: 0;
  max-width: 100%;
  word-wrap: break-word;
}

.process-step:hover .step-title {
  transform: translateY(-1px);
  color: var(--color-primary);
  font-weight: 700;
}

.step-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(0, 112, 107, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 112, 107, 0.12);
  z-index: 1000;
  margin-top: 12px;
  overflow: hidden;
  min-width: 220px;
  display: none;
  animation: slideDown 0.3s ease;
}

.step-dropdown::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 8px;
  background: transparent;
  z-index: 1;
}

.step-dropdown.show {
  display: block;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-menu {
  padding: 8px 0;
}

.dropdown-item {
  padding: 14px 18px;
  cursor: pointer;
  color: #4a5568;
  border-bottom: 1px solid rgba(0, 112, 107, 0.08);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: transparent;
}

.dropdown-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-primary);
  transform: scaleY(0);
  transition: transform 0.3s ease;
  border-radius: 0 3px 3px 0;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, rgba(0, 112, 107, 0.04) 0%, rgba(240, 248, 255, 0.6) 100%);
  color: var(--color-primary);
  transform: translateX(2px);
  font-weight: 600;
}

.dropdown-item:hover::before {
  transform: scaleY(1);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item.disabled {
  color: #a0aec0;
  cursor: not-allowed;
  background: transparent;
  opacity: 0.6;
}

.dropdown-item.disabled:hover {
  background: transparent;
  color: #a0aec0;
  transform: none;
  font-weight: 500;
}

.dropdown-item.disabled::before {
  display: none;
}

.step-icon img {
  width: 28px;
  height: 28px;
  filter: brightness(0) saturate(100%) invert(39%) sepia(65%) saturate(1052%) hue-rotate(138deg) brightness(96%) contrast(97%);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
</style>

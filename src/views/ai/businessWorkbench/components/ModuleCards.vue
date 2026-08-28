<template>
  <section class="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3 animate-fade-in-up">
    <div
      v-for="(module, idx) in moduleConfigs"
      :key="module.id"
      class="bw-module-card tw-border tw-transition-all tw-duration-300 tw-relative tw-overflow-hidden tw-flex tw-flex-col tw-justify-between animate-fade-in-up"
      :class="
        module.loading
          ? [module.bgColor, 'tw-rounded-xl tw-p-3 tw-cursor-not-allowed tw-select-none tw-shadow-sm']
          : module.hasPermission === false
          ? [module.bgColor, 'tw-rounded-xl tw-p-3 tw-cursor-not-allowed tw-select-none tw-shadow-sm']
          : [
              module.bgColor,
              'tw-rounded-xl tw-p-3 tw-cursor-pointer hover:tw-shadow-md hover:tw-shadow-slate-100',
              { 'is-selected': isSelected(module.id) }
            ]
      "
      :style="{ animationDelay: `${idx * 40}ms`, borderBottomLeftRadius: 'var(--radius, 12px)' }"
      :title="module.hasPermission === false && !module.loading ? module.permissionText || '该角色无此模块操作权限' : ''"
      @click="selectModule(module)"
    >
      <div
        v-if="module.hasPermission === true && !module.loading"
        class="tw-absolute -tw-right-8 -tw-bottom-8 tw-w-24 tw-h-24 tw-rounded-full tw-bg-white/20 tw-blur-xl tw-pointer-events-none"
      ></div>

      <div class="tw-flex tw-items-center tw-justify-between tw-gap-2.5 tw-relative tw-z-10">
        <div class="tw-flex tw-items-center tw-min-w-0" :class="module.hasPermission === true && !module.loading ? 'tw-gap-2.5' : 'tw-gap-3.5'">
          <div
            class="tw-p-2.5 tw-shrink-0"
            :class="
              module.loading || module.hasPermission === false
                ? 'tw-rounded-lg tw-bg-white/80 tw-shadow-sm tw-border tw-border-slate-100/80 tw-text-slate-400'
                : 'tw-rounded-lg tw-bg-white tw-shadow-sm tw-border tw-border-slate-100/80'
            "
          >
            <component
              :is="getIconComponent(module.icon)"
              class="tw-h-5 tw-w-5"
              :class="module.hasPermission === true && !module.loading ? module.color : 'tw-text-slate-400'"
              :stroke-width="2"
            />
          </div>
          <div class="tw-min-w-0">
            <h3
              class="tw-font-bold tw-leading-tight tw-truncate"
              :class="module.loading || module.hasPermission === false ? 'tw-text-slate-600 tw-text-lg' : 'tw-text-slate-800 tw-text-lg'"
            >
              {{ module.title }}
            </h3>
            <p v-if="module.loading || module.hasPermission === false" class="tw-text-xs tw-text-slate-500/90 tw-mt-0.5 tw-mb-0">
              {{ module.loading ? '正在校验模块权限' : module.permissionText || '该角色无此模块操作权限' }}
            </p>
          </div>
        </div>
        <span
          class="tw-px-2 tw-py-0.5 tw-flex tw-items-center tw-gap-1 tw-shrink-0 tw-transition-all tw-duration-150"
          :class="
            module.loading || module.hasPermission === false
              ? 'tw-text-[9px] tw-font-extrabold tw-rounded-full tw-bg-slate-200/60 tw-text-slate-500'
              : isSelected(module.id)
              ? 'tw-text-xs tw-font-bold tw-rounded-md tw-border tw-bg-sggreen-500 tw-text-white tw-border-sggreen-500'
              : `tw-text-xs tw-font-bold tw-rounded-md tw-border tw-bg-white/90 ${module.color} tw-border-slate-100`
          "
        >
          <component
            :is="module.loading ? LoaderCircle : module.hasPermission === false ? Lock : Check"
            :class="module.loading ? 'tw-w-2.5 tw-h-2.5 tw-animate-spin' : module.hasPermission === false ? 'tw-w-2.5 tw-h-2.5' : 'tw-w-3 tw-h-3'"
            :stroke-width="3"
          />
          {{ module.loading ? '校验中' : module.hasPermission === false ? '未授权' : isSelected(module.id) ? '已选中' : '已授权' }}
        </span>
      </div>

      <div
        v-if="module.hasPermission === true && !module.loading"
        class="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-mt-3.5 tw-relative tw-z-10 tw-w-full"
      >
        <button
          v-for="menu in module.menus"
          :key="menu.id"
          class="tw-inline-flex tw-items-center tw-gap-1 tw-px-3.5 tw-py-1.5 tw-text-sm tw-font-semibold tw-rounded-lg tw-bg-white/90 hover:tw-bg-white tw-text-slate-600 hover:tw-text-sggreen-600 tw-border tw-border-slate-200/50 hover:tw-border-sggreen-500/30 tw-transition-all tw-duration-150 tw-group/btn hover:tw-shadow-sm"
          :class="{
            'tw-cursor-not-allowed tw-text-slate-400 hover:tw-text-slate-400 hover:tw-border-slate-200/50':
              module.hasPermission === false || menu.disabled
          }"
          :disabled="module.hasPermission === false || menu.disabled"
          @click.stop="handleMenuClick(module, menu)"
        >
          <span>{{ menu.label }}</span>
          <ChevronRight
            class="tw-w-3.5 tw-h-3.5 tw-text-slate-400 group-hover/btn:tw-text-sggreen-500 group-hover/btn:tw-translate-x-0.5 tw-transition-all tw-duration-150 tw-shrink-0"
            :stroke-width="2.5"
          />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ClipboardList, Users, Archive, Check, ChevronRight, Lock, LoaderCircle } from 'lucide-vue-next'
import type { MenuConfig, ModuleConfig, ModuleId } from '../types'

interface Props {
  moduleConfigs: ModuleConfig[]
  currentModuleId: ModuleId
}

interface Emits {
  (e: 'select-module', moduleId: ModuleId): void
  (e: 'menu-click', menu: MenuConfig): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'clipboard-list': ClipboardList,
    users: Users,
    archive: Archive
  }
  return iconMap[iconName] || ClipboardList
}

const isSelected = (moduleId: ModuleId) => props.currentModuleId === moduleId

const selectModule = (module: ModuleConfig) => {
  if (module.loading || module.hasPermission !== true) return
  emit('select-module', module.id)
}

const handleMenuClick = (module: ModuleConfig, menu: MenuConfig) => {
  if (module.loading || module.hasPermission !== true || menu.disabled) return
  emit('menu-click', menu)
}
</script>

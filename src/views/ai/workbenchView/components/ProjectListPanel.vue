<template>
  <aside id="workbench-project-list" class="project-panel glass-card">
    <div class="panel-heading">
      <div class="section-title">
        <span class="title-icon" aria-hidden="true"
          ><el-icon><Search /></el-icon
        ></span>
        <h2>项目审核查询</h2>
      </div>
      <button class="compact-action-button" type="button" :disabled="refreshing" @click="$emit('create-task')">
        <el-icon><Plus /></el-icon>创建任务
      </button>
    </div>

    <div class="search-box" role="search">
      <el-icon aria-hidden="true"><Search /></el-icon>
      <!-- 列表接口只按 taskName 过滤，placeholder 不能承诺项目编码检索 -->
      <input :value="keyword" type="search" placeholder="搜索任务名称或者编码" aria-label="搜索任务名称或者编码" @input="handleKeywordInput" />
    </div>

    <div class="status-tabs" role="tablist" aria-label="项目预审状态">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        type="button"
        :class="[statusClass(tab.value), { active: activeStatus === tab.value }]"
        @click="$emit('status-change', tab.value)"
      >
        <span class="status-tab-label"
          ><ReText>{{ tab.label }}</ReText></span
        >
      </button>
    </div>

    <div v-loading="refreshing" element-loading-text="正在加载项目" class="project-list">
      <button
        v-for="project in projects"
        :key="project.taskId"
        type="button"
        :class="['project-item', { active: selectedProject.taskId === project.taskId }]"
        @click="$emit('select-project', project)"
      >
        <span class="project-topline">
          <span class="project-code"
            ><ReText>{{ project.xmbm }}</ReText></span
          >
          <span :class="['status-chip', statusClass(project.status)]"
            ><ReText>{{ project.statusName }}</ReText></span
          >
        </span>
        <strong class="project-name"
          ><ReText>{{ project.xmmc }}</ReText></strong
        >
        <span class="project-foot">
          <span class="project-foot-meta">
            <span v-if="project.ejdw" class="project-unit"
              ><ReText>{{ project.ejdw }}</ReText></span
            >
            <span v-if="project.riskCount > 0" class="danger">{{ project.riskCount }} 项风险</span>
          </span>
          <span class="progress-link" @click.stop="$emit('open-progress', project)">
            查看进度 <el-icon><ArrowRight /></el-icon>
          </span>
        </span>
      </button>

      <!-- 加载中 / 加载失败 / 无数据 / 筛选无结果 四种情形分开，避免请求未完成就报「没有项目」 -->
      <div v-if="!refreshing && errorText" class="list-error-state" role="alert">
        <el-icon class="list-error-state__icon" aria-hidden="true"><WarningFilled /></el-icon>
        <strong>项目列表加载失败</strong>
        <span>{{ errorText }}</span>
        <button type="button" class="empty-state__action" @click="$emit('reload')">
          <el-icon aria-hidden="true"><Refresh /></el-icon>
          <span>重新加载</span>
        </button>
      </div>
      <div v-else-if="!refreshing && projects.length === 0" class="empty-state">
        <el-icon><Search /></el-icon>
        <template v-if="hasActiveFilter">
          <strong>未找到匹配项目</strong>
          <span>当前筛选条件下没有项目</span>
          <button type="button" class="empty-state__action" @click="$emit('clear-filters')">
            <el-icon aria-hidden="true"><Refresh /></el-icon>
            <span>清除筛选条件</span>
          </button>
        </template>
        <template v-else>
          <strong>暂无审核任务</strong>
          <span>选择项目创建审核任务后即可在此查看</span>
          <button type="button" class="empty-state__action" @click="$emit('create-task')">
            <el-icon aria-hidden="true"><Plus /></el-icon>
            <span>创建任务</span>
          </button>
        </template>
      </div>
    </div>

    <div class="pager">
      <span class="pager-total">共 {{ Number(page.total) }} 条</span>
      <el-pagination
        :current-page="page.page"
        background
        small
        align="center"
        :page-sizes="[10, 20, 50]"
        :page-size="page.limit"
        :pager-count="3"
        :total="Number(page.total)"
        layout="prev, pager, next"
        @size-change="$emit('limit-change', $event)"
        @current-change="$emit('page-change', $event)"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReText from '@/components/ReText/src/index.vue'
import { ArrowRight, Plus, Refresh, Search, WarningFilled } from '../icons'
import type { WorkbenchFilterOption } from '../types'
import type { WorkbenchProject } from '../types'

const props = withDefaults(
  defineProps<{
    projects: WorkbenchProject[]
    selectedProject: WorkbenchProject
    statusTabs: WorkbenchFilterOption[]
    activeStatus: string
    keyword: string
    refreshing: boolean
    page: { page: number; limit: number; total: number | string }
    statusClass: (status?: string) => string
    /** 列表加载失败的原因；非空时渲染错误态并提供重新加载 */
    errorText?: string
  }>(),
  {
    errorText: ''
  }
)

const emit = defineEmits([
  'update:keyword',
  'create-task',
  'status-change',
  'select-project',
  'open-progress',
  'page-change',
  'limit-change',
  'reload',
  'clear-filters'
])

const hasActiveFilter = computed(() => Boolean(props.keyword.trim() || props.activeStatus))

// 受控输入上不做 trim，否则用户敲空格时 DOM 与状态不一致；空格由查询参数组装时统一去除
const handleKeywordInput = (event: Event) => {
  emit('update:keyword', (event.target as HTMLInputElement).value)
}
</script>
